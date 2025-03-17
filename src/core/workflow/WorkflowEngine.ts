/**
 * WorkflowEngine.ts
 * 
 * Implements the workflow execution engine for RebelFlow.
 * The WorkflowEngine is responsible for orchestrating the execution of node workflows.
 */

import { 
  Workflow, 
  WorkflowResult, 
  WorkflowStatus, 
  ExecutionOptions, 
  ExecutionContext,
  NodeInputs,
  NodeOutputs
} from './WorkflowTypes';
import { NodeExecutor } from './NodeExecutor';
import { CoreEventTypes } from '../events/EventTypes';
import { getEventBus } from '../events/EventBus';

/**
 * WorkflowEngine class that manages the execution of node workflows
 */
export class WorkflowEngine {
  private nodeExecutor: NodeExecutor;
  private eventBus = getEventBus();
  private activeWorkflows: Map<string, {
    status: WorkflowStatus;
    context: ExecutionContext;
    controller: AbortController;
    resolve: (result: WorkflowResult) => void;
    reject: (error: Error) => void;
  }>;
  
  /**
   * Creates a new WorkflowEngine
   * 
   * @param nodeExecutor The NodeExecutor to use for executing nodes
   */
  constructor(nodeExecutor: NodeExecutor) {
    this.nodeExecutor = nodeExecutor;
    this.activeWorkflows = new Map();
  }
  
  /**
   * Execute a workflow
   * 
   * @param workflow The workflow to execute
   * @param options Execution options (e.g., starting node, timeout)
   * @returns Promise that resolves with the workflow result
   */
  public executeWorkflow(
    workflow: Workflow,
    options: ExecutionOptions = {}
  ): Promise<WorkflowResult> {
    const { id: workflowId } = workflow;
    
    // Create a promise that will be resolved when the workflow completes
    return new Promise<WorkflowResult>(async (resolve, reject) => {
      try {
        // Create an abort controller for timeout and cancellation
        const controller = new AbortController();
        const { signal } = controller;
        
        // Set up timeout if specified
        let timeoutId: NodeJS.Timeout | undefined;
        if (options.timeout && options.timeout > 0) {
          timeoutId = setTimeout(() => {
            controller.abort();
            const error = new Error('Workflow execution timed out');
            this.handleWorkflowError(workflowId, error);
            reject(error);
          }, options.timeout);
        }
        
        // Create execution context
        const context: ExecutionContext = {
          workflowId,
          nodeOutputs: new Map(),
          startTime: Date.now(),
          status: 'running',
          variables: new Map(Object.entries(options.variables || {})),
          logger: console
        };
        
        // Store the active workflow
        this.activeWorkflows.set(workflowId, {
          status: 'running',
          context,
          controller,
          resolve,
          reject
        });
        
        // Publish workflow started event
        await this.eventBus.publish(CoreEventTypes.WORKFLOW_STARTED, {
          workflowId,
          workflow,
          options
        });
        
        // Perform topological sort to determine execution order
        const executionOrder = this.topologicalSort(workflow);
        
        // Execute the workflow
        signal.addEventListener('abort', () => {
          if (timeoutId) clearTimeout(timeoutId);
          
          if (!signal.aborted) {
            const error = new Error('Workflow execution was cancelled');
            this.handleWorkflowError(workflowId, error);
            reject(error);
          }
        });
        
        // Execute nodes in order
        let nodesExecuted = 0;
        
        // Prepare initial inputs for entry nodes
        if (options.inputs) {
          for (const entryNodeId of workflow.entryPoints) {
            context.nodeOutputs.set(entryNodeId, options.inputs);
          }
        }
        
        // Execute nodes based on execution strategy
        if (options.parallel) {
          // Group nodes by their level in the graph
          const levels = this.groupNodesByLevel(workflow, executionOrder);
          
          // Execute each level in parallel
          for (const level of levels) {
            if (signal.aborted) break;
            
            // Execute all nodes in this level in parallel
            await Promise.all(
              level.map(async (nodeId) => {
                if (signal.aborted) return;
                
                const node = workflow.nodes.find(n => n.id === nodeId);
                if (!node) return;
                
                // Get input data from connected nodes
                const inputs = this.gatherInputs(node, workflow, context);
                
                // Execute the node
                try {
                  const outputs = await this.nodeExecutor.executeNode(node, inputs, context);
                  
                  // Store outputs in context
                  context.nodeOutputs.set(nodeId, outputs);
                  nodesExecuted++;
                } catch (error) {
                  // Abort execution on error
                  controller.abort();
                  throw error;
                }
              })
            );
          }
        } else {
          // Sequential execution
          for (const nodeId of executionOrder) {
            if (signal.aborted) break;
            
            const node = workflow.nodes.find(n => n.id === nodeId);
            if (!node) continue;
            
            // Get input data from connected nodes
            const inputs = this.gatherInputs(node, workflow, context);
            
            // Execute the node
            const outputs = await this.nodeExecutor.executeNode(node, inputs, context);
            
            // Store outputs in context
            context.nodeOutputs.set(nodeId, outputs);
            nodesExecuted++;
          }
        }
        
        // Clear timeout if set
        if (timeoutId) clearTimeout(timeoutId);
        
        // If execution was aborted, don't resolve
        if (signal.aborted) return;
        
        // Gather final results
        const result = this.createWorkflowResult(workflow, context, nodesExecuted);
        
        // Update workflow status
        const activeWorkflow = this.activeWorkflows.get(workflowId);
        if (activeWorkflow) {
          activeWorkflow.status = 'completed';
        }
        
        // Publish workflow completed event
        await this.eventBus.publish(CoreEventTypes.WORKFLOW_COMPLETED, {
          workflowId,
          result
        });
        
        // Remove from active workflows
        this.activeWorkflows.delete(workflowId);
        
        // Resolve the promise
        resolve(result);
      } catch (error) {
        // Handle and publish error
        this.handleWorkflowError(workflowId, error as Error);
        
        // Reject the promise
        reject(error);
      }
    });
  }
  
