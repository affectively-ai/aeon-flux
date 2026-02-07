/**
 * Aeon Pages Offline Encryption
 *
 * UCAN-based encryption wrapper for queued operations.
 * Uses Web Crypto API exclusively - no external dependencies.
 *
 * Key Derivation:
 * 1. UCAN signing key or session key as base material
 * 2. Derive encryption key via HKDF with context string
 * 3. Each operation encrypted with AES-256-GCM + authenticated
 * 4. Nonce is random per operation (prevents replay)
 *
 * Security Properties:
 * - Forward secrecy: Each operation uses unique nonce
 * - Authentication: GCM provides built-in authentication tag
 * - Key binding: Operations tied to user's key material
 * - No plaintext: Operations never stored unencrypted
 *
 * Binary Format: [version:1][nonce:12][ciphertext:*][auth_tag:16]
 */
import type { OfflineOperation, EncryptedPayload, EncryptionKeyMaterial } from './types';
/**
 * Offline operation encryption service
 * Uses Web Crypto API for all cryptographic operations
 */
export declare class OfflineOperationEncryption {
    private keyCache;
    /**
     * Derive an encryption key from UCAN signing key material
     */
    deriveKeyFromUCAN(userId: string, signingKeyBytes: Uint8Array, context: string): Promise<EncryptionKeyMaterial>;
    /**
     * Derive an encryption key from session-based material (fallback when UCAN not available)
     */
    deriveKeyFromSession(sessionId: string, context: string): Promise<EncryptionKeyMaterial>;
    /**
     * Encrypt operation for queue storage
     * Returns binary format: [version:1][nonce:12][ciphertext+tag]
     */
    encryptOperation(operation: Omit<OfflineOperation, 'id' | 'status' | 'encryptedData' | 'bytesSize' | 'failedCount' | 'retryCount' | 'maxRetries'>, keyMaterial: EncryptionKeyMaterial): Promise<Uint8Array>;
    /**
     * Decrypt operation from queue storage
     */
    decryptOperation(encryptedData: Uint8Array, keyMaterial: EncryptionKeyMaterial): Promise<Omit<OfflineOperation, 'id' | 'status' | 'encryptedData' | 'bytesSize' | 'failedCount' | 'retryCount' | 'maxRetries'>>;
    /**
     * Encrypt a batch of operations for sync payload
     */
    encryptSyncBatch(operations: Array<{
        operationId: string;
        sessionId: string;
        type: string;
        data: Record<string, unknown>;
    }>, keyMaterial: EncryptionKeyMaterial): Promise<EncryptedPayload>;
    /**
     * Decrypt a batch of operations from sync response
     */
    decryptSyncBatch(encrypted: EncryptedPayload, keyMaterial: EncryptionKeyMaterial): Promise<Array<{
        operationId: string;
        sessionId: string;
        type: string;
        data: Record<string, unknown>;
    }>>;
    /**
     * Clear the key cache (call on logout/session end)
     */
    clearKeyCache(): void;
    /**
     * Remove a specific key from cache
     */
    removeKeyFromCache(userId: string, context: string): void;
}
/**
 * Get the singleton encryption service instance
 */
export declare function getOperationEncryption(): OfflineOperationEncryption;
/**
 * Reset the encryption service (for testing)
 */
export declare function resetOperationEncryption(): void;
/**
 * Generate a random operation ID
 */
export declare function generateOperationId(): string;
/**
 * Estimate the encrypted size of an operation
 */
export declare function estimateEncryptedSize(operation: Record<string, unknown>): number;
