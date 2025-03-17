/**
 * ControlFlowNode.ts
 * 
 * Implements a node for controlling the flow of execution.
 * ControlFlowNodes are used to route data based on conditions or other logic.
 */

import { BaseNode } from '../base/BaseNode';

/**
 * Type definition for a condition function
 */
export type ConditionFn = (inputs: Record<string, any>) => boolean;

/**
 * Type definition for a routing function
 */
export type RoutingFn = (inputs: Record<string, any>) => string;

/**
 * Type definition for a custom routing function
 */
export type CustomRoutingFn = (inputs: Record<string, any>) => Record<string, any>;

/**
 * ControlFlowNode class for controlling the flow of execution
 */
export class ControlFlowNode extends BaseNode {
  /**
   * The condition function (for if/else routing)
   */
  private conditionFn: ConditionFn | null;
  
  /**
   * The routing function (for switch/case routing)
   */
  private routingFn: RoutingFn | null;
  
  /**
   * The custom routing function (for custom routing)
   */
  private customRoutingFn: CustomRoutingFn | null;
  
  /**
   * Creates a new ControlFlowNode
   * 
   * @param id Unique identifier for the node
   * @param name Human-readable name of the node
   */
  constructor(id: string, name: string) {
    super(id, name);
    
    // Initialize functions
    this.conditionFn = null;
    this.routingFn = null;
    this.customRoutingFn = null;
  }
  
  /**
   * Set the condition function for if/else routing
   * 
   * @param fn The condition function
   */
  public setConditionFunction(fn: ConditionFn): void {
    this.conditionFn = fn;
    this.routingFn = null;
    this.customRoutingFn = null;
  }
  
  /**
   * Set the routing function for switch/case routing
   * 
   * @param fn The routing function
   */
  public setRoutingFunction(fn: RoutingFn): void {
    this.routingFn = fn;
    this.conditionFn = null;
    this.customRoutingFn = null;
  }
  
  /**
   * Set the custom routing function for custom routing
   * 
   * @param fn The custom routing function
   */
  public setCustomRoutingFunction(fn: CustomRoutingFn): void {
    this.customRoutingFn = fn;
    this.conditionFn = null;
    this.routingFn = null;
  }
  
  /**
   * Process the inputs and produce outputs
   * 
   * @param inputs Input data for the node
   * @returns The node outputs
   * @protected
   */
  protected process(inputs: Record<string, any>): Record<string, any> {
    // Initialize outputs
    const outputs: Record<string, any> = {};
    
    // Get all output port IDs
    const outputPortIds = this.getOutputs().map(port => port.id);
    
    // Initialize all outputs to undefined
    for (const portId of outputPortIds) {
      outputs[portId] = undefined;
    }
    
    // Apply routing based on the active function
    if (this.conditionFn) {
      // If/else routing
      const condition = this.conditionFn(inputs);
      
      if (condition && inputs.value !== undefined) {
        outputs.true = inputs.value;
      } else if (!condition && inputs.value !== undefined) {
        outputs.false = inputs.value;
      }
    } else if (this.routingFn) {
      // Switch/case routing
      const route = this.routingFn(inputs);
      
      if (outputPortIds.includes(route) && inputs.value !== undefined) {
        outputs[route] = inputs.value;
      }
    } else if (this.customRoutingFn) {
      // Custom routing
      const customOutputs = this.customRoutingFn(inputs);
      
      // Merge custom outputs with initialized outputs
      Object.assign(outputs, customOutputs);
    }
    
    return outputs;
  }
  
  /**
   * Validate the node configuration
   * 
   * @returns True if the configuration is valid, false otherwise
   */
  public validate(): boolean {
    // Check if at least one routing function is set
    return !!(this.conditionFn || this.routingFn || this.customRoutingFn);
  }
}

export default ControlFlowNode;
