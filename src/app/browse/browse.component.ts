import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WalletService } from '../services/wallet.service';
import { NFTService, TransactionStatus } from '../services/nft.service';
import { CHAIN_ID, ChainIdType, CONTRACT_ADDRESSES } from '../services/address';
import { ListingBookABI } from '../../abi/ListingBook';
import { Pair721ABI } from '../../abi/Pair721';
import { ERC721ABI } from '../../abi/ERC721';
import { Contract, uint256 } from 'starknet';

// Define a type for the listing data
interface ListingData {
  pairAddress: string;
  nftIds: readonly bigint[];
  price: bigint; // Price to buy an NFT (inputAmount from getBuyNFTQuote)
  isBuying?: boolean; // Flag to track if a buy transaction is in progress
}

@Component({
  selector: 'app-browse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './browse.component.html',
  styleUrl: './browse.component.css'
})
export class BrowseComponent implements OnInit {
  private route = inject(ActivatedRoute);
  walletService = inject(WalletService);
  nftService = inject(NFTService);

  // Route parameters
  label: string | null = null;
  address: string | null = null;

  // Chain information
  chainId: ChainIdType = CHAIN_ID.MAINNET; // Default to MAINNET

  // Listings data
  erc721Listings = signal<string[]>([]);
  listingsData = signal<ListingData[]>([]);

  // Token metadata
  tokenName = signal<string>('');
  tokenSymbol = signal<string>('');

  // Get the current chain ID from the wallet service
  get currentChainId(): ChainIdType {
    return this.walletService.getCurrentChainId();
  }

  ngOnInit(): void {
    // Subscribe to route params to get label and address
    this.route.paramMap.subscribe(params => {
      this.label = params.get('label');
      this.address = params.get('address');

      // Set the chain ID based on the label
      if (this.label) {
        this.setChainIdFromLabel(this.label);
      }
    });

    // If wallet is already connected, fetch the balance and listings
    if (this.walletService.isConnected()) {
      this.walletService.fetchBalance();

      // If we have an address from the route, fetch the ERC721 listings
      if (this.address) {
        this.fetchERC721Listings(this.address);
      }
    }
  }

  /**
   * Set the chain ID based on the label
   */
  private setChainIdFromLabel(label: string): void {
    // Convert label to lowercase for case-insensitive comparison
    const labelLower = label.toLowerCase();

    if (labelLower === 'mainnet' || labelLower === 'starknet') {
      this.chainId = CHAIN_ID.MAINNET;
    } else if (labelLower === 'sepolia' || labelLower === 'testnet') {
      this.chainId = CHAIN_ID.SEPOLIA;
    } else {
      // Default to MAINNET if label is not recognized
      this.chainId = CHAIN_ID.MAINNET;
      console.warn(`Unrecognized chain label: ${label}, defaulting to MAINNET`);
    }
  }

  /**
   * Connect wallet using the wallet service
   */
  async connectWallet(): Promise<void> {
    await this.walletService.connectWallet();

    // If we have an address from the route, fetch the ERC721 listings
    if (this.address) {
      await this.fetchERC721Listings(this.address);
    }
  }

  /**
   * Disconnect wallet using the wallet service
   */
  async disconnectWallet(): Promise<void> {
    await this.walletService.disconnectWallet();
  }

  /**
   * Refresh wallet balance
   */
  async refreshBalance(): Promise<void> {
    await this.walletService.fetchBalance();
  }

  /**
   * Fetch all ERC721 listings using the ListingBook contract
   * @param collectionAddress The address of the ERC721 collection
   */
  async fetchERC721Listings(collectionAddress: string): Promise<void> {
    try {
      const provider = this.walletService.getProvider();

      // Get the ListingBook contract address for the current chain
      const listingBookAddress = CONTRACT_ADDRESSES[this.currentChainId].LISTING_BOOK;

      // Use zero address for native token, start of 0, end of 0 as specified
      const tokenAddress = '0x0';
      const start = 0n;
      const end = 0n;

      console.log('Fetching ERC721 listings and metadata for:', {
        collection: collectionAddress,
        token: tokenAddress,
        start,
        end,
        listingBookAddress
      });

      // Create contract instances
      const nftContract = new Contract(ERC721ABI, collectionAddress, provider);
      const listingBookContract = new Contract(ListingBookABI, listingBookAddress, provider);

      // Fetch name, symbol, and listings
      const [name, symbol, listings] = await Promise.all([
        nftContract.name(),
        nftContract.symbol(),
        listingBookContract.get_721_listings(collectionAddress, tokenAddress, uint256.bnToUint256(start), uint256.bnToUint256(end))
      ]);

      console.log('Token metadata:', { name, symbol });
      console.log('ERC721 listings:', listings);

      // Update the token metadata signals
      this.tokenName.set(this.feltToString(name));
      this.tokenSymbol.set(this.feltToString(symbol));

      // Update the listings signal
      const listingsArray = Array.isArray(listings) ? listings : [];
      this.erc721Listings.set(listingsArray);

      // If we have listings, fetch the NFT IDs for each pair
      if (listingsArray.length > 0) {
        await this.fetchNFTIdsForPairs(listingsArray);
      }
    } catch (error) {
      console.error('Error fetching ERC721 listings and metadata:', error);
      // Set default values in case of error
      this.tokenName.set('Unknown Collection');
      this.tokenSymbol.set('???');
    }
  }

