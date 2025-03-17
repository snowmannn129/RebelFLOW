# Core Module Implementation

This document provides detailed implementation information for the Core module of RebelFlow. It covers architectural decisions, implementation patterns, and technical details that are important for developers working on this module.

## Event System Implementation

### Architecture

The Event System follows a publish-subscribe (pub/sub) pattern with the following components:

1. **EventBus**: Central event dispatcher that manages subscriptions and event publishing
2. **Subscription**: Represents an active subscription to an event
3. **EventTypes**: Enumeration of standard event types used throughout the system
4. **EventPropagator**: Manages how events flow through the node graph based on connections

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

### Implementation Details

#### EventBus

The `EventBus` is implemented as a singleton to ensure a single point of event management throughout the application:

```typescript
// Simplified implementation
class EventBus {
  private static instance: EventBus;
  private subscriptions: Map<string, Set<SubscriptionInfo>>;
  
  private constructor() {
    this.subscriptions = new Map();
  }
  
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }
  
  // Implementation of subscribe, publish, unsubscribe methods...
}
```

Key implementation features:

1. **Subscription Management**: Uses a Map with event types as keys and Sets of subscriptions as values for efficient lookup
2. **Asynchronous Event Processing**: Event handlers are executed asynchronously to prevent blocking
3. **Priority-based Execution**: Subscriptions can specify a priority to control execution order
4. **Error Isolation**: Errors in one subscriber don't affect others

#### Event Propagation

Events are propagated using an asynchronous approach to prevent blocking:

```typescript
// Simplified implementation
async publish<T>(eventType: string, data: T): Promise<void> {
  const subscribers = this.subscriptions.get(eventType) || new Set();
  
  // Sort by priority
  const sortedSubscribers = Array.from(subscribers)
    .sort((a, b) => (b.options?.priority || 0) - (a.options?.priority || 0));
  
  // Execute in parallel with error isolation
  await Promise.all(
    sortedSubscribers.map(async (sub) => {
      try {
        await sub.callback(data);
        
        // Handle 'once' subscriptions
        if (sub.options?.once) {
          this.unsubscribe(sub.subscription);
        }
      } catch (error) {
        // Log error but don't stop propagation
        console.error(`Error in event handler for ${eventType}:`, error);
      }
    })
  );
}
```

#### Performance Optimizations

1. **Subscription Pooling**: Reuse subscription objects to reduce garbage collection
2. **Lazy Initialization**: Only create subscription sets when needed
3. **Efficient Lookup**: Use Map and Set for O(1) average lookup time
4. **Batched Updates**: Group multiple related events to reduce overhead

#### EventPropagator

The `EventPropagator` manages how events flow through the node graph based on connections between nodes:

```typescript
// Simplified implementation
class EventPropagator {
  private eventBus: EventBus;
  private workflows: Map<string, Workflow>;
  private filters: EventFilter[];
  private visitedNodes: Set<string>;
  
  constructor(eventBus?: EventBus) {
    this.eventBus = eventBus || getEventBus();
    this.workflows = new Map<string, Workflow>();
    this.filters = [];
    this.visitedNodes = new Set<string>();
  }
  
  // Implementation of registerWorkflow, propagateEvent, etc.
}
```

Key implementation features:

1. **Workflow Registration**: Manages workflows for event propagation
2. **Connection-based Propagation**: Events flow through node connections
3. **Event Filtering**: Supports filtering events based on custom predicates
4. **Cycle Detection**: Prevents infinite loops in circular connections
5. **Event Transformation**: Allows transforming event data during propagation

The event propagation process follows these steps:

1. An event is triggered from a source node
2. The EventPropagator finds all connections from the source node
3. For each connection, it applies filters and transformations
4. It then publishes the event to the target node
5. Optionally, it can continue propagation through the entire connection chain

```typescript
// Simplified implementation of event propagation
async propagateEvent(
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
```

## Workflow Execution Implementation

### Architecture

The Workflow Execution system follows a pipeline pattern with these components:

1. **WorkflowEngine**: Orchestrates the overall workflow execution
2. **NodeExecutor**: Handles execution of individual nodes
3. **DataFlow**: Manages data transfer between nodes

