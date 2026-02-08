/**
 * Merkle-Based UCAN Capability Verification
 *
 * Provides fine-grained access control to component nodes using Merkle hashes.
 * Integrates with UCAN tokens for cryptographic authorization.
 *
 * Resource formats:
 * - `merkle:<hash>` - Exact match on Merkle hash
 * - `tree:<hash>` - Match node or any ancestor with this hash
 * - `path:<route>` - Match all nodes on a route (wildcards supported)
 * - `*` - Match any node (wildcard)
 */
import type { AeonAnyCapability, AeonNodeCapability, AeonNodeCapabilityAction, AeonResourceType, MerkleAccessRequest, ParsedResource } from '../types';
/**
 * Parse a resource identifier from a capability
 *
 * @example
 * ```ts
 * parseResource('merkle:a1b2c3d4e5f6')
 * // { type: 'merkle', value: 'a1b2c3d4e5f6' }
 *
 * parseResource('tree:a1b2c3d4e5f6')
 * // { type: 'tree', value: 'a1b2c3d4e5f6' }
 *
 * parseResource('path:/dashboard/*')
 * // { type: 'path', value: '/dashboard/*' }
 *
 * parseResource('*')
 * // { type: 'wildcard', value: '*' }
 * ```
 */
export declare function parseResource(resource: string): ParsedResource;
/**
 * Format a resource identifier for a capability
 */
export declare function formatResource(type: AeonResourceType, value: string): string;
/**
 * Check if a capability grants access to a Merkle node
 */
export declare function capabilityGrantsAccess(capability: AeonAnyCapability, request: MerkleAccessRequest, action: 'read' | 'write'): boolean;
/**
 * Node capability verifier function type
 */
export type NodeCapabilityVerifier = (request: MerkleAccessRequest, action: 'read' | 'write') => Promise<boolean>;
/**
 * Options for creating a node capability verifier
 */
export interface NodeVerifierOptions {
    /**
     * Function to extract capabilities from a token
     * Should return the list of capabilities granted by the token
     */
    extractCapabilities: (token: string) => Promise<AeonAnyCapability[]>;
    /**
     * Function to verify the token is valid (signature, expiry, etc.)
     * If not provided, tokens are assumed valid
     */
    verifyToken?: (token: string) => Promise<boolean>;
    /**
     * Cache for capability lookups (optional)
     * Key: token, Value: capabilities
     */
    cache?: Map<string, AeonAnyCapability[]>;
    /**
     * Cache TTL in milliseconds (default: 5 minutes)
     */
    cacheTtlMs?: number;
}
/**
 * Create a node capability verifier from a token
 *
 * @example
 * ```ts
 * const verifier = createNodeCapabilityVerifier(token, {
 *   extractCapabilities: async (t) => {
 *     const decoded = await decodeUCAN(t);
 *     return decoded.capabilities;
 *   },
 *   verifyToken: async (t) => {
 *     return await verifyUCANSignature(t);
 *   },
 * });
 *
 * // Check if user can read a specific node
 * const canRead = await verifier(
 *   { merkleHash: 'a1b2c3d4e5f6' },
 *   'read'
 * );
 * ```
 */
export declare function createNodeCapabilityVerifier(token: string, options: NodeVerifierOptions): NodeCapabilityVerifier;
/**
 * Create a node read capability for a specific Merkle hash
 */
export declare function createNodeReadCapability(merkleHash: string): AeonNodeCapability;
/**
 * Create a node write capability for a specific Merkle hash
 */
export declare function createNodeWriteCapability(merkleHash: string): AeonNodeCapability;
/**
 * Create a tree capability (grants access to node and all descendants)
 */
export declare function createTreeCapability(merkleHash: string, action?: AeonNodeCapabilityAction): AeonNodeCapability;
/**
 * Create a path-based capability (grants access to all nodes on a route)
 */
export declare function createPathCapability(routePath: string, action?: AeonNodeCapabilityAction): AeonNodeCapability;
/**
 * Create a wildcard capability (grants access to all nodes)
 */
export declare function createWildcardNodeCapability(action?: AeonNodeCapabilityAction): AeonNodeCapability;
/**
 * Check if a user has access to a node
 *
 * @example
 * ```ts
 * const hasAccess = await checkNodeAccess(
 *   capabilities,
 *   { merkleHash: 'a1b2c3d4e5f6', routePath: '/dashboard' },
 *   'read'
 * );
 * ```
 */
export declare function checkNodeAccess(capabilities: AeonAnyCapability[], request: MerkleAccessRequest, action: 'read' | 'write'): boolean;
/**
 * Filter a tree to only include nodes the user has access to
 *
 * @example
 * ```ts
 * const accessibleNodes = filterAccessibleNodes(
 *   nodeMap,
 *   capabilities,
 *   'read'
 * );
 * ```
 */
export declare function filterAccessibleNodes<T extends {
    merkleHash: string;
    treePath?: string[];
}>(nodes: T[], capabilities: AeonAnyCapability[], action: 'read' | 'write', routePath?: string): T[];
/**
 * Get the most specific capability for a node
 * Useful for determining the level of access a user has
 */
export declare function getMostSpecificCapability(capabilities: AeonAnyCapability[], request: MerkleAccessRequest): AeonAnyCapability | null;
