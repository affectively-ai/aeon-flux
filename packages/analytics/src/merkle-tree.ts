/**
 * Merkle Tree Node Identification
 *
 * Generates deterministic, content-addressable hashes for component tree nodes.
 * Uses SHA-256 with children hashes to create a Merkle tree structure.
 *
 * Benefits:
 * - Stable IDs across renders (if content unchanged)
 * - Content-addressable (same content = same hash)
 * - Tree-aware (parent hash changes if any child changes)
 * - Position-independent (moves don't change hash)
 */

import type {
  ComponentNode,
  ComponentTree,
  MerkleNode,
  MerkleTree,
  MERKLE_ATTR,
  PATH_ATTR,
  PATH_HASHES_ATTR,
  TYPE_ATTR,
} from './types';

// ============================================================================
// Crypto Utilities
// ============================================================================

/**
 * SHA-256 hash with Web Crypto API (works in browser and Bun/Node)
 */
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);

  // Use Web Crypto API
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hashHex;
}

/**
 * Synchronous hash using simple djb2 algorithm for performance
 * Used for quick hashing when async is not desired
 */
function djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  // Convert to positive hex, pad to 12 chars
  return ((hash >>> 0).toString(16) + (hash >>> 0).toString(16)).slice(0, 12);
}

/**
 * Truncate hash to 12 characters for compact storage
 */
function truncateHash(hash: string): string {
  return hash.slice(0, 12);
}

// ============================================================================
// Key Sorting for Deterministic JSON
// ============================================================================

/**
 * Sort object keys recursively for deterministic serialization
 */
function sortKeys(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortKeys);
  }

  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj as Record<string, unknown>).sort();

  for (const key of keys) {
    sorted[key] = sortKeys((obj as Record<string, unknown>)[key]);
  }

  return sorted;
}

/**
 * Sanitize props for hashing - remove functions, symbols, etc.
 */
