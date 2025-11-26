# Deployment Guide - PrivateCharterX Escrow

Complete guide to deploying the PrivateCharterX Escrow platform to production.

## Prerequisites

- Node.js v18+ installed
- MetaMask or another Web3 wallet
- Base network testnet ETH (for Sepolia) or mainnet ETH
- Supabase account (optional, if using authentication)
- WalletConnect Project ID

## 1. Installation

```bash
cd escrow.privatecharterx
npm install
```

## 2. Environment Configuration

Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Configure the following variables:

```env
# Supabase (Optional - Can share with DexRais or use separate)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# WalletConnect - ⚠️ MUST BE DIFFERENT FROM DEXRAIS!
VITE_WALLETCONNECT_PROJECT_ID=your_NEW_escrow_project_id

# Escrow Smart Contract (set after deployment)
VITE_ESCROW_CONTRACT_ADDRESS=

# Network (base-sepolia for testnet, base for mainnet)
VITE_ESCROW_NETWORK=base-sepolia

# Fee Collector (where escrow fees go) - ⚠️ DIFFERENT FROM DEXRAIS!
VITE_ESCROW_FEE_COLLECTOR=0xYourEscrowFeeCollectorAddress

# Base RPC
VITE_BASE_RPC_URL=https://sepolia.base.org
```

### ⚠️ CRITICAL: Get WalletConnect Project ID (Separate from DexRais!)

**IMPORTANT**: If DexRais.funds is already live, you MUST create a **separate** WalletConnect Project ID for Escrow!

1. Go to https://cloud.walletconnect.com/
2. Create a **NEW** project
3. Name: **"PrivateCharterX Escrow"** (NOT "DexRaise.funds")
4. Copy the Project ID
5. **DO NOT** use the same Project ID as DexRais.funds!

**Why?** Using the same Project ID would cause:
- Mixed analytics data between both apps
- Potential session conflicts
- Confusion in WalletConnect dashboard

See `AVOIDING_CONFLICTS.md` for complete separation guide.

## 3. Smart Contract Compilation

```bash
npm run compile
```

This compiles the `FlexibleEscrow.sol` contract using Hardhat.

## 4. Smart Contract Deployment

### Configure Hardhat

Edit `hardhat.config.cjs` and add your private key:

```javascript
// NEVER commit this file with your real private key!
const PRIVATE_KEY = process.env.PRIVATE_KEY || "your_private_key_here";
```

### Deploy to Base Sepolia (Testnet)

```bash
npm run deploy:base
```

Or manually:

```bash
npx hardhat run scripts/deploy-base.cjs --network base-sepolia
```

### Deploy to Base Mainnet

⚠️ **IMPORTANT**: Test thoroughly on Sepolia before deploying to mainnet!

```bash
npx hardhat run scripts/deploy-base.cjs --network base
```

### After Deployment

1. Copy the deployed contract address
2. Add it to `.env`:
   ```
   VITE_ESCROW_CONTRACT_ADDRESS=0x...
   ```
3. Verify the contract on BaseScan:
   ```bash
   npx hardhat verify --network base-sepolia YOUR_CONTRACT_ADDRESS YOUR_FEE_COLLECTOR_ADDRESS
   ```

## 5. Frontend Development

```bash
npm run dev
```

Access at http://localhost:5173

## 6. Frontend Build

```bash
npm run build
```

This creates optimized production files in the `dist/` folder.

## 7. Frontend Deployment

### Option A: Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Option B: Netlify

1. Push code to GitHub
2. Connect repository to Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables
6. Deploy

### Option C: Traditional Hosting

```bash
npm run build
# Upload dist/ folder to your web server
```

## 8. Post-Deployment Checklist

- [ ] Smart contract deployed and verified on BaseScan
- [ ] Contract address added to `.env`
- [ ] Frontend deployed and accessible
- [ ] WalletConnect working correctly
- [ ] All environment variables set
- [ ] Test creating an escrow
- [ ] Test signing/releasing escrow
- [ ] Test refund functionality
- [ ] Test dispute mechanism
- [ ] Monitor contract on BaseScan

## 9. Video Background Setup

To add the grey glass dashboard video:

1. Place your video file in `public/videos/`
2. Update `src/pages/Home.tsx` line ~78:
   ```tsx
   <source src="/videos/grey-glass-bg.mp4" type="video/mp4" />
   ```

Supported formats: MP4, WebM
Recommended: Compressed, optimized video <5MB

## 10. Security Considerations

- ✅ ReentrancyGuard enabled on FlexibleEscrow.sol
- ✅ Progressive fee tiers enforced on-chain
- ✅ Multi-signature release mechanism
- ✅ Emergency timeout (180 days)
- ✅ Admin dispute resolution
- ⚠️ Never commit `.env` or private keys
- ⚠️ Always test on Sepolia first
- ⚠️ Audit contract before handling large amounts

## 11. Smart Contract Functions

### User Functions
- `createCustomEscrow()` - Create new escrow with contract upload
- `signRelease()` - Sign to approve fund release
- `refund()` - Refund to buyer (seller/admin only)
- `raiseDispute()` - Raise a dispute
- `emergencyTimeout()` - Mark as disputed after 180 days

### View Functions
- `getEscrow(uint256 _escrowId)` - Get escrow details
- `calculateFee(uint256 _amount)` - Calculate platform fee
- `canEmergencyTimeout(uint256 _escrowId)` - Check emergency availability

### Admin Functions
- `resolveDispute()` - Resolve disputed escrow
- `withdrawFees()` - Withdraw collected fees
- `updateFeeCollector()` - Change fee collector address
- `togglePause()` - Pause/unpause contract

## 12. Network Information

### Base Sepolia (Testnet)
- Chain ID: 84532
- RPC: https://sepolia.base.org
- Explorer: https://sepolia.basescan.org
- Faucet: https://faucet.quicknode.com/base/sepolia

### Base Mainnet
- Chain ID: 8453
- RPC: https://mainnet.base.org
- Explorer: https://basescan.org

## 13. Troubleshooting

### "Insufficient funds" error
- Get testnet ETH from Base Sepolia faucet
- Check wallet is connected to correct network

### "Contract not deployed" error
- Verify `VITE_ESCROW_CONTRACT_ADDRESS` is set in `.env`
- Rebuild frontend after changing `.env`

### WalletConnect not working
- Verify `VITE_WALLETCONNECT_PROJECT_ID` is set
- Check project is active on WalletConnect Cloud

### Build fails
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 14. Monitoring & Maintenance

- Monitor contract on BaseScan
- Track gas usage and optimize if needed
- Monitor escrow creation rate
- Review disputed escrows regularly
- Withdraw accumulated fees periodically

## Support

For issues or questions:
- GitHub: https://github.com/privatecharterxdevelopment/escrow
- Email: support@privatecharterx.com

## License

MIT License - See LICENSE file for details
