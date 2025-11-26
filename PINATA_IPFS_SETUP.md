# Pinata IPFS Integration - FREE & Simple! 🎉

## Why Pinata?

✅ **Completely FREE** - 1GB storage (more than enough for contracts)  
✅ **No credit card required**  
✅ **Simple API** - Just one JWT token  
✅ **Reliable** - Industry-standard IPFS pinning service  
✅ **Fast** - Dedicated IPFS gateway  

## Quick Setup (5 minutes)

### Step 1: Create FREE Pinata Account
1. Go to **https://pinata.cloud**
2. Click "Sign Up" (top right)
3. Enter email and create password
4. Verify your email

### Step 2: Get Your JWT Token
1. Login to your Pinata dashboard
2. Click on **"API Keys"** in the left sidebar
3. Click **"New Key"** (top right)
4. Configure permissions:
   - ✅ Check **"pinFileToIPFS"**
   - Give it a name like "PrivateCharterX Escrow"
5. Click **"Create Key"**
6. **IMPORTANT**: Copy the JWT token immediately (it starts with `eyJ...`)
   - You can only see it once!
   - If you lose it, create a new key

### Step 3: Add to Your `.env` File
Open `/escrow.privatecharterx/.env` and add your JWT:

```env
# Pinata for IPFS (FREE - 1GB storage)
VITE_PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb25JZCI6IjEyMzQ1Ni...

# Development Mode (set to false to enable real uploads)
VITE_DEV_MODE=false
```

### Step 4: Restart Dev Server
```bash
cd escrow.privatecharterx
# Kill current server (Ctrl+C)
npm run dev
```

### Step 5: Test It!
1. Go to `/create-escrow`
2. Fill out Steps 1 & 2
3. Upload a contract file in Step 3
4. Click "Next"
5. ✅ File should upload to Pinata IPFS!
6. ✅ You'll see a real CID like `QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco`

---

## Development vs Production

### Development Mode (Current Default)
```env
VITE_DEV_MODE=true
VITE_PINATA_JWT=  # Empty - not needed
```

**What happens:**
- Files are selected but NOT uploaded to IPFS
- Mock CID is used: `bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi`
- Amber "DEV MODE" badge shows in Step 3
- Perfect for testing the UI without IPFS

### Production Mode (Real Uploads)
```env
VITE_DEV_MODE=false
VITE_PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  # Your JWT
```

**What happens:**
- Files are encrypted with AES-256
- Uploaded to Pinata IPFS
- Real CID is returned
- Files are permanently stored on IPFS
- Only authorized wallets can decrypt

---

## How It Works

### 1. File Encryption (Client-Side)
```typescript
// Generate random AES-256 key
const encryptionKey = generateAESKey();

// Encrypt file with AES-256-GCM
const encryptedBlob = await encryptFile(contractFile, encryptionKey);
```

### 2. Upload to Pinata
```typescript
// Upload encrypted file to Pinata IPFS
const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${PINATA_JWT}` },
  body: formData
});

// Returns: { IpfsHash: "QmXoypiz...", PinSize: 12345, Timestamp: "2025-11-26..." }
```

### 3. Store CID & Encrypted Key
```typescript
// Store in database:
{
  contract_cid: "QmXoypiz...",                    // IPFS hash
  encryption_keys: {
    "0xbuyer...": "encrypted_aes_key_for_buyer",
    "0xseller...": "encrypted_aes_key_for_seller"
  }
}
```

### 4. Download & Decrypt (Later)
```typescript
// Download from Pinata gateway
const file = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);

