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
import { type ReactNode } from 'react';
interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
    }>;
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
/**
 * Hook for managing PWA install prompt
 */
export declare function useInstallPrompt(): InstallPromptState;
/**
 * PWA install prompt component
 */
export declare function InstallPrompt({ renderInstalled, renderPrompt, renderIOSInstructions, showOnlyWhenInstallable, className, }: InstallPromptProps): ReactNode;
declare global {
    interface WindowEventMap {
        beforeinstallprompt: BeforeInstallPromptEvent;
        appinstalled: Event;
    }
}
export default InstallPrompt;
