/**
 * EventPropagator.ts
 * 
 * Implements the event propagation system for RebelFlow.
 * The EventPropagator manages how events flow through the node graph
 * based on connections between nodes.
 */

import { EventBus, getEventBus } from './EventBus';
import { CoreEventTypes } from './EventTypes';

/**
 * Type definition for a workflow
 */
export interface Workflow {
  /**
   * Unique identifier for the workflow
   */
  id: string;
  
  /**
   * Nodes that make up the workflow
   */
  nodes: Node[];
  
  /**
   * Connections between nodes
   */
  connections: Connection[];
}

/**
 * Type definition for a node
 */
export interface Node {
  /**
   * Unique identifier for the node
   */
  id: string;
  
  /**
   * Type of the node
   */
  type: string;
}

/**
 * Type definition for a connection between nodes
 */
export interface Connection {
  /**
   * Unique identifier for the connection
   */
  id: string;
  
  /**
   * Source node ID
   */
  sourceNodeId: string;
  
  /**
   * Source port ID
   */
  sourcePortId: string;
  
  /**
   * Target node ID
   */
  targetNodeId: string;
  
  /**
   * Target port ID
   */
  targetPortId: string;
}

/**
 * Options for event propagation
 */
export interface PropagationOptions {
  /**
   * Whether to propagate the event through the entire connection chain
   * Default: false (only propagate to directly connected nodes)
   */
  propagateChain?: boolean;
  
  /**
   * Function to transform event data before propagation
   * @param data The event data
   * @param sourceNodeId The ID of the source node
   * @param targetNodeId The ID of the target node
   * @returns Transformed event data
   */
  transform?: (data: any, sourceNodeId: string, targetNodeId: string) => any;
}

/**
 * Type definition for an event filter function
 */
export type EventFilter = (eventType: string, data: any) => boolean;

/**
 * EventPropagator class that manages event propagation through the node graph
 */
export class EventPropagator {
  private eventBus: EventBus;
  private workflows: Map<string, Workflow>;
  private filters: EventFilter[];
  private visitedNodes: Set<string>; // Used to prevent infinite loops in circular connections
  
  /**
   * Creates a new EventPropagator
   * 
   * @param eventBus Optional EventBus instance to use (defaults to singleton)
   */
  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus || getEventBus();
    this.workflows = new Map<string, Workflow>();
    this.filters = [];
    this.visitedNodes = new Set<string>();
  }
  
  /**
   * Get the EventBus instance used by this propagator
   * 
   * @returns The EventBus instance
   */
  public getEventBus(): EventBus {
    return this.eventBus;
  }
  
  /**
   * Register a workflow for event propagation
   * 
   * @param workflow The workflow to register
   * @throws Error if the workflow is already registered
   */
  public registerWorkflow(workflow: Workflow): void {
    if (this.workflows.has(workflow.id)) {
      throw new Error(`Workflow with ID ${workflow.id} is already registered`);
    }
    
    this.workflows.set(workflow.id, workflow);
  }
  
  /**
   * Unregister a workflow
   * 
   * @param workflowId The ID of the workflow to unregister
   */
  public unregisterWorkflow(workflowId: string): void {
    this.workflows.delete(workflowId);
  }
  
  /**
   * Check if a workflow is registered
   * 
   * @param workflowId The ID of the workflow to check
   * @returns True if the workflow is registered
   */
  public hasWorkflow(workflowId: string): boolean {
    return this.workflows.has(workflowId);
  }
  
  /**
   * Propagate an event through the node graph
   * 
   * @param workflowId The ID of the workflow
   * @param sourceNodeId The ID of the source node
   * @param eventType The type of event
   * @param data The event data
   * @param options Options for propagation
   * @throws Error if the workflow is not registered
   */
  public async propagateEvent(
    workflowId: string,
    sourceNodeId: string,
    eventType: string,
    data: any,
    options: PropagationOptions = {}
  ): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    
    if (!workflow) {
      throw new Error(`Workflow with ID ${workflowId} is not registered`);
    }
    
    // Clear visited nodes set for this propagation
    this.visitedNodes.clear();
    
    // Start propagation from the source node
    await this.propagateEventToConnectedNodes(
      workflow,
      sourceNodeId,
      eventType,
      data,
      options
    );
  }
  
  /**
   * Add an event filter
   * 
   * @param filter The filter function
   */
  public addEventFilter(filter: EventFilter): void {
    this.filters.push(filter);
  }
  
  /**
   * Remove an event filter
   * 
   * @param filter The filter function to remove
   */
  public removeEventFilter(filter: EventFilter): void {
    const index = this.filters.indexOf(filter);
    if (index !== -1) {
      this.filters.splice(index, 1);
    }
  }
  
  /**
   * Clear all event filters
   */
  public clearEventFilters(): void {
    this.filters = [];
  }
  
  /**
   * Propagate an event to connected nodes
   * 
   * @param workflow The workflow
   * @param sourceNodeId The ID of the source node
   * @param eventType The type of event
   * @param data The event data
   * @param options Options for propagation
   * @private
   */
  private async propagateEventToConnectedNodes(
    workflow: Workflow,
    sourceNodeId: string,
    eventType: string,
    data: any,
    options: PropagationOptions
  ): Promise<void> {
    // Prevent infinite loops in circular connections
    if (this.visitedNodes.has(sourceNodeId)) {
      return;
    }
    
    // Mark this node as visited
    this.visitedNodes.add(sourceNodeId);
    
    // Find all connections from this node
    const connections = workflow.connections.filter(
      conn => conn.sourceNodeId === sourceNodeId
    );
    
    // Propagate to each connected node
    for (const connection of connections) {
      const targetNodeId = connection.targetNodeId;
      
      // Apply transformations if provided
      let eventData = { ...data, sourceNodeId };
      if (options.transform) {
        eventData = options.transform(eventData, sourceNodeId, targetNodeId);
      }
      
      // Apply filters
      if (!this.passesFilters(eventType, eventData)) {
        continue;
      }
      
      // Create the node-specific event type
      const nodeEventType = `node:${targetNodeId}:${eventType}`;
      
      // Publish the event
      await this.eventBus.publish(nodeEventType, eventData);
      
      // Propagate through the chain if requested
      if (options.propagateChain) {
        await this.propagateEventToConnectedNodes(
          workflow,
          targetNodeId,
          eventType,
          eventData,
          options
        );
      }
    }
  }
  
  /**
   * Check if an event passes all filters
   * 
   * @param eventType The type of event
   * @param data The event data
   * @returns True if the event passes all filters
   * @private
   */
  private passesFilters(eventType: string, data: any): boolean {
    // If no filters, always pass
    if (this.filters.length === 0) {
      return true;
    }
    
    // Check all filters (all must pass)
    for (const filter of this.filters) {
      if (!filter(eventType, data)) {
        return false;
      }
    }
    
    return true;
  }
}

/**
 * Get a new EventPropagator instance
 * 
 * @param eventBus Optional EventBus instance to use
 * @returns A new EventPropagator instance
 */
export function createEventPropagator(eventBus?: EventBus): EventPropagator {
  return new EventPropagator(eventBus);
}

export default {
  createEventPropagator
};
