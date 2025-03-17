# Event System

The Event System is a core component of RebelFlow that facilitates communication between nodes in a workflow through a publish-subscribe pattern. It provides a decoupled architecture where components can communicate without direct dependencies.

## Overview

The Event System consists of the following key components:

- **EventBus**: Central event management system that handles event subscriptions and publishing
- **Subscription**: Represents an active subscription to an event
- **EventTypes**: Standard event types used throughout the system
- **EventPropagator**: Manages how events flow through the node graph based on connections

## Architecture

```
┌─────────────┐     publishes     ┌───────────┐
│             │─────────────────▶│           │
│  Publisher  │                   │  EventBus │
│             │◀─────────────────│           │
└─────────────┘     confirms      └─────┬─────┘
                                        │
                                        │ notifies
                                        ▼
                                  ┌───────────┐
                                  │           │
                                  │Subscribers│
                                  │           │
                                  └───────────┘
```

The Event System follows a publish-subscribe (pub/sub) pattern where:

1. Publishers emit events to the EventBus
2. The EventBus maintains a registry of subscribers for each event type
3. When an event is published, the EventBus notifies all subscribers
4. The EventPropagator extends this by managing how events flow through connected nodes

## Usage Guide

### Basic Event Subscription

To subscribe to an event:

```typescript
import { getEventBus, CoreEventTypes } from '@rebelflow/core/events';

// Get the EventBus instance
const eventBus = getEventBus();

// Subscribe to an event
const subscription = eventBus.subscribe(CoreEventTypes.WORKFLOW_STARTED, (data) => {
  console.log(`Workflow started: ${data.workflowId}`);
});

// Later, unsubscribe when no longer needed
subscription.unsubscribe();
```

### Publishing Events

To publish an event:

```typescript
import { getEventBus, CoreEventTypes } from '@rebelflow/core/events';

// Get the EventBus instance
const eventBus = getEventBus();

// Publish an event
await eventBus.publish(CoreEventTypes.WORKFLOW_STARTED, {
  workflowId: 'workflow-123',
  timestamp: Date.now()
});
```

### Subscription Options

When subscribing to events, you can provide options to customize behavior:

```typescript
// Subscribe with options
const subscription = eventBus.subscribe(
  CoreEventTypes.NODE_EXECUTION_COMPLETED,
  (data) => {
    console.log(`Node execution completed: ${data.nodeId}`);
  },
  {
    // Higher priority subscribers are called first
    priority: 10,
    
    // 'once' subscriptions are automatically removed after first execution
    once: true,
    
    // Custom ID for the subscription
    id: 'my-custom-subscription',
    
    // Whether to execute the callback asynchronously (default: true)
    async: true
  }
);
```

### Event Propagation

The EventPropagator manages how events flow through the node graph:

```typescript
import { createEventPropagator } from '@rebelflow/core/events';

// Create an event propagator
const propagator = createEventPropagator();

// Register a workflow
const workflow = {
  id: 'workflow-123',
  nodes: [
    { id: 'node-1', type: 'source' },
    { id: 'node-2', type: 'process' },
    { id: 'node-3', type: 'sink' }
  ],
  connections: [
    { 
      id: 'conn-1', 
      sourceNodeId: 'node-1', 
      sourcePortId: 'out-1', 
      targetNodeId: 'node-2', 
      targetPortId: 'in-1' 
    },
    { 
      id: 'conn-2', 
      sourceNodeId: 'node-2', 
      sourcePortId: 'out-1', 
      targetNodeId: 'node-3', 
      targetPortId: 'in-1' 
    }
  ]
};

propagator.registerWorkflow(workflow);

// Propagate an event through the workflow
await propagator.propagateEvent(
  'workflow-123',  // Workflow ID
  'node-1',        // Source node ID
  'data:updated',  // Event type
  { value: 42 },   // Event data
  {
    // Propagate through the entire connection chain
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
```

### Event Filtering

You can add filters to control which events are propagated:

