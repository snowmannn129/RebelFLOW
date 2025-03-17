/**
 * ConnectionManager.ts
 * 
 * Implements the manager for node connections.
 * The ConnectionManager is responsible for creating, validating, and managing connections between nodes.
 */

import { v4 as uuidv4 } from 'uuid';
import { INode } from '../base/INode';
import { NodeConnection } from './NodeConnection';
import { getEventBus } from '@rebelflow/core/events/EventBus';
import { CoreEventTypes } from '@rebelflow/core/events/EventTypes';

/**
 * Class for managing connections between nodes
 */
export class ConnectionManager {
  /**
   * Map of connections by ID
   */
  private connections: Map<string, NodeConnection>;
  
  /**
   * Event bus for publishing events
   */
  private eventBus = getEventBus();
  
  /**
   * Creates a new ConnectionManager
   */
  constructor() {
    this.connections = new Map<string, NodeConnection>();
  }
  
  /**
   * Create a connection between two nodes
   * 
   * @param sourceNode Source node
   * @param sourcePortId Source port ID
   * @param targetNode Target node
   * @param targetPortId Target port ID
   * @returns The created connection, or undefined if the connection is invalid
   */
  public createConnection(
    sourceNode: INode,
    sourcePortId: string,
    targetNode: INode,
    targetPortId: string
  ): NodeConnection | undefined {
    // Check if source port exists
    const sourcePort = sourceNode.getOutputPort(sourcePortId);
    if (!sourcePort) {
      console.error(`Source port ${sourcePortId} not found on node ${sourceNode.getId()}`);
      return undefined;
    }
    
    // Check if target port exists
    const targetPort = targetNode.getInputPort(targetPortId);
    if (!targetPort) {
      console.error(`Target port ${targetPortId} not found on node ${targetNode.getId()}`);
      return undefined;
    }
    
    // Check if port types match
    if (sourcePort.type !== targetPort.type) {
      console.error(`Port types do not match: ${sourcePort.type} != ${targetPort.type}`);
      return undefined;
    }
    
    // Check if connection already exists
    const existingConnection = this.findConnection(sourceNode.getId(), sourcePortId, targetNode.getId(), targetPortId);
    if (existingConnection) {
      console.error('Connection already exists');
      return undefined;
    }
    
    // Check if target port already has a connection
    const targetConnections = this.getConnectionsByPort(targetNode, targetPortId);
    if (targetConnections.length > 0) {
      console.error(`Target port ${targetPortId} already has a connection`);
      return undefined;
    }
    
    // Create a new connection
    const id = uuidv4();
    const connection = new NodeConnection(id, sourceNode, sourcePortId, targetNode, targetPortId);
    
    // Register the connection
    this.connections.set(id, connection);
    
    // Publish connection created event
    this.eventBus.publish(CoreEventTypes.DATA_FLOW_STARTED, {
      connectionId: id,
      sourceNodeId: sourceNode.getId(),
      sourcePortId,
      targetNodeId: targetNode.getId(),
      targetPortId
    });
    
    return connection;
  }
  
  /**
   * Get all connections
   * 
   * @returns Array of all connections
   */
  public getConnections(): NodeConnection[] {
    return Array.from(this.connections.values());
  }
  
  /**
   * Get a connection by ID
   * 
   * @param id The connection ID
   * @returns The connection, or undefined if not found
   */
  public getConnectionById(id: string): NodeConnection | undefined {
    return this.connections.get(id);
  }
  
  /**
   * Get all connections for a node
   * 
   * @param node The node
   * @returns Array of connections for the node
   */
  public getConnectionsByNode(node: INode): NodeConnection[] {
    const nodeId = node.getId();
    return this.getConnections().filter(
      connection =>
        connection.getSourceNode().getId() === nodeId ||
        connection.getTargetNode().getId() === nodeId
    );
  }
  
  /**
   * Get all connections for a port
   * 
   * @param node The node
   * @param portId The port ID
   * @returns Array of connections for the port
   */
  public getConnectionsByPort(node: INode, portId: string): NodeConnection[] {
    const nodeId = node.getId();
    return this.getConnections().filter(
      connection =>
        (connection.getSourceNode().getId() === nodeId && connection.getSourcePortId() === portId) ||
        (connection.getTargetNode().getId() === nodeId && connection.getTargetPortId() === portId)
    );
  }
  
  /**
   * Remove a connection
   * 
   * @param id The connection ID
   * @returns True if the connection was removed, false if it wasn't found
   */
  public removeConnection(id: string): boolean {
    const connection = this.connections.get(id);
    
    if (connection) {
      // Publish connection deleted event
      this.eventBus.publish(CoreEventTypes.DATA_FLOW_FAILED, {
        connectionId: id,
        sourceNodeId: connection.getSourceNode().getId(),
        sourcePortId: connection.getSourcePortId(),
        targetNodeId: connection.getTargetNode().getId(),
        targetPortId: connection.getTargetPortId()
      });
      
      // Remove the connection
      this.connections.delete(id);
      return true;
    }
    
    return false;
  }
  
  /**
   * Remove all connections for a node
   * 
   * @param node The node
   * @returns Number of connections removed
   */
  public removeConnectionsByNode(node: INode): number {
    const connections = this.getConnectionsByNode(node);
    
    for (const connection of connections) {
      this.removeConnection(connection.getId());
    }
    
    return connections.length;
  }
  
  /**
   * Find a connection by source and target
   * 
   * @param sourceNodeId Source node ID
   * @param sourcePortId Source port ID
   * @param targetNodeId Target node ID
   * @param targetPortId Target port ID
   * @returns The connection, or undefined if not found
   * @private
   */
  private findConnection(
    sourceNodeId: string,
    sourcePortId: string,
    targetNodeId: string,
    targetPortId: string
  ): NodeConnection | undefined {
    return this.getConnections().find(
      connection =>
        connection.getSourceNode().getId() === sourceNodeId &&
        connection.getSourcePortId() === sourcePortId &&
        connection.getTargetNode().getId() === targetNodeId &&
        connection.getTargetPortId() === targetPortId
    );
  }
  
  /**
   * Clear all connections
   */
  public clear(): void {
    this.connections.clear();
  }
}

export default ConnectionManager;
