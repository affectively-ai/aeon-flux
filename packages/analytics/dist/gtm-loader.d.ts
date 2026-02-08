/**
 * GTM Script Loader
 *
 * Injects Google Tag Manager script and noscript iframe.
 * Handles async loading and ensures proper initialization order.
 */
import type { GTMConfig } from './types';
/**
 * Inject GTM script into document head
 */
export declare function injectGTM(config: GTMConfig): boolean;
/**
 * Inject GTM noscript iframe into document body
 * For tracking when JavaScript is disabled
 */
export declare function injectGTMNoScript(containerId: string): boolean;
/**
 * Initialize GTM with full configuration
 */
export declare function initializeGTM(config: GTMConfig): boolean;
/**
 * Generate GTM script tag for SSR
 * Returns HTML string to inject into <head>
 */
export declare function generateGTMScriptTag(config: GTMConfig): string;
/**
 * Generate GTM noscript tag for SSR
 * Returns HTML string to inject at start of <body>
 */
export declare function generateGTMNoScriptTag(containerId: string): string;
/**
 * Generate dataLayer initialization script for SSR
 * Use this before GTM script to pre-populate data
 */
export declare function generateDataLayerScript(initialData: Record<string, unknown>, dataLayerName?: string): string;
/**
 * Check if GTM has been injected
 */
export declare function isGTMInjected(): boolean;
/**
 * Check if GTM is loaded and ready
 */
export declare function isGTMReady(): boolean;
/**
 * Wait for GTM to be ready
 */
export declare function waitForGTM(timeout?: number): Promise<boolean>;
/**
 * Reset GTM injection state (for testing only)
 */
export declare function resetGTMState(): void;