  /**
   * Pause a running workflow
   * 
   * @param workflowId The ID of the workflow to pause
   * @returns Promise that resolves when the workflow is paused
   */
  public async pauseWorkflow(workflowId: string): Promise<void> {
    const activeWorkflow = this.activeWorkflows.get(workflowId);
    
    if (!activeWorkflow) {
      throw new Error(`No active workflow with ID ${workflowId}`);
    }
    
    if (activeWorkflow.status !== 'running') {
      throw new Error(`Workflow ${workflowId} is not running (status: ${activeWorkflow.status})`);
    }
    
    // Update status
    activeWorkflow.status = 'paused';
    activeWorkflow.context.status = 'paused';
    
    // Publish workflow paused event
    await this.eventBus.publish(CoreEventTypes.WORKFLOW_PAUSED, {
      workflowId
    });
  }
  
  /**
   * Resume a paused workflow
   * 
   * @param workflowId The ID of the workflow to resume
   * @returns Promise that resolves when the workflow is resumed
   */
  public async resumeWorkflow(workflowId: string): Promise<void> {
    const activeWorkflow = this.activeWorkflows.get(workflowId);
    
    if (!activeWorkflow) {
      throw new Error(`No active workflow with ID ${workflowId}`);
    }
    
    if (activeWorkflow.status !== 'paused') {
      throw new Error(`Workflow ${workflowId} is not paused (status: ${activeWorkflow.status})`);
    }
    
    // Update status
    activeWorkflow.status = 'running';
    activeWorkflow.context.status = 'running';
    
    // Publish workflow resumed event
    await this.eventBus.publish(CoreEventTypes.WORKFLOW_RESUMED, {
      workflowId
    });
  }
  
  /**
   * Stop a running workflow
   * 
   * @param workflowId The ID of the workflow to stop
   * @returns Promise that resolves when the workflow is stopped
   */
  public async stopWorkflow(workflowId: string): Promise<void> {
    const activeWorkflow = this.activeWorkflows.get(workflowId);
    
    if (!activeWorkflow) {
      throw new Error(`No active workflow with ID ${workflowId}`);
    }
    
    // Update status
    activeWorkflow.status = 'cancelled';
    activeWorkflow.context.status = 'cancelled';
    
    // Abort execution
    activeWorkflow.controller.abort();
    
    // Publish workflow cancelled event
    await this.eventBus.publish(CoreEventTypes.WORKFLOW_FAILED, {
      workflowId,
      error: new Error('Workflow execution was cancelled')
    });
  }
  
  /**
   * Get the current status of a workflow
   * 
   * @param workflowId The ID of the workflow
   * @returns The current workflow status
   */
  public getWorkflowStatus(workflowId: string): WorkflowStatus {
    const activeWorkflow = this.activeWorkflows.get(workflowId);
    
    if (!activeWorkflow) {
      return 'completed'; // Assume completed if not active
    }
    
    return activeWorkflow.status;
  }
  
  /**
   * Handle workflow execution error
   * 
   * @param workflowId The workflow ID
   * @param error The error that occurred
   * @private
   */
  private async handleWorkflowError(workflowId: string, error: Error): Promise<void> {
    // Get the active workflow
    const activeWorkflow = this.activeWorkflows.get(workflowId);
    
    if (activeWorkflow) {
      // Update status
      activeWorkflow.status = 'failed';
      activeWorkflow.context.status = 'failed';
      
      // Publish workflow failed event
      await this.eventBus.publish(CoreEventTypes.WORKFLOW_FAILED, {
        workflowId,
        error
      });
      
      // Remove from active workflows
      this.activeWorkflows.delete(workflowId);
    }
  }
  
