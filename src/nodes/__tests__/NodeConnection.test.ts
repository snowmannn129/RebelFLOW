/**
 * NodeConnection.test.ts
 * 
 * Tests for the node connection system.
 */

import '../__tests__/setup';
import { NodeConnection } from '../connection/NodeConnection';
import { ConnectionManager } from '../connection/ConnectionManager';
import { BaseNode } from '../base/BaseNode';
import { NodePort, NodePortType } from '../base/NodePort';
import { DataNode } from '../types/DataNode';
import { ProcessNode } from '../types/ProcessNode';
import { getEventBus } from '@rebelflow/core/events/EventBus';
import { CoreEventTypes } from '@rebelflow/core/events/EventTypes';

// Mock implementation of BaseNode for testing
class TestSourceNode extends BaseNode {
  constructor(id: string, name: string) {
    super(id, name);
    this.addOutput('output1', 'number', 'Test output');
    this.addOutput('output2', 'string', 'Test output');
  }
  
  protected process(inputs: Record<string, any>): Record<string, any> {
    return {
      output1: 42,
      output2: 'test'
    };
  }
}

class TestTargetNode extends BaseNode {
  constructor(id: string, name: string) {
    super(id, name);
    this.addInput('input1', 'number', 'Test input');
    this.addInput('input2', 'string', 'Test input');
  }
  
  protected process(inputs: Record<string, any>): Record<string, any> {
    return {
      result: inputs.input1 + inputs.input2
    };
  }
}

describe('NodeConnection', () => {
  let sourceNode: TestSourceNode;
  let targetNode: TestTargetNode;
  let connection: NodeConnection;
  
  beforeEach(() => {
    sourceNode = new TestSourceNode('source-node', 'Source Node');
    targetNode = new TestTargetNode('target-node', 'Target Node');
    
    connection = new NodeConnection(
      'test-connection',
      sourceNode,
      'output1',
      targetNode,
      'input1'
    );
  });
  
  it('should initialize with correct properties', () => {
    expect(connection.getId()).toBe('test-connection');
    expect(connection.getSourceNode()).toBe(sourceNode);
    expect(connection.getSourcePortId()).toBe('output1');
    expect(connection.getTargetNode()).toBe(targetNode);
    expect(connection.getTargetPortId()).toBe('input1');
  });
  
  it('should validate connection compatibility', () => {
    // Valid connection (same type)
    expect(connection.isValid()).toBe(true);
    
    // Invalid connection (different types)
    const invalidConnection = new NodeConnection(
      'invalid-connection',
      sourceNode,
      'output2', // string
      targetNode,
      'input1' // number
    );
    
    expect(invalidConnection.isValid()).toBe(false);
  });
  
  it('should transfer data from source to target', async () => {
    // Execute source node
    const sourceOutputs = await sourceNode.execute({});
    
    // Transfer data
    const transferredData = connection.transferData(sourceOutputs);
    
    // Check transferred data
    expect(transferredData).toEqual({
      input1: 42
    });
  });
  
  it('should handle missing source data', async () => {
    // Empty source outputs
    const sourceOutputs = {};
    
    // Transfer data
    const transferredData = connection.transferData(sourceOutputs);
    
    // Should return empty object
    expect(transferredData).toEqual({});
  });
});

