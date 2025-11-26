# Quick Start Guide - PrivateCharterX Escrow

## 🚀 Get Started in 5 Minutes

### 1. Install Dependencies
```bash
cd escrow.privatecharterx
npm install
```

### 2. Configure Environment

Create `.env` file:
```bash
cp .env.example .env
```

Add your WalletConnect Project ID:
```env
VITE_WALLETCONNECT_PROJECT_ID=your_NEW_escrow_project_id_here
VITE_ESCROW_NETWORK=base-sepolia
```

⚠️ **IMPORTANT**: Get your Project ID at: https://cloud.walletconnect.com/

**If DexRais.funds is already live**: Create a **NEW** WalletConnect project for Escrow!
- Do NOT use the same Project ID as DexRais
- Name the new project "PrivateCharterX Escrow"
- This prevents conflicts between both apps

See `AVOIDING_CONFLICTS.md` for details.

### 3. Start Development Server
```bash
npm run dev
```

Open http://localhost:5173

## 🔗 Smart Contract Deployment

### Compile Contract
```bash
npm run compile
```

### Deploy to Base Sepolia (Testnet)
```bash
npm run deploy:base
```

### Update .env with Contract Address
After deployment, add the contract address to `.env`:
```env
VITE_ESCROW_CONTRACT_ADDRESS=0x... (your deployed contract address)
```

## 📹 Adding Background Video

The Home page has a placeholder for a grey glass dashboard background video.

To add your video:

1. Place your video in `public/videos/grey-glass-bg.mp4`
2. The video is already configured in `src/pages/Home.tsx` (line 75-80)
3. Uncomment the `<source>` tag:

```tsx
<video autoPlay loop muted playsInline>
  <source src="/videos/grey-glass-bg.mp4" type="video/mp4" />
</video>
```

**Recommended video specs:**
- Format: MP4 (H.264)
- Resolution: 1920x1080 or 1280x720
- Size: < 5MB (compressed)
- Duration: 10-30 seconds (will loop)

## 🏗️ Build for Production

```bash
npm run build
```

Output will be in `dist/` folder.

## 🌐 Deploy Frontend

### Option 1: Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Option 2: Netlify
1. Push to GitHub
2. Connect in Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables
6. Deploy

## ✅ Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] `.env` configured with WalletConnect Project ID
- [ ] Smart contract compiled
- [ ] Smart contract deployed to Base Sepolia
- [ ] Contract address added to `.env`
- [ ] Development server running
- [ ] Wallet connection working
- [ ] Background video added (optional)
- [ ] Ready for production build

## 📚 Next Steps

1. **Test on Sepolia**: Create test escrows with test ETH
2. **Integrate Escrow Components**: Add CreateCustomEscrowModal from existing code
3. **Add IPFS**: Integrate contract document upload
4. **Deploy to Production**: Deploy contract to Base mainnet
5. **Monitor**: Track escrows on BaseScan

## 🛟 Troubleshooting

**Can't connect wallet?**
- Check WalletConnect Project ID is set
- Try different wallet (MetaMask, Coinbase Wallet, etc.)

**Build errors?**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Contract not found?**
- Verify `VITE_ESCROW_CONTRACT_ADDRESS` is set
- Rebuild after changing `.env`: `npm run dev`

**Need testnet ETH?**
- Base Sepolia Faucet: https://faucet.quicknode.com/base/sepolia

## 📞 Support

- **Full Documentation**: See `DEPLOYMENT.md`
- **Project Overview**: See `PROJECT_SUMMARY.md`
- **Smart Contract**: `contracts/FlexibleEscrow.sol`
- **GitHub**: https://github.com/privatecharterxdevelopment/escrow

---

**Ready to launch?** Follow `DEPLOYMENT.md` for production deployment guide.