  /**
   * Perform topological sort to determine execution order
   * 
   * @param workflow The workflow
   * @returns Array of node IDs in execution order
   * @private
   */
  private topologicalSort(workflow: Workflow): string[] {
    const result: string[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();
    
    // Helper function for depth-first search
    const visit = (nodeId: string) => {
      // Check for cycles
      if (temp.has(nodeId)) {
        throw new Error(`Workflow contains a cycle involving node ${nodeId}`);
      }
      
      // Skip if already visited
      if (visited.has(nodeId)) return;
      
      // Mark as temporarily visited
      temp.add(nodeId);
      
      // Visit all dependencies (nodes that provide input to this node)
      const dependencies = this.getNodeDependencies(nodeId, workflow);
      for (const depId of dependencies) {
        visit(depId);
      }
      
      // Mark as visited and add to result
      temp.delete(nodeId);
      visited.add(nodeId);
      result.push(nodeId);
    };
    
    // Start with entry points
    for (const entryPoint of workflow.entryPoints) {
      visit(entryPoint);
    }
    
    // Ensure all nodes are visited
    for (const node of workflow.nodes) {
      if (!visited.has(node.id)) {
        visit(node.id);
      }
    }
    
    return result;
  }
  
  /**
   * Group nodes by their level in the graph for parallel execution
   * 
   * @param workflow The workflow
   * @param executionOrder The execution order from topological sort
   * @returns Array of arrays, where each inner array contains nodes at the same level
   * @private
   */
  private groupNodesByLevel(workflow: Workflow, executionOrder: string[]): string[][] {
    const levels: Map<string, number> = new Map();
    
    // Initialize levels for all nodes
    for (const nodeId of executionOrder) {
      levels.set(nodeId, 0);
    }
    
    // Calculate level for each node
    for (const connection of workflow.connections) {
      const sourceLevel = levels.get(connection.sourceNodeId) || 0;
      const targetLevel = levels.get(connection.targetNodeId) || 0;
      
      // Target node must be at a higher level than source node
      if (sourceLevel >= targetLevel) {
        levels.set(connection.targetNodeId, sourceLevel + 1);
      }
    }
    
    // Group nodes by level
    const levelGroups: Map<number, string[]> = new Map();
    
    for (const [nodeId, level] of levels.entries()) {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      
      levelGroups.get(level)!.push(nodeId);
    }
    
    // Convert to array of arrays
    const result: string[][] = [];
    
    // Sort by level
    const sortedLevels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
    
    for (const level of sortedLevels) {
      result.push(levelGroups.get(level)!);
    }
    
    return result;
  }
  
  /**
   * Get the dependencies of a node
   * 
   * @param nodeId The node ID
   * @param workflow The workflow
   * @returns Array of node IDs that the node depends on
   * @private
   */
  private getNodeDependencies(nodeId: string, workflow: Workflow): string[] {
    const dependencies: string[] = [];
    
    // Find all connections where this node is the target
    for (const connection of workflow.connections) {
      if (connection.targetNodeId === nodeId) {
        dependencies.push(connection.sourceNodeId);
      }
    }
    
    return dependencies;
  }
  
  /**
   * Gather inputs for a node from its dependencies
   * 
   * @param node The node
   * @param workflow The workflow
   * @param context The execution context
   * @returns Input data for the node
   * @private
   */
  private gatherInputs(
    node: Workflow['nodes'][0],
    workflow: Workflow,
    context: ExecutionContext
  ): NodeInputs {
    const inputs: NodeInputs = {};
    
    // Find all connections where this node is the target
    for (const connection of workflow.connections) {
      if (connection.targetNodeId === node.id) {
        // Get the source node outputs
        const sourceOutputs = context.nodeOutputs.get(connection.sourceNodeId);
        
        if (sourceOutputs && sourceOutputs[connection.sourcePortId]) {
          // Map the source output to the target input
          inputs[connection.targetPortId] = sourceOutputs[connection.sourcePortId];
        }
      }
    }
    
    // For entry nodes, include any initial inputs
    if (workflow.entryPoints.includes(node.id)) {
      // Get any initial inputs for entry nodes
      const initialInputs = context.nodeOutputs.get(node.id);
      
      if (initialInputs) {
        // Merge with connection inputs (connection inputs take precedence)
        Object.assign(inputs, initialInputs);
      }
    }
    
    return inputs;
  }
  
  /**
   * Create a workflow result object
   * 
   * @param workflow The workflow
   * @param context The execution context
   * @param nodesExecuted The number of nodes executed
   * @returns The workflow result
   * @private
   */
  private createWorkflowResult(
    workflow: Workflow,
    context: ExecutionContext,
    nodesExecuted: number
  ): WorkflowResult {
    const endTime = Date.now();
    const outputs: Record<string, any> = {};
    
    // Gather outputs from exit nodes
    for (const exitNodeId of workflow.exitPoints) {
      const nodeOutputs = context.nodeOutputs.get(exitNodeId);
      
      if (nodeOutputs) {
        outputs[exitNodeId] = nodeOutputs;
      }
    }
    
    return {
      workflowId: workflow.id,
      status: context.status,
      outputs,
      stats: {
        startTime: context.startTime,
        endTime,
        executionTime: endTime - context.startTime,
        nodesExecuted
      }
    };
  }
}

export default WorkflowEngine;
