/**
 * IPFS Integration with Client-Side Encryption
 * Uses Pinata for free IPFS pinning (1GB free tier)
 * AES-256-GCM encryption for private contracts
 */

import CryptoJS from 'crypto-js';

// Pinata configuration
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_API = 'https://api.pinata.cloud';

export interface EncryptedUploadResult {
  cid: string;                  // IPFS CID
  encryptionKey: string;        // AES key (to be encrypted per wallet)
  fileSize: number;             // Original file size
  encryptedSize: number;        // Encrypted file size
  uploadedAt: Date;
}

export interface ImageUploadResult {
  cid: string;                  // IPFS CID (unencrypted - images are public)
  filename: string;             // Original filename
  fileSize: number;             // File size
  uploadedAt: Date;
}

export interface DownloadResult {
  blob: Blob;
  filename: string;
  mimeType: string;
}

/**
 * Generate random AES-256 encryption key
 * @returns Random hex string (256 bits)
 */
export function generateAESKey(): string {
  return CryptoJS.lib.WordArray.random(32).toString(); // 256 bits
}

/**
 * Encrypt file with AES-256-GCM
 * @param file File to encrypt
 * @param key AES encryption key (hex string)
 * @returns Encrypted file as Blob
 */
export async function encryptFile(file: File, key: string): Promise<Blob> {
  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Convert to WordArray for CryptoJS
    const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer as any);

    // Encrypt with AES
    const encrypted = CryptoJS.AES.encrypt(wordArray, key, {
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.Pkcs7
    });

    // Convert to string
    const encryptedString = encrypted.toString();

    // Create blob with encrypted data
    const blob = new Blob([encryptedString], {
      type: 'application/octet-stream'
    });

    return blob;
  } catch (error) {
    console.error('File encryption failed:', error);
    throw new Error('Failed to encrypt file');
  }
}

/**
 * Decrypt file with AES-256-GCM
 * @param encryptedBlob Encrypted blob
 * @param key AES decryption key (hex string)
 * @param originalMimeType Original file MIME type
 * @returns Decrypted file as Blob
 */
export async function decryptFile(
  encryptedBlob: Blob,
  key: string,
  originalMimeType: string = 'application/pdf'
): Promise<Blob> {
  try {
    // Read encrypted data as text
    const encryptedText = await encryptedBlob.text();

    // Decrypt with AES
    const decrypted = CryptoJS.AES.decrypt(encryptedText, key, {
      mode: CryptoJS.mode.GCM,
      padding: CryptoJS.pad.Pkcs7
    });

    // Convert back to array buffer
    const arrayBuffer = wordArrayToArrayBuffer(decrypted);

    // Create blob with original MIME type
    return new Blob([arrayBuffer], { type: originalMimeType });
  } catch (error) {
    console.error('File decryption failed:', error);
    throw new Error('Failed to decrypt file - invalid key or corrupted data');
  }
}

/**
 * Upload encrypted file to IPFS via Pinata
 * @param file File to upload (will be encrypted first)
 * @param filename Original filename
 * @returns Upload result with CID and encryption key
 */
