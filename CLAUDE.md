# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AmmLite is an Angular 19 web application for NFT Automated Market Maker (AMM) pool management. Users can create NFT listings with bonding curve pricing, browse collections, buy/sell NFTs from pools, and manage pool positions. The app supports multiple Initia-based chains (Yominet and Zaar).

## Development Commands

```bash
npm start          # Start dev server at http://localhost:4200
npm run build      # Production build
npm test           # Run Karma + Jasmine tests
npm run watch      # Build with watch mode
```

## Architecture

### Tech Stack
- **Framework**: Angular 19.2 with standalone components and signals
- **Web3**: viem for contract interactions, web3-onboard for wallet connections
- **Styling**: Tailwind CSS 4.1
- **Testing**: Karma + Jasmine

### Key Services

**WalletService** (`src/app/services/wallet.service.ts`)
- Manages multi-chain wallet connections via web3-onboard
- Uses Angular signals for reactive state (`walletAddress`, `isConnected`, `balance`)
- Provides viem `PublicClient` for reads and `WalletClient` for transactions
- Auto-connects to last used wallet

**NFTService** (`src/app/services/nft.service.ts`)
- Orchestrates NFT buy/sell transactions on Pair721 contracts
- Returns Observable streams for transaction lifecycle tracking

### Contract Integration

Contract addresses are defined in `src/app/services/address.ts` with typed exports:
- `CHAIN_ID` - Chain identifiers (YOMINET, ZAAR)
- `CONTRACT_ADDRESSES` - Per-chain contract addresses (Factory, Curves, Router, Multicall, ListingBook)

ABIs live in `src/abi/`:
- `ERC721.ts`, `ERC20.ts` - Standard token interfaces
- `Factory.ts` - Pool creation
- `Pair721.ts` - AMM pair with swap functions
- `ListingBook.ts` - Registry of pools per collection
- `Multicall.ts` - Batch read aggregation

### Routes

```
/                         -> HomeComponent (create listings)
/browse/:label/:address   -> BrowseComponent (view collection listings)
/manage/:label/:address   -> ManageComponent (manage pool)
/kami/:id                 -> KamiComponent (lookup pool by KAMI NFT)
```

- `:label` is chain name (yominet/zaar)
- `:address` is collection address (browse) or pool address (manage)

### Supported Chains

| Chain   | Chain ID          | Native Token | RPC |
|---------|-------------------|--------------|-----|
| Yominet | `0x18623A6A54F3F` | ETH          | `jsonrpc-yominet-1.anvil.asia-southeast.initia.xyz` |
| Zaar    | `0x4be439dcd8b3f` | Init         | `jsonrpc-zaar-mainnet-1.anvil.asia-southeast.initia.xyz` |

## Code Patterns

- **Standalone components**: No NgModules, all components use `standalone: true`
- **Angular signals**: Reactive state management (no manual subscriptions in templates)
- **Multicall batching**: Efficient RPC usage for batch contract reads
- **Typed ABIs**: viem with TypeScript for type-safe contract calls
