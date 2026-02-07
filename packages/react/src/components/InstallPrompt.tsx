/**
 * InstallPrompt Component
 *
 * PWA install prompt component for web applications.
 * Handles beforeinstallprompt event and iOS-specific instructions.
 *
 * Features:
 * - Cross-browser install prompt handling
 * - iOS-specific installation instructions
 * - Standalone mode detection
 * - Customizable UI via render props
 * - Headless hook export
 */

'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';

// ============================================================================
// Types
// ============================================================================

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface InstallPromptState {
  /** Whether the app can be installed */
  canInstall: boolean;
  /** Whether the app is already installed (standalone mode) */
  isInstalled: boolean;
  /** Whether on iOS */
  isIOS: boolean;
  /** Trigger the install prompt (Chrome/Edge) */
  install: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
  /** Dismiss the install prompt */
  dismiss: () => void;
}

export interface InstallPromptProps {
  /** Render when app is already installed */
  renderInstalled?: () => ReactNode;
  /** Render install prompt (receives install function) */
  renderPrompt?: (state: InstallPromptState) => ReactNode;
  /** Render iOS-specific instructions */
  renderIOSInstructions?: () => ReactNode;
  /** Only show when install is available */
  showOnlyWhenInstallable?: boolean;
  /** CSS class for container */
  className?: string;
}

// ============================================================================
// useInstallPrompt Hook
// ============================================================================

/**
 * Hook for managing PWA install prompt
 */
export function useInstallPrompt(): InstallPromptState {
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(iOS);

    // Detect standalone mode (already installed)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(standalone);

    // For iOS, show instructions even if can't trigger prompt
    if (iOS && !standalone) {
      setCanInstall(true);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferredPrompt) {
      return 'unavailable';
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setCanInstall(false);
    }

    return outcome;
  }, [deferredPrompt]);

  const dismiss = useCallback(() => {
    setCanInstall(false);
    setDeferredPrompt(null);
  }, []);

  return {
    canInstall,
    isInstalled,
    isIOS,
    install,
    dismiss,
  };
}

// ============================================================================
// InstallPrompt Component
// ============================================================================

/**
 * PWA install prompt component
 */
export function InstallPrompt({
  renderInstalled,
  renderPrompt,
  renderIOSInstructions,
  showOnlyWhenInstallable = true,
  className,
}: InstallPromptProps): ReactNode {
  const state = useInstallPrompt();

  // Don't render if already installed
  if (state.isInstalled) {
    return renderInstalled?.() || null;
  }

  // Don't render if not installable and only showing when installable
  if (showOnlyWhenInstallable && !state.canInstall) {
    return null;
  }

  // Custom render for iOS
  if (state.isIOS) {
    if (renderIOSInstructions) {
      return renderIOSInstructions();
    }

    return (
      <div className={className} role="region" aria-label="Install app instructions">
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Install App
        </h3>
        <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          To install this app on your iOS device:
        </p>
        <ol style={{ fontSize: '0.875rem', paddingLeft: '1.5rem', listStyleType: 'decimal' }}>
          <li>Tap the share button in Safari</li>
          <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
          <li>Tap &quot;Add&quot; to confirm</li>
        </ol>
      </div>
    );
  }

  // Custom render for install prompt
  if (renderPrompt) {
    return renderPrompt(state);
  }

  // Default install prompt
  if (!state.canInstall) {
    return null;
  }

  return (
    <div className={className} role="region" aria-label="Install app prompt">
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
        Install App
      </h3>
      <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
        Install this app on your device for a better experience.
      </p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => state.install()}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#0d9488',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
          aria-label="Install application"
        >
          Add to Home Screen
        </button>
        <button
          onClick={state.dismiss}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'transparent',
            color: '#6b7280',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
          aria-label="Dismiss install prompt"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Type declarations for global events
// ============================================================================

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }
}

export default InstallPrompt;