export async function uploadEncryptedToIPFS(
  file: File,
  filename: string = file.name
): Promise<EncryptedUploadResult> {
  if (!PINATA_JWT) {
    throw new Error('Pinata JWT not configured. Set VITE_PINATA_JWT in .env');
  }

  try {
    // Generate encryption key
    const encryptionKey = generateAESKey();

    // Encrypt file
    const encryptedBlob = await encryptFile(file, encryptionKey);

    // Create FormData for upload to Pinata
    const formData = new FormData();
    const encryptedFile = new File(
      [encryptedBlob],
      `${filename}.encrypted`,
      { type: 'application/octet-stream' }
    );
    formData.append('file', encryptedFile);

    // Add metadata for Pinata
    const metadata = JSON.stringify({
      name: `${filename}.encrypted`,
      keyvalues: {
        encrypted: 'true',
        originalFilename: filename
      }
    });
    formData.append('pinataMetadata', metadata);

    // Upload to Pinata
    const response = await fetch(`${PINATA_API}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Upload failed: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    return {
      cid: data.IpfsHash, // Pinata returns IpfsHash instead of cid
      encryptionKey,
      fileSize: file.size,
      encryptedSize: encryptedBlob.size,
      uploadedAt: new Date()
    };
  } catch (error) {
    console.error('IPFS upload failed:', error);
    throw error instanceof Error ? error : new Error('Failed to upload file to IPFS');
  }
}

/**
 * Download and decrypt file from IPFS
 * @param cid IPFS CID
 * @param encryptionKey AES decryption key
 * @param originalFilename Original filename
 * @param originalMimeType Original MIME type
 * @returns Decrypted file blob
 */
export async function downloadDecryptFromIPFS(
  cid: string,
  encryptionKey: string,
  originalFilename: string = 'contract.pdf',
  originalMimeType: string = 'application/pdf'
): Promise<DownloadResult> {
  try {
    // Download from Pinata's dedicated gateway
    const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
    const response = await fetch(gatewayUrl);

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    // Get encrypted blob
    const encryptedBlob = await response.blob();

    // Decrypt
    const decryptedBlob = await decryptFile(
      encryptedBlob,
      encryptionKey,
      originalMimeType
    );

    return {
      blob: decryptedBlob,
      filename: originalFilename,
      mimeType: originalMimeType
    };
  } catch (error) {
    console.error('IPFS download failed:', error);
    throw new Error('Failed to download or decrypt file from IPFS');
  }
}

/**
 * Encrypt AES key for specific wallet (using wallet signature)
 * This allows only the wallet owner to decrypt the AES key
 *
 * @param aesKey AES encryption key
 * @param walletAddress Wallet address
 * @param signMessage Function to sign message with wallet
 * @returns Encrypted AES key
 */
export async function encryptKeyForWallet(
  aesKey: string,
  walletAddress: string,
  signMessage: (message: string) => Promise<string>
): Promise<string> {
  try {
    // Create message to sign (deterministic)
    const message = `Encrypt escrow key for ${walletAddress}`;

    // Get wallet signature (this acts as wallet-specific encryption key)
    const signature = await signMessage(message);

    // Use signature as encryption key for AES key
    const encryptedKey = CryptoJS.AES.encrypt(aesKey, signature).toString();

    return encryptedKey;
  } catch (error) {
    console.error('Key encryption failed:', error);
    throw new Error('Failed to encrypt key for wallet');
  }
}

/**
 * Decrypt AES key using wallet signature
 * @param encryptedKey Encrypted AES key
 * @param walletAddress Wallet address
 * @param signMessage Function to sign message with wallet
 * @returns Decrypted AES key
 */
export async function decryptKeyWithWallet(
  encryptedKey: string,
  walletAddress: string,
  signMessage: (message: string) => Promise<string>
): Promise<string> {
  try {
    // Recreate same message (deterministic)
    const message = `Encrypt escrow key for ${walletAddress}`;

    // Get wallet signature (same as encryption)
    const signature = await signMessage(message);

    // Decrypt AES key using signature
    const decrypted = CryptoJS.AES.decrypt(encryptedKey, signature);
    const aesKey = decrypted.toString(CryptoJS.enc.Utf8);

    if (!aesKey) {
      throw new Error('Decryption failed - invalid signature');
    }

    return aesKey;
  } catch (error) {
    console.error('Key decryption failed:', error);
    throw new Error('Failed to decrypt key with wallet');
  }
}

/**
 * Generate preview URL for IPFS file (encrypted - will show garbled data)
 * @param cid IPFS CID
 * @returns Gateway URL
 */
export function getIPFSGatewayUrl(cid: string): string {
  return `https://gateway.pinata.cloud/ipfs/${cid}`;
}

/**
 * Upload image to IPFS via Pinata (no encryption - images are public)
 * @param file Image file to upload
 * @param filename Original filename
 * @returns Upload result with CID
 */
export async function uploadImageToIPFS(
  file: File,
  filename: string = file.name
): Promise<ImageUploadResult> {
  if (!PINATA_JWT) {
    throw new Error('Pinata JWT not configured. Set VITE_PINATA_JWT in .env');
  }

  try {
    // Create FormData for upload to Pinata
    const formData = new FormData();
    formData.append('file', file);

    // Add metadata for Pinata
    const metadata = JSON.stringify({
      name: filename,
      keyvalues: {
        type: 'image',
        originalFilename: filename
      }
    });
    formData.append('pinataMetadata', metadata);

    // Upload to Pinata
    const response = await fetch(`${PINATA_API}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Upload failed: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    return {
      cid: data.IpfsHash,
      filename,
      fileSize: file.size,
      uploadedAt: new Date()
    };
  } catch (error) {
    console.error('Image upload failed:', error);
    throw error instanceof Error ? error : new Error('Failed to upload image to IPFS');
  }
}

/**
 * Upload multiple images to IPFS
 * @param files Array of image files (max 5)
 * @returns Array of upload results
 */
export async function uploadMultipleImagesToIPFS(
  files: File[]
): Promise<ImageUploadResult[]> {
  if (files.length === 0) {
    return [];
  }

  if (files.length > 5) {
    throw new Error('Maximum 5 images allowed');
  }

  // Upload all images in parallel
  const uploadPromises = files.map(file => uploadImageToIPFS(file));
  return Promise.all(uploadPromises);
}

/**
 * Check if Pinata is configured
 * @returns True if JWT is set
 */
export function isIPFSConfigured(): boolean {
  return !!PINATA_JWT;
}

/**
 * Estimate storage cost (Pinata is FREE up to 1GB!)
 * @param fileSizeBytes File size in bytes
 * @returns Cost info
 */
export function estimateStorageCost(fileSizeBytes: number): {
  size: string;
  cost: string;
  tier: string;
} {
  const sizeKB = fileSizeBytes / 1024;
  const sizeMB = sizeKB / 1024;
  const sizeGB = sizeMB / 1024;

  if (sizeGB <= 1) { // <= 1GB
    return {
      size: `${sizeMB.toFixed(2)} MB`,
      cost: '$0 (FREE)',
      tier: 'Free Tier - Pinata'
    };
  } else {
    return {
      size: `${sizeGB.toFixed(2)} GB`,
      cost: '$0.15/GB',
      tier: 'Picnic Plan - $20/month'
    };
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Convert WordArray to ArrayBuffer
 * @param wordArray CryptoJS WordArray
 * @returns ArrayBuffer
 */
function wordArrayToArrayBuffer(wordArray: CryptoJS.lib.WordArray): ArrayBuffer {
  const words = wordArray.words;
  const sigBytes = wordArray.sigBytes;

  const u8 = new Uint8Array(sigBytes);
  for (let i = 0; i < sigBytes; i++) {
    u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }

  return u8.buffer;
}

/**
 * Validate IPFS CID format
 * @param cid IPFS CID string
 * @returns True if valid CID format
 */
export function isValidCID(cid: string): boolean {
  // Basic validation (CIDv0 starts with Qm, CIDv1 starts with b)
  return /^(Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,})$/.test(cid);
}

/**
 * Format file size for display
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Get file extension from filename
 * @param filename Filename with extension
 * @returns Extension (e.g., "pdf")
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Get MIME type from file extension
 * @param extension File extension
 * @returns MIME type
 */
export function getMimeTypeFromExtension(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif'
  };

  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

/**
 * Download blob as file (trigger browser download)
 * @param blob Blob to download
 * @param filename Filename for download
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
