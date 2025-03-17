/**
 * NodeExecutor.ts
 * 
 * Implements the node execution logic for the workflow system.
 * The NodeExecutor is responsible for executing individual nodes within a workflow.
 */

import { Node, NodeInputs, NodeOutputs, ExecutionContext } from './WorkflowTypes';
import { CoreEventTypes } from '../events/EventTypes';
import { getEventBus } from '../events/EventBus';

/**
 * Type definition for a node executor function
 */
export type NodeExecutorFn = (
  nodeId: string,
  inputs: NodeInputs,
  context: ExecutionContext
) => Promise<NodeOutputs> | NodeOutputs;

/**
 * Type definition for an input transformation function
 */
export type InputTransformationFn = (
  inputs: NodeInputs,
  node: Node,
  context: ExecutionContext
) => NodeInputs;

/**
 * Type definition for an output transformation function
 */
export type OutputTransformationFn = (
  outputs: NodeOutputs,
  node: Node,
  context: ExecutionContext
) => NodeOutputs;

/**
 * Type definition for an input validation function
 */
export type InputValidatorFn = (
  inputs: NodeInputs,
  node: Node,
  context: ExecutionContext
) => boolean;

/**
 * Type definition for an output validation function
 */
export type OutputValidatorFn = (
  outputs: NodeOutputs,
  node: Node,
  context: ExecutionContext
) => boolean;

/**
 * NodeExecutor class that handles the execution of individual nodes
 */
export class NodeExecutor {
  private nodeTypeExecutors: Map<string, NodeExecutorFn>;
  private inputTransformations: Map<string, InputTransformationFn[]>;
  private outputTransformations: Map<string, OutputTransformationFn[]>;
  private inputValidators: Map<string, InputValidatorFn[]>;
  private outputValidators: Map<string, OutputValidatorFn[]>;
  private eventBus = getEventBus();
  
  /**
   * Creates a new NodeExecutor
   */
  constructor() {
    this.nodeTypeExecutors = new Map<string, NodeExecutorFn>();
    this.inputTransformations = new Map<string, InputTransformationFn[]>();
    this.outputTransformations = new Map<string, OutputTransformationFn[]>();
    this.inputValidators = new Map<string, InputValidatorFn[]>();
    this.outputValidators = new Map<string, OutputValidatorFn[]>();
  }
  
  /**
   * Register an executor function for a specific node type
   * 
   * @param nodeType The type of node
   * @param executor The executor function
   */
  public registerNodeTypeExecutor(nodeType: string, executor: NodeExecutorFn): void {
    this.nodeTypeExecutors.set(nodeType, executor);
  }
  
  /**
   * Register an input transformation function for a specific node type
   * 
   * @param nodeType The type of node
   * @param transformation The transformation function
   */
  public registerInputTransformation(nodeType: string, transformation: InputTransformationFn): void {
    if (!this.inputTransformations.has(nodeType)) {
      this.inputTransformations.set(nodeType, []);
    }
    
    this.inputTransformations.get(nodeType)!.push(transformation);
  }
  
  /**
   * Register an output transformation function for a specific node type
   * 
   * @param nodeType The type of node
   * @param transformation The transformation function
   */
  public registerOutputTransformation(nodeType: string, transformation: OutputTransformationFn): void {
    if (!this.outputTransformations.has(nodeType)) {
      this.outputTransformations.set(nodeType, []);
    }
    
    this.outputTransformations.get(nodeType)!.push(transformation);
  }
  
  /**
   * Register an input validator function for a specific node type
   * 
   * @param nodeType The type of node
   * @param validator The validator function
   */
  public registerInputValidator(nodeType: string, validator: InputValidatorFn): void {
    if (!this.inputValidators.has(nodeType)) {
      this.inputValidators.set(nodeType, []);
    }
    
    this.inputValidators.get(nodeType)!.push(validator);
  }
  
  /**
   * Register an output validator function for a specific node type
   * 
   * @param nodeType The type of node
   * @param validator The validator function
   */
  public registerOutputValidator(nodeType: string, validator: OutputValidatorFn): void {
    if (!this.outputValidators.has(nodeType)) {
      this.outputValidators.set(nodeType, []);
    }
    
    this.outputValidators.get(nodeType)!.push(validator);
  }
  
