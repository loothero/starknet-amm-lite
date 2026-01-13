import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WalletService } from '../services/wallet.service';
import { NFTService, TransactionStatus } from '../services/nft.service';
import { CHAIN_ID, ChainIdType, CONTRACT_ADDRESSES, normalizeStarknetAddress } from '../services/address';
import { Pair721ABI } from '../../abi/Pair721';
import { ERC721ABI } from '../../abi/ERC721';
import { Contract, uint256 } from 'starknet';
import { feltToString, formatPrice } from '../utils/starknet-utils';
import { NFTMetadata, NFTData } from '../types/starknet.types';

@Component({
  selector: 'app-manage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage.component.html',
  styleUrl: './manage.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  walletService = inject(WalletService);
  nftService = inject(NFTService);

  // Route parameters
  label: string | null = null;
  address: string | null = null;

  // Chain information
  chainId: ChainIdType = CHAIN_ID.MAINNET; // Default to MAINNET

  // NFT IDs data
  nftIds = signal<readonly bigint[]>([]);
  nftDataList = signal<NFTData[]>([]);
  selectedNftId = signal<bigint | null>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Withdrawal state
  isWithdrawing = signal<boolean>(false);
  withdrawSuccess = signal<boolean>(false);
  withdrawError = signal<string>('');
  nftContractAddress = signal<string>('');
  isPoolOwner = signal<boolean>(false);

  // Buy state
  nftPrice = signal<bigint>(0n);
  isBuying = signal<boolean>(false);
  buySuccess = signal<boolean>(false);
  buyError = signal<string>('');

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

    // If wallet is already connected, fetch the NFT IDs
    if (this.walletService.isConnected()) {
      this.walletService.fetchBalance();

      // If we have an address from the route, fetch the NFT IDs
      if (this.address) {
        this.fetchNFTIds(this.address);
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

    // If we have an address from the route, fetch the NFT IDs
    if (this.address) {
      await this.fetchNFTIds(this.address);
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
   * Fetch NFT IDs for the pair address
   * @param pairAddress The address of the pair
   */
  async fetchNFTIds(pairAddress: string): Promise<void> {
    try {
      this.isLoading.set(true);
      this.errorMessage.set('');
      this.withdrawSuccess.set(false);
      this.withdrawError.set('');

      const provider = this.walletService.getProvider();

      console.log('Fetching NFT IDs for pair:', {
        pairAddress
      });

      // Create pair contract instance
      const pairContract = new Contract(Pair721ABI, pairAddress, provider);

      // Fetch all data in parallel
      const [ids, nftAddress, quote, ownerAddress] = await Promise.all([
        pairContract.get_all_ids(),
        pairContract.nft(),
        pairContract.get_buy_nft_quote(uint256.bnToUint256(0n), uint256.bnToUint256(1n)),
        pairContract.owner()
      ]);

      // Extract the inputAmount from the quote result
      const inputAmount = quote.input_amount ? uint256.uint256ToBN(quote.input_amount) : 0n;

      // Convert IDs from u256 to bigint
      const idsBigInt = Array.isArray(ids) ? ids.map((id: any) => uint256.uint256ToBN(id)) : [];

      console.log('NFT IDs for pair:', idsBigInt);
      console.log('NFT contract address:', nftAddress);
      console.log('Buy NFT price quote:', inputAmount);
      console.log('Pool owner address:', ownerAddress);

      // Check if the current wallet address is the pool owner
      const walletAddress = this.walletService.walletAddress();
      const isOwner = walletAddress
        ? normalizeStarknetAddress(walletAddress) === normalizeStarknetAddress(ownerAddress)
        : false;

      // Update the signals
      this.nftIds.set(idsBigInt);
      this.nftContractAddress.set(nftAddress);
      this.nftPrice.set(inputAmount);
      this.isPoolOwner.set(isOwner);

      // Set the selected NFT ID to the first ID if available
      if (idsBigInt.length > 0) {
        this.selectedNftId.set(idsBigInt[0]);
      } else {
        this.selectedNftId.set(null);
      }

      // Create NFT data list with initial data
      const nftDataList = idsBigInt.map(id => ({
        id,
        price: inputAmount,
        isLoadingMetadata: false,
        metadata: undefined,
        metadataError: undefined
      }));

      this.nftDataList.set(nftDataList);

      // Fetch metadata for all NFTs
      if (idsBigInt.length > 0) {
        await this.fetchNFTMetadata(nftAddress, nftDataList);
      }
    } catch (error) {
      console.error('Error fetching NFT IDs for pair:', error);
      this.errorMessage.set('Error fetching NFT IDs. Please try again.');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Withdraw all NFTs from the pair
   */
  async withdrawAllNFTs(): Promise<void> {
    if (!this.address || this.nftIds().length === 0) {
      this.withdrawError.set('No NFTs to withdraw');
      return;
    }

    try {
      this.isWithdrawing.set(true);
      this.withdrawSuccess.set(false);
      this.withdrawError.set('');

      const account = this.walletService.getAccount();
      if (!account) {
        this.withdrawError.set('No account available');
        this.isWithdrawing.set(false);
        return;
      }

      const walletAddress = this.walletService.walletAddress();
      if (!walletAddress) {
        this.withdrawError.set('Wallet not connected');
        this.isWithdrawing.set(false);
        return;
      }

      console.log('Withdrawing all NFTs:', {
        pairAddress: this.address,
        nftAddress: this.nftContractAddress(),
        nftIds: this.nftIds(),
        walletAddress
      });

      // Convert NFT IDs to u256 format for Starknet
      const nftIdsU256 = this.nftIds().map(id => uint256.bnToUint256(id));

      // Call withdraw_erc721 on the pair contract
      const txHash = await this.walletService.executeTransaction(
        this.address,
        Pair721ABI,
        'withdraw_erc721',
        [this.nftContractAddress(), nftIdsU256]
      );

      console.log('Withdrawal transaction hash:', txHash);

      // Wait for the transaction to be confirmed
      await this.walletService.waitForTransaction(txHash);

      // Set success state
      this.withdrawSuccess.set(true);

      // Refresh the NFT IDs after withdrawal
      await this.fetchNFTIds(this.address);
    } catch (error) {
      console.error('Error withdrawing NFTs:', error);
      this.withdrawError.set('Error withdrawing NFTs. Please try again.');
    } finally {
      this.isWithdrawing.set(false);
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
   * Format a bigint price to a human-readable string with limited decimal places
   * Uses the centralized formatPrice utility
   * @param price The price as a bigint
   * @returns Formatted price string
   */
  formatPriceDisplay(price: bigint): string {
    return formatPrice(price);
  }

  /**
   * Buy an NFT from the pair
   * @param nftId Optional NFT ID to buy. If not provided, uses the selected NFT ID.
   */
  async buyNFT(nftId?: bigint): Promise<void> {
    if (!this.address || this.nftIds().length === 0) {
      this.buyError.set('No NFTs available to buy');
      return;
    }

    // Use the provided NFT ID or the selected one
    const selectedId = nftId || this.selectedNftId();
    if (selectedId === null) {
      this.buyError.set('No NFT ID selected to buy');
      return;
    }

    // Set the selected NFT ID to track which one is being purchased
    this.selectedNftId.set(selectedId);

    try {
      this.isBuying.set(true);
      this.buySuccess.set(false);
      this.buyError.set('');

      // Subscribe to transaction events
      const statusSubscription = this.nftService.transactionStatus$.subscribe(status => {
        console.log('Transaction status:', status);
      });

      // Call the NFT service to buy the NFT
      const result = await this.nftService.buyNFT({
        pairAddress: this.address,
        nftIds: [selectedId],
        price: this.nftPrice()
      });

      // Unsubscribe from the status updates
      statusSubscription.unsubscribe();

      // If the transaction was successful, refresh the NFT IDs
      if (result.status === TransactionStatus.SUCCESS && this.address) {
        this.buySuccess.set(true);
        await this.fetchNFTIds(this.address);
      }
    } catch (error) {
      console.error('Error buying NFT:', error);
      this.buyError.set('Error buying NFT. Please try again.');
    } finally {
      this.isBuying.set(false);

      // Reset the transaction status in the service
      this.nftService.resetTransactionStatus();
    }
  }

  /**
   * Fetch metadata for all NFTs in the pool
   * @param nftAddress The NFT contract address
   * @param nftDataList The list of NFT data objects
   */
  async fetchNFTMetadata(nftAddress: string, nftDataList: NFTData[]): Promise<void> {
    try {
      console.log('Fetching metadata for NFTs:', {
        nftAddress,
        nftCount: nftDataList.length
      });

      const provider = this.walletService.getProvider();
      const nftContract = new Contract(ERC721ABI, nftAddress, provider);

      // Process NFTs sequentially to avoid rate limiting
      for (let i = 0; i < nftDataList.length; i++) {
        const nftData = nftDataList[i];

        // Update loading state
        nftData.isLoadingMetadata = true;
        this.nftDataList.update(currentList => {
          const newList = [...currentList];
          newList[i] = { ...nftData };
          return newList;
        });

        try {
          // Fetch token_uri for this NFT
          const tokenURI = await nftContract.token_uri(uint256.bnToUint256(nftData.id));

          // Parse the metadata
          const metadata = this.parseTokenURI(tokenURI);

          // Update the NFT data with metadata
          nftData.metadata = metadata;
          nftData.isLoadingMetadata = false;

          this.nftDataList.update(currentList => {
            const newList = [...currentList];
            newList[i] = { ...nftData };
            return newList;
          });

          console.log(`Fetched metadata for NFT ID ${nftData.id}:`, metadata);
        } catch (error) {
          console.error(`Error fetching metadata for NFT ID ${nftData.id}:`, error);

          // Update error state
          nftData.isLoadingMetadata = false;
          nftData.metadataError = 'Failed to load metadata';

          this.nftDataList.update(currentList => {
            const newList = [...currentList];
            newList[i] = { ...nftData };
            return newList;
          });
        }

        // Add a small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Error fetching NFT metadata:', error);
    }
  }

  /**
   * Parse tokenURI which could be an array of felt252 or a string
   * @param tokenURI The token URI from Starknet
   * @returns Parsed metadata object
   */
  private parseTokenURI(tokenURI: any): NFTMetadata {
    try {
      let uriString: string;

      // Handle array of felt252 (Starknet string representation)
      if (Array.isArray(tokenURI)) {
        uriString = tokenURI.map((felt: bigint | string) => feltToString(felt)).join('');
      } else {
        uriString = feltToString(tokenURI);
      }

      // Check if this is base64 encoded data
      if (uriString.startsWith('data:application/json;base64,')) {
        const base64Data = uriString.replace('data:application/json;base64,', '');
        const jsonString = atob(base64Data);
        return JSON.parse(jsonString);
      }

      // If it's a URL, return a placeholder
      console.log('Non-base64 tokenURI detected:', uriString);
      return {
        name: `Token`,
        image: uriString,
        attributes: []
      };
    } catch (error) {
      console.error('Error parsing metadata:', error);
      return {
        name: 'Error parsing metadata',
        image: '',
        attributes: []
      };
    }
  }

}
