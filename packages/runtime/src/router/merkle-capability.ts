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

import type {
  AeonAnyCapability,
  AeonCapabilityActionType,
  AeonNodeCapability,
  AeonNodeCapabilityAction,
  AeonResourceType,
  MerkleAccessRequest,
  ParsedResource,
} from '../types';

// ============================================================================
// Resource Parsing
// ============================================================================

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
export function parseResource(resource: string): ParsedResource {
  if (resource === '*') {
    return { type: 'wildcard', value: '*' };
  }

  const colonIndex = resource.indexOf(':');
  if (colonIndex === -1) {
    // No prefix - treat as merkle hash
    return { type: 'merkle', value: resource };
  }

  const prefix = resource.slice(0, colonIndex);
  const value = resource.slice(colonIndex + 1);

  switch (prefix) {
    case 'merkle':
      return { type: 'merkle', value };
    case 'tree':
      return { type: 'tree', value };
    case 'path':
      return { type: 'path', value };
    default:
      // Unknown prefix - treat entire string as merkle hash
      return { type: 'merkle', value: resource };
  }
}

/**
 * Format a resource identifier for a capability
 */
export function formatResource(type: AeonResourceType, value: string): string {
  if (type === 'wildcard') return '*';
  return `${type}:${value}`;
}

// ============================================================================
// Capability Matching
// ============================================================================

/**
 * Check if an action is permitted by a capability action
 */
function actionPermits(
  capabilityAction: AeonCapabilityActionType,
  requestedAction: 'read' | 'write',
): boolean {
  // Wildcard permits everything
  if (capabilityAction === 'aeon:*' || capabilityAction === 'aeon:node:*') {
    return true;
  }

  // Admin permits everything
  if (capabilityAction === 'aeon:admin') {
    return true;
  }

  // Check specific actions
  if (requestedAction === 'read') {
    return (
      capabilityAction === 'aeon:read' ||
      capabilityAction === 'aeon:write' ||
      capabilityAction === 'aeon:node:read' ||
      capabilityAction === 'aeon:node:write'
    );
  }

  if (requestedAction === 'write') {
    return (
      capabilityAction === 'aeon:write' ||
      capabilityAction === 'aeon:node:write'
    );
  }

  return false;
}

/**
 * Check if a path pattern matches a route
 * Supports wildcards: `/dashboard/*` matches `/dashboard/settings`
 */
function pathMatches(pattern: string, path: string): boolean {
  // Exact match
  if (pattern === path) return true;

  // Wildcard pattern
  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -2);
    return path.startsWith(prefix);
  }

  // Double wildcard (match any depth)
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3);
    return path.startsWith(prefix);
  }

  return false;
}

/**
 * Check if a capability grants access to a Merkle node
 */
export function capabilityGrantsAccess(
  capability: AeonAnyCapability,
  request: MerkleAccessRequest,
  action: 'read' | 'write',
): boolean {
  // Check action first
  if (!actionPermits(capability.can, action)) {
    return false;
  }

  // Parse the resource
  const resource = parseResource(capability.with);

  switch (resource.type) {
    case 'wildcard':
      // Wildcard grants access to all nodes
      return true;

    case 'merkle':
      // Exact Merkle hash match
      return resource.value === request.merkleHash;

    case 'tree':
      // Match if the node or any ancestor has this hash
      if (resource.value === request.merkleHash) {
        return true;
      }
      // Check ancestors
      if (request.ancestorHashes) {
        return request.ancestorHashes.includes(resource.value);
      }
      return false;

    case 'path':
      // Match based on route path
      if (request.routePath) {
        return pathMatches(resource.value, request.routePath);
      }
      return false;

    default:
      return false;
  }
}

// ============================================================================
// Capability Verification
// ============================================================================

/**
 * Node capability verifier function type
 */
