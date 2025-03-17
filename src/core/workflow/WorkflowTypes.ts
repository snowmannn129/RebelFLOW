/**
 * WorkflowTypes.ts
 * 
 * Defines the core types for the workflow execution system.
 * These types represent the structure of workflows, nodes, and connections.
 */

/**
 * Represents a node port (input or output)
 */
export interface NodePort {
  /**
   * Unique identifier for the port
   */
  id: string;
  
  /**
   * Human-readable name of the port
   */
  name: string;
  
  /**
   * Data type of the port
   */
  type: string;
  
  /**
   * Optional description of the port
   */
  description?: string;
  
  /**
   * Default value for input ports
   */
  defaultValue?: any;
}

/**
 * Represents a node in a workflow
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
  
  /**
   * Optional description of the node
   */
  description?: string;
}

/**
 * Represents a connection between two nodes
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
 * Represents a complete workflow of connected nodes
 */
export interface Workflow {
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

/**
 * Status of a workflow execution
 */
export type WorkflowStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

/**
 * Result of a workflow execution
 */
export interface WorkflowResult {
  /**
   * Workflow ID
   */
  workflowId: string;
  
  /**
   * Status of the workflow execution
   */
  status: WorkflowStatus;
  
  /**
   * Output data from exit nodes
   */
  outputs: Record<string, any>;
  
  /**
   * Execution statistics
   */
  stats: {
    /**
     * Start time of the execution
     */
    startTime: number;
    
    /**
     * End time of the execution
     */
    endTime: number;
    
    /**
     * Total execution time in milliseconds
     */
    executionTime: number;
    
    /**
     * Number of nodes executed
     */
    nodesExecuted: number;
  };
  
  /**
   * Error information (if status is 'failed')
   */
  error?: {
    /**
     * Error message
     */
    message: string;
    
    /**
     * Node ID where the error occurred
     */
    nodeId?: string;
    
    /**
     * Stack trace
     */
    stack?: string;
  };
}

/**
 * Options for workflow execution
 */
export interface ExecutionOptions {
  /**
   * Initial input data for entry nodes
   */
  inputs?: Record<string, any>;
  
  /**
   * Timeout in milliseconds (0 for no timeout)
   */
  timeout?: number;
  
  /**
   * Whether to execute independent nodes in parallel
   */
  parallel?: boolean;
  
  /**
   * Custom variables for the execution context
   */
  variables?: Record<string, any>;
}

/**
 * Context for workflow execution
 */
export interface ExecutionContext {
  /**
   * Workflow ID
   */
  workflowId: string;
  
  /**
   * Map of node outputs
   */
  nodeOutputs: Map<string, Record<string, any>>;
  
  /**
   * Start time of the execution
   */
  startTime: number;
  
  /**
   * Current status of the execution
   */
  status: WorkflowStatus;
  
  /**
   * Variables available during execution
   */
  variables: Map<string, any>;
  
  /**
   * Logger for execution events
   */
  logger: Console;
}

/**
 * Input data for a node
 */
export type NodeInputs = Record<string, any>;

/**
 * Output data from a node
 */
export type NodeOutputs = Record<string, any>;
