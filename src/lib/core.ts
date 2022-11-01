import axios from 'axios';
import { CollectionInfo, NFT, Owner, Transfer } from './interfaces';
import { Chain, Marketplace, Order } from './types';

interface Options {
  endPoint: string;
  floodControl: boolean;
  debugMode: boolean;
  parallelRequests: number;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class SimpleHashAPI {
  private readonly options: Options = {
    endPoint: 'https://api.simplehash.com/api/v0/nfts/',
    floodControl: true,
    debugMode: false,
    parallelRequests: 1,
  };
  private readonly apiKey: string;
  private lastRequestDate: Date = new Date('1970-01-01');

  public constructor(apiKey: string, options?: Partial<Options>) {
    this.apiKey = apiKey;
    this.options = {
      ...this.options,
      ...options,
    }
  }

  /**
   * This endpoint is commonly used to retrieve metadata of all of the NFTs on a single collection
   * To understand more about the difference between Collections and Contracts, please refer to our FAQ
   * 
   * @param collectionId The unique identifier of the collection (obtainable from an NFT response, or from the Collection ID Lookup endpoint)
   */
  public async nftsByCollection(collectionId: string, orderBy: Order = 'timestamp_desc') {
    const path = `collection/${collectionId}`;
    return this.getPaginated<NFT>(path, 'nfts');
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
    return this.getPaginated<NFT>(url, 'nfts');
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
    const url = `transfers/wallets?chains=${chain}&wallet_addresses=${wallet}&order_by=${orderBy}`;
    return this.getPaginated<Transfer>(url, 'transfers');
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

    return this.getPaginated<Transfer>(url, 'transfers');
  }

  /**
   * This endpoint is commonly used to pass a chain, contract address, 
   * and token_id and get the full list of wallets owning this NFT.
   * The number of owners may be more than 1 in the case of ERC-1155 tokens, or 0 for burned tokens.
   * 
   * This endpoint is paginated to 1,000 items per response
   * 
   * On Solana, only the chain and contract address should be supplied
   * @param chain 
   * @param contractAddress 
   * @param token_id 
   * @returns 
   */
  public async ownersByNft(chain: Chain, contractAddress: string, token_id: string) {
    const url = `owners/${chain}/${contractAddress}/${token_id}`;
    return this.getPaginated<Owner>(url, 'owners');
  }

  /**
   * This endpoint is used to obtain the unique identifier for an NFT Collection
   * These identifiers can be then passed to the NFTs by Collection endpoint. 
   * Either the metaplex_mint OR the marketplace_collection_id + marketplace_name 
   * query params should be provided.
   * @param metaplexMint Metaplex mint address
   * @param marketplaceCollectionId Marketplace collection ID
   * @param marketplaceName Marketplace name
   */
  public async collectionIDLookup(metaplexMint = '', marketplaceCollectionId = '', marketplaceName: Marketplace = 'opensea') {
    let url = 'collections?';
    if (metaplexMint) {
      url = `${url}metaplex_mint=${metaplexMint}`;
    } else if (marketplaceCollectionId && marketplaceName) {
      url = `${url}marketplace_collection_id=${marketplaceCollectionId}&marketplace_name=${marketplaceName}`;
    } else {
      throw new Error('metaplexMint or marketplaceCollectionId and marketplaceName are required');
    }

    return this.getPaginated<CollectionInfo>(url, 'collections');
  }
  
  private async getPaginated<T>(path: string, fieldName: string): Promise<T[]> {
    const url = `${this.options.endPoint}${path}`;
    const results: T[] = [];

    const { next, [fieldName]: data, count } = await this.get<any>(url, { count: 1 });
    results.push(...data);

    const nextRegex = new RegExp('.0+([0-9]+)__next$', 'gm');

    if (next) {
      const _cursorHash: string = next.split('cursor=')[1];
      const cursor = Buffer.from(_cursorHash, 'base64').toString();
      const sizeString = nextRegex.exec(cursor)?.[1];
      const size = parseInt(sizeString || '50', 10);

      const threadsCount = Math.min(Math.ceil(count / size), this.options.parallelRequests);

      if (this.options.debugMode) {
        console.debug(`Selected threads count: ${threadsCount}`);
      }

      let position = size;
      while (position < count) {

        let i = 0;
        const promises = [];

        while (i < threadsCount && position < count) {
          const nullDiff = Math.floor(Math.log10(position)) - Math.floor(Math.log10(size));
          const prefix = '0'.repeat(nullDiff);
          const newCursor = cursor.replace(prefix + size.toString(), position.toString());
          if (this.options.debugMode) {
            console.debug(newCursor);
          }
          const cursorHash = Buffer.from(newCursor, 'utf8').toString('base64');
          promises.push(this.get<any>(url, { cursor: cursorHash }));
          position += size;
          i++;
        }

        const responses = await Promise.all(promises);
        responses.forEach((response) => {
          results.push(...response[fieldName]);
        });
      }
    }

    return results;
  }

  private async get<T>(url: string, params = {}): Promise<T> {
    await this.waitForFloodControl();
    try {
      const response = await axios.get<T>(
        url,
        {
          params,
          headers: {
            Accept: 'application/json',
            'x-api-key': this.apiKey,
          },
        }
      );
      const json = response.data;
      return json;
    } catch (error) {
      console.error(error);
    }

    return {} as T;
  }

  private async waitForFloodControl() {
    if (this.options.floodControl) {
      const now = new Date();
      const diff = now.getTime() - this.lastRequestDate.getTime();
      if (diff < 100) {
        await sleep(100);
      }
    }
    this.lastRequestDate = new Date();
  }
}

function createApi (apiKey: string, options?: Partial<Options>) {
  return new SimpleHashAPI(apiKey, options);
}

export {
  createApi,
  Options,
};