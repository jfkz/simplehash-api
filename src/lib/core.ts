import axios from 'axios';
import { NFT, Sale, Transfer } from './interfaces';
import { Chain, Order } from './types';

interface Options {
  endPoint: string;
  floodControl: boolean;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class SimpleHashAPI {
  private readonly options: Options = {
    endPoint: 'https://api.simplehash.com/api/v0/nfts/',
    floodControl: true,
  };
  private readonly apiKey: string;

  public constructor(apiKey: string, options?: Partial<Options>) {
    this.apiKey = apiKey;
    this.options = {
      ...this.options,
      ...options,
    }
  }

  /**
   * This endpoint is commonly used to pass specific wallet addresses to get back the metadata of the NFTs held by them:
   * @param chains Name of the chain(s) (e.g., optimism), comma-separated for multiple values (e.g, optimism,ethereum)
   * @param walletAddresses Owner wallet address(es), comma-separated for multiple values (e.g., 0xa12,0xb34). Limit of 20 addresses.
   * @returns Array of NFTs
   */
  public async nftsByOwners(chains: Chain[], walletAddresses: string[]): Promise<NFT[]> {
    const chain = chains.join(',');
    const wallet = walletAddresses.join(',');
    const url = `owners?chains=${chain}&wallet_addresses=${wallet}`;
    return this.paginatedGet<NFT>(url, 'nfts');
  }

  /**
   * This endpoint is commonly used to pass specific wallet addresses to get back a list of inbound and outbound NFT transfers:
   * @param chains Name of the chain(s) (e.g., optimism), comma-separated for multiple values (e.g, optimism,ethereum)
   * @param walletAddresses Owner wallet address(es), comma-separated for multiple values (e.g., 0xa12,0xb34). Limit of 20 addresses.
   * @param orderBy Available values are timestamp_desc (default) or timestamp_asc
   * @returns Array of transfers
   */
  public async transfersByWallets(chains: Chain[], walletAddresses: string[], orderBy: Order = 'timestamp_desc'): Promise<Transfer[]> {
    const chain = chains.join(',');
    const wallet = walletAddresses.join(',');
    const url = `owners?chains=${chain}&wallet_addresses=${wallet}&order_by=${orderBy}`;
    return this.paginatedGet<Transfer>(url, 'transfers');
  }
  
  /**
   * This endpoint is commonly used to pass a single specific NFT to get back a list of its historical transfers:
   * @param chain Name of the chain
   * @param contractAddress Address of the NFT contract
   * @param tokenId Token ID of the given NFT
   * @param orderBy Available values are timestamp_desc (default) or timestamp_asc
   * @returns Array of transfers
   */
  public async transfersByNft(chain: Chain, contractAddress: string, tokenId = '', orderBy: Order = 'timestamp_desc'): Promise<Transfer[]> {
    if (chain !== 'solana' && tokenId === '') {
      throw new Error('tokenId is required for non-solana chains');
    }

    let url = '';
    switch (chain) {
      case 'solana':
        url = `transfers/${chain}/${contractAddress}`;
        break;
      default:
        url = `transfers/${chain}/${contractAddress}/${tokenId}`;
        break;
    }

    url = `${url}?order_by=${orderBy}`;

    return this.paginatedGet<Transfer>(url, 'transfers');
  }

  public async ownersByNft(chain: Chain, contractAddress: string, token_id: string) {
    return this.get(`owners/${chain}/${contractAddress}/${token_id}`);
  }

  private async paginatedGet<T>(url: string, fieldName: string): Promise<T[]> {
    const results: T[] = [];

    while (url) {
      const { next, [fieldName]: data } = await this.get<any>(url);
      url = next;
      results.push(...data);

      if (url) {
        if (this.options.floodControl) {
          await sleep(300);
        }
      }
    }

    return results;
  }

  private async get<T>(query: string): Promise<T> {
    const url = `${this.options.endPoint}${query}`;
    try {
      const response = await axios.get<T>(
        url,
        {
          headers: {
            Accept: 'application/json',
            'x-api-key': this.apiKey,
          },
        }
      );
      const json = response.data;
      return json;
    } catch (error) {
      console.log(error);
    }

    return {} as T;
  }
}

function createApi (apiKey: string, options?: Partial<Options>) {
  return new SimpleHashAPI(apiKey, options);
}

export {
  createApi,
  Options,
};