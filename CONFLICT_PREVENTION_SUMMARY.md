# 🛡️ Conflict Prevention Summary

## Quick Checklist: DexRais.funds vs PrivateCharterX Escrow

### ✅ What's Already Different (No Action Needed)

| Feature | DexRais.funds | PrivateCharterX Escrow | Status |
|---------|---------------|------------------------|--------|
| **App Name** | "DexRaise.funds" | "PrivateCharterX Escrow" | ✅ Different |
| **App URL** | dexraise.funds | escrow.privatecharterx.com | ✅ Different |
| **Smart Contracts** | Gnosis Safe, USDC, etc. | FlexibleEscrow.sol | ✅ Different |
| **Smart Contract Address** | 0x... (DexRais) | 0x... (Escrow) | ✅ Different |
| **Purpose** | Fundraising/Campaigns | Escrow Services | ✅ Different |
| **Networks** | Base Mainnet | Base Mainnet & Sepolia | ✅ Compatible |

### ⚠️ What MUST Be Different (Action Required)

| Item | Action Required | Priority |
|------|----------------|----------|
| **WalletConnect Project ID** | Create NEW project at cloud.walletconnect.com | 🔴 CRITICAL |
| **Fee Collector Wallet** | Use different wallet address | 🟡 Important |
| **Domain/Deployment** | Deploy to different URL | 🟡 Important |

### 🟢 What CAN Be Same (Optional)

| Item | Can Share? | Notes |
|------|-----------|-------|
| **Supabase** | ✅ Yes | Use different table prefixes |
| **Hosting Account** | ✅ Yes | Different deployment projects |
| **Base Network** | ✅ Yes | Different smart contracts |
| **Git Repository** | ✅ Yes | Different folders |

## 🎯 Action Items Before Deployment

### 1. WalletConnect Project ID (CRITICAL!)

```bash
# ❌ WRONG: Using same Project ID as DexRais
VITE_WALLETCONNECT_PROJECT_ID=abc123def456...

# ✅ CORRECT: New Project ID for Escrow
VITE_WALLETCONNECT_PROJECT_ID=xyz789ghi012...
```

**Steps**:
1. Visit https://cloud.walletconnect.com/
2. Click "Create New Project"
3. Name: "PrivateCharterX Escrow"
4. Copy new Project ID
5. Add to `.env`

### 2. Fee Collector Wallet

```bash
# DexRais uses:
VITE_PLATFORM_WALLET=0x1111111111111111111111111111111111111111

# Escrow should use DIFFERENT wallet:
VITE_ESCROW_FEE_COLLECTOR=0x2222222222222222222222222222222222222222
```

**Why?** Separate accounting, easier tracking, security isolation.

### 3. Deployment URL

```bash
# DexRais deployed at:
https://dexraise.funds

# Escrow should deploy to:
https://escrow.privatecharterx.com
# OR
https://privatecharterx.com/escrow
# OR
https://escrow.example.com
```

**Why?** Prevents browser cache/cookie conflicts, cleaner separation.

## 📊 Environment Variables Side-by-Side

### DexRais.funds `.env`
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=key_xxx
VITE_WALLETCONNECT_PROJECT_ID=dexrais_project_id_123
VITE_PLATFORM_WALLET=0x1111...
VITE_USDC_ADDRESS=0x833589...
VITE_CHF_TO_USDC=1.10
VITE_RESEND_API_KEY=re_xxx
VITE_CHAIN_ID=8453
```

### PrivateCharterX Escrow `.env`
```env
VITE_SUPABASE_URL=https://xxx.supabase.co          # ← Can be same
VITE_SUPABASE_ANON_KEY=key_xxx                     # ← Can be same
VITE_WALLETCONNECT_PROJECT_ID=escrow_project_id_789  # ← MUST differ!
VITE_ESCROW_CONTRACT_ADDRESS=0x2222...             # ← Unique
VITE_ESCROW_NETWORK=base-sepolia                   # ← Escrow-specific
VITE_ESCROW_FEE_COLLECTOR=0x3333...                # ← Should differ!
VITE_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/  # ← Optional
```

**Notice**: Escrow doesn't need `VITE_USDC_ADDRESS`, `VITE_CHF_TO_USDC`, or `VITE_RESEND_API_KEY` - those are DexRais-specific.

## 🧪 Testing Both Apps Together

### Local Development (Both Running)

```bash
# Terminal 1 - DexRais
cd "dexrais.funds-main 2"
npm run dev
# → http://localhost:5173

# Terminal 2 - Escrow
cd escrow.privatecharterx
npm run dev
# → http://localhost:5174 (auto-increments port)
```

**Test**:
1. Open both URLs in browser
2. Connect wallet to DexRais
3. Connect wallet to Escrow
4. Verify both work independently
5. Check WalletConnect shows 2 active connections

✅ If both apps work without errors = no conflicts!

## 🚨 Common Pitfalls to Avoid

### ❌ Mistake #1: Copying `.env` from DexRais to Escrow
```bash
# DON'T DO THIS!
cp ../dexrais.funds-main\ 2/.env .env
```
**Why?** This copies DexRais's WalletConnect Project ID, causing conflicts.

### ❌ Mistake #2: Using Same WalletConnect Project ID
```env
# Both projects have:
VITE_WALLETCONNECT_PROJECT_ID=abc123same...
```
**Result**: Analytics data mixed, potential session issues.

### ❌ Mistake #3: Deploying to Same Domain
```
https://dexraise.funds → DexRais
https://dexraise.funds/escrow → Escrow (❌ DON'T DO THIS)
```
**Why?** Routing conflicts, state management issues.

**Better**:
```
https://dexraise.funds → DexRais
https://escrow.privatecharterx.com → Escrow ✅
```

## ✅ Verification Checklist

Before going live with Escrow:

- [ ] Created NEW WalletConnect Project ID
- [ ] Verified Project ID is different from DexRais
- [ ] Set `VITE_WALLETCONNECT_PROJECT_ID` in Escrow `.env`
- [ ] Different fee collector wallet configured
- [ ] Deployed FlexibleEscrow.sol smart contract
- [ ] Set `VITE_ESCROW_CONTRACT_ADDRESS` in `.env`
- [ ] Different deployment URL/domain
- [ ] Tested both apps locally (different ports)
- [ ] Verified wallet connection works in both
- [ ] No console errors about conflicts
- [ ] WalletConnect dashboard shows 2 separate projects

## 📞 If You See Conflicts

### Symptom: "Session already exists"
**Solution**: Check if using same WalletConnect Project ID. Create new one.

### Symptom: "Wrong contract called"
**Solution**: Verify `VITE_ESCROW_CONTRACT_ADDRESS` is set correctly and is FlexibleEscrow, not DexRais contracts.

### Symptom: "Fees going to DexRais wallet"
**Solution**: Check smart contract deployment used correct fee collector address.

### Symptom: Analytics data is mixed
**Solution**: Use different WalletConnect Project IDs and optionally different Google Analytics IDs.

## 🎉 Result

With these precautions:
- ✅ DexRais.funds continues running unchanged
- ✅ PrivateCharterX Escrow runs independently
- ✅ Both can share Base Network
- ✅ Both can share Supabase (optional)
- ✅ Both can use same hosting account
- ✅ Zero interference between apps

---

**Most Important**: Create a NEW WalletConnect Project ID for Escrow! Everything else is flexible.

See `AVOIDING_CONFLICTS.md` for detailed explanations.
