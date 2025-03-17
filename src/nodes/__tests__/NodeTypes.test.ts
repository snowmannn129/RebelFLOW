/**
 * NodeTypes.test.ts
 * 
 * Tests for the core node types.
 */

import '../__tests__/setup';
import { DataNode } from '../types/DataNode';
import { ProcessNode } from '../types/ProcessNode';
import { ControlFlowNode } from '../types/ControlFlowNode';
import { NodeStatus } from '../base/NodeStatus';
import { getEventBus } from '@rebelflow/core/events/EventBus';
import { CoreEventTypes } from '@rebelflow/core/events/EventTypes';

describe('DataNode', () => {
  let node: DataNode;
  
  beforeEach(() => {
    node = new DataNode('data-node-1', 'Test Data Node');
  });
  
  it('should have correct type', () => {
    expect(node.getType()).toBe('DataNode');
  });
  
  it('should store and retrieve data', async () => {
    // Set initial data
    node.setData({ key1: 'value1', key2: 42 });
    
    // Execute node
    const result = await node.execute({});
    
    // Should output the stored data
    expect(result).toEqual({
      data: { key1: 'value1', key2: 42 }
    });
  });
  
  it('should update data from input', async () => {
    // Set initial data
    node.setData({ key1: 'value1', key2: 42 });
    
    // Execute node with input data
    const result = await node.execute({
      data: { key1: 'updated', key3: true }
    });
    
    // Should merge the input data with existing data
    expect(result).toEqual({
      data: { key1: 'updated', key2: 42, key3: true }
    });
    
    // Data should be updated in the node
    expect(node.getData()).toEqual({
      key1: 'updated', key2: 42, key3: true
    });
  });
  
  it('should support data transformation', async () => {
    // Create a data node with a transformation function
    const transformNode = new DataNode('transform-node', 'Transform Node');
    transformNode.setTransformationFunction((data) => {
      return {
        transformed: true,
        uppercase: typeof data.text === 'string' ? data.text.toUpperCase() : undefined,
        value: data.value ? data.value * 2 : 0
      };
    });
    
    // Execute node with input data
    const result = await transformNode.execute({
      data: { text: 'hello', value: 21 }
    });
    
    // Should apply the transformation function
    expect(result).toEqual({
      data: {
        transformed: true,
        uppercase: 'HELLO',
        value: 42
      }
    });
  });
});

describe('ProcessNode', () => {
  it('should process inputs correctly', async () => {
    // Create a process node that adds two numbers
    const node = new ProcessNode('add-node', 'Add Node', (inputs) => {
      return {
        sum: (inputs.a || 0) + (inputs.b || 0)
      };
    });
    
    // Add input and output ports
    node.addInput('a', 'number', 'First number');
    node.addInput('b', 'number', 'Second number');
    node.addOutput('sum', 'number', 'Sum of a and b');
    
    // Execute node
    const result = await node.execute({
      a: 5,
      b: 7
    });
    
    // Should output the sum
    expect(result).toEqual({
      sum: 12
    });
  });
  
  it('should handle async processing', async () => {
    // Create a process node with async processing
    const node = new ProcessNode('async-node', 'Async Node', async (inputs) => {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 10));
      
      return {
        result: `Processed: ${inputs.value}`
      };
    });
    
    // Add input and output ports
    node.addInput('value', 'string', 'Value to process');
    node.addOutput('result', 'string', 'Processed result');
    
    // Execute node
    const result = await node.execute({
      value: 'test'
    });
    
    // Should output the processed result
    expect(result).toEqual({
      result: 'Processed: test'
    });
  });
  
  it('should handle errors in processing', async () => {
    // Create a process node that throws an error
    const node = new ProcessNode('error-node', 'Error Node', () => {
      throw new Error('Test error');
    });
    
    // Execute node
    await expect(node.execute({})).rejects.toThrow('Test error');
    
    // Status should be FAILED
    expect(node.getStatus()).toBe(NodeStatus.FAILED);
    
    // Should publish error event
    expect(getEventBus().publish).toHaveBeenCalledWith(
      CoreEventTypes.NODE_EXECUTION_FAILED,
      expect.objectContaining({
        nodeId: 'error-node',
        error: expect.any(Error)
      })
    );
  });
});

describe('ControlFlowNode', () => {
  it('should route data based on condition', async () => {
    // Create a control flow node that routes based on a condition
    const node = new ControlFlowNode('if-node', 'If Node');
    
    // Add input and output ports
    node.addInput('condition', 'boolean', 'Condition to evaluate');
    node.addInput('value', 'any', 'Value to route');
    node.addOutput('true', 'any', 'Output if condition is true');
    node.addOutput('false', 'any', 'Output if condition is false');
    
    // Set condition function
    node.setConditionFunction((inputs) => {
      return !!inputs.condition;
    });
    
    // Execute node with true condition
    let result = await node.execute({
      condition: true,
      value: 'test value'
    });
    
    // Should route to 'true' output
    expect(result).toEqual({
      true: 'test value',
      false: undefined
    });
    
    // Execute node with false condition
    result = await node.execute({
      condition: false,
      value: 'test value'
    });
    
    // Should route to 'false' output
    expect(result).toEqual({
      true: undefined,
      false: 'test value'
    });
  });
  
  it('should support multiple output routes', async () => {
    // Create a control flow node with multiple routes
    const node = new ControlFlowNode('switch-node', 'Switch Node');
    
    // Add input and output ports
    node.addInput('value', 'number', 'Value to evaluate');
    node.addOutput('low', 'number', 'Output if value < 10');
    node.addOutput('medium', 'number', 'Output if 10 <= value < 100');
    node.addOutput('high', 'number', 'Output if value >= 100');
    
    // Set routing function
    node.setRoutingFunction((inputs) => {
      const value = inputs.value as number;
      
      if (value < 10) {
        return 'low';
      } else if (value < 100) {
        return 'medium';
      } else {
        return 'high';
      }
    });
    
    // Execute node with different values
    let result = await node.execute({ value: 5 });
    expect(result).toEqual({
      low: 5,
      medium: undefined,
      high: undefined
    });
    
    result = await node.execute({ value: 50 });
    expect(result).toEqual({
      low: undefined,
      medium: 50,
      high: undefined
    });
    
    result = await node.execute({ value: 500 });
    expect(result).toEqual({
      low: undefined,
      medium: undefined,
      high: 500
    });
  });
  
  it('should support custom routing logic', async () => {
    // Create a control flow node with custom routing
    const node = new ControlFlowNode('custom-route-node', 'Custom Route Node');
    
    // Add input and output ports
    node.addInput('values', 'array', 'Array of values');
    node.addOutput('even', 'array', 'Even numbers');
    node.addOutput('odd', 'array', 'Odd numbers');
    
    // Set custom routing function that splits values into even and odd
    node.setCustomRoutingFunction((inputs) => {
      const values = inputs.values as number[];
      const even: number[] = [];
      const odd: number[] = [];
      
      if (Array.isArray(values)) {
        values.forEach(value => {
          if (value % 2 === 0) {
            even.push(value);
          } else {
            odd.push(value);
          }
        });
      }
      
      return {
        even,
        odd
      };
    });
    
    // Execute node
    const result = await node.execute({
      values: [1, 2, 3, 4, 5, 6]
    });
    
    // Should split values into even and odd
    expect(result).toEqual({
      even: [2, 4, 6],
      odd: [1, 3, 5]
    });
  });
});
