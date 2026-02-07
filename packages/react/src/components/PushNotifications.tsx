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

'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert VAPID key from base64url to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
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
 * Serialize PushSubscription for server
 */
function serializeSubscription(sub: PushSubscription): PushSubscriptionData {
  const p256dh = sub.getKey('p256dh');
  const auth = sub.getKey('auth');

  return {
    endpoint: sub.endpoint,
    keys: {
      p256dh: p256dh
        ? btoa(String.fromCharCode(...new Uint8Array(p256dh)))
        : '',
      auth: auth
        ? btoa(String.fromCharCode(...new Uint8Array(auth)))
        : '',
    },
  };
}

// ============================================================================
// usePushNotifications Hook
// ============================================================================

export interface UsePushNotificationsConfig {
  /** VAPID public key */
  vapidPublicKey?: string;
  /** Service worker URL */
  serviceWorkerUrl?: string;
}

/**
 * Hook for managing push notifications
 */
export function usePushNotifications(
  config: UsePushNotificationsConfig = {}
): PushNotificationState {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [subscription, setSubscription] = useState<PushSubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { vapidPublicKey, serviceWorkerUrl = '/sw.js' } = config;

  // Check support and load existing subscription
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (!supported) {
      setPermission('unsupported');
      return;
    }

    // Check current permission
    setPermission(Notification.permission);

    // Load existing subscription
    navigator.serviceWorker.ready.then(async (registration) => {
      try {
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          setSubscription(serializeSubscription(existingSub));
        }
      } catch (err) {
        console.error('Error loading push subscription:', err);
      }
    });
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return 'denied';
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<PushSubscriptionData | null> => {
    if (!isSupported) {
      setError('Push notifications are not supported');
      return null;
    }

    if (!vapidPublicKey) {
      setError('VAPID public key is required');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Ensure service worker is registered
      let registration: ServiceWorkerRegistration;

      try {
        registration = await navigator.serviceWorker.ready;
      } catch {
        // Try to register if not ready
        registration = await navigator.serviceWorker.register(serviceWorkerUrl, {
          scope: '/',
        });
      }

      // Request permission if needed
      if (Notification.permission === 'default') {
        const perm = await Notification.requestPermission();
        setPermission(perm);

        if (perm !== 'granted') {
          throw new Error('Notification permission denied');
        }
      } else if (Notification.permission !== 'granted') {
        throw new Error('Notification permission not granted');
      }

      // Subscribe to push
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      const serialized = serializeSubscription(sub);
      setSubscription(serialized);

      return serialized;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to subscribe';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, vapidPublicKey, serviceWorkerUrl]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();

      if (sub) {
        await sub.unsubscribe();
      }

      setSubscription(null);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unsubscribe';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isSupported,
    permission,
    subscription,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    requestPermission,
    clearError,
  };
}

// ============================================================================
// PushNotifications Component
// ============================================================================

/**
 * Push notifications management component
 */
export function PushNotifications({
  vapidPublicKey,
  onSubscribe,
  onUnsubscribe,
  render,
  showUI = true,
  className,
}: PushNotificationsProps): ReactNode {
  const state = usePushNotifications({ vapidPublicKey });

  const handleSubscribe = async () => {
    const sub = await state.subscribe();
    if (sub && onSubscribe) {
      await onSubscribe(sub);
    }
  };

  const handleUnsubscribe = async () => {
    const endpoint = state.subscription?.endpoint;
    const success = await state.unsubscribe();
    if (success && endpoint && onUnsubscribe) {
      await onUnsubscribe(endpoint);
    }
  };

  // Custom render
  if (render) {
    return render(state);
  }

  // Don't show UI if not requested
  if (!showUI) {
    return null;
  }

  // Not supported message
  if (!state.isSupported) {
    return (
      <div className={className} role="region" aria-label="Push notifications">
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Push notifications are not supported in this browser.
        </p>
      </div>
    );
  }

  return (
    <div className={className} role="region" aria-label="Push notifications">
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        Push Notifications
      </h3>

      {state.error && (
        <div
          style={{
            padding: '0.75rem',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.375rem',
            color: '#dc2626',
            fontSize: '0.875rem',
            marginBottom: '1rem',
          }}
          role="alert"
        >
          {state.error}
          <button
            onClick={state.clearError}
            style={{
              marginLeft: '0.5rem',
              color: '#dc2626',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {state.subscription ? (
        <div>
          <p style={{ color: '#10b981', fontSize: '0.875rem', marginBottom: '1rem' }}>
            ✓ You are subscribed to push notifications.
          </p>
          <button
            onClick={handleUnsubscribe}
            disabled={state.isLoading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: state.isLoading ? 'not-allowed' : 'pointer',
              opacity: state.isLoading ? 0.5 : 1,
              fontSize: '0.875rem',
            }}
            aria-label="Unsubscribe from push notifications"
          >
            {state.isLoading ? 'Unsubscribing...' : 'Unsubscribe'}
          </button>
        </div>
      ) : (
        <div>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
            You are not subscribed to push notifications.
          </p>
          <button
            onClick={handleSubscribe}
            disabled={state.isLoading || !vapidPublicKey}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#0d9488',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: state.isLoading || !vapidPublicKey ? 'not-allowed' : 'pointer',
              opacity: state.isLoading || !vapidPublicKey ? 0.5 : 1,
              fontSize: '0.875rem',
            }}
            aria-label="Subscribe to push notifications"
          >
            {state.isLoading ? 'Subscribing...' : 'Subscribe'}
          </button>
          {!vapidPublicKey && (
            <p style={{ color: '#f59e0b', fontSize: '0.75rem', marginTop: '0.5rem' }}>
              VAPID public key is required for push notifications.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default PushNotifications;
