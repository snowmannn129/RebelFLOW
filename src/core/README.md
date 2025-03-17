# Core Module

The Core module is the foundation of RebelFlow, providing essential infrastructure for workflow execution, event handling, and node lifecycle management.

## Overview

This module implements the fundamental components that enable the node-based automation system:

- **Event System**: Facilitates communication between nodes through a publish-subscribe mechanism and manages event propagation through the node graph
- **Workflow Execution Engine**: Manages the execution of node workflows
- **Data Flow Management**: Handles data transfer between connected nodes
- **Node Lifecycle**: Controls node initialization, execution, and cleanup

## Module Structure

```
core/
├── events/              # Event system implementation
│   ├── EventBus.ts      # Central event management
│   ├── EventTypes.ts    # Event type definitions
│   ├── Subscription.ts  # Event subscription handling
│   └── EventPropagator.ts # Event propagation through node graph
├── workflow/            # Workflow execution
│   ├── WorkflowEngine.ts # Main execution engine
│   ├── NodeExecutor.ts  # Node execution logic
│   └── DataFlow.ts      # Data transfer between nodes
├── types/               # Core type definitions
│   ├── NodeTypes.ts     # Node interface definitions
│   ├── ConnectionTypes.ts # Connection type definitions
│   └── WorkflowTypes.ts # Workflow structure types
└── utils/               # Core utilities
    ├── Logger.ts        # Logging functionality
    └── ErrorHandling.ts # Error management
```

## Current Status

The Core module is in the initial development phase. We are currently focusing on:

- Designing and implementing the Event System
- Defining core interfaces and types
- Establishing the foundation for workflow execution

See [CURRENT_FEATURE.md](../../development/CURRENT_FEATURE.md) for details on the current development focus.

## Dependencies

The Core module is designed to have minimal external dependencies to maintain its role as the foundation of the system.

## Integration Points

Other modules will depend on the Core module for:

- Event handling and communication
- Workflow execution
- Node lifecycle management
- Data flow control

## Performance Considerations

As the foundation of RebelFlow, the Core module's performance is critical. Key considerations include:

- Minimizing event dispatch overhead
- Optimizing workflow execution paths
- Efficient memory management for node data
- Thread safety for concurrent operations
