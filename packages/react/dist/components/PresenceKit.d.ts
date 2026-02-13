import { type CSSProperties, type ReactNode } from 'react';
import type { PresenceScroll, PresenceUser } from '../provider';
export interface PresenceCursorLayerProps {
    presence: PresenceUser[];
    localUserId?: string;
    width?: number | string;
    height?: number | string;
    className?: string;
}
export declare function PresenceCursorLayer({ presence, localUserId, width, height, className, }: PresenceCursorLayerProps): import("react/jsx-runtime").JSX.Element;
export interface PresenceFocusListProps {
    presence: PresenceUser[];
    localUserId?: string;
    maxItems?: number;
    className?: string;
}
export declare function PresenceFocusList({ presence, localUserId, maxItems, className, }: PresenceFocusListProps): import("react/jsx-runtime").JSX.Element;
export interface PresenceTypingListProps {
    presence: PresenceUser[];
    localUserId?: string;
    className?: string;
}
export declare function PresenceTypingList({ presence, localUserId, className, }: PresenceTypingListProps): import("react/jsx-runtime").JSX.Element;
export interface PresenceSelectionListProps {
    presence: PresenceUser[];
    localUserId?: string;
    className?: string;
}
export declare function PresenceSelectionList({ presence, localUserId, className, }: PresenceSelectionListProps): import("react/jsx-runtime").JSX.Element;
export interface PresenceScrollBarProps {
    presence: PresenceUser[];
    localUserId?: string;
    height?: number;
    className?: string;
    accentColor?: string;
    markerLimit?: number;
    showLegend?: boolean;
}
export declare function PresenceScrollBar({ presence, localUserId, height, className, accentColor, markerLimit, showLegend, }: PresenceScrollBarProps): import("react/jsx-runtime").JSX.Element;
export interface PresenceViewportListProps {
    presence: PresenceUser[];
    localUserId?: string;
    className?: string;
}
export declare function PresenceViewportList({ presence, localUserId, className, }: PresenceViewportListProps): import("react/jsx-runtime").JSX.Element;
export interface PresenceInputStateListProps {
    presence: PresenceUser[];
    localUserId?: string;
    className?: string;
}
export declare function PresenceInputStateList({ presence, localUserId, className, }: PresenceInputStateListProps): import("react/jsx-runtime").JSX.Element;
export interface PresenceEmotionListProps {
    presence: PresenceUser[];
    localUserId?: string;
    className?: string;
}
export declare function PresenceEmotionList({ presence, localUserId, className, }: PresenceEmotionListProps): import("react/jsx-runtime").JSX.Element;
export interface PresenceEditingListProps {
    presence: PresenceUser[];
    localUserId?: string;
    className?: string;
}
export declare function PresenceEditingList({ presence, localUserId, className, }: PresenceEditingListProps): import("react/jsx-runtime").JSX.Element;
export interface PresenceStatusListProps {
    presence: PresenceUser[];
    localUserId?: string;
    className?: string;
}
export declare function PresenceStatusList({ presence, localUserId, className, }: PresenceStatusListProps): import("react/jsx-runtime").JSX.Element;
export interface PresenceElementsPanelProps {
    presence: PresenceUser[];
    localUserId?: string;
    className?: string;
    showCursorLayer?: boolean;
    cursorLayerHeight?: number | string;
    scrollBarAccentColor?: string;
    scrollBarMarkerLimit?: number;
    showScrollLegend?: boolean;
}
export declare function PresenceElementsPanel({ presence, localUserId, className, showCursorLayer, cursorLayerHeight, scrollBarAccentColor, scrollBarMarkerLimit, showScrollLegend, }: PresenceElementsPanelProps): import("react/jsx-runtime").JSX.Element;
export interface CollaborativePresenceScrollContainerProps {
    children: ReactNode;
    presence: PresenceUser[];
    localUserId?: string;
    height?: number | string;
    className?: string;
    style?: CSSProperties;
    accentColor?: string;
    markerLimit?: number;
    onScrollStateChange?: (scroll: PresenceScroll) => void;
}
export declare function CollaborativePresenceScrollContainer({ children, presence, localUserId, height, className, style, accentColor, markerLimit, onScrollStateChange, }: CollaborativePresenceScrollContainerProps): import("react/jsx-runtime").JSX.Element;
