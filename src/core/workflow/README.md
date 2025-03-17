# Workflow Execution System

The Workflow Execution System is a core component of RebelFlow that manages the execution of node-based workflows. It provides a flexible and extensible framework for defining, validating, and executing workflows composed of interconnected nodes.

## Overview

The Workflow Execution System consists of the following key components:

- **WorkflowEngine**: Orchestrates the overall workflow execution
- **NodeExecutor**: Handles execution of individual nodes
- **WorkflowTypes**: Defines the core types for workflows, nodes, and connections

## Architecture

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

The workflow execution follows these steps:

1. **Initialization**: Validate workflow structure and prepare execution context
2. **Topological Sorting**: Determine execution order based on node dependencies
3. **Node Execution**: Execute nodes in the determined order
4. **Data Flow**: Transfer data between connected nodes
5. **Completion/Error Handling**: Handle workflow completion or errors

## Usage Guide

### Basic Workflow Execution

To execute a workflow:

```typescript
import { WorkflowEngine, NodeExecutor } from '@rebelflow/core/workflow';

// Create a NodeExecutor
const nodeExecutor = new NodeExecutor();

// Register node type executors
nodeExecutor.registerNodeTypeExecutor('process', async (nodeId, inputs, context) => {
  // Process the inputs
  const result = processData(inputs);
  
  // Return outputs
  return {
    [`${nodeId}-output`]: result
  };
});

// Create a WorkflowEngine
const workflowEngine = new WorkflowEngine(nodeExecutor);

// Define a workflow
const workflow = {
  id: 'workflow-1',
  name: 'Sample Workflow',
  nodes: [
    {
      id: 'node-1',
      type: 'process',
      name: 'Process Node 1',
      inputs: [
        { id: 'node-1-in-1', name: 'Input 1', type: 'any' }
      ],
      outputs: [
        { id: 'node-1-out-1', name: 'Output 1', type: 'any' }
      ]
    },
    {
      id: 'node-2',
      type: 'process',
      name: 'Process Node 2',
      inputs: [
        { id: 'node-2-in-1', name: 'Input 1', type: 'any' }
      ],
      outputs: [
        { id: 'node-2-out-1', name: 'Output 1', type: 'any' }
      ]
    }
  ],
  connections: [
    {
      id: 'conn-1',
      sourceNodeId: 'node-1',
      sourcePortId: 'node-1-out-1',
      targetNodeId: 'node-2',
      targetPortId: 'node-2-in-1'
    }
  ],
  entryPoints: ['node-1'],
  exitPoints: ['node-2']
};

// Execute the workflow
try {
  const result = await workflowEngine.executeWorkflow(workflow, {
    inputs: {
      'node-1-in-1': { value: 'initial input' }
    }
  });
  
  console.log('Workflow completed successfully:', result);
} catch (error) {
  console.error('Workflow execution failed:', error);
}
```

### Node Execution Customization

You can customize node execution by registering transformations and validators:

```typescript
// Register an input transformation
nodeExecutor.registerInputTransformation('process', (inputs, node, context) => {
  // Transform inputs before execution
  return Object.entries(inputs).reduce((transformed, [key, value]) => {
    transformed[key] = { value: `transformed ${value.value}` };
    return transformed;
  }, {} as NodeInputs);
});

// Register an output transformation
nodeExecutor.registerOutputTransformation('process', (outputs, node, context) => {
  // Transform outputs after execution
  return Object.entries(outputs).reduce((transformed, [key, value]) => {
    transformed[key] = { value: `transformed ${value.value}` };
    return transformed;
  }, {} as NodeOutputs);
});

// Register an input validator
nodeExecutor.registerInputValidator('process', (inputs, node, context) => {
  // Validate inputs before execution
  if (!inputs[`${node.id}-in-1`]) {
    throw new Error(`Missing required input: ${node.id}-in-1`);
  }
  return true;
});

// Register an output validator
nodeExecutor.registerOutputValidator('process', (outputs, node, context) => {
  // Validate outputs after execution
  if (!outputs[`${node.id}-out-1`]) {
    throw new Error(`Missing required output: ${node.id}-out-1`);
  }
  return true;
});
```

### Workflow Control

The WorkflowEngine provides methods for controlling workflow execution:

```typescript
// Pause a running workflow
await workflowEngine.pauseWorkflow('workflow-1');

// Resume a paused workflow
await workflowEngine.resumeWorkflow('workflow-1');

// Stop a running workflow
await workflowEngine.stopWorkflow('workflow-1');

// Get the current status of a workflow
const status = workflowEngine.getWorkflowStatus('workflow-1');
```

### Parallel Execution

You can execute independent nodes in parallel:

```typescript
// Execute the workflow with parallel execution
const result = await workflowEngine.executeWorkflow(workflow, {
  parallel: true
});
```

## Best Practices

### 1. Define Clear Node Interfaces

