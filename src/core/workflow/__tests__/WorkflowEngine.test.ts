/**
 * WorkflowEngine.test.ts
 * 
 * Tests for the WorkflowEngine class.
 */

import { WorkflowEngine } from '../WorkflowEngine';
import { NodeExecutor } from '../NodeExecutor';
import { 
  createLinearWorkflow, 
  createBranchingWorkflow, 
  mockNodeExecutor,
  mockErrorNodeExecutor
} from './setup';
import { CoreEventTypes } from '../../events/EventTypes';
import { getEventBus } from '../../events/EventBus';

describe('WorkflowEngine', () => {
  let workflowEngine: WorkflowEngine;
  let nodeExecutor: NodeExecutor;
  let eventBus = getEventBus();
  
  // Mock event subscription
  const mockSubscribe = jest.fn();
  const mockPublish = jest.fn().mockResolvedValue(undefined);
  
  beforeEach(() => {
    // Reset mocks
    mockSubscribe.mockReset();
    mockPublish.mockReset();
    
    // Mock the event bus
    jest.spyOn(eventBus, 'subscribe').mockImplementation(mockSubscribe);
    jest.spyOn(eventBus, 'publish').mockImplementation(mockPublish);
    
    // Create a new NodeExecutor for each test
    nodeExecutor = new NodeExecutor();
    
    // Register mock executor for all node types
    nodeExecutor.registerNodeTypeExecutor('source', mockNodeExecutor);
    nodeExecutor.registerNodeTypeExecutor('process', mockNodeExecutor);
    nodeExecutor.registerNodeTypeExecutor('sink', mockNodeExecutor);
    nodeExecutor.registerNodeTypeExecutor('merge', mockNodeExecutor);
    
    // Create a new WorkflowEngine for each test
    workflowEngine = new WorkflowEngine(nodeExecutor);
  });
  
  test('should execute a linear workflow successfully', async () => {
    // Create a linear workflow with 3 nodes
    const workflow = createLinearWorkflow('workflow-1', 'Linear Workflow', 3);
    
    // Execute the workflow
    const result = await workflowEngine.executeWorkflow(workflow);
    
    // Verify the result
    expect(result).toBeDefined();
    expect(result.status).toBe('completed');
    expect(result.workflowId).toBe('workflow-1');
    expect(result.outputs).toBeDefined();
    expect(result.stats).toBeDefined();
    expect(result.stats.nodesExecuted).toBe(3);
    
    // Verify that workflow events were published
    expect(mockPublish).toHaveBeenCalledWith(
      CoreEventTypes.WORKFLOW_STARTED,
      expect.objectContaining({ workflowId: 'workflow-1' })
    );
    
    expect(mockPublish).toHaveBeenCalledWith(
      CoreEventTypes.WORKFLOW_COMPLETED,
      expect.objectContaining({ workflowId: 'workflow-1' })
    );
  });
  
  test('should execute a branching workflow successfully', async () => {
    // Create a branching workflow
    const workflow = createBranchingWorkflow('workflow-2', 'Branching Workflow');
    
    // Execute the workflow
    const result = await workflowEngine.executeWorkflow(workflow, { parallel: true });
    
    // Verify the result
    expect(result).toBeDefined();
    expect(result.status).toBe('completed');
    expect(result.workflowId).toBe('workflow-2');
    expect(result.outputs).toBeDefined();
    expect(result.stats).toBeDefined();
    expect(result.stats.nodesExecuted).toBe(6); // All 6 nodes should be executed
    
    // Verify that workflow events were published
    expect(mockPublish).toHaveBeenCalledWith(
      CoreEventTypes.WORKFLOW_STARTED,
      expect.objectContaining({ workflowId: 'workflow-2' })
    );
    
    expect(mockPublish).toHaveBeenCalledWith(
      CoreEventTypes.WORKFLOW_COMPLETED,
      expect.objectContaining({ workflowId: 'workflow-2' })
    );
  });
  
  test('should handle errors in workflow execution', async () => {
    // Create a linear workflow with 3 nodes
    const workflow = createLinearWorkflow('workflow-3', 'Error Workflow', 3);
    
    // Register error executor for the second node
    nodeExecutor.registerNodeTypeExecutor('process', (nodeId, inputs, context) => {
      if (nodeId === 'node-1') {
        return mockErrorNodeExecutor(nodeId, inputs);
      }
      return mockNodeExecutor(nodeId, inputs);
    });
    
    // Execute the workflow
    await expect(workflowEngine.executeWorkflow(workflow))
      .rejects.toThrow('Error executing node node-1');
    
    // Verify that workflow events were published
    expect(mockPublish).toHaveBeenCalledWith(
      CoreEventTypes.WORKFLOW_STARTED,
      expect.objectContaining({ workflowId: 'workflow-3' })
    );
    
    expect(mockPublish).toHaveBeenCalledWith(
      CoreEventTypes.WORKFLOW_FAILED,
      expect.objectContaining({ 
        workflowId: 'workflow-3',
        error: expect.any(Error)
      })
    );
  });
  
  test('should pause and resume workflow execution', async () => {
    // Create a linear workflow with 3 nodes
    const workflow = createLinearWorkflow('workflow-4', 'Pause/Resume Workflow', 3);
    
    // Start the workflow execution
    const executionPromise = workflowEngine.executeWorkflow(workflow);
    
    // Pause the workflow
    await workflowEngine.pauseWorkflow('workflow-4');
    
    // Verify that the workflow is paused
    expect(workflowEngine.getWorkflowStatus('workflow-4')).toBe('paused');
    
    // Verify that pause event was published
    expect(mockPublish).toHaveBeenCalledWith(
      CoreEventTypes.WORKFLOW_PAUSED,
      expect.objectContaining({ workflowId: 'workflow-4' })
    );
    
    // Resume the workflow
    await workflowEngine.resumeWorkflow('workflow-4');
    
    // Verify that resume event was published
    expect(mockPublish).toHaveBeenCalledWith(
      CoreEventTypes.WORKFLOW_RESUMED,
      expect.objectContaining({ workflowId: 'workflow-4' })
    );
    
    // Wait for the workflow to complete
    const result = await executionPromise;
    
    // Verify the result
    expect(result).toBeDefined();
    expect(result.status).toBe('completed');
  });
  
  test('should stop workflow execution', async () => {
    // Create a linear workflow with 3 nodes
    const workflow = createLinearWorkflow('workflow-5', 'Stop Workflow', 3);
    
    // Start the workflow execution
    const executionPromise = workflowEngine.executeWorkflow(workflow);
    
    // Stop the workflow
    await workflowEngine.stopWorkflow('workflow-5');
    
    // Verify that the workflow is cancelled
    expect(workflowEngine.getWorkflowStatus('workflow-5')).toBe('cancelled');
    
    // Wait for the workflow to complete (should be cancelled)
    await expect(executionPromise).rejects.toThrow('Workflow execution was cancelled');
  });
  
  test('should handle workflow with timeout', async () => {
    // Create a linear workflow with 3 nodes
    const workflow = createLinearWorkflow('workflow-6', 'Timeout Workflow', 3);
    
    // Register a slow executor for all nodes
    const slowExecutor = async (nodeId: string, inputs: Record<string, any>) => {
      // Simulate a slow operation (100ms)
      await new Promise(resolve => setTimeout(resolve, 100));
      return mockNodeExecutor(nodeId, inputs);
    };
    
    nodeExecutor.registerNodeTypeExecutor('process', slowExecutor);
    
    // Execute the workflow with a short timeout (50ms)
    await expect(workflowEngine.executeWorkflow(workflow, { timeout: 50 }))
      .rejects.toThrow('Workflow execution timed out');
    
    // Verify that workflow events were published
    expect(mockPublish).toHaveBeenCalledWith(
      CoreEventTypes.WORKFLOW_STARTED,
      expect.objectContaining({ workflowId: 'workflow-6' })
    );
    
    expect(mockPublish).toHaveBeenCalledWith(
      CoreEventTypes.WORKFLOW_FAILED,
      expect.objectContaining({ 
        workflowId: 'workflow-6',
        error: expect.any(Error)
      })
    );
  });
  
  test('should provide initial inputs to entry nodes', async () => {
    // Create a linear workflow with 3 nodes
    const workflow = createLinearWorkflow('workflow-7', 'Input Workflow', 3);
    
    // Mock node executor that verifies inputs
    const inputVerifyingExecutor = jest.fn().mockImplementation(
      async (nodeId: string, inputs: Record<string, any>) => {
        // For the first node, verify that it received the initial inputs
        if (nodeId === 'node-0') {
          expect(inputs).toHaveProperty('initialInput');
          expect(inputs.initialInput.value).toBe('test value');
        }
        
        return mockNodeExecutor(nodeId, inputs);
      }
    );
    
    nodeExecutor.registerNodeTypeExecutor('process', inputVerifyingExecutor);
    
    // Execute the workflow with initial inputs
    await workflowEngine.executeWorkflow(workflow, {
      inputs: {
        initialInput: { value: 'test value' }
      }
    });
    
    // Verify that the input-verifying executor was called
    expect(inputVerifyingExecutor).toHaveBeenCalled();
  });
});