```typescript
// Add an event filter
propagator.addEventFilter((eventType, data) => {
  // Only allow events with priority > 0
  return data.priority > 0;
});

// Remove a filter when no longer needed
propagator.removeEventFilter(myFilter);

// Clear all filters
propagator.clearEventFilters();
```

## Best Practices

### 1. Use Standard Event Types

Use the predefined event types from `EventTypes` whenever possible to maintain consistency:

```typescript
import { CoreEventTypes, UIEventTypes, DataEventTypes } from '@rebelflow/core/events';

// Core events
eventBus.subscribe(CoreEventTypes.WORKFLOW_STARTED, handleWorkflowStart);

// UI events
eventBus.subscribe(UIEventTypes.NODE_SELECTED, handleNodeSelection);

// Data events
eventBus.subscribe(DataEventTypes.DATA_VALIDATION_SUCCEEDED, handleValidation);
```

### 2. Clean Up Subscriptions

Always unsubscribe when components are destroyed to prevent memory leaks:

```typescript
class MyComponent {
  private subscriptions: Subscription[] = [];
  
  initialize() {
    // Store subscriptions
    this.subscriptions.push(
      eventBus.subscribe(CoreEventTypes.WORKFLOW_STARTED, this.handleStart)
    );
    
    this.subscriptions.push(
      eventBus.subscribe(CoreEventTypes.WORKFLOW_COMPLETED, this.handleComplete)
    );
  }
  
  cleanup() {
    // Unsubscribe all
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }
}
```

### 3. Handle Errors in Event Handlers

Always handle errors in event handlers to prevent them from affecting other subscribers:

```typescript
eventBus.subscribe(CoreEventTypes.NODE_EXECUTION_STARTED, async (data) => {
  try {
    await processNodeExecution(data);
  } catch (error) {
    console.error('Error in node execution handler:', error);
    
    // Optionally publish an error event
    await eventBus.publish(CoreEventTypes.SYSTEM_ERROR, {
      source: 'node-execution-handler',
      error
    });
  }
});
```

### 4. Use Event Propagation for Node Communication

When nodes need to communicate, use the EventPropagator rather than direct EventBus publishing:

```typescript
// Instead of this:
eventBus.publish(`node:${targetNodeId}:data:updated`, data);

// Use this:
propagator.propagateEvent(workflowId, sourceNodeId, 'data:updated', data);
```

### 5. Prioritize Critical Handlers

Use the priority option to ensure critical handlers execute first:

```typescript
// Logging handler (low priority)
eventBus.subscribe(
  CoreEventTypes.WORKFLOW_FAILED,
  logFailure,
  { priority: 0 }
);

// Error recovery handler (high priority)
eventBus.subscribe(
  CoreEventTypes.WORKFLOW_FAILED,
  attemptRecovery,
  { priority: 100 }
);
```

## API Reference

### EventBus

The central event management system.

```typescript
class EventBus {
  // Get the singleton instance
  static getInstance(): EventBus;
  
  // Subscribe to an event
  subscribe<T>(
    eventType: string,
    callback: (data: T) => void | Promise<void>,
    options?: SubscriptionOptions
  ): Subscription;
  
  // Publish an event
  publish<T>(eventType: string, data: T): Promise<void>;
  
  // Unsubscribe from an event
  unsubscribe(subscription: Subscription): void;
  
  // Check if an event has subscribers
  hasSubscribers(eventType: string): boolean;
  
  // Get subscriber count
  getSubscriberCount(eventType: string): number;
  
  // Clear subscriptions for an event
  clearEventSubscriptions(eventType: string): void;
  
  // Clear all subscriptions
  clearAllSubscriptions(): void;
  
  // Set a custom logger
  setLogger(logger: Console): void;
}

// Get the singleton instance
function getEventBus(): EventBus;
```

### Subscription

Represents an active subscription to an event.

