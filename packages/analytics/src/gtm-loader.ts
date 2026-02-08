/**
 * GTM Script Loader
 *
 * Injects Google Tag Manager script and noscript iframe.
 * Handles async loading and ensures proper initialization order.
 */

import type { GTMConfig } from './types';
import { ensureDataLayer } from './data-layer';

// ============================================================================
// GTM Script Injection
// ============================================================================

/** Track if GTM has been injected */
let gtmInjected = false;

/**
 * Generate GTM script inline code
 */
function generateGTMScript(containerId: string, dataLayerName: string): string {
  return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','${dataLayerName}','${containerId}');`;
}

/**
 * Validate GTM container ID format
 */
function validateContainerId(containerId: string): boolean {
  // GTM container ID format: GTM-XXXXXX (6-8 alphanumeric characters)
  return /^GTM-[A-Z0-9]{6,8}$/i.test(containerId);
}

/**
 * Inject GTM script into document head
 */
export function injectGTM(config: GTMConfig): boolean {
  // Prevent double injection
  if (gtmInjected) {
    console.warn('[Aeon Analytics] GTM already injected');
    return false;
  }

  // Validate container ID
  if (!validateContainerId(config.containerId)) {
    console.error(
      `[Aeon Analytics] Invalid GTM container ID: ${config.containerId}. ` +
      'Expected format: GTM-XXXXXX'
    );
    return false;
  }

  // Ensure dataLayer exists before GTM loads
  const dataLayerName = config.dataLayerName || 'dataLayer';
  ensureDataLayer(dataLayerName);

  // Create and inject script element
  const script = document.createElement('script');
  script.innerHTML = generateGTMScript(config.containerId, dataLayerName);

  // Insert at beginning of head for earliest execution
  if (document.head.firstChild) {
    document.head.insertBefore(script, document.head.firstChild);
  } else {
    document.head.appendChild(script);
  }

  gtmInjected = true;
  return true;
}

/**
 * Inject GTM noscript iframe into document body
 * For tracking when JavaScript is disabled
 */
export function injectGTMNoScript(containerId: string): boolean {
  // Validate container ID
  if (!validateContainerId(containerId)) {
    return false;
  }

  // Check if noscript already exists
  const existingNoscript = document.querySelector(
    `noscript iframe[src*="googletagmanager.com/ns.html?id=${containerId}"]`
  );
  if (existingNoscript) {
    return false;
  }

  // Create noscript element with iframe
  const noscript = document.createElement('noscript');
  const iframe = document.createElement('iframe');

  iframe.src = `https://www.googletagmanager.com/ns.html?id=${containerId}`;
  iframe.height = '0';
  iframe.width = '0';
  iframe.style.display = 'none';
  iframe.style.visibility = 'hidden';

  noscript.appendChild(iframe);

  // Insert at beginning of body
  if (document.body.firstChild) {
    document.body.insertBefore(noscript, document.body.firstChild);
  } else {
    document.body.appendChild(noscript);
  }

  return true;
}

/**
 * Initialize GTM with full configuration
 */
export function initializeGTM(config: GTMConfig): boolean {
  const scriptInjected = injectGTM(config);

  // Only inject noscript if script was successfully injected
  if (scriptInjected) {
    injectGTMNoScript(config.containerId);
  }

  return scriptInjected;
}

// ============================================================================
// Server-Side Rendering Helpers
// ============================================================================

/**
 * Generate GTM script tag for SSR
 * Returns HTML string to inject into <head>
 */
export function generateGTMScriptTag(config: GTMConfig): string {
  if (!validateContainerId(config.containerId)) {
    return '';
  }

  const dataLayerName = config.dataLayerName || 'dataLayer';

  return `<script>${generateGTMScript(config.containerId, dataLayerName)}</script>`;
}

/**
 * Generate GTM noscript tag for SSR
 * Returns HTML string to inject at start of <body>
 */
export function generateGTMNoScriptTag(containerId: string): string {
  if (!validateContainerId(containerId)) {
    return '';
  }

  return `<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${containerId}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`;
}

/**
 * Generate dataLayer initialization script for SSR
 * Use this before GTM script to pre-populate data
 */
export function generateDataLayerScript(
  initialData: Record<string, unknown>,
  dataLayerName = 'dataLayer'
): string {
  const dataJson = JSON.stringify(initialData);
  return `<script>window.${dataLayerName}=window.${dataLayerName}||[];window.${dataLayerName}.push(${dataJson});</script>`;
}

// ============================================================================
// Status Helpers
// ============================================================================

/**
 * Check if GTM has been injected
 */
export function isGTMInjected(): boolean {
  return gtmInjected;
}

/**
 * Check if GTM is loaded and ready
 */
export function isGTMReady(): boolean {
  if (!gtmInjected) return false;

  // Check for gtm.js event in dataLayer
  const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer;
  if (!dataLayer) return false;

  return dataLayer.some(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      (item as Record<string, unknown>).event === 'gtm.js'
  );
}

/**
 * Wait for GTM to be ready
 */
export function waitForGTM(timeout = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    if (isGTMReady()) {
      resolve(true);
      return;
    }

    const startTime = Date.now();

    const check = () => {
      if (isGTMReady()) {
        resolve(true);
        return;
      }

      if (Date.now() - startTime > timeout) {
        resolve(false);
        return;
      }

      requestAnimationFrame(check);
    };

    check();
  });
}

// ============================================================================
// Reset (for testing)
// ============================================================================

/**
 * Reset GTM injection state (for testing only)
 */
export function resetGTMState(): void {
  gtmInjected = false;
}
