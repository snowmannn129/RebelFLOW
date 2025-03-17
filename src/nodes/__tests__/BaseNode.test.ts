/**
 * BaseNode.test.ts
 * 
 * Tests for the base node interfaces and abstract classes.
 */

import '../__tests__/setup';
import { BaseNode } from '../base/BaseNode';
import { NodePort, NodePortType } from '../base/NodePort';
import { NodeStatus } from '../base/NodeStatus';
import { getEventBus } from '@rebelflow/core/events/EventBus';
import { CoreEventTypes } from '@rebelflow/core/events/EventTypes';

// Mock implementation of BaseNode for testing
class TestNode extends BaseNode {
  constructor(id: string, name: string) {
    super(id, name);
    
    // Add some test ports
    this.addInput('input1', 'number', 'Test input 1');
    this.addInput('input2', 'string', 'Test input 2', 'default value');
    this.addOutput('output1', 'number', 'Test output 1');
  }
  
  // Implement abstract method
  protected async process(inputs: Record<string, any>): Promise<Record<string, any>> {
    // Simple processing logic for testing
    return {
      output1: inputs.input1 ? Number(inputs.input1) * 2 : 0
    };
  }
}

describe('BaseNode', () => {
  let node: TestNode;
  
  beforeEach(() => {
    node = new TestNode('test-node-1', 'Test Node');
  });
  
  describe('Constructor and basic properties', () => {
    it('should initialize with correct id and name', () => {
      expect(node.getId()).toBe('test-node-1');
      expect(node.getName()).toBe('Test Node');
    });
    
    it('should have default status of "idle"', () => {
      expect(node.getStatus()).toBe(NodeStatus.IDLE);
    });
    
    it('should have correct input and output ports', () => {
      const inputs = node.getInputs();
      const outputs = node.getOutputs();
      
      expect(inputs.length).toBe(2);
      expect(outputs.length).toBe(1);
      
      expect(inputs[0].id).toBe('input1');
      expect(inputs[0].name).toBe('input1');
      expect(inputs[0].type).toBe('number');
      expect(inputs[0].description).toBe('Test input 1');
      expect(inputs[0].defaultValue).toBeUndefined();
      
      expect(inputs[1].id).toBe('input2');
      expect(inputs[1].type).toBe('string');
      expect(inputs[1].defaultValue).toBe('default value');
      
      expect(outputs[0].id).toBe('output1');
      expect(outputs[0].type).toBe('number');
    });
  });
  
  describe('Port management', () => {
    it('should add input port correctly', () => {
      node.addInput('input3', 'boolean', 'Test input 3', false);
      
      const inputs = node.getInputs();
      expect(inputs.length).toBe(3);
      
      const newInput = inputs.find(p => p.id === 'input3');
      expect(newInput).toBeDefined();
      expect(newInput?.type).toBe('boolean');
      expect(newInput?.defaultValue).toBe(false);
    });
    
    it('should add output port correctly', () => {
      node.addOutput('output2', 'string', 'Test output 2');
      
      const outputs = node.getOutputs();
      expect(outputs.length).toBe(2);
      
      const newOutput = outputs.find(p => p.id === 'output2');
      expect(newOutput).toBeDefined();
      expect(newOutput?.type).toBe('string');
    });
    
    it('should remove port correctly', () => {
      node.removeInput('input1');
      
      const inputs = node.getInputs();
      expect(inputs.length).toBe(1);
      expect(inputs[0].id).toBe('input2');
    });
    
    it('should get port by id', () => {
      const input = node.getInputPort('input1');
      const output = node.getOutputPort('output1');
      
      expect(input).toBeDefined();
      expect(input?.id).toBe('input1');
      
      expect(output).toBeDefined();
      expect(output?.id).toBe('output1');
    });
    
    it('should return undefined for non-existent port', () => {
      const input = node.getInputPort('non-existent');
      const output = node.getOutputPort('non-existent');
      
      expect(input).toBeUndefined();
      expect(output).toBeUndefined();
    });
  });
  
  describe('Node execution', () => {
    it('should execute node correctly', async () => {
      const inputs = {
        input1: 5,
        input2: 'test'
      };
      
      const result = await node.execute(inputs);
      
      expect(result).toEqual({
        output1: 10
      });
    });
    
    it('should use default values for missing inputs', async () => {
      const inputs = {
        input1: 5
        // input2 is missing, should use default
      };
      
      const result = await node.execute(inputs);
      
      expect(result).toEqual({
        output1: 10
      });
    });
    
    it('should handle errors during execution', async () => {
      // Mock the process method to throw an error
      jest.spyOn(node as any, 'process').mockImplementation(() => {
        throw new Error('Test error');
      });
      
      await expect(node.execute({})).rejects.toThrow('Test error');
      
      // Should publish error event
      expect(getEventBus().publish).toHaveBeenCalledWith(
        CoreEventTypes.NODE_EXECUTION_FAILED,
        expect.objectContaining({
          nodeId: 'test-node-1',
          error: expect.any(Error)
        })
      );
    });
    
    it('should update status during execution', async () => {
      const executePromise = node.execute({ input1: 5 });
      
      // Status should be PROCESSING during execution
      expect(node.getStatus()).toBe(NodeStatus.PROCESSING);
      
      await executePromise;
      
      // Status should be COMPLETED after successful execution
      expect(node.getStatus()).toBe(NodeStatus.COMPLETED);
    });
    
    it('should publish events during execution', async () => {
      await node.execute({ input1: 5 });
      
      // Should publish started event
      expect(getEventBus().publish).toHaveBeenCalledWith(
        CoreEventTypes.NODE_EXECUTION_STARTED,
        expect.objectContaining({
          nodeId: 'test-node-1',
          inputs: expect.objectContaining({
            input1: 5
          })
        })
      );
      
      // Should publish completed event
      expect(getEventBus().publish).toHaveBeenCalledWith(
        CoreEventTypes.NODE_EXECUTION_COMPLETED,
        expect.objectContaining({
          nodeId: 'test-node-1',
          outputs: expect.objectContaining({
            output1: 10
          })
        })
      );
    });
  });
  
  describe('Configuration', () => {
    it('should set and get configuration', () => {
      const config = {
        key1: 'value1',
        key2: 42
      };
      
      node.setConfig(config);
      
      expect(node.getConfig()).toEqual(config);
      expect(node.getConfigValue('key1')).toBe('value1');
      expect(node.getConfigValue('key2')).toBe(42);
    });
    
    it('should update configuration', () => {
      node.setConfig({ key1: 'value1', key2: 42 });
      
      node.updateConfig({
        key1: 'updated',
        key3: true
      });
      
      expect(node.getConfig()).toEqual({
        key1: 'updated',
        key2: 42,
        key3: true
      });
    });
    
    it('should return default value for missing config', () => {
      expect(node.getConfigValue('missing')).toBeUndefined();
      expect(node.getConfigValue('missing', 'default')).toBe('default');
    });
  });
  
  describe('Metadata', () => {
    it('should set and get metadata', () => {
      node.setMetadata('position', { x: 100, y: 200 });
      
      expect(node.getMetadata('position')).toEqual({ x: 100, y: 200 });
    });
    
    it('should return undefined for missing metadata', () => {
      expect(node.getMetadata('missing')).toBeUndefined();
    });
  });
});

describe('NodePort', () => {
  it('should create input port correctly', () => {
    const port = NodePort.createInput('test-input', 'number', 'Test input', 42);
    
    expect(port.id).toBe('test-input');
    expect(port.name).toBe('test-input');
    expect(port.type).toBe('number');
    expect(port.description).toBe('Test input');
    expect(port.defaultValue).toBe(42);
    expect(port.portType).toBe(NodePortType.INPUT);
  });
  
  it('should create output port correctly', () => {
    const port = NodePort.createOutput('test-output', 'string', 'Test output');
    
    expect(port.id).toBe('test-output');
    expect(port.name).toBe('test-output');
    expect(port.type).toBe('string');
    expect(port.description).toBe('Test output');
    expect(port.defaultValue).toBeUndefined();
    expect(port.portType).toBe(NodePortType.OUTPUT);
  });
});
