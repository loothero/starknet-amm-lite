import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { WalletService } from '../services/wallet.service';
import { CHAIN_ID, ChainIdType, CONTRACT_ADDRESSES } from '../services/address';
import { ERC721ABI } from '../../abi/ERC721';
import { Contract, uint256 } from 'starknet';

@Component({
  selector: 'app-kami',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kami.component.html',
  styleUrl: './kami.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KamiComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  walletService = inject(WalletService);

  // Route parameters
  id: string | null = null;

  // State signals
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');
  isWrongNetwork = signal<boolean>(false);

  // Get the current chain ID from the wallet service
  get currentChainId(): ChainIdType {
    return this.walletService.getCurrentChainId();
  }

  ngOnInit(): void {
    // Subscribe to route params to get the ID
    this.route.paramMap.subscribe(params => {
      this.id = params.get('id');

      // If wallet is already connected, check the network and process the ID
      if (this.walletService.isConnected()) {
        this.checkNetworkAndProcessId();
      }
    });
  }

  /**
   * Check if the user is on the correct network and process the ID
   */
  private async checkNetworkAndProcessId(): Promise<void> {
    // Check if we're on MAINNET
    if (this.currentChainId !== CHAIN_ID.MAINNET) {
      this.isWrongNetwork.set(true);
      this.errorMessage.set('Please connect to Starknet Mainnet to view this NFT.');
      return;
    }

    // Reset the wrong network flag
    this.isWrongNetwork.set(false);

    // If we have an ID, process it
    if (this.id) {
      await this.processKamiId(this.id);
    }
  }

  /**
   * Process the KAMI ID by calling owner_of and redirecting if it's a pool
   */
  private async processKamiId(id: string): Promise<void> {
    try {
      this.isLoading.set(true);
      this.errorMessage.set('');

      const provider = this.walletService.getProvider();

      // Get the KAMI contract address (placeholder - would need to be set in address.ts)
      const kamiAddress = CONTRACT_ADDRESSES[CHAIN_ID.MAINNET].PAIR_FACTORY; // Using factory as placeholder
      if (!kamiAddress) {
        throw new Error('Contract address not found');
      }

      console.log(`Calling owner_of(${id}) on contract at ${kamiAddress}`);

      // Create contract instance
      const nftContract = new Contract(ERC721ABI, kamiAddress, provider);

      // Call owner_of on the NFT contract
      const owner = await nftContract.owner_of(uint256.bnToUint256(BigInt(id)));

      console.log(`Owner of NFT #${id} is ${owner}`);

      // Redirect to the manage route with the pool address
      this.router.navigate(['/manage', 'mainnet', owner]);
    } catch (error) {
      console.error('Error processing NFT ID:', error);
      this.errorMessage.set(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Connect wallet using the wallet service
   */
  async connectWallet(): Promise<void> {
    const connected = await this.walletService.connectWallet();
    if (connected) {
      await this.checkNetworkAndProcessId();
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
}
