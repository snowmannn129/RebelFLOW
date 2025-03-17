/**
 * BaseNode.ts
 * 
 * Implements the base abstract class for all nodes in the system.
 * This class provides common functionality for all node types.
 */

import { INode } from './INode';
import { NodePort, NodePortType } from './NodePort';
import { NodeStatus } from './NodeStatus';
import { getEventBus } from '@rebelflow/core/events/EventBus';
import { CoreEventTypes } from '@rebelflow/core/events/EventTypes';

/**
 * Abstract base class for all nodes in the system
 */
export abstract class BaseNode implements INode {
  /**
   * Unique identifier for the node
   */
  private readonly id: string;
  
  /**
   * Type of the node
   */
  private readonly type: string;
  
  /**
   * Human-readable name of the node
   */
  private name: string;
  
  /**
   * Current status of the node
   */
  private status: NodeStatus;
  
  /**
   * Input ports of the node
   */
  private inputs: NodePort[];
  
  /**
   * Output ports of the node
   */
  private outputs: NodePort[];
  
  /**
   * Configuration of the node
   */
  private config: Record<string, any>;
  
  /**
   * Metadata of the node (e.g., position, size, etc.)
   */
  private metadata: Record<string, any>;
  
  /**
   * Event bus for publishing events
   */
  private eventBus = getEventBus();
  
