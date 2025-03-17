/**
 * NodeExecutor.test.ts
 * 
 * Tests for the NodeExecutor class.
 */

import { NodeExecutor } from '../NodeExecutor';
import { createMockNode, mockNodeExecutor, mockErrorNodeExecutor } from './setup';
import { Node, NodeInputs, ExecutionContext } from '../WorkflowTypes';

describe('NodeExecutor', () => {
  let nodeExecutor: NodeExecutor;
  let mockNode: Node;
  let mockContext: ExecutionContext;
  
  beforeEach(() => {
    // Create a new NodeExecutor instance for each test
    nodeExecutor = new NodeExecutor();
    
    // Create a mock node
    mockNode = createMockNode('test-node', 'process', 'Test Node');
    
    // Create a mock execution context
    mockContext = {
      workflowId: 'test-workflow',
      nodeOutputs: new Map(),
      startTime: Date.now(),
      status: 'running',
      variables: new Map(),
      logger: {
        log: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
      } as unknown as Console
    };
  });
  
  test('should execute a node with the registered executor', async () => {
    // Register a mock executor for the 'process' node type
    nodeExecutor.registerNodeTypeExecutor('process', mockNodeExecutor);
    
    // Mock input data
    const inputs: NodeInputs = {
      'test-node-in-1': { value: 'input 1' },
      'test-node-in-2': { value: 'input 2' }
    };
    
    // Execute the node
    const outputs = await nodeExecutor.executeNode(mockNode, inputs, mockContext);
    
    // Verify outputs
    expect(outputs).toBeDefined();
    expect(outputs['test-node-out-1']).toBeDefined();
    expect(outputs['test-node-out-1'].value).toBe('test-node output 1');
    expect(outputs['test-node-out-2']).toBeDefined();
    expect(outputs['test-node-out-2'].value).toBe('test-node output 2');
    
    // Verify that the outputs include the source inputs
    expect(outputs['test-node-out-1'].sourceInput).toEqual(inputs);
  });
  
  test('should throw an error if no executor is registered for the node type', async () => {
    // Mock input data
    const inputs: NodeInputs = {
      'test-node-in-1': { value: 'input 1' }
    };
    
    // Execute the node without registering an executor
    await expect(nodeExecutor.executeNode(mockNode, inputs, mockContext))
      .rejects.toThrow(`No executor registered for node type: process`);
  });
  
  test('should handle errors from node executors', async () => {
    // Register a mock error executor for the 'process' node type
    nodeExecutor.registerNodeTypeExecutor('process', mockErrorNodeExecutor);
    
    // Mock input data
    const inputs: NodeInputs = {
      'test-node-in-1': { value: 'input 1' }
    };
    
    // Execute the node
    await expect(nodeExecutor.executeNode(mockNode, inputs, mockContext))
      .rejects.toThrow(`Error executing node test-node`);
    
    // Verify that the error was logged
    expect(mockContext.logger.error).toHaveBeenCalled();
  });
  
  test('should apply input transformations before execution', async () => {
    // Register a mock executor for the 'process' node type
    nodeExecutor.registerNodeTypeExecutor('process', mockNodeExecutor);
    
    // Register an input transformation
    nodeExecutor.registerInputTransformation('process', (inputs) => {
      return Object.entries(inputs).reduce((transformed, [key, value]) => {
        transformed[key] = { value: `transformed ${value.value}` };
        return transformed;
      }, {} as NodeInputs);
    });
    
    // Mock input data
    const inputs: NodeInputs = {
      'test-node-in-1': { value: 'input 1' },
      'test-node-in-2': { value: 'input 2' }
    };
    
    // Execute the node
    const outputs = await nodeExecutor.executeNode(mockNode, inputs, mockContext);
    
    // Verify that the transformation was applied
    expect(outputs['test-node-out-1'].sourceInput['test-node-in-1'].value).toBe('transformed input 1');
    expect(outputs['test-node-out-1'].sourceInput['test-node-in-2'].value).toBe('transformed input 2');
  });
  
  test('should apply output transformations after execution', async () => {
    // Register a mock executor for the 'process' node type
    nodeExecutor.registerNodeTypeExecutor('process', mockNodeExecutor);
    
    // Register an output transformation
    nodeExecutor.registerOutputTransformation('process', (outputs) => {
      return Object.entries(outputs).reduce((transformed, [key, value]) => {
        transformed[key] = { value: `transformed ${value.value}` };
        return transformed;
      }, {} as NodeInputs);
    });
    
    // Mock input data
    const inputs: NodeInputs = {
      'test-node-in-1': { value: 'input 1' }
    };
    
    // Execute the node
    const outputs = await nodeExecutor.executeNode(mockNode, inputs, mockContext);
    
    // Verify that the transformation was applied
    expect(outputs['test-node-out-1'].value).toBe('transformed test-node output 1');
    expect(outputs['test-node-out-2'].value).toBe('transformed test-node output 2');
  });
  
  test('should validate inputs before execution', async () => {
    // Register a mock executor for the 'process' node type
    nodeExecutor.registerNodeTypeExecutor('process', mockNodeExecutor);
    
    // Register an input validator that requires 'test-node-in-1'
    nodeExecutor.registerInputValidator('process', (inputs, node) => {
      if (!inputs['test-node-in-1']) {
        throw new Error(`Missing required input: test-node-in-1`);
      }
      return true;
    });
    
    // Mock input data without the required input
    const inputs: NodeInputs = {
      'test-node-in-2': { value: 'input 2' }
    };
    
    // Execute the node
    await expect(nodeExecutor.executeNode(mockNode, inputs, mockContext))
      .rejects.toThrow(`Missing required input: test-node-in-1`);
  });
  
  test('should validate outputs after execution', async () => {
    // Register a mock executor for the 'process' node type
    nodeExecutor.registerNodeTypeExecutor('process', mockNodeExecutor);
    
    // Register an output validator that requires 'test-node-out-1'
    nodeExecutor.registerOutputValidator('process', (outputs, node) => {
      if (!outputs['test-node-out-1']) {
        throw new Error(`Missing required output: test-node-out-1`);
      }
      return true;
    });
    
    // Mock a custom executor that doesn't provide the required output
    const customExecutor = async (nodeId: string, inputs: Record<string, any>) => {
      return {
        'test-node-out-2': { value: 'output 2' }
      };
    };
    
    // Override the executor
    nodeExecutor.registerNodeTypeExecutor('process', customExecutor);
    
    // Mock input data
    const inputs: NodeInputs = {
      'test-node-in-1': { value: 'input 1' }
    };
    
    // Execute the node
    await expect(nodeExecutor.executeNode(mockNode, inputs, mockContext))
      .rejects.toThrow(`Missing required output: test-node-out-1`);
  });
});