Each node should have well-defined inputs and outputs:

```typescript
const node = {
  id: 'process-node',
  type: 'process',
  name: 'Process Node',
  inputs: [
    { id: 'process-node-in-1', name: 'Input 1', type: 'string', description: 'The input string to process' }
  ],
  outputs: [
    { id: 'process-node-out-1', name: 'Output 1', type: 'string', description: 'The processed output string' }
  ]
};
```

### 2. Handle Node Execution Errors

Always handle errors in node executors:

```typescript
nodeExecutor.registerNodeTypeExecutor('process', async (nodeId, inputs, context) => {
  try {
    // Process the inputs
    const result = processData(inputs);
    
    // Return outputs
    return {
      [`${nodeId}-output`]: result
    };
  } catch (error) {
    // Log the error
    context.logger.error(`Error executing node ${nodeId}:`, error);
    
    // Re-throw the error to fail the workflow
    throw error;
  }
});
```

### 3. Use Transformations for Data Mapping

Use input and output transformations for data mapping:

```typescript
// Register an input transformation for data mapping
nodeExecutor.registerInputTransformation('process', (inputs, node, context) => {
  // Map inputs to the format expected by the node
  const mappedInputs = {};
  
  if (inputs['source-data']) {
    mappedInputs[`${node.id}-in-1`] = {
      value: inputs['source-data'].value
    };
  }
  
  return mappedInputs;
});
```

### 4. Validate Workflows Before Execution

Validate workflows before execution to catch errors early:

```typescript
function validateWorkflow(workflow) {
  // Check for required properties
  if (!workflow.id || !workflow.nodes || !workflow.connections) {
    throw new Error('Invalid workflow: missing required properties');
  }
  
  // Check for cycles
  const hasCycle = checkForCycles(workflow);
  if (hasCycle) {
    throw new Error('Invalid workflow: contains cycles');
  }
  
  // Check for disconnected nodes
  const disconnectedNodes = findDisconnectedNodes(workflow);
  if (disconnectedNodes.length > 0) {
    throw new Error(`Invalid workflow: disconnected nodes: ${disconnectedNodes.join(', ')}`);
  }
  
  return true;
}
```

### 5. Use Event System for Monitoring

Use the event system to monitor workflow execution:

```typescript
import { getEventBus, CoreEventTypes } from '@rebelflow/core/events';

const eventBus = getEventBus();

// Subscribe to workflow events
eventBus.subscribe(CoreEventTypes.WORKFLOW_STARTED, (data) => {
  console.log(`Workflow started: ${data.workflowId}`);
});

eventBus.subscribe(CoreEventTypes.NODE_EXECUTION_STARTED, (data) => {
  console.log(`Node execution started: ${data.nodeId}`);
});

eventBus.subscribe(CoreEventTypes.NODE_EXECUTION_COMPLETED, (data) => {
  console.log(`Node execution completed: ${data.nodeId}`);
});

eventBus.subscribe(CoreEventTypes.WORKFLOW_COMPLETED, (data) => {
  console.log(`Workflow completed: ${data.workflowId}`);
});

eventBus.subscribe(CoreEventTypes.WORKFLOW_FAILED, (data) => {
  console.error(`Workflow failed: ${data.workflowId}`, data.error);
});
```

## API Reference

### WorkflowEngine

The main class for orchestrating workflow execution.

```typescript
class WorkflowEngine {
  /**
   * Creates a new WorkflowEngine
   * @param nodeExecutor The NodeExecutor to use for executing nodes
   */
  constructor(nodeExecutor: NodeExecutor);
  
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

### NodeExecutor

Handles the execution of individual nodes.

```typescript
class NodeExecutor {
  /**
   * Register an executor function for a specific node type
   * @param nodeType The type of node
   * @param executor The executor function
   */
  registerNodeTypeExecutor(nodeType: string, executor: NodeExecutorFn): void;
  
  /**
   * Register an input transformation function for a specific node type
   * @param nodeType The type of node
   * @param transformation The transformation function
   */
  registerInputTransformation(nodeType: string, transformation: InputTransformationFn): void;
  
  /**
   * Register an output transformation function for a specific node type
   * @param nodeType The type of node
   * @param transformation The transformation function
   */
  registerOutputTransformation(nodeType: string, transformation: OutputTransformationFn): void;
  
  /**
   * Register an input validator function for a specific node type
   * @param nodeType The type of node
   * @param validator The validator function
   */
  registerInputValidator(nodeType: string, validator: InputValidatorFn): void;
  
