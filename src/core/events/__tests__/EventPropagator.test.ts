/**
 * EventPropagator.test.ts
 * 
 * Unit tests for the EventPropagator class.
 */

// Import test setup
import './setup';

import { EventBus, getEventBus } from '../EventBus';
import { EventPropagator } from '../EventPropagator';
import { CoreEventTypes } from '../EventTypes';

describe('EventPropagator', () => {
  let eventBus: EventBus;
  let eventPropagator: EventPropagator;

  // Mock workflow and node structure
  const mockWorkflow = {
    id: 'workflow-1',
    nodes: [
      { id: 'node-1', type: 'source' },
      { id: 'node-2', type: 'process' },
      { id: 'node-3', type: 'sink' }
    ],
    connections: [
      { id: 'conn-1', sourceNodeId: 'node-1', sourcePortId: 'out-1', targetNodeId: 'node-2', targetPortId: 'in-1' },
      { id: 'conn-2', sourceNodeId: 'node-2', sourcePortId: 'out-1', targetNodeId: 'node-3', targetPortId: 'in-1' }
    ]
  };

  beforeEach(() => {
    // Get a fresh instance for each test
    eventBus = EventBus.getInstance();
    eventBus.clearAllSubscriptions();
    eventPropagator = new EventPropagator(eventBus);
  });

  describe('constructor', () => {
    it('should create an instance with the provided event bus', () => {
      expect(eventPropagator).toBeDefined();
      expect(eventPropagator.getEventBus()).toBe(eventBus);
    });

    it('should use the singleton event bus if none is provided', () => {
      const defaultPropagator = new EventPropagator();
      expect(defaultPropagator.getEventBus()).toBe(getEventBus());
    });
  });

  describe('registerWorkflow', () => {
    it('should register a workflow for event propagation', () => {
      eventPropagator.registerWorkflow(mockWorkflow);
      expect(eventPropagator.hasWorkflow(mockWorkflow.id)).toBe(true);
    });

    it('should throw an error if the workflow is already registered', () => {
      eventPropagator.registerWorkflow(mockWorkflow);
      expect(() => eventPropagator.registerWorkflow(mockWorkflow)).toThrow();
    });
  });

  describe('unregisterWorkflow', () => {
    it('should unregister a workflow', () => {
      eventPropagator.registerWorkflow(mockWorkflow);
      expect(eventPropagator.hasWorkflow(mockWorkflow.id)).toBe(true);
      
      eventPropagator.unregisterWorkflow(mockWorkflow.id);
      expect(eventPropagator.hasWorkflow(mockWorkflow.id)).toBe(false);
    });

    it('should do nothing if the workflow is not registered', () => {
      expect(() => eventPropagator.unregisterWorkflow('non-existent')).not.toThrow();
    });
  });

  describe('propagateEvent', () => {
    it('should propagate an event to connected nodes', async () => {
      // Setup spy on eventBus.publish
      const publishSpy = jest.spyOn(eventBus, 'publish');
      
      eventPropagator.registerWorkflow(mockWorkflow);
      
      // Simulate an event from node-1
      await eventPropagator.propagateEvent(mockWorkflow.id, 'node-1', 'test:event', { value: 42 });
      
      // Should publish to node-2 (directly connected)
      expect(publishSpy).toHaveBeenCalledWith(
        'node:node-2:test:event',
        expect.objectContaining({ value: 42, sourceNodeId: 'node-1' })
      );
      
      // Should not publish to node-3 (not directly connected to node-1)
      expect(publishSpy).not.toHaveBeenCalledWith(
        'node:node-3:test:event',
        expect.anything()
      );
    });

    it('should propagate events through the entire connection chain', async () => {
      // Setup spy on eventBus.publish
      const publishSpy = jest.spyOn(eventBus, 'publish');
      
      eventPropagator.registerWorkflow(mockWorkflow);
      
      // Enable chain propagation
      await eventPropagator.propagateEvent(
        mockWorkflow.id, 
        'node-1', 
        'test:event', 
        { value: 42 }, 
        { propagateChain: true }
      );
      
      // Should publish to node-2 (directly connected)
      expect(publishSpy).toHaveBeenCalledWith(
        'node:node-2:test:event',
        expect.objectContaining({ value: 42, sourceNodeId: 'node-1' })
      );
      
      // Should also publish to node-3 (connected through node-2)
      expect(publishSpy).toHaveBeenCalledWith(
        'node:node-3:test:event',
        expect.objectContaining({ value: 42, sourceNodeId: 'node-2' })
      );
    });

    it('should apply event transformations if provided', async () => {
      // Setup spy on eventBus.publish
      const publishSpy = jest.spyOn(eventBus, 'publish');
      
      // Define a transformation function
      const transform = (data: any, sourceId: string, targetId: string) => {
        return {
          ...data,
          transformed: true,
          path: `${sourceId}->${targetId}`
        };
      };
      
      eventPropagator.registerWorkflow(mockWorkflow);
      
      await eventPropagator.propagateEvent(
        mockWorkflow.id, 
        'node-1', 
        'test:event', 
        { value: 42 }, 
        { transform }
      );
      
      // Should publish transformed data to node-2
      expect(publishSpy).toHaveBeenCalledWith(
        'node:node-2:test:event',
        expect.objectContaining({
          value: 42,
          transformed: true,
          path: 'node-1->node-2',
          sourceNodeId: 'node-1'
        })
      );
    });

    it('should throw an error if the workflow is not registered', async () => {
      await expect(
        eventPropagator.propagateEvent('non-existent', 'node-1', 'test:event', {})
      ).rejects.toThrow();
    });

    it('should handle circular connections safely', async () => {
      // Create a workflow with circular connections
      const circularWorkflow = {
        id: 'circular-workflow',
        nodes: [
          { id: 'node-a', type: 'process' },
          { id: 'node-b', type: 'process' }
        ],
        connections: [
          { id: 'conn-1', sourceNodeId: 'node-a', sourcePortId: 'out-1', targetNodeId: 'node-b', targetPortId: 'in-1' },
          { id: 'conn-2', sourceNodeId: 'node-b', sourcePortId: 'out-1', targetNodeId: 'node-a', targetPortId: 'in-1' }
        ]
      };
      
      // Setup spy on eventBus.publish
      const publishSpy = jest.spyOn(eventBus, 'publish');
      
      eventPropagator.registerWorkflow(circularWorkflow);
      
      // Should not cause an infinite loop
      await eventPropagator.propagateEvent(
        circularWorkflow.id, 
        'node-a', 
        'test:event', 
        { value: 42 }, 
        { propagateChain: true }
      );
      
      // Should have published to node-b only once
      const nodeBCalls = publishSpy.mock.calls.filter(
        call => call[0] === 'node:node-b:test:event'
      );
      
      expect(nodeBCalls.length).toBe(1);
    });
  });

  describe('addEventFilter', () => {
    it('should filter events based on the provided predicate', async () => {
      // Setup spy on eventBus.publish
      const publishSpy = jest.spyOn(eventBus, 'publish');
      
      eventPropagator.registerWorkflow(mockWorkflow);
      
      // Add a filter that only allows events with value > 50
      eventPropagator.addEventFilter((eventType, data) => {
        return data.value > 50;
      });
      
      // This event should be filtered out
      await eventPropagator.propagateEvent(mockWorkflow.id, 'node-1', 'test:event', { value: 42 });
      
      // This event should pass through
      await eventPropagator.propagateEvent(mockWorkflow.id, 'node-1', 'test:event', { value: 60 });
      
      // Reset the spy to clear previous calls
      publishSpy.mockClear();
      
      // This event should pass through
      await eventPropagator.propagateEvent(mockWorkflow.id, 'node-1', 'test:event', { value: 60 });
      
      // Should have published only the event with value 60
      expect(publishSpy).toHaveBeenCalledTimes(1);
      expect(publishSpy).toHaveBeenCalledWith(
        'node:node-2:test:event',
        expect.objectContaining({ value: 60 })
      );
    });

    it('should support multiple filters (all must pass)', async () => {
      // Setup spy on eventBus.publish
      const publishSpy = jest.spyOn(eventBus, 'publish');
      
      eventPropagator.registerWorkflow(mockWorkflow);
      
      // Add filters
      eventPropagator.addEventFilter((eventType, data) => data.value > 50);
      eventPropagator.addEventFilter((eventType, data) => data.type === 'important');
      
      // Clear the spy
      publishSpy.mockClear();
      
      // This event should be filtered out (fails first filter)
      await eventPropagator.propagateEvent(
        mockWorkflow.id, 
        'node-1', 
        'test:event', 
        { value: 42, type: 'important' }
      );
      
      // Verify no events were published
      expect(publishSpy).not.toHaveBeenCalled();
      
      // This event should be filtered out (fails second filter)
      await eventPropagator.propagateEvent(
        mockWorkflow.id, 
        'node-1', 
        'test:event', 
        { value: 60, type: 'normal' }
      );
      
      // Verify still no events were published
      expect(publishSpy).not.toHaveBeenCalled();
      
      // This event should pass through (passes both filters)
      await eventPropagator.propagateEvent(
        mockWorkflow.id, 
        'node-1', 
        'test:event', 
        { value: 60, type: 'important' }
      );
      
      // Should only have published the third event
      expect(publishSpy).toHaveBeenCalledTimes(1);
      expect(publishSpy).toHaveBeenCalledWith(
        'node:node-2:test:event',
        expect.objectContaining({ value: 60, type: 'important' })
      );
    });
  });

  describe('removeEventFilter', () => {
    it('should remove a previously added filter', async () => {
      // Setup spy on eventBus.publish
      const publishSpy = jest.spyOn(eventBus, 'publish');
      
      eventPropagator.registerWorkflow(mockWorkflow);
      
      // Add a filter
      const filter = (eventType: string, data: any) => data.value > 50;
      eventPropagator.addEventFilter(filter);
      
      // This event should be filtered out
      await eventPropagator.propagateEvent(mockWorkflow.id, 'node-1', 'test:event', { value: 42 });
      
      // Remove the filter
      eventPropagator.removeEventFilter(filter);
      
      // This event should now pass through
      await eventPropagator.propagateEvent(mockWorkflow.id, 'node-1', 'test:event', { value: 42 });
      
      // Should have published the second event
      expect(publishSpy).toHaveBeenCalledWith(
        'node:node-2:test:event',
        expect.objectContaining({ value: 42 })
      );
    });
  });

  describe('clearEventFilters', () => {
    it('should remove all event filters', async () => {
      // Setup spy on eventBus.publish
      const publishSpy = jest.spyOn(eventBus, 'publish');
      
      eventPropagator.registerWorkflow(mockWorkflow);
      
      // Add multiple filters
      eventPropagator.addEventFilter((eventType, data) => data.value > 50);
      eventPropagator.addEventFilter((eventType, data) => data.type === 'important');
      
      // This event should be filtered out
      await eventPropagator.propagateEvent(
        mockWorkflow.id, 
        'node-1', 
        'test:event', 
        { value: 42, type: 'normal' }
      );
      
      // Clear all filters
      eventPropagator.clearEventFilters();
      
      // This event should now pass through
      await eventPropagator.propagateEvent(
        mockWorkflow.id, 
        'node-1', 
        'test:event', 
        { value: 42, type: 'normal' }
      );
      
      // Should have published the second event
      expect(publishSpy).toHaveBeenCalledWith(
        'node:node-2:test:event',
        expect.objectContaining({ value: 42, type: 'normal' })
      );
    });
  });
});
