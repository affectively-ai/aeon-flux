/**
 * Aeon Pages Service Worker Push Handler
 *
 * Optional push notification handler for service workers.
 * Only loaded when push feature is enabled.
 *
 * Features:
 * - Push event handling with notification display
 * - Notification click handling with navigation
 * - Background sync integration
 * - Badge updates
 */

// ============================================================================
// Types
// ============================================================================

export interface PushNotificationData {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    action?: string;
    [key: string]: unknown;
  };
  requireInteraction?: boolean;
  vibrate?: number[];
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export interface PushHandlerConfig {
  defaultIcon?: string;
  defaultBadge?: string;
  defaultVibrate?: number[];
  onNotificationClick?: (
    data: PushNotificationData['data'],
  ) => string | undefined;
}

// ============================================================================
// Push Event Handler
// ============================================================================

/**
 * Handle incoming push event
 */
export function handlePush(
  event: PushEvent,
  config: PushHandlerConfig = {},
): void {
  if (!event.data) {
    console.warn('[AeonSW] Push event received with no data');
    return;
  }

  let data: PushNotificationData;

  try {
    data = event.data.json() as PushNotificationData;
  } catch {
    // If not JSON, treat as plain text
    data = {
      title: 'Notification',
      body: event.data.text(),
    };
  }

  // Extended notification options with vibrate (not in all type definitions)
  const notificationOptions = {
    body: data.body,
    icon: data.icon || config.defaultIcon,
    badge: data.badge || config.defaultBadge,
    tag: data.tag || 'aeon-notification',
    data: data.data,
    requireInteraction: data.requireInteraction || false,
    vibrate: data.vibrate || config.defaultVibrate || [200, 100, 200],
    actions: data.actions,
  } as NotificationOptions;

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions),
  );
}

/**
 * Handle notification click event
 */
export function handleNotificationClick(
  event: NotificationEvent,
  config: PushHandlerConfig = {},
): void {
  event.notification.close();

  const data = event.notification.data as PushNotificationData['data'];
  let targetUrl = '/';

  // Check for action-specific URL
  if (event.action && data?.action) {
    // Handle specific action
    targetUrl = data.action;
  } else if (data?.url) {
    targetUrl = data.url;
  } else if (config.onNotificationClick) {
    const customUrl = config.onNotificationClick(data);
    if (customUrl) {
      targetUrl = customUrl;
    }
  }

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(async (clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if ('focus' in client && client.url.includes(self.location.origin)) {
            const focusedClient = await client.focus();
            if ('navigate' in focusedClient) {
              await (focusedClient as WindowClient).navigate(targetUrl);
            }
            return;
          }
        }

        // Open a new window if no existing window found
        if (clients.openWindow) {
          await clients.openWindow(targetUrl);
        }
      }),
  );
}

/**
 * Handle notification close event
 */
export function handleNotificationClose(event: NotificationEvent): void {
  // Analytics or cleanup can be done here
  console.debug('[AeonSW] Notification closed:', event.notification.tag);
}

// ============================================================================
// Background Sync Handler
// ============================================================================

/**
 * Handle background sync event for offline queue
 */
export function handleSync(event: ExtendableEvent, tag: string): void {
  if (tag === 'aeon-offline-sync') {
    event.waitUntil(syncOfflineQueue());
  }
}

/**
 * Sync offline queue with server
 */
async function syncOfflineQueue(): Promise<void> {
  // This would be implemented to read from IndexedDB and sync
  // For now, we'll post a message to any listening clients
  const clientList = await clients.matchAll({ type: 'window' });

  for (const client of clientList) {
    client.postMessage({
      type: 'SYNC_OFFLINE_QUEUE',
      timestamp: Date.now(),
    });
  }
}

// ============================================================================
// Message Handler
// ============================================================================

export interface ServiceWorkerMessage {
  type: string;
  payload?: unknown;
}

/**
 * Handle messages from main thread
 */
export function handleMessage(
  event: ExtendableMessageEvent,
  handlers: Record<string, (payload: unknown) => Promise<unknown> | unknown>,
): void {
  const message = event.data as ServiceWorkerMessage;

  if (!message || !message.type) {
    return;
  }

  const handler = handlers[message.type];
  if (handler) {
    const result = handler(message.payload);

    // If handler returns a promise, send response when resolved
    if (result instanceof Promise) {
      event.waitUntil(
        result.then((response) => {
          if (event.source && 'postMessage' in event.source) {
            (event.source as Client).postMessage({
              type: `${message.type}_RESPONSE`,
              payload: response,
            });
          }
        }),
      );
    }
  }
}

// ============================================================================
// Service Worker Registration Helpers
// ============================================================================

/**
 * Register push event handlers in service worker
 */
export function registerPushHandlers(
  sw: ServiceWorkerGlobalScope,
  config: PushHandlerConfig = {},
): void {
  sw.addEventListener('push', (event) => {
    handlePush(event, config);
  });

  sw.addEventListener('notificationclick', (event) => {
    handleNotificationClick(event, config);
  });

  sw.addEventListener('notificationclose', (event) => {
    handleNotificationClose(event);
  });
}

/**
 * Register sync handlers in service worker
 */
export function registerSyncHandlers(sw: ServiceWorkerGlobalScope): void {
  sw.addEventListener('sync', (event: Event) => {
    const syncEvent = event as ExtendableEvent & { tag: string };
    handleSync(syncEvent, syncEvent.tag);
  });
}

/**
 * Register message handlers in service worker
 */
export function registerMessageHandlers(
  sw: ServiceWorkerGlobalScope,
  handlers: Record<string, (payload: unknown) => Promise<unknown> | unknown>,
): void {
  sw.addEventListener('message', (event) => {
    handleMessage(event, handlers);
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert VAPID public key from base64url to Uint8Array
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Serialize push subscription for sending to server
 */
export function serializePushSubscription(subscription: PushSubscription): {
  endpoint: string;
  keys: { p256dh: string; auth: string };
} {
  const p256dh = subscription.getKey('p256dh');
  const auth = subscription.getKey('auth');

  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: p256dh
        ? btoa(
            String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dh))),
          )
        : '',
      auth: auth
        ? btoa(
            String.fromCharCode.apply(null, Array.from(new Uint8Array(auth))),
          )
        : '',
    },
  };
}

// ============================================================================
// Type declarations for ServiceWorker context
// ============================================================================

declare const self: ServiceWorkerGlobalScope;
declare const clients: Clients;
