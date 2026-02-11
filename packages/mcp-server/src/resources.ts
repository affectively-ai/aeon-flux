/**
 * Aeon Flux MCP Resources
 *
 * Resources that provide context to the LLM:
 * - sitemap: Full site structure for navigation context
 * - session: Current user session data
 * - consciousness: Site consciousness state from Cyrano
 */

import type { Resource, TextContent } from '@modelcontextprotocol/sdk/types.js';
import { getNavigationState } from './tools/navigation';

// ============================================================================
// Resource Definitions
// ============================================================================

export const sitemapResource: Resource = {
  uri: 'aeon://sitemap',
  name: 'Sitemap',
  description:
    'Full site structure with all available routes and their metadata',
  mimeType: 'application/json',
};

export const sessionResource: Resource = {
  uri: 'aeon://session',
  name: 'Current Session',
  description:
    'Current user session data including navigation history, emotional state, and preferences',
  mimeType: 'application/json',
};

export const consciousnessResource: Resource = {
  uri: 'aeon://consciousness',
  name: 'Site Consciousness',
  description:
    'Current site consciousness state - awareness level, triggers, and Cyrano state',
  mimeType: 'application/json',
};

// ============================================================================
// State Interfaces (would be connected to real state in production)
// ============================================================================

interface SessionState {
  userId?: string;
  tier: 'free' | 'starter' | 'pro' | 'enterprise';
  startedAt: number;
  emotionalState?: {
    primary: string;
    valence: number;
    arousal: number;
  };
  preferences: Record<string, unknown>;
  recentTools: string[];
}

interface ConsciousnessState {
  awarenessLevel:
    | 'dormant'
    | 'observing'
    | 'attentive'
    | 'engaged'
    | 'intervening';
  triggerCount: number;
  pendingWhispers: number;
  orbState: 'idle' | 'listening' | 'thinking' | 'speaking';
  captionsEnabled: boolean;
  voiceEnabled: boolean;
  lastInteraction?: number;
}

// Mock state (would be connected to real services in production)
let sessionState: SessionState = {
  tier: 'free',
  startedAt: Date.now(),
  preferences: {},
  recentTools: [],
};

let consciousnessState: ConsciousnessState = {
  awarenessLevel: 'observing',
  triggerCount: 0,
  pendingWhispers: 0,
  orbState: 'idle',
  captionsEnabled: true,
  voiceEnabled: false,
};

// ============================================================================
// Resource Handlers
// ============================================================================

