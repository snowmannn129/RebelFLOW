/**
 * INode.ts
 * 
 * Defines the interface for all nodes in the system.
 * This interface specifies the core functionality that all nodes must implement.
 */

import { NodePort } from './NodePort';
import { NodeStatus } from './NodeStatus';

/**
 * Interface representing a node in the system
 */
export interface INode {
  /**
   * Get the unique identifier of the node
   * 
   * @returns The node ID
   */
  getId(): string;
  
  /**
   * Get the type of the node
   * 
   * @returns The node type
   */
  getType(): string;
  
  /**
   * Get the human-readable name of the node
   * 
   * @returns The node name
   */
  getName(): string;
  
  /**
   * Set the human-readable name of the node
   * 
   * @param name The new node name
   */
  setName(name: string): void;
  
  /**
   * Get the current status of the node
   * 
   * @returns The node status
   */
  getStatus(): NodeStatus;
  
  /**
   * Get all input ports of the node
   * 
   * @returns Array of input ports
   */
  getInputs(): NodePort[];
  
  /**
   * Get all output ports of the node
   * 
   * @returns Array of output ports
   */
  getOutputs(): NodePort[];
  
  /**
   * Get an input port by ID
   * 
   * @param id The port ID
   * @returns The input port, or undefined if not found
   */
  getInputPort(id: string): NodePort | undefined;
  
  /**
   * Get an output port by ID
   * 
   * @param id The port ID
   * @returns The output port, or undefined if not found
   */
  getOutputPort(id: string): NodePort | undefined;
  
  /**
   * Add an input port to the node
   * 
   * @param id The port ID
   * @param type The data type of the port
   * @param description Optional description of the port
   * @param defaultValue Optional default value for the port
   * @returns The created port
   */
  addInput(id: string, type: string, description?: string, defaultValue?: any): NodePort;
  
  /**
   * Add an output port to the node
   * 
   * @param id The port ID
   * @param type The data type of the port
   * @param description Optional description of the port
   * @returns The created port
   */
  addOutput(id: string, type: string, description?: string): NodePort;
  
  /**
   * Remove an input port from the node
   * 
   * @param id The port ID
   * @returns True if the port was removed, false if it wasn't found
   */
  removeInput(id: string): boolean;
  
  /**
   * Remove an output port from the node
   * 
   * @param id The port ID
   * @returns True if the port was removed, false if it wasn't found
   */
  removeOutput(id: string): boolean;
  
  /**
   * Execute the node with the given inputs
   * 
   * @param inputs Input data for the node
   * @returns Promise that resolves with the node outputs
   */
  execute(inputs: Record<string, any>): Promise<Record<string, any>>;
  
  /**
   * Get the node configuration
   * 
   * @returns The node configuration
   */
  getConfig(): Record<string, any>;
  
  /**
   * Set the node configuration
   * 
   * @param config The new configuration
   */
  setConfig(config: Record<string, any>): void;
  
  /**
   * Update the node configuration (partial update)
   * 
   * @param config The configuration updates
   */
  updateConfig(config: Record<string, any>): void;
  
  /**
   * Get a specific configuration value
   * 
   * @param key The configuration key
   * @param defaultValue Optional default value if the key is not found
   * @returns The configuration value, or the default value if not found
   */
  getConfigValue<T>(key: string, defaultValue?: T): T | undefined;
  
  /**
   * Set a specific metadata value
   * 
   * @param key The metadata key
   * @param value The metadata value
   */
  setMetadata(key: string, value: any): void;
  
  /**
   * Get a specific metadata value
   * 
   * @param key The metadata key
   * @returns The metadata value, or undefined if not found
   */
  getMetadata<T>(key: string): T | undefined;
  
  /**
   * Validate the node configuration
   * 
   * @returns True if the configuration is valid, false otherwise
   */
  validate(): boolean;
  
  /**
   * Reset the node to its initial state
   */
  reset(): void;
}

export default INode;
