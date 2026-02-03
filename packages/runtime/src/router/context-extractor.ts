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
 * Extract user identity and tier from cookies/headers
 */
function extractIdentity(
  cookies: Record<string, string>,
  request: Request
): { userId?: string; tier: UserTier } {
  // User ID from cookie or header
  const userId = cookies['user_id'] || request.headers.get('x-user-id') || undefined;

  // Tier from cookie, header, or default
  const tierCookie = cookies['user_tier'] as UserTier | undefined;
  const tierHeader = request.headers.get('x-user-tier') as UserTier | null;
  const tier = tierCookie || tierHeader || 'free';

  return { userId, tier };
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
  const { userId, tier: initialTier } = extractIdentity(cookies, request);
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
// Exports
// ============================================================================

export type { ContextExtractorOptions };
