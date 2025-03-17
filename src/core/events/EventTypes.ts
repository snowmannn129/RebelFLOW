/**
 * EventTypes.ts
 * 
 * Defines the standard event types used throughout the RebelFlow system.
 * These event types provide a consistent way to identify and categorize events
 * for the publish-subscribe system.
 */

/**
 * Core event types used throughout the system
 */
export enum CoreEventTypes {
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

/**
 * UI event types for the editor interface
 */
export enum UIEventTypes {
  // Canvas events
  CANVAS_ZOOMED = 'canvas:zoomed',
  CANVAS_PANNED = 'canvas:panned',
  CANVAS_RESET = 'canvas:reset',
  
  // Node UI events
  NODE_SELECTED = 'node:selected',
  NODE_DESELECTED = 'node:deselected',
  NODE_MOVED = 'node:moved',
  NODE_RESIZED = 'node:resized',
  NODE_ADDED = 'node:added',
  NODE_REMOVED = 'node:removed',
  
  // Connection UI events
  CONNECTION_CREATED = 'connection:created',
  CONNECTION_DELETED = 'connection:deleted',
  CONNECTION_SELECTED = 'connection:selected',
  
  // Editor events
  EDITOR_UNDO = 'editor:undo',
  EDITOR_REDO = 'editor:redo',
  EDITOR_COPY = 'editor:copy',
  EDITOR_PASTE = 'editor:paste',
  EDITOR_CUT = 'editor:cut',
  EDITOR_DELETE = 'editor:delete'
}

/**
 * Data event types for data flow and processing
 */
export enum DataEventTypes {
  // Data validation events
  DATA_VALIDATION_SUCCEEDED = 'data:validation:succeeded',
  DATA_VALIDATION_FAILED = 'data:validation:failed',
  
  // Data transformation events
  DATA_TRANSFORMED = 'data:transformed',
  DATA_TRANSFORMATION_FAILED = 'data:transformation:failed',
  
  // Data storage events
  DATA_SAVED = 'data:saved',
  DATA_LOADED = 'data:loaded',
  DATA_DELETED = 'data:deleted'
}

/**
 * Plugin event types for the plugin system
 */
export enum PluginEventTypes {
  PLUGIN_LOADED = 'plugin:loaded',
  PLUGIN_UNLOADED = 'plugin:unloaded',
  PLUGIN_ERROR = 'plugin:error',
  PLUGIN_UPDATED = 'plugin:updated'
}

/**
 * Combined event types for easier imports
 */
export const EventTypes = {
  Core: CoreEventTypes,
  UI: UIEventTypes,
  Data: DataEventTypes,
  Plugin: PluginEventTypes
};

export default EventTypes;
