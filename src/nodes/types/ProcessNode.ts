/**
 * ProcessNode.ts
 * 
 * Implements a node for processing operations.
 * ProcessNodes are used to perform operations on input data and produce output data.
 */

import { BaseNode } from '../base/BaseNode';

/**
 * Type definition for a process function
 */
export type ProcessFn = (
  inputs: Record<string, any>
) => Promise<Record<string, any>> | Record<string, any>;

/**
 * ProcessNode class for processing operations
 */
export class ProcessNode extends BaseNode {
  /**
   * The process function
   */
  private processFn: ProcessFn;
  
  /**
   * Creates a new ProcessNode
   * 
   * @param id Unique identifier for the node
   * @param name Human-readable name of the node
   * @param processFn The process function
   */
  constructor(id: string, name: string, processFn: ProcessFn) {
    super(id, name);
    
    // Set the process function
    this.processFn = processFn;
  }
  
  /**
   * Set the process function
   * 
   * @param fn The process function
   */
  public setProcessFunction(fn: ProcessFn): void {
    this.processFn = fn;
  }
  
  /**
   * Process the inputs and produce outputs
   * 
   * @param inputs Input data for the node
   * @returns Promise that resolves with the node outputs
   * @protected
   */
  protected async process(inputs: Record<string, any>): Promise<Record<string, any>> {
    // Call the process function
    return await this.processFn(inputs);
  }
  
  /**
   * Validate the node configuration
   * 
   * @returns True if the configuration is valid, false otherwise
   */
  public validate(): boolean {
    // Check if process function is set
    return typeof this.processFn === 'function';
  }
}

export default ProcessNode;
