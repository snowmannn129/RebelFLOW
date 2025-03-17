/**
 * index.ts
 * 
 * Entry point for the workflow module.
 * Exports all workflow system components for easy importing.
 */

// Export WorkflowTypes
export {
  NodePort,
  Node,
  Connection,
  Workflow,
  WorkflowStatus,
  WorkflowResult,
  ExecutionOptions,
  ExecutionContext,
  NodeInputs,
  NodeOutputs
} from './WorkflowTypes';

// Export NodeExecutor
export {
  NodeExecutor,
  NodeExecutorFn,
  InputTransformationFn,
  OutputTransformationFn,
  InputValidatorFn,
  OutputValidatorFn
} from './NodeExecutor';

// Export WorkflowEngine
export { WorkflowEngine } from './WorkflowEngine';

// Import for default export
import { WorkflowEngine } from './WorkflowEngine';
import { NodeExecutor } from './NodeExecutor';

// Default export for convenience
export default {
  createWorkflowEngine: (nodeExecutor: NodeExecutor = new NodeExecutor()) => new WorkflowEngine(nodeExecutor),
  createNodeExecutor: () => new NodeExecutor()
};