  /**
   * Execute a single node
   * 
   * @param node The node to execute
   * @param inputs Input data for the node
   * @param context Execution context
   * @returns Promise that resolves with the node outputs
   * @throws Error if execution fails
   */
  public async executeNode(
    node: Node,
    inputs: NodeInputs,
    context: ExecutionContext
  ): Promise<NodeOutputs> {
    const { id, type } = node;
    
    try {
      // Get the executor for this node type
      const executor = this.nodeTypeExecutors.get(type);
      
      if (!executor) {
        throw new Error(`No executor registered for node type: ${type}`);
      }
      
      // Publish node execution started event
      await this.eventBus.publish(CoreEventTypes.NODE_EXECUTION_STARTED, {
        nodeId: id,
        nodeType: type,
        inputs
      });
      
      // Apply input transformations
      const transformedInputs = await this.applyInputTransformations(node, inputs, context);
      
      // Validate inputs
      await this.validateInputs(node, transformedInputs, context);
      
      // Execute the node
      const outputs = await executor(id, transformedInputs, context);
      
      // Validate outputs
      await this.validateOutputs(node, outputs, context);
      
      // Apply output transformations
      const transformedOutputs = await this.applyOutputTransformations(node, outputs, context);
      
      // Publish node execution completed event
      await this.eventBus.publish(CoreEventTypes.NODE_EXECUTION_COMPLETED, {
        nodeId: id,
        nodeType: type,
        outputs: transformedOutputs
      });
      
      return transformedOutputs;
    } catch (error) {
      // Log the error
      context.logger.error(`Error executing node ${id}:`, error);
      
      // Publish node execution failed event
      await this.eventBus.publish(CoreEventTypes.NODE_EXECUTION_FAILED, {
        nodeId: id,
        nodeType: type,
        error
      });
      
      // Re-throw the error
      throw error;
    }
  }
  
  /**
   * Apply input transformations to the inputs
   * 
   * @param node The node
   * @param inputs The input data
   * @param context The execution context
   * @returns Transformed inputs
   */
  private async applyInputTransformations(
    node: Node,
    inputs: NodeInputs,
    context: ExecutionContext
  ): Promise<NodeInputs> {
    const { type } = node;
    let transformedInputs = { ...inputs };
    
    // Get transformations for this node type
    const transformations = this.inputTransformations.get(type) || [];
    
    // Apply each transformation in sequence
    for (const transformation of transformations) {
      transformedInputs = transformation(transformedInputs, node, context);
    }
    
    return transformedInputs;
  }
  
  /**
   * Apply output transformations to the outputs
   * 
   * @param node The node
   * @param outputs The output data
   * @param context The execution context
   * @returns Transformed outputs
   */
  private async applyOutputTransformations(
    node: Node,
    outputs: NodeOutputs,
    context: ExecutionContext
  ): Promise<NodeOutputs> {
    const { type } = node;
    let transformedOutputs = { ...outputs };
    
    // Get transformations for this node type
    const transformations = this.outputTransformations.get(type) || [];
    
    // Apply each transformation in sequence
    for (const transformation of transformations) {
      transformedOutputs = transformation(transformedOutputs, node, context);
    }
    
    return transformedOutputs;
  }
  
  /**
   * Validate the inputs
   * 
   * @param node The node
   * @param inputs The input data
   * @param context The execution context
   * @throws Error if validation fails
   */
  private async validateInputs(
    node: Node,
    inputs: NodeInputs,
    context: ExecutionContext
  ): Promise<void> {
    const { type } = node;
    
    // Get validators for this node type
    const validators = this.inputValidators.get(type) || [];
    
    // Apply each validator
    for (const validator of validators) {
      const isValid = validator(inputs, node, context);
      
      if (!isValid) {
        throw new Error(`Input validation failed for node ${node.id}`);
      }
    }
  }
  
  /**
   * Validate the outputs
   * 
   * @param node The node
   * @param outputs The output data
   * @param context The execution context
   * @throws Error if validation fails
   */
  private async validateOutputs(
    node: Node,
    outputs: NodeOutputs,
    context: ExecutionContext
  ): Promise<void> {
    const { type } = node;
    
    // Get validators for this node type
    const validators = this.outputValidators.get(type) || [];
    
    // Apply each validator
    for (const validator of validators) {
      const isValid = validator(outputs, node, context);
      
      if (!isValid) {
        throw new Error(`Output validation failed for node ${node.id}`);
      }
    }
  }
}

export default NodeExecutor;
