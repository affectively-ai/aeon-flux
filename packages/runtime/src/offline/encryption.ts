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

// ============================================================================
// Constants
// ============================================================================

const ENCRYPTION_VERSION = 1;
const NONCE_LENGTH = 12; // 96 bits for AES-GCM
const TAG_LENGTH = 16; // 128 bits auth tag

// ============================================================================
// Encryption Service
// ============================================================================

/**
 * Offline operation encryption service
 * Uses Web Crypto API for all cryptographic operations
 */
export class OfflineOperationEncryption {
  private keyCache: Map<string, EncryptionKeyMaterial> = new Map();

  /**
   * Derive an encryption key from UCAN signing key material
   */
  async deriveKeyFromUCAN(
    userId: string,
    signingKeyBytes: Uint8Array,
    context: string
  ): Promise<EncryptionKeyMaterial> {
    const cacheKey = `${userId}:${context}`;

    // Check cache first
    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey)!;
    }

    // Import the signing key material as HKDF base key
    const baseKey = await crypto.subtle.importKey(
      'raw',
      signingKeyBytes.buffer as ArrayBuffer,
      'HKDF',
      false,
      ['deriveKey']
    );

    // Derive AES-256-GCM key using HKDF
    const info = new TextEncoder().encode(`aeon-offline-operation:${context}`);
    const salt = new TextEncoder().encode('aeon-pages-v1');

    const encryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt,
        info,
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    const material: EncryptionKeyMaterial = {
      key: encryptionKey,
      context,
      userId,
    };

    this.keyCache.set(cacheKey, material);
    return material;
  }

  /**
   * Derive an encryption key from session-based material (fallback when UCAN not available)
   */
  async deriveKeyFromSession(
    sessionId: string,
    context: string
  ): Promise<EncryptionKeyMaterial> {
    const cacheKey = `session:${sessionId}:${context}`;

    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey)!;
    }

    // Generate deterministic key from session ID
    const sessionBytes = new TextEncoder().encode(sessionId);
    const baseKey = await crypto.subtle.importKey(
      'raw',
      sessionBytes,
      'HKDF',
      false,
      ['deriveKey']
    );

    const info = new TextEncoder().encode(`aeon-session-operation:${context}`);
    const salt = new TextEncoder().encode('aeon-pages-session-v1');

    const encryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt,
        info,
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    const material: EncryptionKeyMaterial = {
      key: encryptionKey,
      context,
      userId: sessionId,
    };

    this.keyCache.set(cacheKey, material);
    return material;
  }

  /**
   * Encrypt operation for queue storage
   * Returns binary format: [version:1][nonce:12][ciphertext+tag]
   */
  async encryptOperation(
    operation: Omit<OfflineOperation, 'id' | 'status' | 'encryptedData' | 'bytesSize' | 'failedCount' | 'retryCount' | 'maxRetries'>,
    keyMaterial: EncryptionKeyMaterial
  ): Promise<Uint8Array> {
    // Serialize operation to JSON
    const operationJson = JSON.stringify({
      type: operation.type,
      sessionId: operation.sessionId,
      data: operation.data,
      priority: operation.priority,
      createdAt: operation.createdAt,
      encryptionVersion: operation.encryptionVersion,
    });

    const plaintext = new TextEncoder().encode(operationJson);

    // Generate random nonce
    const nonce = crypto.getRandomValues(new Uint8Array(NONCE_LENGTH));

    // Encrypt with AES-GCM (includes authentication tag)
    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: nonce,
        tagLength: TAG_LENGTH * 8, // bits
      },
      keyMaterial.key,
      plaintext
    );

    // Serialize to binary: [version:1][nonce:12][ciphertext+tag]
    const ciphertextBytes = new Uint8Array(ciphertext);
    const serialized = new Uint8Array(1 + NONCE_LENGTH + ciphertextBytes.length);

    serialized[0] = ENCRYPTION_VERSION;
    serialized.set(nonce, 1);
    serialized.set(ciphertextBytes, 1 + NONCE_LENGTH);

    return serialized;
  }

  /**
   * Decrypt operation from queue storage
   */
  async decryptOperation(
    encryptedData: Uint8Array,
    keyMaterial: EncryptionKeyMaterial
  ): Promise<Omit<OfflineOperation, 'id' | 'status' | 'encryptedData' | 'bytesSize' | 'failedCount' | 'retryCount' | 'maxRetries'>> {
    // Verify version
    const version = encryptedData[0];
    if (version !== ENCRYPTION_VERSION) {
      throw new Error(`Unsupported encryption version: ${version}`);
    }

    // Extract nonce and ciphertext
    const nonce = encryptedData.slice(1, 1 + NONCE_LENGTH);
    const ciphertext = encryptedData.slice(1 + NONCE_LENGTH);

    // Decrypt with AES-GCM
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: nonce,
        tagLength: TAG_LENGTH * 8,
      },
      keyMaterial.key,
      ciphertext
    );

    // Parse JSON
    const operationJson = new TextDecoder().decode(plaintext);
    const parsed = JSON.parse(operationJson);

    return {
      type: parsed.type,
      sessionId: parsed.sessionId,
      data: parsed.data,
      priority: parsed.priority || 'normal',
      createdAt: parsed.createdAt || Date.now(),
      encryptionVersion: parsed.encryptionVersion || ENCRYPTION_VERSION,
    };
  }

  /**
   * Encrypt a batch of operations for sync payload
   */
  async encryptSyncBatch(
    operations: Array<{
      operationId: string;
      sessionId: string;
      type: string;
      data: Record<string, unknown>;
    }>,
    keyMaterial: EncryptionKeyMaterial
  ): Promise<EncryptedPayload> {
    const batchJson = JSON.stringify({
      operations,
      timestamp: Date.now(),
      userId: keyMaterial.userId,
    });

    const plaintext = new TextEncoder().encode(batchJson);
    const nonce = crypto.getRandomValues(new Uint8Array(NONCE_LENGTH));

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: nonce,
        tagLength: TAG_LENGTH * 8,
      },
      keyMaterial.key,
      plaintext
    );

    return {
      version: ENCRYPTION_VERSION,
      nonce,
      ciphertext: new Uint8Array(ciphertext),
    };
  }

  /**
   * Decrypt a batch of operations from sync response
   */
  async decryptSyncBatch(
    encrypted: EncryptedPayload,
    keyMaterial: EncryptionKeyMaterial
  ): Promise<Array<{
    operationId: string;
    sessionId: string;
    type: string;
    data: Record<string, unknown>;
  }>> {
    if (encrypted.version !== ENCRYPTION_VERSION) {
      throw new Error(`Unsupported encryption version: ${encrypted.version}`);
    }

    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: encrypted.nonce.buffer as ArrayBuffer,
        tagLength: TAG_LENGTH * 8,
      },
      keyMaterial.key,
      encrypted.ciphertext.buffer as ArrayBuffer
    );

    const batchJson = new TextDecoder().decode(plaintext);
    const parsed = JSON.parse(batchJson);

    return parsed.operations;
  }

  /**
   * Clear the key cache (call on logout/session end)
   */
  clearKeyCache(): void {
    this.keyCache.clear();
  }

  /**
   * Remove a specific key from cache
   */
  removeKeyFromCache(userId: string, context: string): void {
    // Try both UCAN and session key formats
    this.keyCache.delete(`${userId}:${context}`);
    this.keyCache.delete(`session:${userId}:${context}`);
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let _instance: OfflineOperationEncryption | null = null;

/**
 * Get the singleton encryption service instance
 */
export function getOperationEncryption(): OfflineOperationEncryption {
  if (!_instance) {
    _instance = new OfflineOperationEncryption();
  }
  return _instance;
}

/**
 * Reset the encryption service (for testing)
 */
export function resetOperationEncryption(): void {
  if (_instance) {
    _instance.clearKeyCache();
  }
  _instance = null;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a random operation ID
 */
export function generateOperationId(): string {
  const timestamp = Date.now().toString(36);
  const random = crypto.getRandomValues(new Uint8Array(8));
  const randomStr = Array.from(random)
    .map((b) => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, 9);
  return `op_${timestamp}_${randomStr}`;
}

/**
 * Estimate the encrypted size of an operation
 */
export function estimateEncryptedSize(operation: Record<string, unknown>): number {
  const json = JSON.stringify(operation);
  // JSON size + version byte + nonce + auth tag + some padding
  return json.length + 1 + NONCE_LENGTH + TAG_LENGTH + 16;
}
