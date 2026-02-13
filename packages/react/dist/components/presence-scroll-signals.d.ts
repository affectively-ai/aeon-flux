import type { PresenceUser } from '../provider';
export declare const DEFAULT_SCROLL_ACCENT = "#3b82f6";
export declare const DEFAULT_SCROLL_MARKER_LIMIT = 32;
export declare const DEFAULT_SCROLL_DENSITY_BUCKETS = 16;
export declare const DEFAULT_SCROLL_ACTIVITY_WINDOW_MS = 120000;
export declare const DEFAULT_LOCAL_SCROLL_DEPTH_EPSILON = 0.0025;
export interface PresenceScrollSignal {
    user: PresenceUser;
    userId: string;
    label: string;
    shortLabel: string;
    depth: number;
    color: string;
    isLocal: boolean;
    activity: number;
    laneOffsetPx: number;
    socialSignal: string;
}
export interface BuildScrollSignalsOptions {
    localUserId?: string;
    markerLimit?: number;
    now?: number;
    laneSpacingPx?: number;
    laneCount?: number;
    activityWindowMs?: number;
}
export declare function clampDepth(depth: number): number;
export declare function hashPresenceColor(userId: string): string;
export declare function displayPresenceUser(userId: string): string;
export declare function hashLaneOffset(userId: string, laneSpacingPx?: number, laneCount?: number): number;
export declare function summarizeScrollSignal(user: PresenceUser): string;
export declare function computeScrollActivity(user: PresenceUser, now: number, activityWindowMs?: number): number;
export declare function buildScrollSignals(presence: PresenceUser[], { localUserId, markerLimit, now, laneSpacingPx, laneCount, activityWindowMs, }?: BuildScrollSignalsOptions): PresenceScrollSignal[];
export declare function sortScrollSignalsForRail(signals: PresenceScrollSignal[]): PresenceScrollSignal[];
export declare function sortScrollSignalsForLegend(signals: PresenceScrollSignal[], limit?: number): PresenceScrollSignal[];
export declare function buildScrollDensityMap(signals: PresenceScrollSignal[], bucketCount?: number): number[];
export declare function shouldCommitLocalDepthUpdate(previousDepth: number, nextDepth: number, epsilon?: number): boolean;
