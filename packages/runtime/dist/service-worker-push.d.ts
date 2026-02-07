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
    onNotificationClick?: (data: PushNotificationData['data']) => string | undefined;
}
/**
 * Handle incoming push event
 */
export declare function handlePush(event: PushEvent, config?: PushHandlerConfig): void;
/**
 * Handle notification click event
 */
export declare function handleNotificationClick(event: NotificationEvent, config?: PushHandlerConfig): void;
/**
 * Handle notification close event
 */
export declare function handleNotificationClose(event: NotificationEvent): void;
/**
 * Handle background sync event for offline queue
 */
export declare function handleSync(event: ExtendableEvent, tag: string): void;
export interface ServiceWorkerMessage {
    type: string;
    payload?: unknown;
}
/**
 * Handle messages from main thread
 */
export declare function handleMessage(event: ExtendableMessageEvent, handlers: Record<string, (payload: unknown) => Promise<unknown> | unknown>): void;
/**
 * Register push event handlers in service worker
 */
export declare function registerPushHandlers(sw: ServiceWorkerGlobalScope, config?: PushHandlerConfig): void;
/**
 * Register sync handlers in service worker
 */
export declare function registerSyncHandlers(sw: ServiceWorkerGlobalScope): void;
/**
 * Register message handlers in service worker
 */
export declare function registerMessageHandlers(sw: ServiceWorkerGlobalScope, handlers: Record<string, (payload: unknown) => Promise<unknown> | unknown>): void;
/**
 * Convert VAPID public key from base64url to Uint8Array
 */
export declare function urlBase64ToUint8Array(base64String: string): Uint8Array;
/**
 * Serialize push subscription for sending to server
 */
export declare function serializePushSubscription(subscription: PushSubscription): {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
};