```typescript
interface Subscription {
  // The event type
  readonly eventType: string;
  
  // Whether the subscription is active
  readonly active: boolean;
  
  // Unique identifier
  readonly id: string;
  
  // Cancel the subscription
  unsubscribe(): void;
}

// Subscription options
interface SubscriptionOptions {
  // Priority (higher numbers execute first)
  priority?: number;
  
  // Auto-remove after first execution
  once?: boolean;
  
  // Custom identifier
  id?: string;
  
  // Execute callback asynchronously
  async?: boolean;
}

// Create a subscription
function createSubscription(
  eventType: string,
  unsubscribeFn: (subscription: Subscription) => void,
  id?: string
): Subscription;
```

### EventPropagator

Manages how events flow through the node graph.

```typescript
class EventPropagator {
  // Constructor
  constructor(eventBus?: EventBus);
  
  // Get the EventBus instance
  getEventBus(): EventBus;
  
  // Register a workflow
  registerWorkflow(workflow: Workflow): void;
  
  // Unregister a workflow
  unregisterWorkflow(workflowId: string): void;
  
  // Check if a workflow is registered
  hasWorkflow(workflowId: string): boolean;
  
  // Propagate an event
  propagateEvent(
    workflowId: string,
    sourceNodeId: string,
    eventType: string,
    data: any,
    options?: PropagationOptions
  ): Promise<void>;
  
  // Add an event filter
  addEventFilter(filter: EventFilter): void;
  
  // Remove an event filter
  removeEventFilter(filter: EventFilter): void;
  
  // Clear all event filters
  clearEventFilters(): void;
}

// Create an event propagator
function createEventPropagator(eventBus?: EventBus): EventPropagator;

// Propagation options
interface PropagationOptions {
  // Propagate through the entire chain
  propagateChain?: boolean;
  
  // Transform data during propagation
  transform?: (data: any, sourceNodeId: string, targetNodeId: string) => any;
}

// Event filter function
type EventFilter = (eventType: string, data: any) => boolean;
```

### EventTypes

Standard event types used throughout the system.

```typescript
// Core events
enum CoreEventTypes {
  WORKFLOW_STARTED = 'workflow:started',
  WORKFLOW_COMPLETED = 'workflow:completed',
  WORKFLOW_FAILED = 'workflow:failed',
  WORKFLOW_PAUSED = 'workflow:paused',
  WORKFLOW_RESUMED = 'workflow:resumed',
  NODE_EXECUTION_STARTED = 'node:execution:started',
  NODE_EXECUTION_COMPLETED = 'node:execution:completed',
  NODE_EXECUTION_FAILED = 'node:execution:failed',
  DATA_FLOW_STARTED = 'data:flow:started',
  DATA_FLOW_COMPLETED = 'data:flow:completed',
  DATA_FLOW_FAILED = 'data:flow:failed',
  SYSTEM_ERROR = 'system:error',
  SYSTEM_WARNING = 'system:warning',
  SYSTEM_INFO = 'system:info'
}

// UI events
enum UIEventTypes {
  CANVAS_ZOOMED = 'canvas:zoomed',
  CANVAS_PANNED = 'canvas:panned',
  CANVAS_RESET = 'canvas:reset',
  NODE_SELECTED = 'node:selected',
  NODE_DESELECTED = 'node:deselected',
  NODE_MOVED = 'node:moved',
  NODE_RESIZED = 'node:resized',
  NODE_ADDED = 'node:added',
  NODE_REMOVED = 'node:removed',
  CONNECTION_CREATED = 'connection:created',
  CONNECTION_DELETED = 'connection:deleted',
  CONNECTION_SELECTED = 'connection:selected',
  EDITOR_UNDO = 'editor:undo',
  EDITOR_REDO = 'editor:redo',
  EDITOR_COPY = 'editor:copy',
  EDITOR_PASTE = 'editor:paste',
  EDITOR_CUT = 'editor:cut',
  EDITOR_DELETE = 'editor:delete'
}

// Data events
enum DataEventTypes {
  DATA_VALIDATION_SUCCEEDED = 'data:validation:succeeded',
  DATA_VALIDATION_FAILED = 'data:validation:failed',
  DATA_TRANSFORMED = 'data:transformed',
  DATA_TRANSFORMATION_FAILED = 'data:transformation:failed',
  DATA_SAVED = 'data:saved',
  DATA_LOADED = 'data:loaded',
  DATA_DELETED = 'data:deleted'
}

// Plugin events
enum PluginEventTypes {
  PLUGIN_LOADED = 'plugin:loaded',
  PLUGIN_UNLOADED = 'plugin:unloaded',
  PLUGIN_ERROR = 'plugin:error',
  PLUGIN_UPDATED = 'plugin:updated'
}

// Combined event types
const EventTypes = {
  Core: CoreEventTypes,
  UI: UIEventTypes,
  Data: DataEventTypes,
  Plugin: PluginEventTypes
};
```

