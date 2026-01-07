import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeUrl, SafeHtml } from '@angular/platform-browser';

/**
 * Pipe to sanitize string content by escaping HTML entities
 * Use this for displaying user-provided text content safely
 */
@Pipe({
  name: 'safeContent',
  standalone: true
})
export class SafeContentPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    // Escape HTML entities to prevent XSS
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

/**
 * Pipe to sanitize URLs for safe use in templates
 * Only allows https: and ipfs: protocols
 */
@Pipe({
  name: 'safeUrl',
  standalone: true
})
export class SafeUrlPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined): SafeUrl | string {
    if (!value) {
      return '';
    }

    // Validate URL protocol
    const trimmed = value.trim().toLowerCase();

    // Allow https URLs
    if (trimmed.startsWith('https://')) {
      return this.sanitizer.bypassSecurityTrustUrl(value);
    }

    // Allow ipfs URLs (various formats)
    if (
      trimmed.startsWith('ipfs://') ||
      trimmed.startsWith('https://ipfs.io/') ||
      trimmed.startsWith('https://gateway.pinata.cloud/') ||
      trimmed.startsWith('https://cloudflare-ipfs.com/')
    ) {
      return this.sanitizer.bypassSecurityTrustUrl(value);
    }

    // Allow data URLs for base64 images (commonly used for NFT metadata)
    if (trimmed.startsWith('data:image/')) {
      return this.sanitizer.bypassSecurityTrustUrl(value);
    }

    // For any other protocol, return empty string for security
    console.warn(`SafeUrlPipe: Blocked unsafe URL protocol: ${value.substring(0, 50)}...`);
    return '';
  }
}

/**
 * Pipe to convert IPFS URLs to HTTP gateway URLs
 */
@Pipe({
  name: 'ipfsToHttp',
  standalone: true
})
export class IpfsToHttpPipe implements PipeTransform {
  private readonly IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const trimmed = value.trim();

    // Convert ipfs:// protocol to HTTP gateway
    if (trimmed.toLowerCase().startsWith('ipfs://')) {
      const hash = trimmed.slice(7); // Remove 'ipfs://'
      return `${this.IPFS_GATEWAY}${hash}`;
    }

    // Already an HTTP(S) URL, return as-is
    if (trimmed.toLowerCase().startsWith('http://') || trimmed.toLowerCase().startsWith('https://')) {
      return trimmed;
    }

    // Assume it might be a raw IPFS hash
    if (/^Qm[1-9A-HJ-NP-Za-km-z]{44}$/i.test(trimmed) || /^bafy[a-z0-9]{55}$/i.test(trimmed)) {
      return `${this.IPFS_GATEWAY}${trimmed}`;
    }

    return value;
  }
}
