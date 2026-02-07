/**
 * Aeon Flux MCP Resources
 *
 * Resources that provide context to the LLM:
 * - sitemap: Full site structure for navigation context
 * - session: Current user session data
 * - consciousness: Site consciousness state from Cyrano
 */
import type { Resource } from '@modelcontextprotocol/sdk/types.js';
export declare const sitemapResource: Resource;
export declare const sessionResource: Resource;
export declare const consciousnessResource: Resource;
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
    awarenessLevel: 'dormant' | 'observing' | 'attentive' | 'engaged' | 'intervening';
    triggerCount: number;
    pendingWhispers: number;
    orbState: 'idle' | 'listening' | 'thinking' | 'speaking';
    captionsEnabled: boolean;
    voiceEnabled: boolean;
    lastInteraction?: number;
}
export declare function handleReadSitemap(): Promise<{
    contents: Array<{
        uri: string;
        mimeType: string;
        text: string;
    }>;
}>;
export declare function handleReadSession(): Promise<{
    contents: Array<{
        uri: string;
        mimeType: string;
        text: string;
    }>;
}>;
export declare function handleReadConsciousness(): Promise<{
    contents: Array<{
        uri: string;
        mimeType: string;
        text: string;
    }>;
}>;
export declare function setSessionState(state: Partial<SessionState>): void;
export declare function setConsciousnessState(state: Partial<ConsciousnessState>): void;
export declare function getSessionState(): SessionState;
export declare function getConsciousnessState(): ConsciousnessState;
export {};
//# sourceMappingURL=resources.d.ts.map