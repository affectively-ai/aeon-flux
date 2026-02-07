/**
 * Aeon Service Worker - Total Preload Strategy
 *
 * The Aeon architecture is recursive:
 * - This service worker caches the ENTIRE site as an Aeon
 * - Each page session is an Aeon entity within the site Aeon
 * - Federation would cache multiple sites as Aeons of Aeons
 *
 * With 8.4KB framework + ~2-5KB per page session, we can preload EVERYTHING.
 * A site with 100 pages = ~315KB total (smaller than one hero image!)
 */
export {};
