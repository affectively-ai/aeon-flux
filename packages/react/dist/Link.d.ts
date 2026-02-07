/**
 * Aeon Link Component
 *
 * Drop-in replacement for <a> with superpowers:
 * - Visibility-based prefetch
 * - Hover prefetch
 * - Intent detection (cursor trajectory)
 * - View transitions
 * - Presence awareness
 * - Total preload support
 */
import React, { type ReactNode, type AnchorHTMLAttributes } from 'react';
export type TransitionType = 'slide' | 'fade' | 'morph' | 'none';
export type PrefetchStrategy = 'hover' | 'visible' | 'intent' | 'none';
export interface PresenceRenderProps {
    count: number;
    editing: number;
    hot: boolean;
    users?: {
        userId: string;
        name?: string;
    }[];
}
export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> {
    href: string;
    prefetch?: PrefetchStrategy;
    transition?: TransitionType;
    showPresence?: boolean;
    preloadData?: boolean;
    replace?: boolean;
    children?: ReactNode | ((props: {
        presence: PresenceRenderProps | null;
    }) => ReactNode);
    onNavigateStart?: () => void;
    onNavigateEnd?: () => void;
}
export declare const Link: React.ForwardRefExoticComponent<LinkProps & React.RefAttributes<HTMLAnchorElement>>;