function sanitizeProps(
  props: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!props) return {};

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    // Skip functions, symbols, and React internals
    if (
      typeof value === 'function' ||
      typeof value === 'symbol' ||
      key.startsWith('_') ||
      key === 'children' ||
      key === 'ref' ||
      key === 'key'
    ) {
      continue;
    }

    // Recursively sanitize nested objects
    if (value !== null && typeof value === 'object') {
      sanitized[key] = sanitizeProps(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// ============================================================================
// Hash Generation
// ============================================================================

/**
 * Generate deterministic hash for a single node
 * Hash = SHA-256(type + sortedProps + childHashes)
 */
export async function hashNodeAsync(
  type: string,
  props: Record<string, unknown>,
  childHashes: string[],
): Promise<string> {
  const content = JSON.stringify({
    type,
    props: sortKeys(sanitizeProps(props)),
    children: childHashes.sort(), // Sort for consistency
  });

  const fullHash = await sha256(content);
  return truncateHash(fullHash);
}

/**
 * Synchronous hash generation using djb2
 * Faster but less collision-resistant
 */
export function hashNodeSync(
  type: string,
  props: Record<string, unknown>,
  childHashes: string[],
): string {
  const content = JSON.stringify({
    type,
    props: sortKeys(sanitizeProps(props)),
    children: childHashes.sort(),
  });

  return djb2Hash(content);
}

// ============================================================================
// Merkle Tree Builder
// ============================================================================

interface BuildContext {
  nodes: Map<string, MerkleNode>;
  hashToId: Map<string, string>;
  tree: ComponentTree;
}

/**
 * Recursively build MerkleNode for a node and its children
 * Uses post-order traversal (children first, then parent)
 */
async function buildNodeAsync(
  nodeId: string,
  parentPath: string[],
  parentPathHashes: string[],
  depth: number,
  ctx: BuildContext,
): Promise<MerkleNode | null> {
  const node = ctx.tree.getNode(nodeId);
  if (!node) return null;

  // Process children first (post-order)
  const childHashes: string[] = [];
  const children = ctx.tree.getChildren(nodeId);

  for (const child of children) {
    const childNode = await buildNodeAsync(
      child.id,
      [...parentPath, node.type],
      [...parentPathHashes], // Will be filled after we compute our hash
      depth + 1,
      ctx,
    );
    if (childNode) {
      childHashes.push(childNode.hash);
    }
  }

  // Now hash this node
  const hash = await hashNodeAsync(node.type, node.props || {}, childHashes);

  // Build path with hashes
  const path = [...parentPath, node.type];
  const pathHashes = [...parentPathHashes, hash];

  const merkleNode: MerkleNode = {
    hash,
    originalId: nodeId,
    type: node.type,
    props: sanitizeProps(node.props),
    childHashes,
    path,
    pathHashes,
    depth,
  };

  ctx.nodes.set(nodeId, merkleNode);
  ctx.hashToId.set(hash, nodeId);

  // Update children with correct parent path hashes
  for (const child of children) {
    const childMerkle = ctx.nodes.get(child.id);
    if (childMerkle) {
      childMerkle.pathHashes = [...pathHashes, childMerkle.hash];
    }
  }

  return merkleNode;
}

/**
 * Synchronous version for server-side rendering
 */
function buildNodeSync(
  nodeId: string,
  parentPath: string[],
  parentPathHashes: string[],
  depth: number,
  ctx: BuildContext,
): MerkleNode | null {
  const node = ctx.tree.getNode(nodeId);
  if (!node) return null;

  // Process children first (post-order)
  const childHashes: string[] = [];
  const children = ctx.tree.getChildren(nodeId);

  for (const child of children) {
    const childNode = buildNodeSync(
      child.id,
      [...parentPath, node.type],
      [...parentPathHashes],
      depth + 1,
      ctx,
    );
    if (childNode) {
      childHashes.push(childNode.hash);
    }
  }

  // Hash this node
  const hash = hashNodeSync(node.type, node.props || {}, childHashes);

  // Build path with hashes
  const path = [...parentPath, node.type];
  const pathHashes = [...parentPathHashes, hash];

  const merkleNode: MerkleNode = {
    hash,
    originalId: nodeId,
    type: node.type,
    props: sanitizeProps(node.props),
    childHashes,
    path,
    pathHashes,
    depth,
  };

  ctx.nodes.set(nodeId, merkleNode);
  ctx.hashToId.set(hash, nodeId);

  // Update children with correct parent path hashes
  for (const child of children) {
    const childMerkle = ctx.nodes.get(child.id);
    if (childMerkle) {
      childMerkle.pathHashes = [...pathHashes, childMerkle.hash];
    }
  }

  return merkleNode;
}

/**
 * Build complete Merkle tree from ComponentTree (async)
 */
export async function buildMerkleTree(
  tree: ComponentTree,
): Promise<MerkleTree> {
  const ctx: BuildContext = {
    nodes: new Map(),
    hashToId: new Map(),
    tree,
  };

  const rootNode = await buildNodeAsync(tree.rootId, [], [], 0, ctx);

  const merkleTree: MerkleTree = {
    rootHash: rootNode?.hash || '',
    nodes: ctx.nodes,

    getNode(id: string): MerkleNode | undefined {
      return ctx.nodes.get(id);
    },

    getNodeByHash(hash: string): MerkleNode | undefined {
      const id = ctx.hashToId.get(hash);
      return id ? ctx.nodes.get(id) : undefined;
    },

    getNodesAtDepth(depth: number): MerkleNode[] {
      return Array.from(ctx.nodes.values()).filter((n) => n.depth === depth);
    },
  };

  return merkleTree;
}

/**
 * Build complete Merkle tree from ComponentTree (sync)
 */
export function buildMerkleTreeSync(tree: ComponentTree): MerkleTree {
  const ctx: BuildContext = {
    nodes: new Map(),
    hashToId: new Map(),
    tree,
  };

  const rootNode = buildNodeSync(tree.rootId, [], [], 0, ctx);

  const merkleTree: MerkleTree = {
    rootHash: rootNode?.hash || '',
    nodes: ctx.nodes,

    getNode(id: string): MerkleNode | undefined {
      return ctx.nodes.get(id);
    },

    getNodeByHash(hash: string): MerkleNode | undefined {
      const id = ctx.hashToId.get(hash);
      return id ? ctx.nodes.get(id) : undefined;
    },

    getNodesAtDepth(depth: number): MerkleNode[] {
      return Array.from(ctx.nodes.values()).filter((n) => n.depth === depth);
    },
  };

  return merkleTree;
}

// ============================================================================
// DOM Attribute Helpers
// ============================================================================

/**
 * Generate data attributes for a DOM element
 */
export function getMerkleAttributes(
  merkleNode: MerkleNode,
): Record<string, string> {
  return {
    'data-aeon-merkle': merkleNode.hash,
    'data-aeon-path': JSON.stringify(merkleNode.path),
    'data-aeon-path-hashes': JSON.stringify(merkleNode.pathHashes),
    'data-aeon-type': merkleNode.type,
  };
}

/**
 * Parse Merkle info from DOM element
 */
export function parseMerkleFromElement(element: HTMLElement): {
  hash: string;
  path: string[];
  pathHashes: string[];
  type: string;
} | null {
  const hash = element.getAttribute('data-aeon-merkle');
  if (!hash) return null;

  const pathStr = element.getAttribute('data-aeon-path');
  const pathHashesStr = element.getAttribute('data-aeon-path-hashes');
  const type = element.getAttribute('data-aeon-type') || 'unknown';

  let path: string[] = [];
  let pathHashes: string[] = [];

  try {
    if (pathStr) path = JSON.parse(pathStr);
    if (pathHashesStr) pathHashes = JSON.parse(pathHashesStr);
  } catch {
    // Invalid JSON, use empty arrays
  }

  return { hash, path, pathHashes, type };
}

/**
 * Find nearest ancestor with Merkle attributes
 */
export function findNearestMerkleElement(
  element: HTMLElement,
): HTMLElement | null {
  let current: HTMLElement | null = element;

  while (current) {
    if (current.hasAttribute('data-aeon-merkle')) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

// ============================================================================
// Verification Utilities
// ============================================================================

/**
 * Verify tree integrity by recomputing root hash
 */
export async function verifyMerkleTree(
  tree: MerkleTree,
  componentTree: ComponentTree,
): Promise<boolean> {
  const rebuilt = await buildMerkleTree(componentTree);
  return rebuilt.rootHash === tree.rootHash;
}

/**
 * Find nodes that have changed between two Merkle trees
 */
export function diffMerkleTrees(
  oldTree: MerkleTree,
  newTree: MerkleTree,
): { added: MerkleNode[]; removed: MerkleNode[]; changed: MerkleNode[] } {
  const added: MerkleNode[] = [];
  const removed: MerkleNode[] = [];
  const changed: MerkleNode[] = [];

  const oldHashes = new Set(
    Array.from(oldTree.nodes.values()).map((n) => n.hash),
  );
  const newHashes = new Set(
    Array.from(newTree.nodes.values()).map((n) => n.hash),
  );

  // Find added nodes (in new but not in old)
  for (const [, node] of newTree.nodes) {
    if (!oldHashes.has(node.hash)) {
      // Check if originalId exists in old tree (changed) or not (added)
      const oldNode = oldTree.getNode(node.originalId);
      if (oldNode) {
        changed.push(node);
      } else {
        added.push(node);
      }
    }
  }

  // Find removed nodes (in old but not in new by ID)
  for (const [id, node] of oldTree.nodes) {
    if (!newTree.getNode(id)) {
      removed.push(node);
    }
  }

  return { added, removed, changed };
}
