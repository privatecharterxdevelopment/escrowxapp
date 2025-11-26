# PrivateCharterX - Escrow as a Service

Decentralized escrow platform for luxury assets and high-value transactions.

## ⚠️ Important: Avoiding Conflicts with DexRais.funds

**If you have DexRais.funds already running**: This Escrow project is completely separate and will NOT conflict, **provided you create a NEW WalletConnect Project ID**.

### 🔴 Critical Requirement:
1. Go to https://cloud.walletconnect.com/
2. Create a **NEW** project named "PrivateCharterX Escrow"
3. Copy the new Project ID (DO NOT use DexRais's Project ID!)
4. Add to `.env`: `VITE_WALLETCONNECT_PROJECT_ID=<new_id>`

### 📚 Conflict Prevention Documentation:
- **Quick Reference**: [`NO_CONFLICTS_GUARANTEED.md`](./NO_CONFLICTS_GUARANTEED.md) ⭐ Start here!
- **Detailed Guide**: [`AVOIDING_CONFLICTS.md`](./AVOIDING_CONFLICTS.md)
- **Quick Summary**: [`CONFLICT_PREVENTION_SUMMARY.md`](./CONFLICT_PREVENTION_SUMMARY.md)

## Features

- **Smart Contract Escrow**: Secure, transparent escrow using FlexibleEscrow.sol
- **Progressive Fees**: 2.0% (0-$1M), 1.5% ($1M-$100M), Custom (>$100M)
- **Multi-Signature Support**: Configurable multi-sig release mechanism
- **IPFS Contract Storage**: Upload and store encrypted contracts on-chain
- **Category-Specific Pages**: Aviation, Yachting, Watches, Cars, Art, Services

## Tech Stack

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Smart Contracts**: Solidity + Hardhat + OpenZeppelin
- **Blockchain**: Base Network (Mainnet & Sepolia)
- **Web3**: Wagmi + Viem + Reown AppKit
- **Backend**: Supabase

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # ⚠️ IMPORTANT: Add NEW WalletConnect Project ID (different from DexRais!)
   # See .env.example for detailed instructions
   ```

3. Compile smart contracts:
   ```bash
   npm run compile
   ```

4. Deploy contracts (Sepolia testnet):
   ```bash
   npm run deploy
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

## Smart Contract Deployment

The FlexibleEscrow.sol contract includes:
- Progressive fee tiers
- Multi-signature release
- Dispute resolution
- Emergency timeout (180 days)
- ReentrancyGuard protection

Deploy to Base Sepolia:
```bash
npm run deploy:base
```

## Project Structure

```
escrow.privatecharterx/
├── contracts/           # Solidity smart contracts
├── scripts/             # Deployment scripts
├── src/
│   ├── components/      # React components
│   ├── pages/           # Page components
│   ├── lib/             # Utility functions & Web3 interactions
│   └── context/         # React context providers
├── public/              # Static assets
└── hardhat.config.cjs   # Hardhat configuration
```

## License

MIT