export async function handleReadSitemap(): Promise<{
  contents: Array<{ uri: string; mimeType: string; text: string }>;
}> {
  // Full sitemap with rich metadata
  const sitemap = {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    routes: [
      // Core
      {
        route: '/',
        title: 'Home',
        description:
          'Welcome to AFFECTIVELY - your emotional wellness companion',
        category: 'core',
        tier: 'free',
        keywords: ['home', 'start', 'welcome'],
      },
      {
        route: '/dashboard',
        title: 'Dashboard',
        description: 'Your personal emotional wellness dashboard',
        category: 'core',
        tier: 'free',
        keywords: ['dashboard', 'overview', 'summary'],
      },
      {
        route: '/insights',
        title: 'Insights',
        description: 'Emotional patterns and trends analysis',
        category: 'core',
        tier: 'starter',
        keywords: ['insights', 'patterns', 'trends', 'analysis'],
      },
      {
        route: '/chat',
        title: 'Chat with Cyrano',
        description: 'Fullscreen conversation with your AI companion',
        category: 'core',
        tier: 'free',
        keywords: ['chat', 'cyrano', 'talk', 'conversation'],
      },

      // Breathing Tools
      {
        route: '/breathing',
        title: 'Breathing Exercises',
        description: 'Guided breathing exercises for calm and focus',
        category: 'tools',
        tier: 'free',
        keywords: ['breathing', 'calm', 'relax', 'anxiety'],
        tools: ['4-7-8', 'box', 'coherent', 'energizing'],
      },
      {
        route: '/breathing/4-7-8',
        title: '4-7-8 Breathing',
        description: 'The relaxing breath - inhale 4, hold 7, exhale 8',
        category: 'tools',
        tier: 'free',
        keywords: ['breathing', 'calm', 'sleep', 'anxiety', 'relaxing'],
        duration: '5-10 minutes',
        bestFor: ['stress', 'anxiety', 'sleep'],
      },
      {
        route: '/breathing/box',
        title: 'Box Breathing',
        description: 'Square breathing for focus and calm - 4-4-4-4',
        category: 'tools',
        tier: 'free',
        keywords: ['breathing', 'focus', 'calm', 'navy', 'seals'],
        duration: '5 minutes',
        bestFor: ['focus', 'stress', 'centering'],
      },
      {
        route: '/breathing/coherent',
        title: 'Coherent Breathing',
        description: 'Heart-brain coherence at 5 breaths per minute',
        category: 'tools',
        tier: 'free',
        keywords: ['breathing', 'hrv', 'coherence', 'heart'],
        duration: '10 minutes',
        bestFor: ['hrv', 'heart', 'balance'],
      },

      // Grounding Tools
      {
        route: '/grounding',
        title: 'Grounding Exercises',
        description: 'Techniques to ground yourself in the present',
        category: 'tools',
        tier: 'free',
        keywords: ['grounding', 'present', 'mindfulness', 'overwhelm'],
      },
      {
        route: '/grounding/5-4-3-2-1',
        title: '5-4-3-2-1 Grounding',
        description: 'Sensory grounding - 5 things you see, 4 you hear...',
        category: 'tools',
        tier: 'free',
        keywords: ['grounding', 'senses', 'anxiety', 'panic'],
        duration: '5 minutes',
        bestFor: ['anxiety', 'panic', 'dissociation'],
      },

      // Journaling
      {
        route: '/journaling',
        title: 'Journaling',
        description: 'Reflective writing for emotional processing',
        category: 'tools',
        tier: 'starter',
        keywords: ['journaling', 'writing', 'reflection', 'processing'],
      },
      {
        route: '/journaling/freeform',
        title: 'Freeform Journaling',
        description: 'Open space to write freely',
        category: 'tools',
        tier: 'starter',
        keywords: ['journaling', 'freeform', 'stream'],
      },
      {
        route: '/journaling/gratitude',
        title: 'Gratitude Journal',
        description: 'Daily gratitude practice',
        category: 'tools',
        tier: 'free',
        keywords: ['gratitude', 'positive', 'appreciation'],
        bestFor: ['positivity', 'wellbeing', 'perspective'],
      },

      // Learning
      {
        route: '/learning',
        title: 'Learning Center',
        description: 'Educational content about emotions and wellness',
        category: 'learning',
        tier: 'free',
        keywords: ['learning', 'education', 'emotions'],
      },
      {
        route: '/learning/emotions',
        title: 'Understanding Emotions',
        description: 'Learn about different emotions and how to work with them',
        category: 'learning',
        tier: 'free',
        keywords: ['emotions', 'feelings', 'understanding'],
      },

      // Settings & Account
      {
        route: '/settings',
        title: 'Settings',
        description: 'Customize your experience',
        category: 'settings',
        tier: 'free',
        keywords: ['settings', 'preferences', 'customize'],
      },
      {
        route: '/account',
        title: 'Account',
        description: 'Manage your account',
        category: 'account',
        tier: 'free',
        keywords: ['account', 'profile', 'subscription'],
      },
    ],

    // Navigation hints for Cyrano
    contextualNavigation: {
      highStress: ['/breathing/4-7-8', '/grounding/5-4-3-2-1'],
      lowEnergy: ['/breathing/energizing', '/dashboard'],
      anxiety: ['/breathing/4-7-8', '/grounding', '/journaling'],
      sleep: ['/breathing/4-7-8', '/breathing/coherent'],
      focus: ['/breathing/box', '/grounding'],
      reflection: ['/journaling', '/insights'],
      learning: ['/learning', '/learning/emotions'],
    },
  };

  return {
    contents: [
      {
        uri: 'aeon://sitemap',
        mimeType: 'application/json',
        text: JSON.stringify(sitemap, null, 2),
      },
    ],
  };
}

export async function handleReadSession(): Promise<{
  contents: Array<{ uri: string; mimeType: string; text: string }>;
}> {
  const navState = getNavigationState();

  const fullSession = {
    ...sessionState,
    navigation: {
      currentRoute: navState.currentRoute,
      previousRoutes: navState.previousRoutes,
      pendingSuggestions: navState.pendingSuggestions,
      autoAcceptEnabled: navState.autoAcceptEnabled,
    },
    timestamp: Date.now(),
  };

  return {
    contents: [
      {
        uri: 'aeon://session',
        mimeType: 'application/json',
        text: JSON.stringify(fullSession, null, 2),
      },
    ],
  };
}

export async function handleReadConsciousness(): Promise<{
  contents: Array<{ uri: string; mimeType: string; text: string }>;
}> {
  return {
    contents: [
      {
        uri: 'aeon://consciousness',
        mimeType: 'application/json',
        text: JSON.stringify(consciousnessState, null, 2),
      },
    ],
  };
}

// ============================================================================
// State Management
// ============================================================================

export function setSessionState(state: Partial<SessionState>): void {
  sessionState = { ...sessionState, ...state };
}

export function setConsciousnessState(
  state: Partial<ConsciousnessState>,
): void {
  consciousnessState = { ...consciousnessState, ...state };
}

export function getSessionState(): SessionState {
  return { ...sessionState };
}

export function getConsciousnessState(): ConsciousnessState {
  return { ...consciousnessState };
}