describe('ConnectionManager', () => {
  let connectionManager: ConnectionManager;
  let sourceNode: TestSourceNode;
  let targetNode1: TestTargetNode;
  let targetNode2: TestTargetNode;
  
  beforeEach(() => {
    connectionManager = new ConnectionManager();
    sourceNode = new TestSourceNode('source-node', 'Source Node');
    targetNode1 = new TestTargetNode('target-node-1', 'Target Node 1');
    targetNode2 = new TestTargetNode('target-node-2', 'Target Node 2');
  });
  
  it('should create and register connections', () => {
    // Create connections
    const connection1 = connectionManager.createConnection(
      sourceNode,
      'output1',
      targetNode1,
      'input1'
    );
    
    const connection2 = connectionManager.createConnection(
      sourceNode,
      'output2',
      targetNode2,
      'input2'
    );
    
    // Check connections
    expect(connectionManager.getConnections().length).toBe(2);
    expect(connectionManager.getConnectionById(connection1.getId())).toBe(connection1);
    expect(connectionManager.getConnectionById(connection2.getId())).toBe(connection2);
  });
  
  it('should find connections by node', () => {
    // Create connections
    connectionManager.createConnection(
      sourceNode,
      'output1',
      targetNode1,
      'input1'
    );
    
    connectionManager.createConnection(
      sourceNode,
      'output2',
      targetNode2,
      'input2'
    );
    
    // Find connections by source node
    const sourceConnections = connectionManager.getConnectionsByNode(sourceNode);
    expect(sourceConnections.length).toBe(2);
    
    // Find connections by target node
    const targetConnections1 = connectionManager.getConnectionsByNode(targetNode1);
    expect(targetConnections1.length).toBe(1);
    
    const targetConnections2 = connectionManager.getConnectionsByNode(targetNode2);
    expect(targetConnections2.length).toBe(1);
  });
  
  it('should find connections by port', () => {
    // Create connections
    connectionManager.createConnection(
      sourceNode,
      'output1',
      targetNode1,
      'input1'
    );
    
    connectionManager.createConnection(
      sourceNode,
      'output1',
      targetNode2,
      'input1'
    );
    
    // Find connections by source port
    const sourcePortConnections = connectionManager.getConnectionsByPort(sourceNode, 'output1');
    expect(sourcePortConnections.length).toBe(2);
    
    // Find connections by target port
    const targetPortConnections = connectionManager.getConnectionsByPort(targetNode1, 'input1');
    expect(targetPortConnections.length).toBe(1);
  });
  
  it('should remove connections', () => {
    // Create connections
    const connection1 = connectionManager.createConnection(
      sourceNode,
      'output1',
      targetNode1,
      'input1'
    );
    
    const connection2 = connectionManager.createConnection(
      sourceNode,
      'output2',
      targetNode2,
      'input2'
    );
    
    // Remove one connection
    connectionManager.removeConnection(connection1.getId());
    
    // Check remaining connections
    expect(connectionManager.getConnections().length).toBe(1);
    expect(connectionManager.getConnectionById(connection1.getId())).toBeUndefined();
    expect(connectionManager.getConnectionById(connection2.getId())).toBe(connection2);
  });
  
  it('should remove all connections for a node', () => {
    // Create connections
    connectionManager.createConnection(
      sourceNode,
      'output1',
      targetNode1,
      'input1'
    );
    
    connectionManager.createConnection(
      sourceNode,
      'output2',
      targetNode2,
      'input2'
    );
    
    // Remove all connections for source node
    connectionManager.removeConnectionsByNode(sourceNode);
    
    // Check remaining connections
    expect(connectionManager.getConnections().length).toBe(0);
  });
  
  it('should validate connections', () => {
    // Create valid connection
    const validConnection = connectionManager.createConnection(
      sourceNode,
      'output1',
      targetNode1,
      'input1'
    );
    
    expect(validConnection).toBeDefined();
    expect(connectionManager.getConnections().length).toBe(1);
    
    // Try to create invalid connection (type mismatch)
    const invalidConnection = connectionManager.createConnection(
      sourceNode,
      'output2', // string
      targetNode1,
      'input1' // number
    );
    
    // Should not create invalid connection
    expect(invalidConnection).toBeUndefined();
    expect(connectionManager.getConnections().length).toBe(1);
  });
  
  it('should prevent duplicate connections', () => {
    // Create connection
    connectionManager.createConnection(
      sourceNode,
      'output1',
      targetNode1,
      'input1'
    );
    
    // Try to create duplicate connection
    const duplicateConnection = connectionManager.createConnection(
      sourceNode,
      'output1',
      targetNode1,
      'input1'
    );
    
    // Should not create duplicate connection
    expect(duplicateConnection).toBeUndefined();
    expect(connectionManager.getConnections().length).toBe(1);
  });
  
  it('should prevent multiple connections to the same input port', () => {
    // Create connection
    connectionManager.createConnection(
      sourceNode,
      'output1',
      targetNode1,
      'input1'
    );
    
    // Try to create another connection to the same input port
    const anotherConnection = connectionManager.createConnection(
      sourceNode,
      'output2',
      targetNode1,
      'input1'
    );
    
    // Should not create another connection to the same input port
    expect(anotherConnection).toBeUndefined();
    expect(connectionManager.getConnections().length).toBe(1);
  });
  
  it('should transfer data through connections', async () => {
    // Create data node
    const dataNode = new DataNode('data-node', 'Data Node');
    dataNode.setData({ value: 42 });
    
    // Create process node
    const processNode = new ProcessNode('process-node', 'Process Node', (inputs) => {
      return {
        result: (inputs.data?.value || 0) * 2
      };
    });
    
    // Add ports
    processNode.addInput('data', 'object', 'Input data');
    processNode.addOutput('result', 'number', 'Result');
    
    // Create connection
    connectionManager.createConnection(
      dataNode,
      'data',
      processNode,
      'data'
    );
    
    // Execute data node
    const dataOutputs = await dataNode.execute({});
    
    // Get connections from data node
    const connections = connectionManager.getConnectionsByNode(dataNode);
    
    // Transfer data through connections
    const processInputs: Record<string, any> = {};
    
    for (const connection of connections) {
      const transferredData = connection.transferData(dataOutputs);
      Object.assign(processInputs, transferredData);
    }
    
    // Execute process node with transferred data
    const processOutputs = await processNode.execute(processInputs);
    
    // Check result
    expect(processOutputs.result).toBe(84); // 42 * 2
  });
});