## Advanced Usage

### Custom Event Types

While standard event types are provided, you can create custom event types for specific needs:

```typescript
// Custom event types
const MyCustomEvents = {
  CUSTOM_PROCESS_STARTED: 'custom:process:started',
  CUSTOM_PROCESS_COMPLETED: 'custom:process:completed'
};

// Subscribe to custom event
eventBus.subscribe(MyCustomEvents.CUSTOM_PROCESS_STARTED, handleCustomProcess);

// Publish custom event
await eventBus.publish(MyCustomEvents.CUSTOM_PROCESS_STARTED, {
  processId: 'process-123',
  timestamp: Date.now()
});
```

### Namespaced Events

Use namespaces to organize events and prevent collisions:

```typescript
// Namespaced events
const namespace = 'myFeature';
const eventType = `${namespace}:action:performed`;

// Subscribe to namespaced event
eventBus.subscribe(eventType, handleAction);

// Publish to namespaced event
await eventBus.publish(eventType, { actionId: 'action-123' });
```

### Conditional Event Handling

Use filters to conditionally handle events:

```typescript
// Only handle events for a specific node
eventBus.subscribe(CoreEventTypes.NODE_EXECUTION_COMPLETED, (data) => {
  if (data.nodeId === 'my-special-node') {
    handleSpecialNodeExecution(data);
  }
});
```

### Event Transformation

Transform event data during propagation:

```typescript
// Register a workflow
propagator.registerWorkflow(workflow);

// Propagate with transformation
await propagator.propagateEvent(
  'workflow-123',
  'source-node',
  'data:updated',
  { rawValue: 42 },
  {
    transform: (data, sourceId, targetId) => {
      // Transform based on target node
      if (targetId === 'processing-node') {
        return {
          ...data,
          processedValue: data.rawValue * 2
        };
      }
      
      // Default transformation
      return data;
    }
  }
);
```

### Debugging Events

For debugging, you can set a custom logger or subscribe to all events:

```typescript
// Set a custom logger
const customLogger = {
  ...console,
  debug: (message, ...args) => {
    console.log(`[DEBUG] ${message}`, ...args);
  }
};

eventBus.setLogger(customLogger);

// Debug subscription to log all events
const debugSubscription = eventBus.subscribe('*', (data) => {
  console.log(`[Event Debug] Type: ${data.eventType}, Data:`, data);
});
```

## Performance Considerations

### 1. Subscription Management

- Limit the number of subscriptions to reduce overhead
- Unsubscribe when components are destroyed to prevent memory leaks
- Use event filtering to reduce unnecessary event processing

### 2. Event Data Size

- Keep event data small and focused
- Avoid including large objects in event data
- Consider using references instead of copying large data structures

### 3. Asynchronous Processing

- Use asynchronous event handlers for long-running operations
- Be aware that asynchronous handlers don't block the event loop
- Handle errors properly in asynchronous handlers

### 4. Event Propagation

- Limit propagation depth for complex workflows
- Use targeted events instead of broadcasting when possible
- Consider using event filters to reduce unnecessary propagation
