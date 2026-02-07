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

/** Skeleton state for the current page */
interface SkeletonState {
  skeletonRoot: HTMLElement | null;
  contentRoot: HTMLElement | null;
  swapped: boolean;
}

const state: SkeletonState = {
  skeletonRoot: null,
  contentRoot: null,
  swapped: false,
};

/**
 * Initialize skeleton system
 * Called immediately in <head> before body renders
 */
export function initSkeleton(): void {
  // Find skeleton and content containers
  state.skeletonRoot = document.getElementById('aeon-skeleton');
  state.contentRoot = document.getElementById('root');

  if (!state.skeletonRoot || !state.contentRoot) {
    return;
  }

  // Hide content, show skeleton
  state.contentRoot.style.display = 'none';
  state.skeletonRoot.style.display = 'block';
}

/**
 * Swap skeleton with real content
 * Called when content is ready to render
 */
export function swapToContent(options: SkeletonSwapOptions = {}): void {
  if (state.swapped || !state.skeletonRoot || !state.contentRoot) {
    options.onComplete?.();
    return;
  }

  const { fade = true, duration = 150, onComplete } = options;

  if (fade) {
    // Cross-fade animation
    const transitionStyle = `opacity ${duration}ms ease-out`;
    state.skeletonRoot.style.transition = transitionStyle;
    state.contentRoot.style.transition = transitionStyle;
    state.contentRoot.style.opacity = '0';
    state.contentRoot.style.display = 'block';

    // Force reflow to ensure transition works
    void state.contentRoot.offsetHeight;

    // Start transition
    state.skeletonRoot.style.opacity = '0';
    state.contentRoot.style.opacity = '1';

    // Cleanup after transition
    setTimeout(() => {
      state.skeletonRoot?.remove();
      onComplete?.();
    }, duration);
  } else {
    // Instant swap
    state.skeletonRoot.remove();
    state.contentRoot.style.display = 'block';
    onComplete?.();
  }

  state.swapped = true;
}

/**
 * Check if skeleton is still visible
 */
export function isSkeletonVisible(): boolean {
  return !state.swapped && state.skeletonRoot !== null;
}

/**
 * Generate minified inline init script for <head>
 * This script executes before body renders, ensuring skeleton shows first
 */
export function generateSkeletonInitScript(): string {
  return `<script>
(function(){
  var s=document.getElementById('aeon-skeleton'),r=document.getElementById('root');
  if(s&&r){r.style.display='none';s.style.display='block'}
  window.__AEON_SKELETON__={
    swap:function(o){
      if(this.done)return;
      o=o||{};
      var f=o.fade!==false,d=o.duration||150;
      if(f){
        s.style.transition=r.style.transition='opacity '+d+'ms ease-out';
        r.style.opacity='0';r.style.display='block';
        void r.offsetHeight;
        s.style.opacity='0';r.style.opacity='1';
        setTimeout(function(){s.remove();o.onComplete&&o.onComplete()},d);
      }else{
        s.remove();r.style.display='block';o.onComplete&&o.onComplete();
      }
      this.done=true
    },
    isVisible:function(){return!this.done&&!!s},
    done:false
  };
})();
</script>`;
}

/**
 * Generate the complete HTML structure for skeleton-first rendering
 */
export function generateSkeletonPageStructure(options: {
  title: string;
  description?: string;
  skeletonHtml: string;
  skeletonCss: string;
  contentHtml: string;
  contentCss: string;
  headExtra?: string;
  bodyExtra?: string;
}): string {
  const {
    title,
    description,
    skeletonHtml,
    skeletonCss,
    contentHtml,
    contentCss,
    headExtra = '',
    bodyExtra = '',
  } = options;

  const descriptionMeta = description
    ? `\n  <meta name="description" content="${escapeHtml(description)}">`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>${descriptionMeta}
  <style>
/* Skeleton CSS */
${skeletonCss}
/* Content CSS */
${contentCss}
  </style>
  ${generateSkeletonInitScript()}
  ${headExtra}
</head>
<body>
  <div id="aeon-skeleton" aria-hidden="true">${skeletonHtml}</div>
  <div id="root" style="display:none">${contentHtml}</div>
  <script>
    // Swap when DOM is ready
    if(document.readyState==='loading'){
      document.addEventListener('DOMContentLoaded',function(){
        window.__AEON_SKELETON__.swap({fade:true});
      });
    }else{
      window.__AEON_SKELETON__.swap({fade:true});
    }
  </script>
  ${bodyExtra}
</body>
</html>`;
}

/**
 * Generate skeleton swap script for async content loading
 * Use this when content loads after initial page render
 */
export function generateAsyncSwapScript(): string {
  return `<script>
(function(){
  // Wait for content to be ready (e.g., after React hydration)
  function checkReady(){
    var root=document.getElementById('root');
    if(root&&root.children.length>0){
      window.__AEON_SKELETON__&&window.__AEON_SKELETON__.swap({fade:true});
    }else{
      requestAnimationFrame(checkReady);
    }
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',checkReady);
  }else{
    checkReady();
  }
})();
</script>`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// TypeScript declaration for the global skeleton API
declare global {
  interface Window {
    __AEON_SKELETON__?: {
      swap: (options?: SkeletonSwapOptions) => void;
      isVisible: () => boolean;
      done: boolean;
    };
  }
}