```
┌─────────────┐     controls     ┌───────────────┐
│             │────────────────▶│                │
│  Workflow   │                  │ WorkflowEngine │
│  Engine     │◀────────────────│                │
└─────────────┘     reports      └───────┬───────┘
                                         │
                                         │ delegates
                                         ▼
                      ┌───────────────────────────────┐
                      │                               │
                      │                               │
┌─────────────┐       │                               │       ┌─────────────┐
│             │       │                               │       │             │
│ NodeExecutor│◀──────┤        Execution Pipeline     ├──────▶│  DataFlow   │
│             │executes│                               │transfers│             │
└─────────────┘ nodes  │                               │  data   └─────────────┘
                      │                               │
                      │                               │
                      └───────────────────────────────┘
```

### Implementation Details

#### Workflow Execution Pipeline

The workflow execution follows these steps:

1. **Initialization**: Validate workflow structure and prepare execution context
2. **Topological Sorting**: Determine execution order based on node dependencies
3. **Node Execution**: Execute nodes in the determined order
4. **Data Flow**: Transfer data between connected nodes
5. **Completion/Error Handling**: Handle workflow completion or errors

```typescript
// Simplified implementation
async executeWorkflow(workflow: Workflow, options?: ExecutionOptions): Promise<WorkflowResult> {
  // 1. Initialize execution context
  const context = this.createExecutionContext(workflow, options);
  
  try {
    // 2. Perform topological sort to determine execution order
    const executionOrder = this.topologicalSort(workflow);
    
    // 3. Execute nodes in order
    for (const nodeId of executionOrder) {
      const node = workflow.nodes.find(n => n.id === nodeId);
      if (!node) continue;
      
      // Get input data from connected nodes
      const inputs = this.gatherInputs(node, workflow, context);
      
      // Execute the node
      const outputs = await this.nodeExecutor.executeNode(node, inputs, context);
      
      // Store outputs in context
      context.nodeOutputs.set(nodeId, outputs);
      
      // Publish node execution completed event
      await this.eventBus.publish(CoreEventTypes.NODE_EXECUTION_COMPLETED, {
        nodeId,
        outputs
      });
    }
    
    // 4. Gather final results
    const result = this.gatherResults(workflow, context);
    
    // 5. Publish workflow completed event
    await this.eventBus.publish(CoreEventTypes.WORKFLOW_COMPLETED, {
      workflowId: workflow.id,
      result
    });
    
    return result;
  } catch (error) {
    // Handle and publish error
    await this.eventBus.publish(CoreEventTypes.WORKFLOW_FAILED, {
      workflowId: workflow.id,
      error
    });
    
    throw error;
  }
}
```

#### Topological Sorting

To determine the execution order of nodes, we use a topological sort algorithm:

```typescript
// Simplified implementation
private topologicalSort(workflow: Workflow): string[] {
  const result: string[] = [];
  const visited = new Set<string>();
  const temp = new Set<string>();
  
  // Helper function for depth-first search
  const visit = (nodeId: string) => {
    // Check for cycles
    if (temp.has(nodeId)) {
      throw new Error(`Workflow contains a cycle involving node ${nodeId}`);
    }
    
    // Skip if already visited
    if (visited.has(nodeId)) return;
    
    // Mark as temporarily visited
    temp.add(nodeId);
    
    // Visit all dependencies (nodes that provide input to this node)
    const dependencies = this.getNodeDependencies(nodeId, workflow);
    for (const depId of dependencies) {
      visit(depId);
    }
    
    // Mark as visited and add to result
    temp.delete(nodeId);
    visited.add(nodeId);
    result.push(nodeId);
  };
  
  // Start with entry points
  for (const entryPoint of workflow.entryPoints) {
    visit(entryPoint);
  }
  
  // Ensure all nodes are visited
  for (const node of workflow.nodes) {
    if (!visited.has(node.id)) {
      visit(node.id);
    }
  }
  
  return result;
}
```

#### Concurrency Management

For parallel execution of independent nodes:

```typescript
// Simplified implementation for parallel execution
async executeNodesInParallel(nodes: Node[], workflow: Workflow, context: ExecutionContext): Promise<void> {
  await Promise.all(
    nodes.map(async (node) => {
      const inputs = this.gatherInputs(node, workflow, context);
      const outputs = await this.nodeExecutor.executeNode(node, inputs, context);
      context.nodeOutputs.set(node.id, outputs);
    })
  );
}
```

## Data Flow Implementation

