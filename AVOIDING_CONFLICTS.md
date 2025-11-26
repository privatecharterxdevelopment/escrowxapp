# ⚠️ Avoiding Conflicts with DexRais.funds

## Critical: Both Projects Can Run Simultaneously

Your **DexRais.funds** and **PrivateCharterX Escrow** are completely separate projects and should NOT interfere with each other.

## 🔴 Critical Differences (MUST BE DIFFERENT)

### 1. WalletConnect / Reown AppKit Project ID ⚠️

**MOST IMPORTANT**: Each project needs its own WalletConnect Project ID!

**DexRais.funds**: Uses one Project ID
**Escrow**: MUST use a DIFFERENT Project ID

#### How to Create Separate Project ID:

1. Go to https://cloud.walletconnect.com/
2. Create NEW project
3. Name: **"PrivateCharterX Escrow"** (NOT "DexRaise.funds")
4. Copy the new Project ID
5. Add to Escrow's `.env`:
   ```
   VITE_WALLETCONNECT_PROJECT_ID=<NEW_PROJECT_ID_HERE>
   ```

**Why?** WalletConnect tracks analytics and sessions per Project ID. Using the same ID would mix data from both apps.

### 2. Smart Contract Addresses

**DexRais.funds**: Uses its own fundraising contracts (Gnosis Safe, USDC, etc.)
**Escrow**: Uses FlexibleEscrow.sol (completely different contract)

✅ **No conflict** - They use different contracts on different addresses.

### 3. App Metadata & URLs

**DexRais.funds**:
- Name: "DexRaise.funds"
- URL: https://dexraise.funds
- Description: "Decentralized fundraising..."

**Escrow**:
- Name: "PrivateCharterX Escrow"
- URL: https://escrow.privatecharterx.com (or different domain)
- Description: "Decentralized Escrow as a Service..."

Already configured in `src/lib/wagmi.tsx` - ✅ **No conflict**

### 4. Fee Collector Wallets

**DexRais.funds**: Has `VITE_PLATFORM_WALLET` for fundraising fees
**Escrow**: Should have `VITE_ESCROW_FEE_COLLECTOR` for escrow fees

⚠️ Use DIFFERENT wallet addresses to keep finances separate.

## 🟡 Optional Differences (Can Be Same or Different)

### 5. Supabase Database

**Option A - Share Supabase (Recommended for Cost Savings)**:
- Use same Supabase URL & Key
- Escrow uses different table prefix: `escrow_users`, `escrow_contracts`, etc.
- DexRais uses: `users`, `campaigns`, etc.
- ✅ No conflict if table names are different

**Option B - Separate Supabase Projects**:
- Create new Supabase project for Escrow
- Complete isolation
- Higher cost (2 projects)

**Current Setup**: Escrow doesn't strictly require Supabase (wallet-only auth works), so you can skip it entirely if desired.

### 6. Analytics & Monitoring

If using Google Analytics, consider:
- **DexRais**: `GA_MEASUREMENT_ID_1`
- **Escrow**: `GA_MEASUREMENT_ID_2`

This keeps analytics separated.

## 📝 Environment Variables Comparison