  /**
   * Convert felt252 to string
   */
  private feltToString(felt: any): string {
    if (typeof felt === 'string') {
      if (felt.startsWith('0x')) {
        const hex = felt.slice(2);
        let str = '';
        for (let i = 0; i < hex.length; i += 2) {
          const charCode = parseInt(hex.substr(i, 2), 16);
          if (charCode !== 0) {
            str += String.fromCharCode(charCode);
          }
        }
        return str;
      }
      return felt;
    }
    if (typeof felt === 'bigint') {
      const hex = felt.toString(16);
      let str = '';
      for (let i = 0; i < hex.length; i += 2) {
        const charCode = parseInt(hex.substr(i, 2), 16);
        if (charCode !== 0) {
          str += String.fromCharCode(charCode);
        }
      }
      return str;
    }
    return String(felt);
  }

  /**
   * Fetch NFT IDs for each pair
   * @param pairAddresses Array of pair addresses
   */
  async fetchNFTIdsForPairs(pairAddresses: string[]): Promise<void> {
    try {
      const provider = this.walletService.getProvider();

      console.log('Fetching NFT IDs and quotes for pairs:', {
        pairAddresses
      });

      // Process the results - for each pair, get getAllIds and getBuyNFTQuote
      const listingsWithIds: ListingData[] = await Promise.all(
        pairAddresses.map(async (pairAddress) => {
          try {
            const pairContract = new Contract(Pair721ABI, pairAddress, provider);

            // Get all NFT IDs and buy quote
            const [nftIds, quote] = await Promise.all([
              pairContract.get_all_ids(),
              pairContract.get_buy_nft_quote(uint256.bnToUint256(0n), uint256.bnToUint256(1n))
            ]);

            // Extract the inputAmount from the quote result
            // quote returns: (error, new_spot_price, new_delta, input_amount, protocol_fee, royalty_amount)
            const inputAmount = quote.input_amount ? uint256.uint256ToBN(quote.input_amount) : 0n;

            // Convert nftIds from u256 array to bigint array
            const nftIdsBigInt = Array.isArray(nftIds)
              ? nftIds.map((id: any) => uint256.uint256ToBN(id))
              : [];

            return {
              pairAddress: pairAddress,
              nftIds: nftIdsBigInt,
              price: inputAmount,
              isBuying: false
            };
          } catch (error) {
            console.error(`Error fetching data for pair ${pairAddress}:`, error);
            return {
              pairAddress: pairAddress,
              nftIds: [],
              price: 0n,
              isBuying: false
            };
          }
        })
      );

      console.log('Listings with NFT IDs and prices:', listingsWithIds);

      // Update the listingsData signal
      this.listingsData.set(listingsWithIds);
    } catch (error) {
      console.error('Error fetching NFT IDs and quotes for pairs:', error);
    }
  }

  /**
   * Format a bigint price to a human-readable string with limited decimal places
   * @param price The price as a bigint
   * @returns Formatted price string
   */
  formatPrice(price: bigint): string {
    try {
      // Convert the bigint to ETH format (18 decimals)
      const divisor = BigInt(10 ** 18);
      const integerPart = price / divisor;
      const fractionalPart = price % divisor;

      let fractionalStr = fractionalPart.toString().padStart(18, '0');
      fractionalStr = fractionalStr.replace(/0+$/, '');

      const numPrice = parseFloat(`${integerPart}.${fractionalStr || '0'}`);

      // Format the number based on its size
      if (numPrice < 0.000001 && numPrice > 0) {
        return numPrice.toExponential(2);
      } else if (numPrice < 0.001) {
        return numPrice.toFixed(6);
      } else if (numPrice < 1) {
        return numPrice.toFixed(4);
      } else {
        return numPrice.toFixed(2);
      }
    } catch (error) {
      console.error('Error formatting price:', error);
      return '0.00';
    }
  }

  /**
   * Get the current token symbol from the wallet service
   * @returns The token symbol for the current chain
   */
  getTokenSymbol(): string {
    const chain = this.walletService.getCurrentChain();
    if (!chain) return 'ETH'; // Default to ETH if no chain is available

    return chain.nativeCurrency.symbol;
  }

  /**
   * Buy the first NFT from a listing
   * @param listing The listing data containing the pair address, NFT IDs, and price
   */
  async buyNFT(listing: ListingData): Promise<void> {
    try {
      // Check if there are any NFTs available
      if (!listing.nftIds.length) {
        console.error('No NFTs available in this listing');
        return;
      }

      // Set the listing as in buying state
      const updatedListings = this.listingsData().map(l =>
        l.pairAddress === listing.pairAddress ? { ...l, isBuying: true } : l
      );
      this.listingsData.set(updatedListings);

      // Subscribe to transaction events
      const statusSubscription = this.nftService.transactionStatus$.subscribe(status => {
        console.log('Transaction status:', status);
      });

      // Call the NFT service to buy the NFT
      const result = await this.nftService.buyNFT({
        pairAddress: listing.pairAddress,
        nftIds: listing.nftIds,
        price: listing.price
      });

      // Unsubscribe from the status updates
      statusSubscription.unsubscribe();

      // If the transaction was successful, refresh the listings
      if (result.status === TransactionStatus.SUCCESS && this.address) {
        await this.fetchERC721Listings(this.address);
      }
    } catch (error) {
      console.error('Error buying NFT:', error);
    } finally {
      // Reset the buying state regardless of success or failure
      const updatedListings = this.listingsData().map(l =>
        l.pairAddress === listing.pairAddress ? { ...l, isBuying: false } : l
      );
      this.listingsData.set(updatedListings);

      // Reset the transaction status in the service
      this.nftService.resetTransactionStatus();
    }
  }
}
