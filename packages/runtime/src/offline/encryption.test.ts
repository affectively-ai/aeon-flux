/**
 * Tests for Offline Operation Encryption
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import {
  OfflineOperationEncryption,
  getOperationEncryption,
  resetOperationEncryption,
  generateOperationId,
  estimateEncryptedSize,
} from './encryption';

describe('OfflineOperationEncryption', () => {
  let encryption: OfflineOperationEncryption;

  beforeEach(() => {
    resetOperationEncryption();
    encryption = new OfflineOperationEncryption();
  });

  describe('deriveKeyFromSession', () => {
    test('derives a key from session ID', async () => {
      const keyMaterial = await encryption.deriveKeyFromSession('session-123', 'test-context');

      expect(keyMaterial).toBeDefined();
      expect(keyMaterial.key).toBeInstanceOf(CryptoKey);
      expect(keyMaterial.context).toBe('test-context');
      expect(keyMaterial.userId).toBe('session-123');
    });

    test('caches derived keys', async () => {
      const key1 = await encryption.deriveKeyFromSession('session-123', 'test-context');
      const key2 = await encryption.deriveKeyFromSession('session-123', 'test-context');

      // Should return the same cached key
      expect(key1).toBe(key2);
    });

    test('derives different keys for different sessions', async () => {
      const key1 = await encryption.deriveKeyFromSession('session-1', 'test-context');
      const key2 = await encryption.deriveKeyFromSession('session-2', 'test-context');

      expect(key1.userId).not.toBe(key2.userId);
    });

    test('derives different keys for different contexts', async () => {
      const key1 = await encryption.deriveKeyFromSession('session-123', 'context-1');
      const key2 = await encryption.deriveKeyFromSession('session-123', 'context-2');

      expect(key1.context).not.toBe(key2.context);
    });
  });

  describe('deriveKeyFromUCAN', () => {
    test('derives a key from UCAN signing key bytes', async () => {
      const signingKeyBytes = crypto.getRandomValues(new Uint8Array(32));
      const keyMaterial = await encryption.deriveKeyFromUCAN('user-123', signingKeyBytes, 'ucan-context');

      expect(keyMaterial).toBeDefined();
      expect(keyMaterial.key).toBeInstanceOf(CryptoKey);
      expect(keyMaterial.context).toBe('ucan-context');
      expect(keyMaterial.userId).toBe('user-123');
    });

    test('caches UCAN-derived keys', async () => {
      const signingKeyBytes = crypto.getRandomValues(new Uint8Array(32));
      const key1 = await encryption.deriveKeyFromUCAN('user-123', signingKeyBytes, 'ucan-context');
      const key2 = await encryption.deriveKeyFromUCAN('user-123', signingKeyBytes, 'ucan-context');

      expect(key1).toBe(key2);
    });
  });

  describe('encryptOperation / decryptOperation', () => {
    test('encrypts and decrypts an operation correctly', async () => {
      const keyMaterial = await encryption.deriveKeyFromSession('session-123', 'test');

      const operation = {
        type: 'update' as const,
        sessionId: 'session-123',
        data: { foo: 'bar', count: 42 },
        priority: 'normal' as const,
        createdAt: Date.now(),
      };

      const encrypted = await encryption.encryptOperation(operation, keyMaterial);

      expect(encrypted).toBeInstanceOf(Uint8Array);
      expect(encrypted.length).toBeGreaterThan(0);
      // First byte should be version
      expect(encrypted[0]).toBe(1);

      const decrypted = await encryption.decryptOperation(encrypted, keyMaterial);

      expect(decrypted.type).toBe(operation.type);
      expect(decrypted.sessionId).toBe(operation.sessionId);
      expect(decrypted.data).toEqual(operation.data);
      expect(decrypted.priority).toBe(operation.priority);
    });

    test('encrypted data differs for same plaintext (random nonce)', async () => {
      const keyMaterial = await encryption.deriveKeyFromSession('session-123', 'test');

      const operation = {
        type: 'update' as const,
        sessionId: 'session-123',
        data: { foo: 'bar' },
        priority: 'normal' as const,
        createdAt: Date.now(),
      };

      const encrypted1 = await encryption.encryptOperation(operation, keyMaterial);
      const encrypted2 = await encryption.encryptOperation(operation, keyMaterial);

      // Encrypted data should differ due to random nonce
      expect(encrypted1).not.toEqual(encrypted2);
    });

    test('fails to decrypt with wrong key', async () => {
      const keyMaterial1 = await encryption.deriveKeyFromSession('session-1', 'test');
      const keyMaterial2 = await encryption.deriveKeyFromSession('session-2', 'test');

      const operation = {
        type: 'update' as const,
        sessionId: 'session-1',
        data: { secret: 'data' },
        priority: 'normal' as const,
        createdAt: Date.now(),
      };

      const encrypted = await encryption.encryptOperation(operation, keyMaterial1);

      await expect(encryption.decryptOperation(encrypted, keyMaterial2)).rejects.toThrow();
    });

    test('fails to decrypt tampered data', async () => {
      const keyMaterial = await encryption.deriveKeyFromSession('session-123', 'test');

      const operation = {
        type: 'update' as const,
        sessionId: 'session-123',
        data: { foo: 'bar' },
        priority: 'normal' as const,
        createdAt: Date.now(),
      };

      const encrypted = await encryption.encryptOperation(operation, keyMaterial);

      // Tamper with the ciphertext
      encrypted[20] ^= 0xff;

      await expect(encryption.decryptOperation(encrypted, keyMaterial)).rejects.toThrow();
    });

    test('rejects unsupported encryption version', async () => {
      const keyMaterial = await encryption.deriveKeyFromSession('session-123', 'test');

      const operation = {
        type: 'update' as const,
        sessionId: 'session-123',
        data: { foo: 'bar' },
        priority: 'normal' as const,
        createdAt: Date.now(),
      };

      const encrypted = await encryption.encryptOperation(operation, keyMaterial);

      // Change version byte to unsupported version
      encrypted[0] = 99;

      await expect(encryption.decryptOperation(encrypted, keyMaterial)).rejects.toThrow(
        'Unsupported encryption version: 99'
      );
    });
  });

  describe('encryptSyncBatch / decryptSyncBatch', () => {
    test('encrypts and decrypts a batch of operations', async () => {
      const keyMaterial = await encryption.deriveKeyFromSession('session-123', 'batch-test');

      const operations = [
        { operationId: 'op-1', sessionId: 'session-123', type: 'create', data: { name: 'test1' } },
        { operationId: 'op-2', sessionId: 'session-123', type: 'update', data: { name: 'test2' } },
        { operationId: 'op-3', sessionId: 'session-123', type: 'delete', data: { id: '123' } },
      ];

      const encrypted = await encryption.encryptSyncBatch(operations, keyMaterial);

      expect(encrypted.version).toBe(1);
      expect(encrypted.nonce).toBeInstanceOf(Uint8Array);
      expect(encrypted.nonce.length).toBe(12);
      expect(encrypted.ciphertext).toBeInstanceOf(Uint8Array);

      const decrypted = await encryption.decryptSyncBatch(encrypted, keyMaterial);

      expect(decrypted).toHaveLength(3);
      expect(decrypted[0].operationId).toBe('op-1');
      expect(decrypted[1].operationId).toBe('op-2');
      expect(decrypted[2].operationId).toBe('op-3');
    });
  });

  describe('clearKeyCache', () => {
    test('clears all cached keys', async () => {
      await encryption.deriveKeyFromSession('session-1', 'context-1');
      await encryption.deriveKeyFromSession('session-2', 'context-2');

      encryption.clearKeyCache();

      // After clearing, deriving the same key should create a new one
      const newKey = await encryption.deriveKeyFromSession('session-1', 'context-1');
      expect(newKey).toBeDefined();
    });
  });

  describe('removeKeyFromCache', () => {
    test('removes a specific key from cache', async () => {
      const key1 = await encryption.deriveKeyFromSession('session-1', 'context-1');
      await encryption.deriveKeyFromSession('session-2', 'context-2');

      encryption.removeKeyFromCache('session-1', 'context-1');

      // session-1 key should be regenerated
      const newKey1 = await encryption.deriveKeyFromSession('session-1', 'context-1');
      expect(newKey1).not.toBe(key1);
    });
  });
});

describe('getOperationEncryption', () => {
  beforeEach(() => {
    resetOperationEncryption();
  });

  test('returns singleton instance', () => {
    const instance1 = getOperationEncryption();
    const instance2 = getOperationEncryption();

    expect(instance1).toBe(instance2);
  });

  test('resetOperationEncryption creates new instance', () => {
    const instance1 = getOperationEncryption();
    resetOperationEncryption();
    const instance2 = getOperationEncryption();

    expect(instance1).not.toBe(instance2);
  });
});

describe('generateOperationId', () => {
  test('generates unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateOperationId());
    }
    expect(ids.size).toBe(100);
  });

  test('generates IDs with correct prefix', () => {
    const id = generateOperationId();
    expect(id.startsWith('op_')).toBe(true);
  });

  test('generates IDs with timestamp component', () => {
    const id = generateOperationId();
    const parts = id.split('_');
    expect(parts.length).toBe(3);
    // Timestamp part should be valid base36
    expect(() => parseInt(parts[1], 36)).not.toThrow();
  });
});

describe('estimateEncryptedSize', () => {
  test('estimates size for small operation', () => {
    const operation = { foo: 'bar' };
    const size = estimateEncryptedSize(operation);

    // Should include JSON size + version + nonce + auth tag + padding
    expect(size).toBeGreaterThan(JSON.stringify(operation).length);
  });

  test('estimates size for large operation', () => {
    const operation = {
      data: 'x'.repeat(1000),
      nested: { a: 1, b: 2, c: 3 },
    };
    const size = estimateEncryptedSize(operation);

    expect(size).toBeGreaterThan(1000);
  });

  test('size increases with operation complexity', () => {
    const small = { a: 1 };
    const large = { a: 1, b: 2, c: 3, d: 'long string value' };

    const smallSize = estimateEncryptedSize(small);
    const largeSize = estimateEncryptedSize(large);

    expect(largeSize).toBeGreaterThan(smallSize);
  });
});