### Architecture

The Data Flow system manages the transfer of data between nodes:

1. **Connection Management**: Tracks connections between node ports
2. **Type Validation**: Ensures data types match between connected ports
3. **Data Transfer**: Moves data from source to target nodes

### Implementation Details

#### Data Type Validation

```typescript
// Simplified implementation
validateConnection(connection: Connection, workflow: Workflow): boolean {
  const sourceNode = workflow.nodes.find(n => n.id === connection.sourceNodeId);
  const targetNode = workflow.nodes.find(n => n.id === connection.targetNodeId);
  
  if (!sourceNode || !targetNode) return false;
  
  const sourcePort = sourceNode.outputs.find(p => p.id === connection.sourcePortId);
  const targetPort = targetNode.inputs.find(p => p.id === connection.targetPortId);
  
  if (!sourcePort || !targetPort) return false;
  
  // Check if types are compatible
  return this.areTypesCompatible(sourcePort.type, targetPort.type);
}
```

#### Data Transfer

```typescript
// Simplified implementation
transferData(connection: Connection, sourceData: any): any {
  // Apply any necessary transformations
  return this.transformData(sourceData, connection);
}

private transformData(data: any, connection: Connection): any {
  // Apply transformations based on connection settings
  // This could include type conversion, filtering, etc.
  return data; // Simplified for now
}
```

## Error Handling Implementation

### Architecture

The error handling system provides standardized error management:

1. **Error Categorization**: Classifies errors by type and severity
2. **Error Propagation**: Determines how errors affect workflow execution
3. **Recovery Strategies**: Implements strategies for handling different error types

### Implementation Details

#### Standard Error Format

```typescript
// Simplified implementation
interface StandardError {
  code: string;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
  stack?: string;
}

class ErrorHandler {
  handleError(error: Error, context?: Record<string, any>): StandardError {
    // Determine error code based on error type
    const code = this.getErrorCode(error);
    
    return {
      code,
      message: error.message,
      originalError: error,
      context,
      stack: error.stack
    };
  }
  
  private getErrorCode(error: Error): string {
    // Map error types to codes
    if (error instanceof TypeError) return 'TYPE_ERROR';
    if (error instanceof ReferenceError) return 'REFERENCE_ERROR';
    // ... other error types
    
    return 'UNKNOWN_ERROR';
  }
}
```

#### Recovery Strategies

```typescript
// Simplified implementation
async recoverFromError(error: StandardError, workflow: Workflow, context: ExecutionContext): Promise<boolean> {
  switch (error.code) {
    case 'NODE_EXECUTION_ERROR':
      // Try to skip the failed node if possible
      return this.skipFailedNode(error, workflow, context);
      
    case 'DATA_FLOW_ERROR':
      // Try to use default values
      return this.useDefaultValues(error, workflow, context);
      
    case 'TIMEOUT_ERROR':
      // Try to extend timeout and retry
      return this.retryWithExtendedTimeout(error, workflow, context);
      
    default:
      // No recovery strategy available
      return false;
  }
}
```

## Performance Considerations

### Memory Management

1. **Object Pooling**: Reuse objects to reduce garbage collection
2. **Lazy Evaluation**: Only compute values when needed
3. **Stream Processing**: Process data as streams for large datasets

### Execution Optimization

1. **Parallel Execution**: Execute independent nodes in parallel
2. **Caching**: Cache results of expensive operations
3. **Incremental Processing**: Only process changed parts of a workflow

## Testing Strategy

### Unit Tests

Each component has comprehensive unit tests:

1. **EventBus Tests**: Verify event subscription and publishing
2. **WorkflowEngine Tests**: Validate workflow execution logic
3. **NodeExecutor Tests**: Ensure correct node execution
4. **DataFlow Tests**: Verify data transfer between nodes

### Integration Tests

Integration tests verify the interaction between components:

1. **End-to-End Workflow Tests**: Execute complete workflows
2. **Error Handling Tests**: Verify error recovery strategies
3. **Performance Tests**: Measure execution time and memory usage

## Future Improvements

1. **Distributed Execution**: Support for executing workflows across multiple machines
2. **Persistent Workflows**: Save and resume workflow execution state
3. **Real-time Monitoring**: Improved visualization of workflow execution
4. **Machine Learning Integration**: Optimize workflow execution using ML
