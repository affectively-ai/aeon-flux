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
import type { ComponentTree, MerkleNode, MerkleTree } from './types';
/**
 * Generate deterministic hash for a single node
 * Hash = SHA-256(type + sortedProps + childHashes)
 */
export declare function hashNodeAsync(type: string, props: Record<string, unknown>, childHashes: string[]): Promise<string>;
/**
 * Synchronous hash generation using djb2
 * Faster but less collision-resistant
 */
export declare function hashNodeSync(type: string, props: Record<string, unknown>, childHashes: string[]): string;
/**
 * Build complete Merkle tree from ComponentTree (async)
 */
export declare function buildMerkleTree(tree: ComponentTree): Promise<MerkleTree>;
/**
 * Build complete Merkle tree from ComponentTree (sync)
 */
export declare function buildMerkleTreeSync(tree: ComponentTree): MerkleTree;
/**
 * Generate data attributes for a DOM element
 */
export declare function getMerkleAttributes(merkleNode: MerkleNode): Record<string, string>;
/**
 * Parse Merkle info from DOM element
 */
export declare function parseMerkleFromElement(element: HTMLElement): {
    hash: string;
    path: string[];
    pathHashes: string[];
    type: string;
} | null;
/**
 * Find nearest ancestor with Merkle attributes
 */
export declare function findNearestMerkleElement(element: HTMLElement): HTMLElement | null;
/**
 * Verify tree integrity by recomputing root hash
 */
export declare function verifyMerkleTree(tree: MerkleTree, componentTree: ComponentTree): Promise<boolean>;
/**
 * Find nodes that have changed between two Merkle trees
 */
export declare function diffMerkleTrees(oldTree: MerkleTree, newTree: MerkleTree): {
    added: MerkleNode[];
    removed: MerkleNode[];
    changed: MerkleNode[];
};
