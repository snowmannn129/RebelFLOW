/**
 * NodeStatus.ts
 * 
 * Defines the possible states of a node during execution.
 */

/**
 * Enum representing the possible states of a node
 */
export enum NodeStatus {
  /**
   * Node is idle and ready to be executed
   */
  IDLE = 'idle',
  
  /**
   * Node is currently processing
   */
  PROCESSING = 'processing',
  
  /**
   * Node has completed execution successfully
   */
  COMPLETED = 'completed',
  
  /**
   * Node execution has failed
   */
  FAILED = 'failed',
  
  /**
   * Node execution has been cancelled
   */
  CANCELLED = 'cancelled',
  
  /**
   * Node is waiting for an external event or resource
   */
  WAITING = 'waiting'
}

export default NodeStatus;
