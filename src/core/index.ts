/**
 * index.ts
 * 
 * Entry point for the core module.
 * Exports all core components for easy importing.
 */

// Import modules
import * as eventsModule from './events';
import * as workflowModule from './workflow';

// Re-export with namespaces to avoid naming conflicts
export const events = eventsModule;
export const workflow = workflowModule;

// Export specific types from events module
export {
  EventBus,
  Subscription,
  SubscriptionOptions,
  SubscriptionInfo,
  createSubscription,
  CoreEventTypes,
  UIEventTypes,
  DataEventTypes,
  PluginEventTypes,
  EventTypes,
  EventPropagator,
  createEventPropagator,
  PropagationOptions,
  EventFilter
} from './events';

// Export specific types from workflow module
export {
  NodePort,
  WorkflowStatus,
  WorkflowResult,
  ExecutionOptions,
  ExecutionContext,
  NodeInputs,
  NodeOutputs,
  NodeExecutor,
  NodeExecutorFn,
  InputTransformationFn,
  OutputTransformationFn,
  InputValidatorFn,
  OutputValidatorFn,
  WorkflowEngine
} from './workflow';

// Default export for the core module
export default {
  events: eventsModule.default,
  workflow: workflowModule.default
};
