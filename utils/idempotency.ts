// Idempotency guard for purchase events
interface PurchaseEvent {
  productId: string;
  amount: number;
  timestamp: number;
}

let lastPurchaseEvent: PurchaseEvent | null = null;
const IDEMPOTENCY_WINDOW_MS = 5000; // 5 seconds

/**
 * Check if a purchase event is a duplicate within the idempotency window
 */
export function isDuplicatePurchase(productId: string, amount: number): boolean {
  const now = Date.now();
  
  if (!lastPurchaseEvent) {
    return false;
  }
  
  const timeDiff = now - lastPurchaseEvent.timestamp;
  const isSameEvent = lastPurchaseEvent.productId === productId && lastPurchaseEvent.amount === amount;
  const isWithinWindow = timeDiff < IDEMPOTENCY_WINDOW_MS;
  
  return isSameEvent && isWithinWindow;
}

/**
 * Record a purchase event for idempotency checking
 */
export function recordPurchaseEvent(productId: string, amount: number): void {
  lastPurchaseEvent = {
    productId,
    amount,
    timestamp: Date.now(),
  };
}

/**
 * Clear the last purchase event (useful for testing or manual reset)
 */
export function clearLastPurchaseEvent(): void {
  lastPurchaseEvent = null;
}
