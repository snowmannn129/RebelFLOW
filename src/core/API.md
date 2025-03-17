# Core Module API

This document describes the public API for the Core module of RebelFlow. These interfaces and classes are intended to be used by other modules and represent the stable API contract.

## Event System

### `EventBus`

The central event management system that facilitates communication between nodes.

```typescript
class EventBus {
  /**
   * Subscribe to an event type
   * @param eventType The type of event to subscribe to
   * @param callback Function to be called when the event is triggered
   * @param options Subscription options (priority, once, etc.)
   * @returns Subscription object that can be used to unsubscribe
   */
  subscribe<T>(eventType: string, callback: (data: T) => void, options?: SubscriptionOptions): Subscription;
  
  /**
   * Publish an event to all subscribers
   * @param eventType The type of event to publish
   * @param data The event data to be passed to subscribers
   * @returns Promise that resolves when all subscribers have processed the event
   */
  publish<T>(eventType: string, data: T): Promise<void>;
  
  /**
   * Unsubscribe from an event
   * @param subscription The subscription to cancel
   */
  unsubscribe(subscription: Subscription): void;
  
  /**
   * Check if an event type has subscribers
   * @param eventType The event type to check
   * @returns True if the event has subscribers
   */
  hasSubscribers(eventType: string): boolean;
  
  /**
   * Get the number of subscribers for an event type
   * @param eventType The event type to check
   * @returns The number of subscribers
   */
  getSubscriberCount(eventType: string): number;
  
  /**
   * Remove all subscriptions for a specific event type
   * @param eventType The event type to clear subscriptions for
   */
  clearEventSubscriptions(eventType: string): void;
  
  /**
   * Remove all subscriptions
   */
  clearAllSubscriptions(): void;
}
```

### `EventPropagator`

Manages how events flow through the node graph based on connections between nodes.

```typescript
class EventPropagator {
  /**
   * Register a workflow for event propagation
   * @param workflow The workflow to register
   * @throws Error if the workflow is already registered
   */
  registerWorkflow(workflow: Workflow): void;
  
  /**
   * Unregister a workflow
   * @param workflowId The ID of the workflow to unregister
   */
  unregisterWorkflow(workflowId: string): void;
  
  /**
   * Check if a workflow is registered
   * @param workflowId The ID of the workflow to check
   * @returns True if the workflow is registered
   */
  hasWorkflow(workflowId: string): boolean;
  
  /**
   * Propagate an event through the node graph
   * @param workflowId The ID of the workflow
   * @param sourceNodeId The ID of the source node
   * @param eventType The type of event
   * @param data The event data
   * @param options Options for propagation
   * @throws Error if the workflow is not registered
   */
  propagateEvent(
    workflowId: string,
    sourceNodeId: string,
    eventType: string,
    data: any,
    options?: PropagationOptions
  ): Promise<void>;
  
  /**
   * Add an event filter
   * @param filter The filter function
   */
  addEventFilter(filter: EventFilter): void;
  
  /**
   * Remove an event filter
   * @param filter The filter function to remove
   */
  removeEventFilter(filter: EventFilter): void;
  
  /**
   * Clear all event filters
   */
  clearEventFilters(): void;
}

/**
 * Options for event propagation
 */
interface PropagationOptions {
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
type EventFilter = (eventType: string, data: any) => boolean;
```

### `Subscription`

Represents an active subscription to an event.

```typescript
interface Subscription {
  /**
   * The event type this subscription is for
   */
  readonly eventType: string;
  
  /**
   * Whether this subscription is still active
   */
  readonly active: boolean;
  
  /**
   * Cancel this subscription
   */
  unsubscribe(): void;
}
```

### `EventTypes`

Standard event types used throughout the system.

```typescript
enum CoreEventTypes {
  // Workflow events
  WORKFLOW_STARTED = 'workflow:started',
  WORKFLOW_COMPLETED = 'workflow:completed',
  WORKFLOW_FAILED = 'workflow:failed',
  WORKFLOW_PAUSED = 'workflow:paused',
  WORKFLOW_RESUMED = 'workflow:resumed',
  
  // Node events
  NODE_EXECUTION_STARTED = 'node:execution:started',
  NODE_EXECUTION_COMPLETED = 'node:execution:completed',
  NODE_EXECUTION_FAILED = 'node:execution:failed',
  
  // Data events
  DATA_FLOW_STARTED = 'data:flow:started',
  DATA_FLOW_COMPLETED = 'data:flow:completed',
  DATA_FLOW_FAILED = 'data:flow:failed',
  
  // System events
  SYSTEM_ERROR = 'system:error',
  SYSTEM_WARNING = 'system:warning',
  SYSTEM_INFO = 'system:info'
}
```

## Workflow Execution

### `WorkflowEngine`

Manages the execution of node workflows.

```typescript
class WorkflowEngine {
  /**
   * Execute a workflow
   * @param workflow The workflow to execute
   * @param options Execution options (e.g., starting node, timeout)
   * @returns Promise that resolves with the workflow result
   */
  executeWorkflow(workflow: Workflow, options?: ExecutionOptions): Promise<WorkflowResult>;
  
  /**
   * Pause a running workflow
   * @param workflowId The ID of the workflow to pause
   * @returns Promise that resolves when the workflow is paused
   */
  pauseWorkflow(workflowId: string): Promise<void>;
  
  /**
   * Resume a paused workflow
   * @param workflowId The ID of the workflow to resume
   * @returns Promise that resolves when the workflow is resumed
   */
  resumeWorkflow(workflowId: string): Promise<void>;
  
  /**
   * Stop a running workflow
   * @param workflowId The ID of the workflow to stop
   * @returns Promise that resolves when the workflow is stopped
   */
  stopWorkflow(workflowId: string): Promise<void>;
  
  /**
   * Get the current status of a workflow
   * @param workflowId The ID of the workflow
   * @returns The current workflow status
   */
  getWorkflowStatus(workflowId: string): WorkflowStatus;
}
```

