/**
 * Subscription.ts
 * 
 * Defines the subscription interface and implementation for the event system.
 * Subscriptions represent active listeners to specific event types and provide
 * methods for managing the subscription lifecycle.
 */

/**
 * Options for configuring a subscription
 */
export interface SubscriptionOptions {
  /**
   * Priority of the subscription (higher numbers execute first)
   * Default: 0
   */
  priority?: number;
  
  /**
   * Whether the subscription should be automatically removed after first execution
   * Default: false
   */
  once?: boolean;
  
  /**
   * Optional identifier for the subscription
   */
  id?: string;
  
  /**
   * Whether to execute the callback asynchronously
   * Default: true
   */
  async?: boolean;
}

/**
 * Information about a subscription stored internally by the EventBus
 */
export interface SubscriptionInfo<T = any> {
  /**
   * The event type this subscription is for
   */
  eventType: string;
  
  /**
   * The callback function to execute when the event is triggered
   */
  callback: (data: T) => void | Promise<void>;
  
  /**
   * Options for this subscription
   */
  options: SubscriptionOptions;
  
  /**
   * Reference to the subscription object returned to the subscriber
   */
  subscription: Subscription;
}

/**
 * Public interface for a subscription
 */
export interface Subscription {
  /**
   * The event type this subscription is for
   */
  readonly eventType: string;
  
  /**
   * Whether this subscription is still active
   */
  readonly active: boolean;
  
  /**
   * Unique identifier for this subscription
   */
  readonly id: string;
  
  /**
   * Cancel this subscription
   */
  unsubscribe(): void;
}

/**
 * Implementation of the Subscription interface
 */
export class SubscriptionImpl implements Subscription {
  private _active: boolean = true;
  private readonly _id: string;
  
  /**
   * Creates a new subscription
   * 
   * @param eventType The event type this subscription is for
   * @param unsubscribeFn Function to call when unsubscribing
   * @param id Optional identifier for the subscription
   */
  constructor(
    private readonly _eventType: string,
    private readonly _unsubscribeFn: (subscription: Subscription) => void,
    id?: string
  ) {
    this._id = id || this.generateId();
  }
  
  /**
   * The event type this subscription is for
   */
  get eventType(): string {
    return this._eventType;
  }
  
  /**
   * Whether this subscription is still active
   */
  get active(): boolean {
    return this._active;
  }
  
  /**
   * Unique identifier for this subscription
   */
  get id(): string {
    return this._id;
  }
  
  /**
   * Cancel this subscription
   */
  unsubscribe(): void {
    if (this._active) {
      // Call the unsubscribe function first
      this._unsubscribeFn(this);
      // Then mark as inactive
      this._active = false;
    }
  }
  
  /**
   * Generate a unique ID for this subscription
   */
  private generateId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Factory function to create a new subscription
 * 
 * @param eventType The event type this subscription is for
 * @param unsubscribeFn Function to call when unsubscribing
 * @param id Optional identifier for the subscription
 * @returns A new subscription instance
 */
export function createSubscription(
  eventType: string,
  unsubscribeFn: (subscription: Subscription) => void,
  id?: string
): Subscription {
  return new SubscriptionImpl(eventType, unsubscribeFn, id);
}

export default {
  createSubscription
};
