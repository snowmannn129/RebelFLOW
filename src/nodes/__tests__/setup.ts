/**
 * setup.ts
 * 
 * Setup file for node system tests.
 * This file contains common setup code for all node system tests.
 */

// Mock the event bus
jest.mock('@rebelflow/core/events/EventBus', () => {
  const mockPublish = jest.fn().mockResolvedValue(undefined);
  const mockSubscribe = jest.fn().mockReturnValue({ unsubscribe: jest.fn() });
  
  return {
    getEventBus: jest.fn().mockReturnValue({
      publish: mockPublish,
      subscribe: mockSubscribe
    })
  };
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