  /**
   * Creates a new BaseNode
   * 
   * @param id Unique identifier for the node
   * @param name Human-readable name of the node
   */
  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    this.type = this.constructor.name;
    this.status = NodeStatus.IDLE;
    this.inputs = [];
    this.outputs = [];
    this.config = {};
    this.metadata = {};
  }
  
  /**
   * Get the unique identifier of the node
   * 
   * @returns The node ID
   */
  public getId(): string {
    return this.id;
  }
  
  /**
   * Get the type of the node
   * 
   * @returns The node type
   */
  public getType(): string {
    return this.type;
  }
  
  /**
   * Get the human-readable name of the node
   * 
   * @returns The node name
   */
  public getName(): string {
    return this.name;
  }
  
  /**
   * Set the human-readable name of the node
   * 
   * @param name The new node name
   */
  public setName(name: string): void {
    this.name = name;
  }
  
  /**
   * Get the current status of the node
   * 
   * @returns The node status
   */
  public getStatus(): NodeStatus {
    return this.status;
  }
  
  /**
   * Set the current status of the node
   * 
   * @param status The new node status
   * @private
   */
  private setStatus(status: NodeStatus): void {
    this.status = status;
  }
  
  /**
   * Get all input ports of the node
   * 
   * @returns Array of input ports
   */
  public getInputs(): NodePort[] {
    return [...this.inputs];
  }
  
  /**
   * Get all output ports of the node
   * 
   * @returns Array of output ports
   */
  public getOutputs(): NodePort[] {
    return [...this.outputs];
  }
  
  /**
   * Get an input port by ID
   * 
   * @param id The port ID
   * @returns The input port, or undefined if not found
   */
  public getInputPort(id: string): NodePort | undefined {
    return this.inputs.find(port => port.id === id);
  }
  
  /**
   * Get an output port by ID
   * 
   * @param id The port ID
   * @returns The output port, or undefined if not found
   */
  public getOutputPort(id: string): NodePort | undefined {
    return this.outputs.find(port => port.id === id);
  }
  
  /**
   * Add an input port to the node
   * 
   * @param id The port ID
   * @param type The data type of the port
   * @param description Optional description of the port
   * @param defaultValue Optional default value for the port
   * @returns The created port
   */
  public addInput(id: string, type: string, description?: string, defaultValue?: any): NodePort {
    // Check if port with this ID already exists
    if (this.getInputPort(id)) {
      throw new Error(`Input port with ID '${id}' already exists`);
    }
    
    const port = NodePort.createInput(id, type, description, defaultValue);
    this.inputs.push(port);
    return port;
  }
  
  /**
   * Add an output port to the node
   * 
   * @param id The port ID
   * @param type The data type of the port
   * @param description Optional description of the port
   * @returns The created port
   */
  public addOutput(id: string, type: string, description?: string): NodePort {
    // Check if port with this ID already exists
    if (this.getOutputPort(id)) {
      throw new Error(`Output port with ID '${id}' already exists`);
    }
    
    const port = NodePort.createOutput(id, type, description);
    this.outputs.push(port);
    return port;
  }
  
  /**
   * Remove an input port from the node
   * 
   * @param id The port ID
   * @returns True if the port was removed, false if it wasn't found
   */
  public removeInput(id: string): boolean {
    const initialLength = this.inputs.length;
    this.inputs = this.inputs.filter(port => port.id !== id);
    return this.inputs.length !== initialLength;
  }
  
  /**
   * Remove an output port from the node
   * 
   * @param id The port ID
   * @returns True if the port was removed, false if it wasn't found
   */
  public removeOutput(id: string): boolean {
    const initialLength = this.outputs.length;
    this.outputs = this.outputs.filter(port => port.id !== id);
    return this.outputs.length !== initialLength;
  }
  
  /**
   * Execute the node with the given inputs
   * 
   * @param inputs Input data for the node
   * @returns Promise that resolves with the node outputs
   */
  public async execute(inputs: Record<string, any>): Promise<Record<string, any>> {
    try {
      // Update status to processing
      this.setStatus(NodeStatus.PROCESSING);
      
      // Apply default values for missing inputs
      const processedInputs = this.applyDefaultValues(inputs);
      
      // Publish node execution started event
      await this.eventBus.publish(CoreEventTypes.NODE_EXECUTION_STARTED, {
        nodeId: this.id,
        nodeType: this.type,
        inputs: processedInputs
      });
      
      // Process the inputs
      const outputs = await this.process(processedInputs);
      
      // Update status to completed
      this.setStatus(NodeStatus.COMPLETED);
      
      // Publish node execution completed event
      await this.eventBus.publish(CoreEventTypes.NODE_EXECUTION_COMPLETED, {
        nodeId: this.id,
        nodeType: this.type,
        outputs
      });
      
      return outputs;
    } catch (error) {
      // Update status to failed
      this.setStatus(NodeStatus.FAILED);
      
      // Publish node execution failed event
      await this.eventBus.publish(CoreEventTypes.NODE_EXECUTION_FAILED, {
        nodeId: this.id,
        nodeType: this.type,
        error
      });
      
      // Re-throw the error
      throw error;
    }
  }
  
  /**
   * Apply default values for missing inputs
   * 
   * @param inputs Input data for the node
   * @returns Input data with default values applied
   * @private
   */
  private applyDefaultValues(inputs: Record<string, any>): Record<string, any> {
    const result = { ...inputs };
    
    // Apply default values for missing inputs
    for (const port of this.inputs) {
      if (result[port.id] === undefined && port.defaultValue !== undefined) {
        result[port.id] = port.defaultValue;
      }
    }
    
    return result;
  }
  
  /**
   * Process the inputs and produce outputs
   * This method must be implemented by derived classes
   * 
   * @param inputs Input data for the node
   * @returns Promise that resolves with the node outputs
   * @protected
   */
  protected abstract process(inputs: Record<string, any>): Promise<Record<string, any>> | Record<string, any>;
  
  /**
   * Get the node configuration
   * 
   * @returns The node configuration
   */
  public getConfig(): Record<string, any> {
    return { ...this.config };
  }
  
  /**
   * Set the node configuration
   * 
   * @param config The new configuration
   */
  public setConfig(config: Record<string, any>): void {
    this.config = { ...config };
  }
  
  /**
   * Update the node configuration (partial update)
   * 
   * @param config The configuration updates
   */
  public updateConfig(config: Record<string, any>): void {
    this.config = { ...this.config, ...config };
  }
  
  /**
   * Get a specific configuration value
   * 
   * @param key The configuration key
   * @param defaultValue Optional default value if the key is not found
   * @returns The configuration value, or the default value if not found
   */
  public getConfigValue<T>(key: string, defaultValue?: T): T | undefined {
    return this.config[key] !== undefined ? this.config[key] : defaultValue;
  }
  
  /**
   * Set a specific metadata value
   * 
   * @param key The metadata key
   * @param value The metadata value
   */
  public setMetadata(key: string, value: any): void {
    this.metadata[key] = value;
  }
  
  /**
   * Get a specific metadata value
   * 
   * @param key The metadata key
   * @returns The metadata value, or undefined if not found
   */
  public getMetadata<T>(key: string): T | undefined {
    return this.metadata[key];
  }
  
  /**
   * Validate the node configuration
   * 
   * @returns True if the configuration is valid, false otherwise
   */
  public validate(): boolean {
    // Base implementation always returns true
    // Derived classes should override this method to provide specific validation
    return true;
  }
  
  /**
   * Reset the node to its initial state
   */
  public reset(): void {
    this.setStatus(NodeStatus.IDLE);
  }
  
  /**
   * Convert the node to a JSON-serializable object
   * 
   * @returns JSON-serializable representation of the node
   */
  public toJSON(): Record<string, any> {
    return {
      id: this.id,
      type: this.type,
      name: this.name,
      inputs: this.inputs,
      outputs: this.outputs,
      config: this.config,
      metadata: this.metadata
    };
  }
}

export default BaseNode;
