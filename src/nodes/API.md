# Node System API

This document describes the public API of the Node System module.

## Base Node System

### INode Interface

The `INode` interface defines the core functionality that all nodes must implement.

```typescript
interface INode {
  // Basic properties
  getId(): string;
  getType(): string;
  getName(): string;
  setName(name: string): void;
  getStatus(): NodeStatus;
  
  // Port management
  getInputs(): NodePort[];
  getOutputs(): NodePort[];
  getInputPort(id: string): NodePort | undefined;
  getOutputPort(id: string): NodePort | undefined;
  addInput(id: string, type: string, description?: string, defaultValue?: any): NodePort;
  addOutput(id: string, type: string, description?: string): NodePort;
  removeInput(id: string): boolean;
  removeOutput(id: string): boolean;
  
  // Execution
  execute(inputs: Record<string, any>): Promise<Record<string, any>>;
  
  // Configuration
  getConfig(): Record<string, any>;
  setConfig(config: Record<string, any>): void;
  updateConfig(config: Record<string, any>): void;
  getConfigValue<T>(key: string, defaultValue?: T): T | undefined;
  
  // Metadata
  setMetadata(key: string, value: any): void;
  getMetadata<T>(key: string): T | undefined;
  
  // Validation
  validate(): boolean;
  
  // Reset
  reset(): void;
}
```

### BaseNode Class

The `BaseNode` abstract class provides a base implementation of the `INode` interface.

```typescript
abstract class BaseNode implements INode {
  constructor(id: string, name: string);
  
  // INode implementation
  // ...
  
  // Abstract method that must be implemented by derived classes
  protected abstract process(inputs: Record<string, any>): Promise<Record<string, any>> | Record<string, any>;
  
  // Additional methods
  toJSON(): Record<string, any>;
}
```

### NodePort Class

The `NodePort` class represents a node port (input or output).

```typescript
class NodePort implements INodePort {
  constructor(
    id: string,
    name: string,
    type: string,
    portType: NodePortType,
    description?: string,
    defaultValue?: any
  );
  
  // Factory methods
  static createInput(
    id: string,
    type: string,
    description?: string,
    defaultValue?: any
  ): NodePort;
  
  static createOutput(
    id: string,
    type: string,
    description?: string
  ): NodePort;
  
  // Methods
  isInput(): boolean;
  isOutput(): boolean;
  isCompatibleWith(otherPort: NodePort): boolean;
}
```

### NodeStatus Enum

The `NodeStatus` enum represents the possible states of a node.

```typescript
enum NodeStatus {
  IDLE = 'idle',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  WAITING = 'waiting'
}
```

## Core Node Types

### DataNode Class

The `DataNode` class is used for storing and transforming data.

```typescript
class DataNode extends BaseNode {
  constructor(id: string, name: string);
  
  // Data management
  setData(data: Record<string, any>): void;
  getData(): Record<string, any>;
  
  // Transformation
  setTransformationFunction(fn: DataTransformationFn): void;
  clearTransformationFunction(): void;
}

type DataTransformationFn = (data: Record<string, any>) => Record<string, any>;
```

### ProcessNode Class

The `ProcessNode` class is used for processing operations.

```typescript
class ProcessNode extends BaseNode {
  constructor(id: string, name: string, processFn: ProcessFn);
  
  // Process function
  setProcessFunction(fn: ProcessFn): void;
}

type ProcessFn = (
  inputs: Record<string, any>
) => Promise<Record<string, any>> | Record<string, any>;
```

### ControlFlowNode Class

The `ControlFlowNode` class is used for controlling the flow of execution.

```typescript
class ControlFlowNode extends BaseNode {
  constructor(id: string, name: string);
  
  // Routing functions
  setConditionFunction(fn: ConditionFn): void;
  setRoutingFunction(fn: RoutingFn): void;
  setCustomRoutingFunction(fn: CustomRoutingFn): void;
}

type ConditionFn = (inputs: Record<string, any>) => boolean;
type RoutingFn = (inputs: Record<string, any>) => string;
type CustomRoutingFn = (inputs: Record<string, any>) => Record<string, any>;
```

## Node Connection System

### NodeConnection Class

The `NodeConnection` class represents a connection between two nodes.

```typescript
class NodeConnection {
  constructor(
    id: string,
    sourceNode: INode,
    sourcePortId: string,
    targetNode: INode,
    targetPortId: string
  );
  
  // Properties
  getId(): string;
  getSourceNode(): INode;
  getSourcePortId(): string;
  getTargetNode(): INode;
  getTargetPortId(): string;
  
  // Methods
  isValid(): boolean;
  transferData(sourceOutputs: Record<string, any>): Record<string, any>;
  toJSON(): Record<string, any>;
}
```

### ConnectionManager Class

The `ConnectionManager` class manages connections between nodes.

```typescript
class ConnectionManager {
  constructor();
  
  // Connection management
  createConnection(
    sourceNode: INode,
    sourcePortId: string,
    targetNode: INode,
    targetPortId: string
  ): NodeConnection | undefined;
  
  getConnections(): NodeConnection[];
  getConnectionById(id: string): NodeConnection | undefined;
  getConnectionsByNode(node: INode): NodeConnection[];
  getConnectionsByPort(node: INode, portId: string): NodeConnection[];
  removeConnection(id: string): boolean;
  removeConnectionsByNode(node: INode): number;
  clear(): void;
}
```

## Node Validation System

### ValidationRule Class

The `ValidationRule` class defines a validation rule for nodes.

```typescript
class ValidationRule {
  constructor(
    id: string,
    name: string,
    validationFn: ValidationFn,
    message: string
  );
  
  // Properties
  getId(): string;
  getName(): string;
  getMessage(): string;
  
  // Methods
  validate(node: INode): boolean;
}

type ValidationFn = (node: INode) => boolean;
```

### NodeValidator Class

The `NodeValidator` class validates nodes and workflows against a set of rules.

```typescript
class NodeValidator {
  constructor();
  
  // Rule management
  addRule(
    id: string,
    name: string,
    validationFn: ValidationFn,
    message: string
  ): ValidationRule;
  
  getRule(id: string): ValidationRule | undefined;
  getRules(): ValidationRule[];
  removeRule(id: string): boolean;
  
  // Validation
  validateNode(node: INode, ruleIds?: string[]): NodeValidationResult;
  validateConnection(connection: NodeConnection): ConnectionValidationError | null;
  validateWorkflow(
    nodes: INode[],
    connectionManager: ConnectionManager
  ): WorkflowValidationResult;
}

interface ValidationError {
  ruleId: string;
  message: string;
}

interface NodeValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

interface ConnectionValidationError {
  connectionId: string;
  message: string;
}

interface WorkflowValidationResult {
  isValid: boolean;
  nodeErrors: Map<string, ValidationError[]>;
  connectionErrors: ConnectionValidationError[];
}
