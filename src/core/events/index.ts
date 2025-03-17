/**
 * index.ts
 * 
 * Entry point for the events module.
 * Exports all event system components for easy importing.
 */

// Export EventBus
export { EventBus, getEventBus } from './EventBus';

// Export Subscription types and utilities
export {
  Subscription,
  SubscriptionOptions,
  SubscriptionInfo,
  createSubscription
} from './Subscription';

// Export event types
export {
  CoreEventTypes,
  UIEventTypes,
  DataEventTypes,
  PluginEventTypes,
  EventTypes
} from './EventTypes';

// Export EventPropagator
export {
  EventPropagator,
  createEventPropagator,
  Workflow,
  Node,
  Connection,
  PropagationOptions,
  EventFilter
} from './EventPropagator';

// Import for default export
import { getEventBus } from './EventBus';
import { createEventPropagator } from './EventPropagator';

// Default export for convenience
export default {
  getEventBus,
  createEventPropagator
};
