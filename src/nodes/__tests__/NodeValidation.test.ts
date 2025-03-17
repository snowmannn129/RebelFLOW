/**
 * NodeValidation.test.ts
 * 
 * Tests for the node validation mechanisms.
 */

import '../__tests__/setup';
import { NodeValidator } from '../validation/NodeValidator';
import { ValidationRule } from '../validation/ValidationRule';
import { BaseNode } from '../base/BaseNode';
import { DataNode } from '../types/DataNode';
import { ProcessNode } from '../types/ProcessNode';
import { ConnectionManager } from '../connection/ConnectionManager';

// Mock implementation of BaseNode for testing
class TestNode extends BaseNode {
  constructor(id: string, name: string) {
    super(id, name);
    
    // Add some test ports
    this.addInput('input1', 'number', 'Test input 1');
    this.addInput('input2', 'string', 'Test input 2', 'default value');
    this.addOutput('output1', 'number', 'Test output 1');
  }
  
  protected process(inputs: Record<string, any>): Record<string, any> {
    return {
      output1: inputs.input1 ? Number(inputs.input1) * 2 : 0
    };
  }
}

describe('ValidationRule', () => {
  it('should create a validation rule', () => {
    const rule = new ValidationRule(
      'test-rule',
      'Test Rule',
      (node) => node.getInputs().length > 0,
      'Node must have at least one input'
    );
    
    expect(rule.getId()).toBe('test-rule');
    expect(rule.getName()).toBe('Test Rule');
    expect(rule.getMessage()).toBe('Node must have at least one input');
  });
  
  it('should validate a node', () => {
    const rule = new ValidationRule(
      'test-rule',
      'Test Rule',
      (node) => node.getInputs().length > 0,
      'Node must have at least one input'
    );
    
    const node = new TestNode('test-node', 'Test Node');
    
    expect(rule.validate(node)).toBe(true);
  });
  
  it('should fail validation', () => {
    const rule = new ValidationRule(
      'test-rule',
      'Test Rule',
      (node) => node.getInputs().length > 5,
      'Node must have more than 5 inputs'
    );
    
    const node = new TestNode('test-node', 'Test Node');
    
    expect(rule.validate(node)).toBe(false);
  });
});

describe('NodeValidator', () => {
  let validator: NodeValidator;
  
  beforeEach(() => {
    validator = new NodeValidator();
    
    // Add some validation rules
    validator.addRule(
      'has-inputs',
      'Has Inputs',
      (node) => node.getInputs().length > 0,
      'Node must have at least one input'
    );
    
    validator.addRule(
      'has-outputs',
      'Has Outputs',
      (node) => node.getOutputs().length > 0,
      'Node must have at least one output'
    );
  });
  
  it('should validate a node against all rules', () => {
    const node = new TestNode('test-node', 'Test Node');
    
    const result = validator.validateNode(node);
    
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });
  
  it('should fail validation with errors', () => {
    // Add a rule that will fail
    validator.addRule(
      'has-many-inputs',
      'Has Many Inputs',
      (node) => node.getInputs().length > 5,
      'Node must have more than 5 inputs'
    );
    
    const node = new TestNode('test-node', 'Test Node');
    
    const result = validator.validateNode(node);
    
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBe(1);
    expect(result.errors[0].ruleId).toBe('has-many-inputs');
    expect(result.errors[0].message).toBe('Node must have more than 5 inputs');
  });
  
  it('should validate a node against specific rules', () => {
    const node = new TestNode('test-node', 'Test Node');
    
    // Add a rule that will fail
    validator.addRule(
      'has-many-inputs',
      'Has Many Inputs',
      (node) => node.getInputs().length > 5,
      'Node must have more than 5 inputs'
    );
    
    // Validate only against the 'has-inputs' and 'has-outputs' rules
    const result = validator.validateNode(node, ['has-inputs', 'has-outputs']);
    
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });
  
  it('should validate a workflow', () => {
    // Create nodes
    const dataNode = new DataNode('data-node', 'Data Node');
    dataNode.setData({ value: 42 });
    
    const processNode = new ProcessNode('process-node', 'Process Node', (inputs) => {
      return {
        result: (inputs.data?.value || 0) * 2
      };
    });
    
    // Add ports
    processNode.addInput('data', 'object', 'Input data');
    processNode.addOutput('result', 'number', 'Result');
    
    // Create connection manager
    const connectionManager = new ConnectionManager();
    
    // Create connection
    connectionManager.createConnection(
      dataNode,
      'data',
      processNode,
      'data'
    );
    
    // Validate workflow
    const result = validator.validateWorkflow([dataNode, processNode], connectionManager);
    
    expect(result.isValid).toBe(true);
    expect(result.nodeErrors.size).toBe(0);
    expect(result.connectionErrors.length).toBe(0);
  });
  
  it('should fail workflow validation with node errors', () => {
    // Create nodes
    const dataNode = new DataNode('data-node', 'Data Node');
    
    // Add a rule that will fail for data nodes
    validator.addRule(
      'data-node-has-data',
      'Data Node Has Data',
      (node) => {
        if (node instanceof DataNode) {
          return Object.keys(node.getData()).length > 0;
        }
        return true;
      },
      'Data node must have data'
    );
    
    // Validate workflow
    const result = validator.validateWorkflow([dataNode], new ConnectionManager());
    
    expect(result.isValid).toBe(false);
    expect(result.nodeErrors.size).toBe(1);
    expect(result.nodeErrors.get(dataNode.getId())?.length).toBe(1);
    expect(result.nodeErrors.get(dataNode.getId())?.[0].ruleId).toBe('data-node-has-data');
  });
  
  it('should fail workflow validation with connection errors', () => {
    // Create nodes
    const dataNode = new DataNode('data-node', 'Data Node');
    dataNode.setData({ value: 42 });
    
    const processNode = new ProcessNode('process-node', 'Process Node', (inputs) => {
      return {
        result: (inputs.data?.value || 0) * 2
      };
    });
    
    // Add ports with mismatched types
    processNode.addInput('data', 'number', 'Input data'); // Should be 'object'
    processNode.addOutput('result', 'number', 'Result');
    
    // Create connection manager
    const connectionManager = new ConnectionManager();
    
    // Create connection (this will fail validation)
    const connection = new NodeConnection(
      'test-connection',
      dataNode,
      'data', // object
      processNode,
      'data' // number
    );
    
    // Mock the connections
    jest.spyOn(connectionManager, 'getConnections').mockReturnValue([connection]);
    
    // Validate workflow
    const result = validator.validateWorkflow([dataNode, processNode], connectionManager);
    
    expect(result.isValid).toBe(false);
    expect(result.connectionErrors.length).toBe(1);
    expect(result.connectionErrors[0].connectionId).toBe('test-connection');
    expect(result.connectionErrors[0].message).toBe('Connection has incompatible port types');
  });
});
