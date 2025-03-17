/**
 * EventBus.test.ts
 * 
 * Unit tests for the EventBus class.
 */

// Import test setup
import './setup';

import { EventBus, getEventBus } from '../EventBus';
import { CoreEventTypes } from '../EventTypes';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    // Get a fresh instance for each test
    eventBus = EventBus.getInstance();
    eventBus.clearAllSubscriptions();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = EventBus.getInstance();
      const instance2 = EventBus.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should be accessible via getEventBus helper', () => {
      const instance = EventBus.getInstance();
      const helperInstance = getEventBus();
      expect(instance).toBe(helperInstance);
    });
  });

  describe('subscribe', () => {
    it('should register a callback for an event type', () => {
      const callback = jest.fn();
      eventBus.subscribe(CoreEventTypes.WORKFLOW_STARTED, callback);
      expect(eventBus.hasSubscribers(CoreEventTypes.WORKFLOW_STARTED)).toBe(true);
      expect(eventBus.getSubscriberCount(CoreEventTypes.WORKFLOW_STARTED)).toBe(1);
    });

    it('should return a subscription object', () => {
      const callback = jest.fn();
      const subscription = eventBus.subscribe(CoreEventTypes.WORKFLOW_STARTED, callback);
      
      expect(subscription).toBeDefined();
      expect(subscription.eventType).toBe(CoreEventTypes.WORKFLOW_STARTED);
      expect(subscription.active).toBe(true);
      expect(subscription.id).toBeDefined();
    });

    it('should support multiple subscribers for the same event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      eventBus.subscribe(CoreEventTypes.WORKFLOW_STARTED, callback1);
      eventBus.subscribe(CoreEventTypes.WORKFLOW_STARTED, callback2);
      
      expect(eventBus.getSubscriberCount(CoreEventTypes.WORKFLOW_STARTED)).toBe(2);
    });
  });

  describe('publish', () => {
    it('should call all subscribers for an event type', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const data = { workflowId: '123' };
      
      eventBus.subscribe(CoreEventTypes.WORKFLOW_STARTED, callback1);
      eventBus.subscribe(CoreEventTypes.WORKFLOW_STARTED, callback2);
      
      await eventBus.publish(CoreEventTypes.WORKFLOW_STARTED, data);
      
      expect(callback1).toHaveBeenCalledWith(data);
      expect(callback2).toHaveBeenCalledWith(data);
    });

    it('should not call subscribers for other event types', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      eventBus.subscribe(CoreEventTypes.WORKFLOW_STARTED, callback1);
      eventBus.subscribe(CoreEventTypes.WORKFLOW_COMPLETED, callback2);
      
      await eventBus.publish(CoreEventTypes.WORKFLOW_STARTED, {});
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it('should handle async subscribers', async () => {
      let flag = false;
      
      const asyncCallback = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        flag = true;
      };
      
      eventBus.subscribe(CoreEventTypes.WORKFLOW_STARTED, asyncCallback);
      await eventBus.publish(CoreEventTypes.WORKFLOW_STARTED, {});
      
      expect(flag).toBe(true);
    });

    it('should execute subscribers in priority order', async () => {
      const results: number[] = [];
      
      const callback1 = () => { results.push(1); };
      const callback2 = () => { results.push(2); };
      const callback3 = () => { results.push(3); };
      
      eventBus.subscribe(CoreEventTypes.WORKFLOW_STARTED, callback1, { priority: 1 });
      eventBus.subscribe(CoreEventTypes.WORKFLOW_STARTED, callback2, { priority: 3 });
      eventBus.subscribe(CoreEventTypes.WORKFLOW_STARTED, callback3, { priority: 2 });
      
      await eventBus.publish(CoreEventTypes.WORKFLOW_STARTED, {});
      
      expect(results).toEqual([2, 3, 1]); // Highest priority first
    });

    it('should handle "once" subscriptions', async () => {
      const callback = jest.fn();
      
      eventBus.subscribe(CoreEventTypes.WORKFLOW_STARTED, callback, { once: true });
      
      await eventBus.publish(CoreEventTypes.WORKFLOW_STARTED, {});
      await eventBus.publish(CoreEventTypes.WORKFLOW_STARTED, {});
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(eventBus.hasSubscribers(CoreEventTypes.WORKFLOW_STARTED)).toBe(false);
    });

    it('should isolate errors in subscribers', async () => {
      const errorCallback = () => {
        throw new Error('Test error');
      };
      
      const successCallback = jest.fn();
      
      eventBus.subscribe(CoreEventTypes.WORKFLOW_STARTED, errorCallback);
      eventBus.subscribe(CoreEventTypes.WORKFLOW_STARTED, successCallback);
      
      // Should not throw
      await expect(eventBus.publish(CoreEventTypes.WORKFLOW_STARTED, {})).resolves.not.toThrow();
      
      // Second callback should still be called
      expect(successCallback).toHaveBeenCalled();
    });
  });

  describe('unsubscribe', () => {
    it('should remove a subscription', () => {
      const callback = jest.fn();
      const subscription = eventBus.subscribe(CoreEventTypes.WORKFLOW_STARTED, callback);
      
      expect(eventBus.hasSubscribers(CoreEventTypes.WORKFLOW_STARTED)).toBe(true);
      
      eventBus.unsubscribe(subscription);
      
      expect(eventBus.hasSubscribers(CoreEventTypes.WORKFLOW_STARTED)).toBe(false);
    });

    it('should mark the subscription as inactive', () => {
      const callback = jest.fn();
      const subscription = eventBus.subscribe(CoreEventTypes.WORKFLOW_STARTED, callback);
      
      expect(subscription.active).toBe(true);
      
      eventBus.unsubscribe(subscription);
      
      expect(subscription.active).toBe(false);
    });

    it('should be callable through the subscription object', () => {
      const callback = jest.fn();
      const subscription = eventBus.subscribe(CoreEventTypes.WORKFLOW_STARTED, callback);
      
      expect(eventBus.hasSubscribers(CoreEventTypes.WORKFLOW_STARTED)).toBe(true);
      
      subscription.unsubscribe();
      
      expect(eventBus.hasSubscribers(CoreEventTypes.WORKFLOW_STARTED)).toBe(false);
    });
  });

  describe('clearEventSubscriptions', () => {
    it('should remove all subscriptions for an event type', () => {
      eventBus.subscribe(CoreEventTypes.WORKFLOW_STARTED, () => {});
      eventBus.subscribe(CoreEventTypes.WORKFLOW_STARTED, () => {});
      eventBus.subscribe(CoreEventTypes.WORKFLOW_COMPLETED, () => {});
      
      expect(eventBus.getSubscriberCount(CoreEventTypes.WORKFLOW_STARTED)).toBe(2);
      expect(eventBus.getSubscriberCount(CoreEventTypes.WORKFLOW_COMPLETED)).toBe(1);
      
      eventBus.clearEventSubscriptions(CoreEventTypes.WORKFLOW_STARTED);
      
      expect(eventBus.hasSubscribers(CoreEventTypes.WORKFLOW_STARTED)).toBe(false);
      expect(eventBus.hasSubscribers(CoreEventTypes.WORKFLOW_COMPLETED)).toBe(true);
    });
  });

  describe('clearAllSubscriptions', () => {
    it('should remove all subscriptions', () => {
      eventBus.subscribe(CoreEventTypes.WORKFLOW_STARTED, () => {});
      eventBus.subscribe(CoreEventTypes.WORKFLOW_COMPLETED, () => {});
      
      expect(eventBus.hasSubscribers(CoreEventTypes.WORKFLOW_STARTED)).toBe(true);
      expect(eventBus.hasSubscribers(CoreEventTypes.WORKFLOW_COMPLETED)).toBe(true);
      
      eventBus.clearAllSubscriptions();
      
      expect(eventBus.hasSubscribers(CoreEventTypes.WORKFLOW_STARTED)).toBe(false);
      expect(eventBus.hasSubscribers(CoreEventTypes.WORKFLOW_COMPLETED)).toBe(false);
    });
  });
});
