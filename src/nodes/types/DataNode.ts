/**
 * DataNode.ts
 * 
 * Implements a node for storing and transforming data.
 * DataNodes are used to store, manipulate, and pass data through the workflow.
 */

import { BaseNode } from '../base/BaseNode';

/**
 * Type definition for a data transformation function
 */
export type DataTransformationFn = (data: Record<string, any>) => Record<string, any>;

/**
 * DataNode class for storing and transforming data
 */
export class DataNode extends BaseNode {
  /**
   * The data stored in the node
   */
  private data: Record<string, any>;
  
  /**
   * Optional transformation function
   */
  private transformationFn: DataTransformationFn | null;
  
  /**
   * Creates a new DataNode
   * 
   * @param id Unique identifier for the node
   * @param name Human-readable name of the node
   */
  constructor(id: string, name: string) {
    super(id, name);
    
    // Initialize data
    this.data = {};
    this.transformationFn = null;
    
    // Add standard ports
    this.addInput('data', 'object', 'Input data to store or transform');
    this.addOutput('data', 'object', 'Stored or transformed data');
  }
  
  /**
   * Set the data stored in the node
   * 
   * @param data The data to store
   */
  public setData(data: Record<string, any>): void {
    this.data = { ...data };
  }
  
  /**
   * Get the data stored in the node
   * 
   * @returns The stored data
   */
  public getData(): Record<string, any> {
    return { ...this.data };
  }
  
  /**
   * Set a transformation function for the data
   * 
   * @param fn The transformation function
   */
  public setTransformationFunction(fn: DataTransformationFn): void {
    this.transformationFn = fn;
  }
  
  /**
   * Clear the transformation function
   */
  public clearTransformationFunction(): void {
    this.transformationFn = null;
  }
  
  /**
   * Process the inputs and produce outputs
   * 
   * @param inputs Input data for the node
   * @returns The node outputs
   * @protected
   */
  protected process(inputs: Record<string, any>): Record<string, any> {
    // If input data is provided, update the stored data
    if (inputs.data) {
      this.data = { ...this.data, ...inputs.data };
    }
    
    // Apply transformation if set
    let outputData = this.data;
    if (this.transformationFn) {
      outputData = this.transformationFn(this.data);
    }
    
    // Return the data
    return {
      data: outputData
    };
  }
  
  /**
   * Validate the node configuration
   * 
   * @returns True if the configuration is valid, false otherwise
   */
  public validate(): boolean {
    // DataNode is always valid
    return true;
  }
  
  /**
   * Reset the node to its initial state
   */
  public reset(): void {
    super.reset();
    // Clear data
    this.data = {};
  }
}

export default DataNode;
