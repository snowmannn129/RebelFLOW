/**
 * setup.ts
 * 
 * Test setup for workflow execution tests.
 * This file contains common utilities and mock objects used across workflow execution tests.
 */

import { Node, Connection, Workflow } from '../WorkflowTypes';

/**
 * Create a mock node for testing
 * 
 * @param id Node ID
 * @param type Node type
 * @param name Node name
 * @returns A mock node
 */
export function createMockNode(id: string, type: string, name: string): Node {
  return {
    id,
    type,
    name,
    inputs: [
      { id: `${id}-in-1`, name: 'Input 1', type: 'any' },
      { id: `${id}-in-2`, name: 'Input 2', type: 'any' }
    ],
    outputs: [
      { id: `${id}-out-1`, name: 'Output 1', type: 'any' },
      { id: `${id}-out-2`, name: 'Output 2', type: 'any' }
    ],
    position: { x: 0, y: 0 }
  };
}

/**
 * Create a mock connection for testing
 * 
 * @param id Connection ID
 * @param sourceNodeId Source node ID
 * @param sourcePortId Source port ID
 * @param targetNodeId Target node ID
 * @param targetPortId Target port ID
 * @returns A mock connection
 */
export function createMockConnection(
  id: string,
  sourceNodeId: string,
  sourcePortId: string,
  targetNodeId: string,
  targetPortId: string
): Connection {
  return {
    id,
    sourceNodeId,
    sourcePortId,
    targetNodeId,
    targetPortId
  };
}

/**
 * Create a mock workflow for testing
 * 
 * @param id Workflow ID
 * @param name Workflow name
 * @param nodes Array of nodes
 * @param connections Array of connections
 * @returns A mock workflow
 */
export function createMockWorkflow(
  id: string,
  name: string,
  nodes: Node[] = [],
  connections: Connection[] = []
): Workflow {
  return {
    id,
    name,
    description: `Test workflow: ${name}`,
    nodes,
    connections,
    entryPoints: nodes.length > 0 ? [nodes[0].id] : [],
    exitPoints: nodes.length > 0 ? [nodes[nodes.length - 1].id] : []
  };
}

/**
 * Create a linear workflow with the specified number of nodes
 * 
 * @param id Workflow ID
 * @param name Workflow name
 * @param nodeCount Number of nodes to create
 * @returns A mock linear workflow
 */
export function createLinearWorkflow(id: string, name: string, nodeCount: number): Workflow {
  const nodes: Node[] = [];
  const connections: Connection[] = [];
  
  // Create nodes
  for (let i = 0; i < nodeCount; i++) {
    const nodeId = `node-${i}`;
    nodes.push(createMockNode(nodeId, 'process', `Node ${i}`));
  }
  
  // Create connections (linear chain)
  for (let i = 0; i < nodeCount - 1; i++) {
    const sourceNodeId = `node-${i}`;
    const targetNodeId = `node-${i + 1}`;
    
    connections.push(
      createMockConnection(
        `conn-${i}`,
        sourceNodeId,
        `${sourceNodeId}-out-1`,
        targetNodeId,
        `${targetNodeId}-in-1`
      )
    );
  }
  
  return createMockWorkflow(id, name, nodes, connections);
}

/**
 * Create a branching workflow for testing parallel execution
 * 
 * @param id Workflow ID
 * @param name Workflow name
 * @returns A mock branching workflow
 */
export function createBranchingWorkflow(id: string, name: string): Workflow {
  // Create nodes
  const sourceNode = createMockNode('source', 'source', 'Source');
  const processNode1 = createMockNode('process-1', 'process', 'Process 1');
  const processNode2 = createMockNode('process-2', 'process', 'Process 2');
  const processNode3 = createMockNode('process-3', 'process', 'Process 3');
  const mergeNode = createMockNode('merge', 'merge', 'Merge');
  const sinkNode = createMockNode('sink', 'sink', 'Sink');
  
  const nodes = [sourceNode, processNode1, processNode2, processNode3, mergeNode, sinkNode];
  
  // Create connections
  const connections = [
    // Source to process nodes (branching)
    createMockConnection('conn-1', 'source', 'source-out-1', 'process-1', 'process-1-in-1'),
    createMockConnection('conn-2', 'source', 'source-out-2', 'process-2', 'process-2-in-1'),
    createMockConnection('conn-3', 'source', 'source-out-1', 'process-3', 'process-3-in-1'),
    
    // Process nodes to merge node
    createMockConnection('conn-4', 'process-1', 'process-1-out-1', 'merge', 'merge-in-1'),
    createMockConnection('conn-5', 'process-2', 'process-2-out-1', 'merge', 'merge-in-2'),
    createMockConnection('conn-6', 'process-3', 'process-3-out-1', 'merge', 'merge-in-1'),
    
    // Merge to sink
    createMockConnection('conn-7', 'merge', 'merge-out-1', 'sink', 'sink-in-1')
  ];
  
  return createMockWorkflow(id, name, nodes, connections);
}

/**
 * Create a mock execution context for testing
 * 
 * @param workflowId Workflow ID
 * @returns A mock execution context
 */
export function createMockExecutionContext(workflowId: string) {
  return {
    workflowId,
    nodeOutputs: new Map(),
    startTime: Date.now(),
    status: 'running',
    variables: new Map(),
    logger: console
  };
}

/**
 * Mock node executor function for testing
 * 
 * @param nodeId Node ID to execute
 * @param inputs Input data
 * @returns Mock output data
 */
export async function mockNodeExecutor(nodeId: string, inputs: Record<string, any>) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 10));
  
  // Return mock outputs
  return {
    [`${nodeId}-out-1`]: { value: `${nodeId} output 1`, sourceInput: inputs },
    [`${nodeId}-out-2`]: { value: `${nodeId} output 2`, sourceInput: inputs }
  };
}

/**
 * Mock error node executor function for testing error handling
 * 
 * @param nodeId Node ID to execute
 * @param inputs Input data
 * @throws Error with the node ID
 */
export async function mockErrorNodeExecutor(nodeId: string, inputs: Record<string, any>) {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 10));
  
  // Throw an error
  throw new Error(`Error executing node ${nodeId}`);
}
