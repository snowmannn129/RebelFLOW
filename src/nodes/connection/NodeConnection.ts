/**
 * NodeConnection.ts
 * 
 * Implements the connection between two nodes.
 * Connections represent the data flow between nodes in the workflow.
 */

import { INode } from '../base/INode';

/**
 * Class representing a connection between two nodes
 */
export class NodeConnection {
  /**
   * Unique identifier for the connection
   */
  private readonly id: string;
  
  /**
   * Source node
   */
  private readonly sourceNode: INode;
  
  /**
   * Source port ID
   */
  private readonly sourcePortId: string;
  
  /**
   * Target node
   */
  private readonly targetNode: INode;
  
  /**
   * Target port ID
   */
  private readonly targetPortId: string;
  
  /**
   * Creates a new NodeConnection
   * 
   * @param id Unique identifier for the connection
   * @param sourceNode Source node
   * @param sourcePortId Source port ID
   * @param targetNode Target node
   * @param targetPortId Target port ID
   */
  constructor(
    id: string,
    sourceNode: INode,
    sourcePortId: string,
    targetNode: INode,
    targetPortId: string
  ) {
    this.id = id;
    this.sourceNode = sourceNode;
    this.sourcePortId = sourcePortId;
    this.targetNode = targetNode;
    this.targetPortId = targetPortId;
  }
  
  /**
   * Get the unique identifier of the connection
   * 
   * @returns The connection ID
   */
  public getId(): string {
    return this.id;
  }
  
  /**
   * Get the source node
   * 
   * @returns The source node
   */
  public getSourceNode(): INode {
    return this.sourceNode;
  }
  
  /**
   * Get the source port ID
   * 
   * @returns The source port ID
   */
  public getSourcePortId(): string {
    return this.sourcePortId;
  }
  
  /**
   * Get the target node
   * 
   * @returns The target node
   */
  public getTargetNode(): INode {
    return this.targetNode;
  }
  
  /**
   * Get the target port ID
   * 
   * @returns The target port ID
   */
  public getTargetPortId(): string {
    return this.targetPortId;
  }
  
  /**
   * Check if the connection is valid
   * 
   * @returns True if the connection is valid, false otherwise
   */
  public isValid(): boolean {
    // Get the source and target ports
    const sourcePort = this.sourceNode.getOutputPort(this.sourcePortId);
    const targetPort = this.targetNode.getInputPort(this.targetPortId);
    
    // Check if ports exist
    if (!sourcePort || !targetPort) {
      return false;
    }
    
    // Check if port types match
    return sourcePort.type === targetPort.type;
  }
  
  /**
   * Transfer data from source to target
   * 
   * @param sourceOutputs Output data from the source node
   * @returns Input data for the target node
   */
  public transferData(sourceOutputs: Record<string, any>): Record<string, any> {
    // Get the source data
    const sourceData = sourceOutputs[this.sourcePortId];
    
    // If source data is undefined, return empty object
    if (sourceData === undefined) {
      return {};
    }
    
    // Return data mapped to target port
    return {
      [this.targetPortId]: sourceData
    };
  }
  
  /**
   * Convert the connection to a JSON-serializable object
   * 
   * @returns JSON-serializable representation of the connection
   */
  public toJSON(): Record<string, any> {
    return {
      id: this.id,
      sourceNodeId: this.sourceNode.getId(),
      sourcePortId: this.sourcePortId,
      targetNodeId: this.targetNode.getId(),
      targetPortId: this.targetPortId
    };
  }
}

export default NodeConnection;