// Decrypt with AES key (only authorized wallets can decrypt)
const decryptedFile = await decryptFile(encryptedBlob, aesKey);
```

---

## Pinata Dashboard Features

Once you have files uploaded, you can:

1. **View All Files**:
   - Go to https://app.pinata.cloud/pinmanager
   - See all your pinned IPFS files

2. **File Details**:
   - Click any file to see:
     - IPFS CID
     - File size
     - Upload date
     - Gateway URL

3. **Test Downloads**:
   - Click "View" to download via Pinata gateway
   - Note: Encrypted files will appear as garbled data

4. **Monitor Usage**:
   - See storage used (out of 1GB free)
   - Track bandwidth
   - View request stats

---

## Cost Breakdown

### Free Tier (What You Get)
- ✅ **1GB storage** (enough for ~1,000 PDF contracts)
- ✅ **Unlimited bandwidth**
- ✅ **Unlimited requests**
- ✅ **No credit card required**

### If You Need More (Future)
**Picnic Plan - $20/month**:
- 100GB storage
- Advanced features
- Better support

**Contract files are small** - most PDFs are 100-500KB, so 1GB free tier = plenty!

---

## Security Features

### 1. Client-Side Encryption
- Files encrypted BEFORE upload
- Pinata never sees plain text
- AES-256-GCM standard

### 2. Wallet-Based Access Control
```typescript
// Only buyer's wallet can decrypt
const buyerKey = await decryptKeyWithWallet(
  encryptedKey,
  buyerAddress,
  signMessage
);
```

### 3. IPFS Permanence
- Files are immutable (can't be changed)
- CID verifies file integrity
- Distributed across IPFS network

---

## Troubleshooting

### Error: "Pinata JWT not configured"
**Solution**: Add your JWT to `.env` file and set `VITE_DEV_MODE=false`

### Error: "Upload failed: 401 Unauthorized"
**Solution**: 
1. Check JWT is correct (starts with `eyJ...`)
2. Verify API key has "pinFileToIPFS" permission
3. Create new API key if needed

### Error: "Upload failed: 413 Payload Too Large"
**Solution**: File is too large (>10MB limit in code)
- Check `handleFileSelect()` in CreateEscrow.tsx
- Increase limit if needed (Pinata supports up to 100MB)

### Files not showing in Pinata dashboard
**Solution**: 
1. Wait a few seconds (IPFS propagation)
2. Refresh https://app.pinata.cloud/pinmanager
3. Check API key is active

### Dev mode won't disable
**Solution**:
1. Set `VITE_DEV_MODE=false` in `.env`
2. **Restart dev server** (Vite doesn't auto-reload env changes)
3. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)

---

## API Reference

### Pinata Upload Endpoint
```typescript
POST https://api.pinata.cloud/pinning/pinFileToIPFS
Headers: {
  'Authorization': 'Bearer YOUR_JWT_HERE'
}
Body: FormData {
  file: File,
  pinataMetadata: {
    name: "contract.pdf.encrypted",
    keyvalues: {
      encrypted: "true",
      originalFilename: "contract.pdf"
    }
  }
}
Response: {
  IpfsHash: "QmXoypiz...",
  PinSize: 12345,
  Timestamp: "2025-11-26T12:00:00.000Z"
}
```

### Pinata Gateway (Download)
```
https://gateway.pinata.cloud/ipfs/{CID}
```

---

## Comparison: Pinata vs Web3.Storage

| Feature | Pinata | Web3.Storage |
|---------|--------|--------------|
| Free Storage | 1GB | 5GB (deprecated) |
| Setup | Simple (1 JWT) | Complex (API token) |
| Status | Active & Growing | Being sunset |
| Dashboard | Excellent | Basic |
| Speed | Fast | Moderate |
| Reliability | Very High | High |
| **Our Choice** | ✅ **YES** | ❌ No |

**Why we switched to Pinata:**
- Web3.Storage is being deprecated
- Pinata is the industry standard
- Simpler API (just JWT)
- Better dashboard and monitoring
- More reliable service

---

## Next Steps

1. ✅ **Create Pinata account** (5 min)
2. ✅ **Get JWT token**
3. ✅ **Add to `.env` file**
4. ✅ **Test upload**
5. 🚀 **Ship to production!**

Need help? Check the Pinata docs: https://docs.pinata.cloud/
