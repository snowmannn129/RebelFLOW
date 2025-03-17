/**
 * EventBus.ts
 * 
 * Implements the central event management system for RebelFlow.
 * The EventBus facilitates communication between components through
 * a publish-subscribe pattern, allowing for decoupled architecture.
 */

import { Subscription, SubscriptionOptions, SubscriptionInfo, createSubscription } from './Subscription';
import { CoreEventTypes } from './EventTypes';

/**
 * EventBus class that manages event subscriptions and publishing
 */
export class EventBus {
  private static instance: EventBus;
  private subscriptions: Map<string, Set<SubscriptionInfo>>;
  private logger: Console;
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.subscriptions = new Map<string, Set<SubscriptionInfo>>();
    this.logger = console;
  }
  
  /**
   * Get the singleton instance of the EventBus
   * @returns The EventBus instance
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }
  
  /**
   * Subscribe to an event type
   * 
   * @param eventType The type of event to subscribe to
   * @param callback Function to be called when the event is triggered
   * @param options Subscription options (priority, once, etc.)
   * @returns Subscription object that can be used to unsubscribe
   */
  public subscribe<T>(
    eventType: string,
    callback: (data: T) => void | Promise<void>,
    options: SubscriptionOptions = {}
  ): Subscription {
    // Get or create the set of subscriptions for this event type
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, new Set<SubscriptionInfo>());
    }
    
    const subscriptionSet = this.subscriptions.get(eventType)!;
    
    // Create the subscription
    const subscription = createSubscription(
      eventType,
      this.unsubscribe.bind(this),
      options.id
    );
    
    // Store the subscription info
    const subscriptionInfo: SubscriptionInfo<T> = {
      eventType,
      callback,
      options: {
        priority: options.priority || 0,
        once: options.once || false,
        id: subscription.id,
        async: options.async !== false // Default to true
      },
      subscription
    };
    
    subscriptionSet.add(subscriptionInfo);
    
    // Log subscription if in debug mode
    this.logger.debug?.(`Subscribed to event: ${eventType} (ID: ${subscription.id})`);
    
    return subscription;
  }
  
  /**
   * Publish an event to all subscribers
   * 
   * @param eventType The type of event to publish
   * @param data The event data to be passed to subscribers
   * @returns Promise that resolves when all subscribers have processed the event
   */
  public async publish<T>(eventType: string, data: T): Promise<void> {
    const subscribers = this.subscriptions.get(eventType);
    
    if (!subscribers || subscribers.size === 0) {
      this.logger.debug?.(`No subscribers for event: ${eventType}`);
      return;
    }
    
    this.logger.debug?.(`Publishing event: ${eventType} to ${subscribers.size} subscribers`);
    
    // Sort subscribers by priority (higher numbers first)
    const sortedSubscribers = Array.from(subscribers)
      .sort((a, b) => (b.options.priority || 0) - (a.options.priority || 0));
    
    // Track subscriptions to remove (for 'once' subscriptions)
    const toRemove: Subscription[] = [];
    
    // Execute callbacks
    await Promise.all(
      sortedSubscribers.map(async (sub) => {
        try {
          // Execute the callback
          if (sub.options.async) {
            await Promise.resolve(sub.callback(data));
          } else {
            sub.callback(data);
          }
          
          // Handle 'once' subscriptions
          if (sub.options.once) {
            toRemove.push(sub.subscription);
          }
        } catch (error) {
          // Log error but don't stop propagation
          this.logger.error(`Error in event handler for ${eventType}:`, error);
          
          // Publish error event
          if (eventType !== CoreEventTypes.SYSTEM_ERROR) {
            await this.publish(CoreEventTypes.SYSTEM_ERROR, {
              message: `Error in event handler for ${eventType}`,
              error,
              eventType,
              data
            });
          }
        }
      })
    );
    
    // Remove 'once' subscriptions
    for (const subscription of toRemove) {
      this.unsubscribe(subscription);
    }
  }
  
  /**
   * Unsubscribe from an event
   * 
   * @param subscription The subscription to cancel
   */
  public unsubscribe(subscription: Subscription): void {
    const { eventType, id } = subscription;
    const subscribers = this.subscriptions.get(eventType);
    
    if (!subscribers) {
      return;
    }
    
    // Find and remove the subscription
    for (const sub of subscribers) {
      if (sub.subscription.id === id) {
        // Mark the subscription as inactive
        // This is needed because the subscription object is passed by reference
        // and we need to update its state
        if (sub.subscription.active) {
          // Use any to access the private property
          (sub.subscription as any)._active = false;
        }
        
        subscribers.delete(sub);
        this.logger.debug?.(`Unsubscribed from event: ${eventType} (ID: ${id})`);
        break;
      }
    }
    
    // Clean up empty subscription sets
    if (subscribers.size === 0) {
      this.subscriptions.delete(eventType);
    }
  }
  
  /**
   * Check if an event type has subscribers
   * 
   * @param eventType The event type to check
   * @returns True if the event has subscribers
   */
  public hasSubscribers(eventType: string): boolean {
    const subscribers = this.subscriptions.get(eventType);
    return !!subscribers && subscribers.size > 0;
  }
  
  /**
   * Get the number of subscribers for an event type
   * 
   * @param eventType The event type to check
   * @returns The number of subscribers
   */
  public getSubscriberCount(eventType: string): number {
    const subscribers = this.subscriptions.get(eventType);
    return subscribers ? subscribers.size : 0;
  }
  
  /**
   * Remove all subscriptions for a specific event type
   * 
   * @param eventType The event type to clear subscriptions for
   */
  public clearEventSubscriptions(eventType: string): void {
    this.subscriptions.delete(eventType);
    this.logger.debug?.(`Cleared all subscriptions for event: ${eventType}`);
  }
  
  /**
   * Remove all subscriptions
   */
  public clearAllSubscriptions(): void {
    this.subscriptions.clear();
    this.logger.debug?.('Cleared all event subscriptions');
  }
  
  /**
   * Set a custom logger for the EventBus
   * 
   * @param logger The logger to use
   */
  public setLogger(logger: Console): void {
    this.logger = logger;
  }
}

/**
 * Get the singleton instance of the EventBus
 * @returns The EventBus instance
 */
export function getEventBus(): EventBus {
  return EventBus.getInstance();
}

export default {
  getEventBus
};
