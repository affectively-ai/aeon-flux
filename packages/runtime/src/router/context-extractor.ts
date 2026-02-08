/**
 * User Context Extractor
 *
 * Middleware that extracts UserContext from HTTP requests.
 * Gathers signals from headers, cookies, and request properties.
 */

import type {
  ConnectionType,
  EmotionState,
  UserContext,
  UserTier,
  Viewport,
} from './types';

// ============================================================================
// Cookie Helpers
// ============================================================================

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};

  return cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      acc[key] = decodeURIComponent(value);
    }
    return acc;
  }, {} as Record<string, string>);
}

function parseJSON<T>(value: string | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// ============================================================================
// Header Extraction
// ============================================================================

/**
 * Extract viewport from client hints or fallback headers
 */
function extractViewport(request: Request): Viewport {
  const headers = request.headers;

  // Client Hints (if available)
  const viewportWidth = headers.get('sec-ch-viewport-width');
  const viewportHeight = headers.get('sec-ch-viewport-height');
  const dpr = headers.get('sec-ch-dpr');

  if (viewportWidth && viewportHeight) {
    return {
      width: parseInt(viewportWidth, 10),
      height: parseInt(viewportHeight, 10),
      devicePixelRatio: dpr ? parseFloat(dpr) : undefined,
    };
  }

  // Fallback to custom headers (set by client-side JS)
  const xViewport = headers.get('x-viewport');
  if (xViewport) {
    const [width, height, devicePixelRatio] = xViewport.split(',').map(Number);
    return { width: width || 1920, height: height || 1080, devicePixelRatio };
  }

  // Default desktop viewport
  return { width: 1920, height: 1080 };
}

/**
 * Extract connection type from Network Information API hints
 */
function extractConnection(request: Request): ConnectionType {
  const headers = request.headers;

  // Downlink and RTT for connection quality
  const downlink = headers.get('downlink');
  const rtt = headers.get('rtt');
  const ect = headers.get('ect'); // Effective Connection Type

  // ECT header (if available)
  if (ect) {
    switch (ect) {
      case '4g': return 'fast';
      case '3g': return '3g';
      case '2g': return '2g';
      case 'slow-2g': return 'slow-2g';
    }
  }

  // Infer from downlink (Mbps)
  if (downlink) {
    const mbps = parseFloat(downlink);
    if (mbps >= 10) return 'fast';
    if (mbps >= 2) return '4g';
    if (mbps >= 0.5) return '3g';
    if (mbps >= 0.1) return '2g';
    return 'slow-2g';
  }

  // Infer from RTT (ms)
  if (rtt) {
    const ms = parseInt(rtt, 10);
    if (ms < 50) return 'fast';
    if (ms < 100) return '4g';
    if (ms < 300) return '3g';
    if (ms < 700) return '2g';
    return 'slow-2g';
  }

  // Default to 4g
  return '4g';
}

/**
 * Extract reduced motion preference
 */
function extractReducedMotion(request: Request): boolean {
  const prefersReducedMotion = request.headers.get('sec-ch-prefers-reduced-motion');
  return prefersReducedMotion === 'reduce';
}

/**
 * Extract timezone and local hour
 */
function extractTimeContext(request: Request): { timezone: string; localHour: number } {
  const headers = request.headers;

  // Custom header from client
  const xTimezone = headers.get('x-timezone');
  const xLocalHour = headers.get('x-local-hour');

  // Cloudflare provides timezone in cf object
  const cfTimezone = (request as Request & { cf?: { timezone?: string } }).cf?.timezone;

  const timezone = xTimezone || cfTimezone || 'UTC';
  const localHour = xLocalHour ? parseInt(xLocalHour, 10) : new Date().getUTCHours();

  return { timezone, localHour };
}

// ============================================================================
// Cookie/Session Extraction
// ============================================================================

/**
 * Admin capability verifier function type
 * This should be provided by the auth system (e.g., UCAN token verification)
 */
export type AdminVerifier = (token: string) => Promise<boolean>;

/**
 * Extract user identity and tier from cookies/headers
 * NOTE: isAdmin is NOT determined here - it must be verified via UCAN token
 */
function extractIdentity(
  cookies: Record<string, string>,
  request: Request
): { userId?: string; tier: UserTier; authToken?: string } {
  // User ID from cookie or header
  const userId = cookies['user_id'] || request.headers.get('x-user-id') || undefined;

  // Tier from cookie, header, or default
  const tierCookie = cookies['user_tier'] as UserTier | undefined;
  const tierHeader = request.headers.get('x-user-tier') as UserTier | null;
  const tier = tierCookie || tierHeader || 'free';

  // Auth token for admin verification (DO NOT trust cookies for admin status!)
  const authToken = cookies['auth_token'] ||
                    request.headers.get('authorization')?.replace('Bearer ', '') ||
                    undefined;

  return { userId, tier, authToken };
}

/**
 * Extract navigation history from cookies
 */
function extractNavigationHistory(cookies: Record<string, string>): {
  recentPages: string[];
  dwellTimes: Map<string, number>;
  clickPatterns: string[];
} {
  const recentPages = parseJSON<string[]>(cookies['recent_pages'], []);
  const dwellTimesObj = parseJSON<Record<string, number>>(cookies['dwell_times'], {});
  const clickPatterns = parseJSON<string[]>(cookies['click_patterns'], []);

  return {
    recentPages,
    dwellTimes: new Map(Object.entries(dwellTimesObj)),
    clickPatterns,
  };
}

/**
 * Extract emotion state from cookies/headers
 */
function extractEmotionState(
  cookies: Record<string, string>,
  request: Request
): EmotionState | undefined {
  // Check custom header first (set by edge-workers inference)
  const xEmotion = request.headers.get('x-emotion-state');
  if (xEmotion) {
    return parseJSON<EmotionState | undefined>(xEmotion, undefined);
  }

  // Check cookie
  const emotionCookie = cookies['emotion_state'];
  if (emotionCookie) {
    return parseJSON<EmotionState | undefined>(emotionCookie, undefined);
  }

  return undefined;
}

/**
 * Extract user preferences from cookies
 */
function extractPreferences(cookies: Record<string, string>): Record<string, unknown> {
  return parseJSON<Record<string, unknown>>(cookies['user_preferences'], {});
}

/**
 * Extract session info from cookies
 */
function extractSessionInfo(cookies: Record<string, string>): {
  sessionId?: string;
  isNewSession: boolean;
  sessionStartedAt?: Date;
} {
  const sessionId = cookies['session_id'];
  const sessionStarted = cookies['session_started'];

  return {
    sessionId,
    isNewSession: !sessionId,
    sessionStartedAt: sessionStarted ? new Date(sessionStarted) : undefined,
  };
}

// ============================================================================
// Main Extractor
// ============================================================================

export interface ContextExtractorOptions {
  /** Custom emotion detector (e.g., call edge-workers) */
  detectEmotion?: (request: Request) => Promise<EmotionState | undefined>;

  /** Custom user tier resolver (e.g., from database) */
  resolveUserTier?: (userId: string) => Promise<UserTier>;

  /**
   * Verify admin capability from auth token (REQUIRED for admin access)
   * This should verify the UCAN token has the 'admin' capability
   * If not provided, isAdmin will always be false
   */
  verifyAdminCapability?: AdminVerifier;

  /** Additional context enrichment */
  enrich?: (context: UserContext, request: Request) => Promise<UserContext>;
}

/**
 * Extract UserContext from an HTTP request
 */
export async function extractUserContext(
  request: Request,
  options: ContextExtractorOptions = {}
): Promise<UserContext> {
  const cookies = parseCookies(request.headers.get('cookie'));

  // Extract all signals
  const viewport = extractViewport(request);
  const connection = extractConnection(request);
  const reducedMotion = extractReducedMotion(request);
  const { timezone, localHour } = extractTimeContext(request);
  const { userId, tier: initialTier, authToken } = extractIdentity(cookies, request);
  const { recentPages, dwellTimes, clickPatterns } = extractNavigationHistory(cookies);
  const preferences = extractPreferences(cookies);
  const { sessionId, isNewSession, sessionStartedAt } = extractSessionInfo(cookies);

  // Resolve user tier if we have a resolver and userId
  let tier = initialTier;
  if (options.resolveUserTier && userId) {
    try {
      tier = await options.resolveUserTier(userId);
    } catch {
      // Keep initial tier on error
    }
  }

  // Verify admin capability via UCAN token (NOT from cookies!)
  // Admin access MUST be cryptographically verified
  let isAdmin = false;
  if (authToken && options.verifyAdminCapability) {
    try {
      isAdmin = await options.verifyAdminCapability(authToken);
    } catch {
      // Not admin on verification failure
      isAdmin = false;
    }
  }

  // Extract or detect emotion state
  let emotionState = extractEmotionState(cookies, request);
  if (!emotionState && options.detectEmotion) {
    try {
      emotionState = await options.detectEmotion(request);
    } catch {
      // No emotion state on error
    }
  }

  // Build context
  let context: UserContext = {
    userId,
    tier,
    isAdmin,
    recentPages,
    dwellTimes,
    clickPatterns,
    emotionState,
    preferences,
    viewport,
    connection,
    reducedMotion,
    localHour,
    timezone,
    sessionId,
    isNewSession,
    sessionStartedAt,
  };

  // Optional enrichment
  if (options.enrich) {
    context = await options.enrich(context, request);
  }

  return context;
}

/**
 * Create middleware for user context extraction
 */
export function createContextMiddleware(options: ContextExtractorOptions = {}) {
  return async (request: Request): Promise<UserContext> => {
    return extractUserContext(request, options);
  };
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Set context tracking cookies in response
 */
export function setContextCookies(
  response: Response,
  context: UserContext,
  currentPath: string
): Response {
  const headers = new Headers(response.headers);

  // Update recent pages
  const recentPages = [...context.recentPages.slice(-9), currentPath];
  headers.append(
    'Set-Cookie',
    `recent_pages=${encodeURIComponent(JSON.stringify(recentPages))}; Path=/; Max-Age=604800; SameSite=Lax`
  );

  // Set session cookie if new session
  if (context.isNewSession) {
    const sessionId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    headers.append(
      'Set-Cookie',
      `session_id=${sessionId}; Path=/; Max-Age=86400; SameSite=Lax`
    );
    headers.append(
      'Set-Cookie',
      `session_started=${new Date().toISOString()}; Path=/; Max-Age=86400; SameSite=Lax`
    );
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Add speculation hints to response headers
 */
export function addSpeculationHeaders(
  response: Response,
  prefetch: string[],
  prerender: string[]
): Response {
  const headers = new Headers(response.headers);

  // Add Link headers for prefetch
  if (prefetch.length > 0) {
    const linkHeader = prefetch
      .map((path) => `<${path}>; rel=prefetch`)
      .join(', ');
    headers.append('Link', linkHeader);
  }

  // Add prerender hints (Speculation Rules API will be injected in HTML)
  if (prerender.length > 0) {
    headers.set('X-Prerender-Hints', prerender.join(','));
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// ============================================================================
// ESI State Serialization
// ============================================================================

/**
 * ESI State for global injection in <head>
 * This is consumed by ESI components before React hydration
 */
export interface ESIState {
  /** User subscription tier for feature gating */
  userTier: UserTier;
  /** Admin flag - bypasses ALL tier restrictions */
  isAdmin?: boolean;
  /** Current emotional state for personalization */
  emotionState?: {
    primary: string;
    valence: number;
    arousal: number;
    confidence?: number;
  };
  /** User preferences for UI adaptation */
  preferences: {
    theme?: 'light' | 'dark' | 'auto';
    reducedMotion: boolean;
    language?: string;
  };
  /** Session information */
  sessionId?: string;
  /** Local time context */
  localHour: number;
  timezone: string;
  /** Feature flags based on tier */
  features: {
    aiInference: boolean;
    emotionTracking: boolean;
    collaboration: boolean;
    advancedInsights: boolean;
    customThemes: boolean;
    voiceSynthesis: boolean;
    imageAnalysis: boolean;
  };
  /** User ID (if authenticated) */
  userId?: string;
  /** Is this a new session? */
  isNewSession: boolean;
  /** Recent pages for personalization */
  recentPages: string[];
  /** Viewport information */
  viewport: {
    width: number;
    height: number;
  };
  /** Connection quality */
  connection: ConnectionType;
}

/**
 * Serialize UserContext to ESIState for global injection
 */
export function serializeToESIState(context: UserContext): ESIState {
  // Determine feature flags based on tier
  const tierFeatures: Record<UserTier, ESIState['features']> = {
    free: {
      aiInference: true,
      emotionTracking: true,
      collaboration: false,
      advancedInsights: false,
      customThemes: false,
      voiceSynthesis: false,
      imageAnalysis: false,
    },
    starter: {
      aiInference: true,
      emotionTracking: true,
      collaboration: false,
      advancedInsights: true,
      customThemes: true,
      voiceSynthesis: false,
      imageAnalysis: false,
    },
    pro: {
      aiInference: true,
      emotionTracking: true,
      collaboration: true,
      advancedInsights: true,
      customThemes: true,
      voiceSynthesis: true,
      imageAnalysis: true,
    },
    enterprise: {
      aiInference: true,
      emotionTracking: true,
      collaboration: true,
      advancedInsights: true,
      customThemes: true,
      voiceSynthesis: true,
      imageAnalysis: true,
    },
    admin: {
      aiInference: true,
      emotionTracking: true,
      collaboration: true,
      advancedInsights: true,
      customThemes: true,
      voiceSynthesis: true,
      imageAnalysis: true,
    },
  };

  // Admins get ALL features regardless of tier
  const features = context.isAdmin
    ? tierFeatures.admin
    : tierFeatures[context.tier] || tierFeatures.free;

  return {
    userTier: context.tier,
    isAdmin: context.isAdmin,
    emotionState: context.emotionState ? {
      primary: context.emotionState.primary,
      valence: context.emotionState.valence,
      arousal: context.emotionState.arousal,
      confidence: context.emotionState.confidence,
    } : undefined,
    preferences: {
      theme: context.preferences.theme as 'light' | 'dark' | 'auto' | undefined,
      reducedMotion: context.reducedMotion,
      language: context.preferences.language as string | undefined,
    },
    sessionId: context.sessionId,
    localHour: context.localHour,
    timezone: context.timezone,
    features,
    userId: context.userId,
    isNewSession: context.isNewSession,
    recentPages: context.recentPages.slice(-10), // Last 10 pages
    viewport: {
      width: context.viewport.width,
      height: context.viewport.height,
    },
    connection: context.connection,
  };
}

/**
 * Generate inline script for ESI state injection in <head>
 * This must execute before any ESI components render
 */
export function generateESIStateScript(esiState: ESIState): string {
  const stateJson = JSON.stringify(esiState);
  return `<script>window.__AEON_ESI_STATE__=${stateJson};</script>`;
}

/**
 * Generate ESI state script from UserContext
 */
export function generateESIStateScriptFromContext(context: UserContext): string {
  const esiState = serializeToESIState(context);
  return generateESIStateScript(esiState);
}

// ============================================================================
// Admin Verification Helpers
// ============================================================================

/**
 * Create an admin verifier from a UCAN auth instance
 *
 * @example
 * ```ts
 * import { auth } from './auth';
 * import { createAdminVerifier, extractUserContext } from '@affectively/aeon-pages-runtime';
 *
 * const verifyAdmin = createAdminVerifier(auth);
 *
 * const context = await extractUserContext(request, {
 *   verifyAdminCapability: verifyAdmin,
 * });
 * ```
 */
export function createAdminVerifier<T>(
  auth: {
    verifyCapability: (opts: {
      capability: T;
      resource: string;
      token: string;
    }) => Promise<boolean>;
  },
  adminCapability: T = 'admin' as T,
  adminResource: string = '*'
): AdminVerifier {
  return async (token: string): Promise<boolean> => {
    try {
      return await auth.verifyCapability({
        capability: adminCapability,
        resource: adminResource,
        token,
      });
    } catch {
      return false;
    }
  };
}
