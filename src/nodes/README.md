# Node System

The Node System is a core component of RebelFlow, providing the foundation for creating, connecting, and executing nodes in a workflow.

## Overview

The Node System consists of several key components:

1. **Base Node Interfaces and Classes**: Define the fundamental structure and behavior of nodes.
2. **Core Node Types**: Implement common node types for different operations.
3. **Node Connection System**: Manage connections between nodes for data flow.
4. **Node Validation Mechanisms**: Validate node configurations and connections.

## Base Node System

The base node system defines the fundamental interfaces and classes for all nodes:

- `INode`: Interface that all nodes must implement.
- `BaseNode`: Abstract base class that provides common functionality for all nodes.
- `NodePort`: Class representing a node port (input or output).
- `NodeStatus`: Enum representing the possible states of a node.

### Example: Creating a Custom Node

```typescript
import { BaseNode } from '@rebelflow/nodes';

class MyCustomNode extends BaseNode {
  constructor(id: string, name: string) {
    super(id, name);
    
    // Add input and output ports
    this.addInput('input1', 'number', 'First input');
    this.addInput('input2', 'string', 'Second input', 'default value');
    this.addOutput('output1', 'number', 'Output');
  }
  
  protected process(inputs: Record<string, any>): Record<string, any> {
    // Process inputs and produce outputs
    return {
      output1: inputs.input1 ? Number(inputs.input1) * 2 : 0
    };
  }
}
```

## Core Node Types

The core node types provide ready-to-use implementations for common operations:

- `DataNode`: For storing and transforming data.
- `ProcessNode`: For processing operations.
- `ControlFlowNode`: For controlling the flow of execution.

### Example: Using Core Node Types

```typescript
import { DataNode, ProcessNode, ControlFlowNode } from '@rebelflow/nodes';

// Create a data node
const dataNode = new DataNode('data-node', 'Data Node');
dataNode.setData({ value: 42 });

// Create a process node
const processNode = new ProcessNode('process-node', 'Process Node', (inputs) => {
  return {
    result: (inputs.data?.value || 0) * 2
  };
});

// Add ports to the process node
processNode.addInput('data', 'object', 'Input data');
processNode.addOutput('result', 'number', 'Result');

// Create a control flow node
const controlFlowNode = new ControlFlowNode('if-node', 'If Node');
controlFlowNode.addInput('condition', 'boolean', 'Condition');
controlFlowNode.addInput('value', 'any', 'Value');
controlFlowNode.addOutput('true', 'any', 'True branch');
controlFlowNode.addOutput('false', 'any', 'False branch');
controlFlowNode.setConditionFunction((inputs) => !!inputs.condition);
```

## Node Connection System

The node connection system manages connections between nodes:

- `NodeConnection`: Represents a connection between two nodes.
- `ConnectionManager`: Manages connections between nodes.

### Example: Creating Connections

```typescript
import { ConnectionManager } from '@rebelflow/nodes';

// Create a connection manager
const connectionManager = new ConnectionManager();

// Create a connection between nodes
const connection = connectionManager.createConnection(
  sourceNode,
  'output1',
  targetNode,
  'input1'
);

// Get connections for a node
const nodeConnections = connectionManager.getConnectionsByNode(sourceNode);

// Transfer data through connections
for (const connection of nodeConnections) {
  const transferredData = connection.transferData(sourceOutputs);
  Object.assign(targetInputs, transferredData);
}
```

## Node Validation System

The node validation system validates node configurations and connections:

- `ValidationRule`: Defines a validation rule for nodes.
- `NodeValidator`: Validates nodes and workflows against a set of rules.

### Example: Validating Nodes and Workflows

```typescript
import { NodeValidator } from '@rebelflow/nodes';

// Create a validator
const validator = new NodeValidator();

// Add a custom validation rule
validator.addRule(
  'has-inputs',
  'Has Inputs',
  (node) => node.getInputs().length > 0,
  'Node must have at least one input'
);

// Validate a node
const nodeResult = validator.validateNode(node);
if (!nodeResult.isValid) {
  console.error('Node validation failed:', nodeResult.errors);
}

// Validate a workflow
const workflowResult = validator.validateWorkflow(nodes, connectionManager);
if (!workflowResult.isValid) {
  console.error('Workflow validation failed:');
  
  // Node errors
  for (const [nodeId, errors] of workflowResult.nodeErrors.entries()) {
    console.error(`Node ${nodeId} errors:`, errors);
  }
  
  // Connection errors
  for (const error of workflowResult.connectionErrors) {
    console.error(`Connection ${error.connectionId} error:`, error.message);
  }
}
```

## Integration with Workflow Execution

The Node System integrates with the Workflow Execution System to execute workflows:

```typescript
import { WorkflowEngine, NodeExecutor } from '@rebelflow/core';
import { DataNode, ProcessNode, ConnectionManager } from '@rebelflow/nodes';

// Create nodes
const dataNode = new DataNode('data-node', 'Data Node');
dataNode.setData({ value: 42 });

const processNode = new ProcessNode('process-node', 'Process Node', (inputs) => {
  return {
    result: (inputs.data?.value || 0) * 2
  };
});

// Add ports
processNode.addInput('data', 'object', 'Input data');
processNode.addOutput('result', 'number', 'Result');

// Create connections
const connectionManager = new ConnectionManager();
connectionManager.createConnection(
  dataNode,
  'data',
  processNode,
  'data'
);

// Create workflow
const workflow = {
  id: 'test-workflow',
  name: 'Test Workflow',
  nodes: [dataNode, processNode],
  connections: connectionManager.getConnections(),
  entryPoints: [dataNode.getId()],
  exitPoints: [processNode.getId()]
};

// Create node executor and workflow engine
const nodeExecutor = new NodeExecutor();
const workflowEngine = new WorkflowEngine(nodeExecutor);

// Execute workflow
const result = await workflowEngine.executeWorkflow(workflow);
console.log('Workflow result:', result);
