/**
 * Skeleton Hydration - Client-Side Swap
 *
 * Handles the smooth transition from skeleton to real content.
 * Designed to be inlined in <head> for instant execution.
 */
/** Skeleton swap options */
export interface SkeletonSwapOptions {
    /** Enable cross-fade animation */
    fade?: boolean;
    /** Fade duration in milliseconds */
    duration?: number;
    /** Callback when swap completes */
    onComplete?: () => void;
}
/**
 * Initialize skeleton system
 * Called immediately in <head> before body renders
 */
export declare function initSkeleton(): void;
/**
 * Swap skeleton with real content
 * Called when content is ready to render
 */
export declare function swapToContent(options?: SkeletonSwapOptions): void;
/**
 * Check if skeleton is still visible
 */
export declare function isSkeletonVisible(): boolean;
/**
 * Generate minified inline init script for <head>
 * This script executes before body renders, ensuring skeleton shows first
 */
export declare function generateSkeletonInitScript(): string;
/**
 * Generate the complete HTML structure for skeleton-first rendering
 */
export declare function generateSkeletonPageStructure(options: {
    title: string;
    description?: string;
    skeletonHtml: string;
    skeletonCss: string;
    contentHtml: string;
    contentCss: string;
    headExtra?: string;
    bodyExtra?: string;
}): string;
/**
 * Generate skeleton swap script for async content loading
 * Use this when content loads after initial page render
 */
export declare function generateAsyncSwapScript(): string;
declare global {
    interface Window {
        __AEON_SKELETON__?: {
            swap: (options?: SkeletonSwapOptions) => void;
            isVisible: () => boolean;
            done: boolean;
        };
    }
}