### `NodeExecutor`

Handles the execution of individual nodes within a workflow.

```typescript
class NodeExecutor {
  /**
   * Execute a single node
   * @param node The node to execute
   * @param inputs Input data for the node
   * @param context Execution context
   * @returns Promise that resolves with the node outputs
   */
  executeNode(node: Node, inputs: NodeInputs, context: ExecutionContext): Promise<NodeOutputs>;
}
```

## Core Types

### `Workflow`

Represents a complete workflow of connected nodes.

```typescript
interface Workflow {
  /**
   * Unique identifier for the workflow
   */
  id: string;
  
  /**
   * Human-readable name of the workflow
   */
  name: string;
  
  /**
   * Description of the workflow
   */
  description?: string;
  
  /**
   * Nodes that make up the workflow
   */
  nodes: Node[];
  
  /**
   * Connections between nodes
   */
  connections: Connection[];
  
  /**
   * Entry point nodes (nodes that start the workflow)
   */
  entryPoints: string[];
  
  /**
   * Exit point nodes (nodes that end the workflow)
   */
  exitPoints: string[];
  
  /**
   * Metadata associated with the workflow
   */
  metadata?: Record<string, any>;
}
```

### `Node`

Represents a single node in a workflow.

```typescript
interface Node {
  /**
   * Unique identifier for the node
   */
  id: string;
  
  /**
   * Type of the node
   */
  type: string;
  
  /**
   * Human-readable name of the node
   */
  name: string;
  
  /**
   * Input ports for the node
   */
  inputs: NodePort[];
  
  /**
   * Output ports for the node
   */
  outputs: NodePort[];
  
  /**
   * Node configuration
   */
  config?: Record<string, any>;
  
  /**
   * Position in the editor (for UI purposes)
   */
  position?: { x: number; y: number };
}
```

### `Connection`

Represents a connection between two nodes.

```typescript
interface Connection {
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
```

## Utilities

### `Logger`

Provides logging functionality for the system.

```typescript
class Logger {
  /**
   * Log an informational message
   * @param message The message to log
   * @param context Additional context data
   */
  info(message: string, context?: Record<string, any>): void;
  
  /**
   * Log a warning message
   * @param message The message to log
   * @param context Additional context data
   */
  warn(message: string, context?: Record<string, any>): void;
  
  /**
   * Log an error message
   * @param message The message to log
   * @param error The error object
   * @param context Additional context data
   */
  error(message: string, error?: Error, context?: Record<string, any>): void;
  
  /**
   * Log a debug message (only in development)
   * @param message The message to log
   * @param context Additional context data
   */
  debug(message: string, context?: Record<string, any>): void;
}
```

### `ErrorHandling`

Provides error handling utilities.

```typescript
class ErrorHandler {
  /**
   * Handle an error in a standardized way
   * @param error The error to handle
   * @param context Additional context about where the error occurred
   * @returns A standardized error object
   */
  handleError(error: Error, context?: Record<string, any>): StandardError;
}

interface StandardError {
  /**
   * Error code
   */
  code: string;
  
  /**
   * Error message
   */
  message: string;
  
  /**
   * Original error
   */
  originalError?: Error;
  
  /**
   * Additional context
   */
  context?: Record<string, any>;
  
  /**
   * Stack trace
   */
  stack?: string;
}
```

## Usage Examples

### Subscribing to Events

```typescript
import { EventBus, CoreEventTypes } from '@rebelflow/core';

const eventBus = new EventBus();

// Subscribe to workflow started events
const subscription = eventBus.subscribe(CoreEventTypes.WORKFLOW_STARTED, (workflow) => {
  console.log(`Workflow started: ${workflow.name}`);
});

// Later, unsubscribe
subscription.unsubscribe();
```

### Executing a Workflow

```typescript
import { WorkflowEngine } from '@rebelflow/core';

const engine = new WorkflowEngine();

async function runWorkflow(workflow) {
  try {
    const result = await engine.executeWorkflow(workflow);
    console.log('Workflow completed successfully', result);
  } catch (error) {
    console.error('Workflow execution failed', error);
  }
}
```

### Using the EventPropagator

```typescript
import { EventPropagator, EventBus } from '@rebelflow/core';

// Create an event propagator
const eventBus = EventBus.getInstance();
const propagator = new EventPropagator(eventBus);

// Register a workflow
const workflow = {
  id: 'workflow-1',
  nodes: [
    { id: 'node-1', type: 'source' },
    { id: 'node-2', type: 'process' },
    { id: 'node-3', type: 'sink' }
  ],
  connections: [
    { id: 'conn-1', sourceNodeId: 'node-1', sourcePortId: 'out-1', targetNodeId: 'node-2', targetPortId: 'in-1' },
    { id: 'conn-2', sourceNodeId: 'node-2', sourcePortId: 'out-1', targetNodeId: 'node-3', targetPortId: 'in-1' }
  ]
};

propagator.registerWorkflow(workflow);

// Add an event filter
propagator.addEventFilter((eventType, data) => {
  // Only allow events with priority > 0
  return data.priority > 0;
});

// Propagate an event through the workflow
async function triggerEvent() {
  await propagator.propagateEvent(
    'workflow-1',
    'node-1',
    'data:updated',
    { value: 42, priority: 1 },
    { 
      // Propagate through the entire chain
      propagateChain: true,
      // Transform data during propagation
      transform: (data, sourceId, targetId) => {
        return {
          ...data,
          path: `${sourceId}->${targetId}`
        };
      }
    }
  );
}