export type NodeCapabilityVerifier = (
  request: MerkleAccessRequest,
  action: 'read' | 'write',
) => Promise<boolean>;

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
export function createNodeCapabilityVerifier(
  token: string,
  options: NodeVerifierOptions,
): NodeCapabilityVerifier {
  let cachedCapabilities: AeonAnyCapability[] | null = null;
  let cacheTime = 0;
  const ttl = options.cacheTtlMs ?? 5 * 60 * 1000; // 5 minutes default

  return async (
    request: MerkleAccessRequest,
    action: 'read' | 'write',
  ): Promise<boolean> => {
    // Verify token if verifier provided
    if (options.verifyToken) {
      const isValid = await options.verifyToken(token);
      if (!isValid) {
        return false;
      }
    }

    // Get capabilities (with caching)
    const now = Date.now();
    if (!cachedCapabilities || now - cacheTime > ttl) {
      // Check external cache first
      if (options.cache?.has(token)) {
        cachedCapabilities = options.cache.get(token)!;
      } else {
        cachedCapabilities = await options.extractCapabilities(token);
        options.cache?.set(token, cachedCapabilities);
      }
      cacheTime = now;
    }

    // Check if any capability grants access
    for (const capability of cachedCapabilities) {
      if (capabilityGrantsAccess(capability, request, action)) {
        return true;
      }
    }

    return false;
  };
}

// ============================================================================
// Capability Creation Helpers
// ============================================================================

/**
 * Create a node read capability for a specific Merkle hash
 */
export function createNodeReadCapability(
  merkleHash: string,
): AeonNodeCapability {
  return {
    can: 'aeon:node:read',
    with: formatResource('merkle', merkleHash),
  };
}

/**
 * Create a node write capability for a specific Merkle hash
 */
export function createNodeWriteCapability(
  merkleHash: string,
): AeonNodeCapability {
  return {
    can: 'aeon:node:write',
    with: formatResource('merkle', merkleHash),
  };
}

/**
 * Create a tree capability (grants access to node and all descendants)
 */
export function createTreeCapability(
  merkleHash: string,
  action: AeonNodeCapabilityAction = 'aeon:node:*',
): AeonNodeCapability {
  return {
    can: action,
    with: formatResource('tree', merkleHash),
  };
}

/**
 * Create a path-based capability (grants access to all nodes on a route)
 */
export function createPathCapability(
  routePath: string,
  action: AeonNodeCapabilityAction = 'aeon:node:*',
): AeonNodeCapability {
  return {
    can: action,
    with: formatResource('path', routePath),
  };
}

/**
 * Create a wildcard capability (grants access to all nodes)
 */
export function createWildcardNodeCapability(
  action: AeonNodeCapabilityAction = 'aeon:node:*',
): AeonNodeCapability {
  return {
    can: action,
    with: '*',
  };
}

// ============================================================================
// Access Control Helpers
// ============================================================================

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
export function checkNodeAccess(
  capabilities: AeonAnyCapability[],
  request: MerkleAccessRequest,
  action: 'read' | 'write',
): boolean {
  for (const capability of capabilities) {
    if (capabilityGrantsAccess(capability, request, action)) {
      return true;
    }
  }
  return false;
}

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
export function filterAccessibleNodes<
  T extends { merkleHash: string; treePath?: string[] },
>(
  nodes: T[],
  capabilities: AeonAnyCapability[],
  action: 'read' | 'write',
  routePath?: string,
): T[] {
  return nodes.filter((node) => {
    const request: MerkleAccessRequest = {
      merkleHash: node.merkleHash,
      treePath: node.treePath,
      routePath,
    };
    return checkNodeAccess(capabilities, request, action);
  });
}

/**
 * Get the most specific capability for a node
 * Useful for determining the level of access a user has
 */
export function getMostSpecificCapability(
  capabilities: AeonAnyCapability[],
  request: MerkleAccessRequest,
): AeonAnyCapability | null {
  let mostSpecific: AeonAnyCapability | null = null;
  let specificity = -1;

  for (const capability of capabilities) {
    const resource = parseResource(capability.with);

    // Calculate specificity (higher = more specific)
    let capSpecificity = 0;
    switch (resource.type) {
      case 'merkle':
        if (resource.value === request.merkleHash) {
          capSpecificity = 4; // Most specific - exact match
        }
        break;
      case 'tree':
        if (resource.value === request.merkleHash) {
          capSpecificity = 3;
        } else if (request.ancestorHashes?.includes(resource.value)) {
          capSpecificity = 2;
        }
        break;
      case 'path':
        if (
          request.routePath &&
          pathMatches(resource.value, request.routePath)
        ) {
          capSpecificity = 1;
        }
        break;
      case 'wildcard':
        capSpecificity = 0; // Least specific
        break;
    }

    if (capSpecificity > specificity) {
      specificity = capSpecificity;
      mostSpecific = capability;
    }
  }

  return mostSpecific;
}