### DexRais.funds (.env)
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_WALLETCONNECT_PROJECT_ID=abc123...    # ← DIFFERENT
VITE_PLATFORM_WALLET=0x1111...              # ← DIFFERENT
VITE_USDC_ADDRESS=0x833589...               # (Only DexRais needs this)
VITE_CHF_TO_USDC=1.10                       # (Only DexRais needs this)
VITE_RESEND_API_KEY=re_xxx...               # (Only DexRais needs this)
```

### PrivateCharterX Escrow (.env)
```env
VITE_SUPABASE_URL=https://xxx.supabase.co   # ← Can be SAME
VITE_SUPABASE_ANON_KEY=xxx                  # ← Can be SAME
VITE_WALLETCONNECT_PROJECT_ID=def456...     # ← MUST BE DIFFERENT!
VITE_ESCROW_CONTRACT_ADDRESS=0x2222...      # ← Unique to Escrow
VITE_ESCROW_NETWORK=base-sepolia            # ← Escrow-specific
VITE_ESCROW_FEE_COLLECTOR=0x3333...         # ← DIFFERENT wallet!
VITE_IPFS_GATEWAY=https://...               # ← Only Escrow needs this
```

## 🌐 Network Configuration

Both projects use **Base Network**, which is fine! They use different smart contracts.

**DexRais**: Base Mainnet (Chain ID: 8453)
**Escrow**: Base Sepolia (testing) → Base Mainnet (production)

✅ **No conflict** - Same network, different contracts.

## 🚀 Deployment Separation

### Domains/Subdomains

**DexRais.funds**:
- https://dexraise.funds

**PrivateCharterX Escrow**:
- https://escrow.privatecharterx.com
- OR https://privatecharterx.com/escrow
- OR completely different domain

✅ Different domains = zero conflict

### Hosting

Both can be on:
- Same Vercel account (different projects)
- Different hosting providers
- Same provider, different projects

✅ **No conflict** as long as different deployment URLs

## ✅ Pre-Deployment Checklist

Before deploying Escrow to production:

- [ ] Created NEW WalletConnect Project ID (not DexRais's)
- [ ] Set `VITE_WALLETCONNECT_PROJECT_ID` in Escrow `.env`
- [ ] Deployed `FlexibleEscrow.sol` to Base network
- [ ] Set `VITE_ESCROW_CONTRACT_ADDRESS` in Escrow `.env`
- [ ] Different fee collector wallet (`VITE_ESCROW_FEE_COLLECTOR`)
- [ ] Different domain/subdomain for deployment
- [ ] Tested locally: Both apps work independently
- [ ] Verified: Connecting wallet to one doesn't affect the other

## 🧪 Testing Both Projects

### Test 1: Local Testing
```bash
# Terminal 1 - DexRais
cd "dexrais.funds-main 2"
npm run dev
# Runs on http://localhost:5173

# Terminal 2 - Escrow
cd escrow.privatecharterx
npm run dev
# Runs on http://localhost:5174 (different port automatically)
```

Open both in different browser tabs - they should work independently.

### Test 2: Wallet Connection
1. Connect wallet to DexRais (port 5173)
2. Check it works
3. Connect wallet to Escrow (port 5174)
4. Check it works
5. Verify: Both apps maintain separate states

✅ If both work without errors, you're good!

## 🔒 Security Best Practices

1. **Separate Wallets for Fees**
   - DexRais fees → Wallet A
   - Escrow fees → Wallet B
   - Easier accounting & tracking

2. **Different Admin Keys**
   - Don't use same private key for both contracts
   - Limits blast radius if one is compromised

3. **Separate Environment Files**
   - Never copy `.env` from DexRais to Escrow
   - Each project has its own secrets

## 📞 If You Encounter Conflicts

### Issue: "WalletConnect session conflict"
**Solution**: Create separate WalletConnect Project ID

### Issue: "Wrong contract called"
**Solution**: Verify `VITE_ESCROW_CONTRACT_ADDRESS` is set correctly

### Issue: "Fees going to wrong wallet"
**Solution**: Check `VITE_ESCROW_FEE_COLLECTOR` vs `VITE_PLATFORM_WALLET`

### Issue: "Supabase table collision"
**Solution**: Use different table prefixes or separate Supabase projects

## 🎯 Summary

### Must Be Different:
1. ✅ WalletConnect Project ID
2. ✅ Smart Contract Addresses
3. ✅ Fee Collector Wallets
4. ✅ App Metadata (name, URL, description)
5. ✅ Deployment URLs/Domains

### Can Be Same:
1. ✅ Supabase (if using different tables)
2. ✅ Base Network
3. ✅ Vercel/Netlify Account
4. ✅ Git Repository (different folders)

### Not Needed by Escrow (DexRais-only):
- `VITE_USDC_ADDRESS` (Escrow uses native ETH)
- `VITE_CHF_TO_USDC` (No pricing conversion needed)
- `VITE_RESEND_API_KEY` (No email notifications needed)

---

**Result**: Both projects can coexist peacefully on the same Base network, same hosting provider, even same Supabase database - as long as they have **different WalletConnect Project IDs** and **different smart contracts**.

🎉 You're all set for conflict-free deployment!
