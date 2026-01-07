import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WalletService } from '../services/wallet.service';
import { ERC721ABI } from '../../abi/ERC721';
import { ERC20ABI } from '../../abi/ERC20';
import { CHAIN_ID, CONTRACT_ADDRESSES, ChainIdType } from '../services/address';
import { FactoryABI } from '../../abi/Factory';
import { Contract, uint256 } from 'starknet';
import { feltToString, formatUnits } from '../utils/starknet-utils';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  walletService = inject(WalletService);

  // Form properties
  nftContractAddress: string = '';
  nftIds: string = ''; // Comma-separated list of IDs
  tokenContractAddress: string = ''; // Default to empty for native token
  startingPrice: string = '';

  // Current chain ID
  get currentChainId(): ChainIdType {
    return this.walletService.getCurrentChainId();
  }

  // UI state
  isApproved = signal<boolean>(false);
  isCheckingApproval = signal<boolean>(false);
  errorMessage = signal<string>('');

  // ERC721 NFT state
  nftName = signal<string>('');
  nftSymbol = signal<string>('');
  nftBalance = signal<number>(0);
  isCheckingNFT = signal<boolean>(false);

  // ERC20 token state
  tokenName = signal<string>('');
  tokenSymbol = signal<string>('');
  tokenDecimals = signal<number>(18);
  tokenBalance = signal<string>('0');
  tokenAllowance = signal<string>('0');
  tokenAllowanceRaw = signal<bigint>(0n);
  isTokenApproved = signal<boolean>(false);
  isCheckingToken = signal<boolean>(false);

  /**
   * Format a number in scientific notation
   */
  formatScientific(num: bigint): string {
    if (num === 0n) return '0';

    // Convert to string and then to number for formatting
    const numStr = num.toString();
    const numFloat = parseFloat(numStr);

    // Format in scientific notation
    return numFloat.toExponential(2);
  }

  async connectWallet(): Promise<void> {
    await this.walletService.connectWallet();
  }

  async disconnectWallet(): Promise<void> {
    await this.walletService.disconnectWallet();
  }

  async refreshBalance(): Promise<void> {
    await this.walletService.fetchBalance();
  }

  async createListing(): Promise<void> {
    try {
      // Check if the NFT contract is approved for the Pair Factory
      await this.checkNFTApproval();

      if (!this.isApproved()) {
        // If not approved, we need to request approval
        await this.setNFTApproval();
      }

      // If using an ERC20 token, check if it's approved
      if (this.tokenContractAddress) {
        await this.checkERC20Approval();

        if (!this.isTokenApproved()) {
          // If not approved, we need to request approval
          await this.setERC20Approval();
        }
      }

      // If we're approved, proceed with creating the listing
      if (this.isApproved() && (!this.tokenContractAddress || this.isTokenApproved())) {
        // Log the form values
        console.log('Creating listing with:', {
          nftContractAddress: this.nftContractAddress,
          nftIds: this.nftIds.split(',').map(id => id.trim()),
          tokenContractAddress: this.tokenContractAddress || 'Native Token (ETH)',
          startingPrice: this.startingPrice
        });

        // Create the pool
        await this.createPool();
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      this.errorMessage.set(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if the NFT contract is approved for the Pair Factory
   */
  private async checkNFTApproval(): Promise<void> {
    this.isCheckingApproval.set(true);
    this.isApproved.set(false);

    try {
      const provider = this.walletService.getProvider();
      const walletAddress = this.walletService.walletAddress();
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }

      // Get the Pair Factory address from our constants for the current chain
      const pairFactoryAddress = CONTRACT_ADDRESSES[this.currentChainId].PAIR_FACTORY;

      // Create ERC721 contract instance
      const nftContract = new Contract(ERC721ABI, this.nftContractAddress, provider);

      // Call is_approved_for_all on the NFT contract
      const isApproved = await nftContract.is_approved_for_all(walletAddress, pairFactoryAddress);

      this.isApproved.set(!!isApproved);
    } catch (error) {
      console.error('Error checking NFT approval:', error);
      throw new Error(`Failed to check NFT approval: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.isCheckingApproval.set(false);
    }
  }

  /**
   * Request approval for the NFT contract
   */
  private async setNFTApproval(): Promise<void> {
    const account = this.walletService.getAccount();
    if (!account) {
      throw new Error('No account available');
    }

    // Get the Pair Factory address from our constants for the current chain
    const pairFactoryAddress = CONTRACT_ADDRESSES[this.currentChainId].PAIR_FACTORY;

    // Execute set_approval_for_all on the NFT contract
    const txHash = await this.walletService.executeTransaction(
      this.nftContractAddress,
      ERC721ABI,
      'set_approval_for_all',
      [pairFactoryAddress, true]
    );

    // Wait for transaction to be confirmed
    await this.walletService.waitForTransaction(txHash);

    // Update approval status
    this.isApproved.set(true);
  }

  /**
   * Check NFT collection details when the NFT contract address changes
   */
  async checkNFTDetails(): Promise<void> {
    if (!this.nftContractAddress) {
      // Reset NFT details if no contract address is provided
      this.nftName.set('');
      this.nftSymbol.set('');
      this.nftBalance.set(0);
      return;
    }

    this.isCheckingNFT.set(true);
    this.errorMessage.set('');

    try {
      const provider = this.walletService.getProvider();
      const walletAddress = this.walletService.walletAddress();
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }

      // Create ERC721 contract instance
      const nftContract = new Contract(ERC721ABI, this.nftContractAddress, provider);

      // Call name, symbol, and balance_of
      const [name, symbol, balance] = await Promise.all([
        nftContract.name(),
        nftContract.symbol(),
        nftContract.balance_of(walletAddress)
      ]);

      // Decode felt252 to string for name and symbol
      this.nftName.set(feltToString(name));
      this.nftSymbol.set(feltToString(symbol));

      // Convert balance from u256 to number
      const balanceBigInt = uint256.uint256ToBN(balance);
      this.nftBalance.set(Number(balanceBigInt));

      // Check NFT approval status
      await this.checkNFTApproval();
    } catch (error) {
      console.error('Error checking NFT details:', error);
      this.errorMessage.set(`Error checking NFT details: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.isCheckingNFT.set(false);
    }
  }

  /**
   * Check ERC20 token details when the token address changes
   */
  async checkERC20Details(): Promise<void> {
    if (!this.tokenContractAddress) {
      // Reset token details if no token address is provided
      this.tokenName.set('');
      this.tokenSymbol.set('');
      this.tokenDecimals.set(18);
      this.tokenBalance.set('0');
      this.tokenAllowance.set('0');
      this.isTokenApproved.set(false);
      return;
    }

    this.isCheckingToken.set(true);
    this.errorMessage.set('');

    try {
      const provider = this.walletService.getProvider();
      const walletAddress = this.walletService.walletAddress();
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }

      // Create ERC20 contract instance
      const tokenContract = new Contract(ERC20ABI, this.tokenContractAddress, provider);

      // Call name, symbol, decimals, and balance_of
      const [name, symbol, decimals, balance] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
        tokenContract.balance_of(walletAddress)
      ]);

      // Decode felt252 to string for name and symbol
      this.tokenName.set(feltToString(name));
      this.tokenSymbol.set(feltToString(symbol));
      this.tokenDecimals.set(Number(decimals));

      // Convert balance from u256 to string with decimals
      const balanceBigInt = uint256.uint256ToBN(balance);
      this.tokenBalance.set(formatUnits(balanceBigInt, Number(decimals)));

      // Check token approval
      await this.checkERC20Approval();
    } catch (error) {
      console.error('Error checking ERC20 details:', error);
      this.errorMessage.set(`Error checking token details: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.isCheckingToken.set(false);
    }
  }

  /**
   * Check if the ERC20 token is approved for the Pair Factory
   */
  async checkERC20Approval(): Promise<void> {
    if (!this.tokenContractAddress) return;

    try {
      const provider = this.walletService.getProvider();
      const walletAddress = this.walletService.walletAddress();
      if (!walletAddress) {
        throw new Error('Wallet not connected');
      }

      // Get the Pair Factory address from our constants for the current chain
      const pairFactoryAddress = CONTRACT_ADDRESSES[this.currentChainId].PAIR_FACTORY;

      // Create ERC20 contract instance
      const tokenContract = new Contract(ERC20ABI, this.tokenContractAddress, provider);

      // Call allowance
      const allowance = await tokenContract.allowance(walletAddress, pairFactoryAddress);

      // Convert allowance from u256 to BigInt
      const allowanceBigInt = uint256.uint256ToBN(allowance);
      this.tokenAllowanceRaw.set(allowanceBigInt);

      // Format the allowance for display
      this.tokenAllowance.set(formatUnits(allowanceBigInt, this.tokenDecimals()));

      // Consider approved if allowance is greater than 0
      this.isTokenApproved.set(allowanceBigInt > 0n);
    } catch (error) {
      console.error('Error checking ERC20 approval:', error);
      throw new Error(`Failed to check token approval: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Request approval for the ERC20 token
   */
  async setERC20Approval(): Promise<void> {
    if (!this.tokenContractAddress) return;

    const account = this.walletService.getAccount();
    if (!account) {
      throw new Error('No account available');
    }

    // Get the Pair Factory address from our constants for the current chain
    const pairFactoryAddress = CONTRACT_ADDRESSES[this.currentChainId].PAIR_FACTORY;

    // Approve max uint256 for Starknet (u256 max)
    const maxU256 = uint256.bnToUint256(2n ** 256n - 1n);

    // Execute approve on the ERC20 contract
    const txHash = await this.walletService.executeTransaction(
      this.tokenContractAddress,
      ERC20ABI,
      'approve',
      [pairFactoryAddress, maxU256]
    );

    // Wait for transaction to be confirmed
    await this.walletService.waitForTransaction(txHash);

    // After approval, check the allowance again
    await this.checkERC20Approval();
  }

  private async createPool(): Promise<void> {
    const account = this.walletService.getAccount();
    if (!account) {
      throw new Error('No account available');
    }

    const walletAddress = this.walletService.walletAddress();
    if (!walletAddress) {
      throw new Error('Wallet not connected');
    }

    const pairFactoryAddress = CONTRACT_ADDRESSES[this.currentChainId].PAIR_FACTORY;

    // Parse NFT IDs and convert to u256 format
    const nftIdsList = this.nftIds.split(',').map(id => {
      const trimmedId = id.trim();
      return uint256.bnToUint256(BigInt(trimmedId));
    });

    // Convert starting price to u128 (with 18 decimals)
    const spotPrice = BigInt(Math.floor(parseFloat(this.startingPrice) * 1e18));

    if (!this.tokenContractAddress) {
      // Create ETH pair
      const txHash = await this.walletService.executeTransaction(
        pairFactoryAddress,
        FactoryABI,
        'create_pair_erc721_eth',
        [
          this.nftContractAddress,                                    // nft
          CONTRACT_ADDRESSES[this.currentChainId].LINEAR_CURVE,       // bonding_curve
          walletAddress,                                               // asset_recipient
          1,                                                           // pool_type: NFT (sell)
          0,                                                           // delta
          0,                                                           // fee
          spotPrice,                                                   // spot_price
          nftIdsList                                                   // initial_nft_ids
        ]
      );

      await this.walletService.waitForTransaction(txHash);
      console.log('Pool created successfully! Transaction hash:', txHash);
    } else {
      // Create ERC20 pair
      const txHash = await this.walletService.executeTransaction(
        pairFactoryAddress,
        FactoryABI,
        'create_pair_erc721_erc20',
        [
          this.tokenContractAddress,                                  // token
          this.nftContractAddress,                                    // nft
          CONTRACT_ADDRESSES[this.currentChainId].LINEAR_CURVE,       // bonding_curve
          walletAddress,                                               // asset_recipient
          1,                                                           // pool_type: NFT (sell)
          0,                                                           // delta
          0,                                                           // fee
          spotPrice,                                                   // spot_price
          nftIdsList,                                                  // initial_nft_ids
          uint256.bnToUint256(0n)                                     // initial_token_balance
        ]
      );

      await this.walletService.waitForTransaction(txHash);
      console.log('Pool created successfully! Transaction hash:', txHash);
    }
  }
}
