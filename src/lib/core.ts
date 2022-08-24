import axios from 'axios';
import { NFT, Sale, Transfer } from './interfaces';
import { Chain } from './types';

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

  public static createApi(apiKey: string, options?: Partial<Options>) {
    return new SimpleHashAPI(apiKey, options);
  }

  public constructor(apiKey: string, options?: Partial<Options>) {
    this.apiKey = apiKey;
    this.options = {
      ...this.options,
      ...options,
    }
  }

  public async nftsByOwners(chains: Chain[], walletAddress: string): Promise<NFT[]> {
    const chain = chains.join(',');

    const nfts: NFT[] = [];

    let url = `owners?chains=${chain}&wallet_addresses=${walletAddress}`;

    while (url) {
      const field = 'nfts';
      const { next, [field]: data } = await this.get<{ next: string, nfts: NFT[] }>(url);
      url = next;
      nfts.push(...data);

      if (url) {
        if (this.options.floodControl) {
          await sleep(300);
        }
      }
    }
    return nfts;
  }
  
  public async transfersByNft(chain: Chain, contractAddress: string, tokenId = ''): Promise<Transfer[]> {

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