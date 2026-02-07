/**
 * PushNotifications Component
 *
 * Push notification management component for PWA applications.
 * Handles subscription, permission, and notification sending.
 *
 * Features:
 * - VAPID-based push subscription
 * - Permission handling
 * - Subscription serialization
 * - Customizable UI via render props
 * - Headless hook export
 */
import { type ReactNode } from 'react';
export interface PushSubscriptionData {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}
export interface PushNotificationState {
    /** Whether push is supported */
    isSupported: boolean;
    /** Current permission state */
    permission: NotificationPermission | 'unsupported';
    /** Current subscription (if subscribed) */
    subscription: PushSubscriptionData | null;
    /** Whether currently loading */
    isLoading: boolean;
    /** Last error message */
    error: string | null;
    /** Subscribe to push notifications */
    subscribe: () => Promise<PushSubscriptionData | null>;
    /** Unsubscribe from push notifications */
    unsubscribe: () => Promise<boolean>;
    /** Request permission */
    requestPermission: () => Promise<NotificationPermission>;
    /** Clear error */
    clearError: () => void;
}
export interface PushNotificationsProps {
    /** VAPID public key */
    vapidPublicKey?: string;
    /** Called when subscription changes */
    onSubscribe?: (subscription: PushSubscriptionData) => Promise<void> | void;
    /** Called when unsubscribing */
    onUnsubscribe?: (endpoint: string) => Promise<void> | void;
    /** Custom render function */
    render?: (state: PushNotificationState) => ReactNode;
    /** Show default UI */
    showUI?: boolean;
    /** CSS class for container */
    className?: string;
}
export interface UsePushNotificationsConfig {
    /** VAPID public key */
    vapidPublicKey?: string;
    /** Service worker URL */
    serviceWorkerUrl?: string;
}
/**
 * Hook for managing push notifications
 */
export declare function usePushNotifications(config?: UsePushNotificationsConfig): PushNotificationState;
/**
 * Push notifications management component
 */
export declare function PushNotifications({ vapidPublicKey, onSubscribe, onUnsubscribe, render, showUI, className, }: PushNotificationsProps): ReactNode;
export default PushNotifications;