  /**
   * Register an output validator function for a specific node type
   * @param nodeType The type of node
   * @param validator The validator function
   */
  registerOutputValidator(nodeType: string, validator: OutputValidatorFn): void;
  
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

### WorkflowTypes

Core types for the workflow execution system.

```typescript
/**
 * Represents a node port (input or output)
 */
interface NodePort {
  id: string;
  name: string;
  type: string;
  description?: string;
  defaultValue?: any;
}

/**
 * Represents a node in a workflow
 */
interface Node {
  id: string;
  type: string;
  name: string;
  inputs: NodePort[];
  outputs: NodePort[];
  config?: Record<string, any>;
  position?: { x: number; y: number };
  description?: string;
}

/**
 * Represents a connection between two nodes
 */
interface Connection {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
}

/**
 * Represents a complete workflow of connected nodes
 */
interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: Node[];
  connections: Connection[];
  entryPoints: string[];
  exitPoints: string[];
  metadata?: Record<string, any>;
}

/**
 * Status of a workflow execution
 */
type WorkflowStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

/**
 * Result of a workflow execution
 */
interface WorkflowResult {
  workflowId: string;
  status: WorkflowStatus;
  outputs: Record<string, any>;
  stats: {
    startTime: number;
    endTime: number;
    executionTime: number;
    nodesExecuted: number;
  };
  error?: {
    message: string;
    nodeId?: string;
    stack?: string;
  };
}

/**
 * Options for workflow execution
 */
interface ExecutionOptions {
  inputs?: Record<string, any>;
  timeout?: number;
  parallel?: boolean;
  variables?: Record<string, any>;
}

/**
 * Context for workflow execution
 */
interface ExecutionContext {
  workflowId: string;
  nodeOutputs: Map<string, Record<string, any>>;
  startTime: number;
  status: WorkflowStatus;
  variables: Map<string, any>;
  logger: Console;
}
```

## Advanced Usage

### Custom Node Types

You can create custom node types by registering specialized executors:

```typescript
// Register a custom node type executor
nodeExecutor.registerNodeTypeExecutor('math:add', async (nodeId, inputs, context) => {
  const a = inputs['a']?.value || 0;
  const b = inputs['b']?.value || 0;
  
  return {
    'result': { value: a + b }
  };
});

nodeExecutor.registerNodeTypeExecutor('math:multiply', async (nodeId, inputs, context) => {
  const a = inputs['a']?.value || 0;
  const b = inputs['b']?.value || 0;
  
  return {
    'result': { value: a * b }
  };
});
```

### Workflow Variables

You can use variables to share data across nodes:

```typescript
// Execute workflow with variables
const result = await workflowEngine.executeWorkflow(workflow, {
  variables: {
    'globalCounter': 0,
    'sharedData': { key: 'value' }
  }
});

// Access variables in node executor
nodeExecutor.registerNodeTypeExecutor('process', async (nodeId, inputs, context) => {
  // Get variable
  const counter = context.variables.get('globalCounter') || 0;
  
  // Update variable
  context.variables.set('globalCounter', counter + 1);
  
  return {
    'output': { value: `Counter: ${counter}` }
  };
});
```

### Error Recovery

You can implement error recovery strategies:

```typescript
nodeExecutor.registerNodeTypeExecutor('process', async (nodeId, inputs, context) => {
  try {
    // Attempt primary operation
    const result = primaryOperation(inputs);
    
    return {
      'output': { value: result }
    };
  } catch (error) {
    // Log the error
    context.logger.error(`Primary operation failed: ${error.message}`);
    
    try {
      // Attempt fallback operation
      const fallbackResult = fallbackOperation(inputs);
      
      return {
        'output': { value: fallbackResult },
        'usedFallback': { value: true }
      };
    } catch (fallbackError) {
      // If fallback also fails, re-throw the original error
      throw error;
    }
  }
});
```

### Conditional Execution

You can implement conditional execution using specialized nodes:

```typescript
// Register a condition node executor
nodeExecutor.registerNodeTypeExecutor('condition', async (nodeId, inputs, context) => {
  const value = inputs['value']?.value;
  const condition = inputs['condition']?.value || '==';
  const compareTo = inputs['compareTo']?.value;
  
  let result = false;
  
  switch (condition) {
    case '==':
      result = value == compareTo;
      break;
    case '!=':
      result = value != compareTo;
      break;
    case '>':
      result = value > compareTo;
      break;
    case '<':
      result = value < compareTo;
      break;
    // Add more conditions as needed
  }
  
  return {
    'result': { value: result },
    'trueOutput': result ? inputs['value'] : null,
    'falseOutput': !result ? inputs['value'] : null
  };
});
```

## Performance Considerations

### 1. Node Execution Overhead

- Keep node executors lightweight
- Use asynchronous execution for long-running operations
- Consider caching results for expensive operations

### 2. Parallel Execution

- Use parallel execution for independent nodes
- Group nodes by level for efficient parallel execution
- Be aware of resource constraints when executing in parallel

### 3. Memory Management

- Avoid storing large data in the execution context
- Use references instead of copying large data structures
- Consider streaming data between nodes for large datasets

### 4. Error Handling

- Implement proper error recovery strategies
- Use the event system for monitoring and debugging
- Consider circuit breaker patterns for external dependencies
