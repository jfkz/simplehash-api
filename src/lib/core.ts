import axios from 'axios';
import { Collection, CollectionInfo, FloorPrice, FungibleToken, NFT, Owner, Transfer } from './interfaces';
import { Chain, Marketplace, Order } from './types';

interface Options {
  endPoint: string;
  floodControl: boolean;
  debugMode: boolean;
  parallelRequests: number;
}

interface NFTsByCollectionParams {
  order?: Order;
  endpoint?: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class SimpleHashAPI {
  private readonly options: Options = {
    endPoint: 'https://api.simplehash.com/api/v0/',
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
    };
  }

  /**
   * This endpoint is commonly used to retrieve metadata of all of the NFTs on a single collection
   * To understand more about the difference between Collections and Contracts, please refer to our FAQ
   *
   * @param collectionId The unique identifier of the collection (obtainable from an NFT response, or from the Collection ID Lookup endpoint)
   */
  public async nftsByCollection(collectionId: string, params?: NFTsByCollectionParams) {
    params = {
      order: 'timestamp_desc',
      endpoint: 'collection',
      ...params,
    };
    const path = `${params.endpoint}/${collectionId}`;
    return this.getPaginated<NFT>(path, 'nfts');
  }

  /**
   * This endpoint is commonly used to retrieve metadata of all of the NFTs on a single contract (e.g., Mutant Ape Yacht Club):
   * Pass a chain and contract address to get back information on the NFTs in this contract
   * To understand more about the difference between Collections and Contracts, please refer to our FAQ
   * On Solana, this endpoint will function identically to NFT by Token ID
   * On Flow, the current list of contracts with metadata can be found here
   *
   * @param collectionId The unique identifier of the collection (obtainable from an NFT response, or from the Collection ID Lookup endpoint)
   */
  public async nftsByContract(chain: Chain, contractAddress: string, params?: NFTsByCollectionParams) {
    params = {
      order: 'timestamp_desc',
      endpoint: chain,
      ...params,
    };
    const path = `${params.endpoint}/${contractAddress}`;
    return this.getPaginated<NFT>(path, 'nfts');
  }

  /**
   * This endpoint is commonly used to pass specific wallet addresses to get back the metadata of the NFTs held by them:
   * @param chains Name of the chain(s) (e.g., optimism), comma-separated for multiple values (e.g, optimism,ethereum)
   * @param walletAddresses Owner wallet address(es), comma-separated for multiple values (e.g., 0xa12,0xb34). Limit of 20 addresses.
   * @param queriedWalletBalances The quantity owned and acquired dates of each NFT for each wallet (useful for ERC1155s) (pass queried_wallet_balances=1)
   * @returns Array of NFTs
   */
  public async nftsByOwners(
    chains: Chain[],
    walletAddresses: string[],
    queriedWalletBalances?: number,
  ): Promise<NFT[]> {
    const chain = chains.join(',');
    const wallet = walletAddresses.join(',');
    let url = `owners?chains=${chain}&wallet_addresses=${wallet}`;
    if (queriedWalletBalances) {
      url += `&queried_wallet_balances=${queriedWalletBalances}`;
    }
    return this.getPaginatedSingleThread<NFT>(url, 'nfts');
  }

  /**
   * This endpoint use to get NFT details of given chain,contract address and token id of NFT
   *
   * @param chain Name of the chain
   * @param contractAddress Address of the NFT contract
   * @param tokenId Token ID of the given NFT
   */
  public async nftByTokenId(chain: string, contractAddress: string, tokenId: string): Promise<NFT> {
    const url = `${chain}/${contractAddress}/${tokenId}`;
    return this.get(url);
  }

  /**
   * This endpoint is commonly used to pass specific wallet addresses to get back a list of inbound and outbound NFT transfers:
   * @param chains Name of the chain(s) (e.g., optimism), comma-separated for multiple values (e.g, optimism,ethereum)
   * @param walletAddresses Owner wallet address(es), comma-separated for multiple values (e.g., 0xa12,0xb34). Limit of 20 addresses.
   * @param orderBy Available values are timestamp_desc (default) or timestamp_asc
   * @returns Array of transfers
   */
  public async transfersByWallets(
    chains: Chain[],
    walletAddresses: string[],
    orderBy: Order = 'timestamp_desc',
  ): Promise<Transfer[]> {
    const chain = chains.join(',');
    const wallet = walletAddresses.join(',');
    const url = `transfers/wallets?chains=${chain}&wallet_addresses=${wallet}&order_by=${orderBy}`;
    return this.getPaginatedSingleThread<Transfer>(url, 'transfers');
  }

  /**
   * This endpoint is commonly used to pass a single specific NFT to get back a list of its historical transfers:
   * @param chain Name of the chain
   * @param contractAddress Address of the NFT contract
   * @param tokenId Token ID of the given NFT
   * @param orderBy Available values are timestamp_desc (default) or timestamp_asc
   * @returns Array of transfers
   */
  public async transfersByNft(
    chain: Chain,
    contractAddress: string,
    tokenId = '',
    orderBy: Order = 'timestamp_desc',
  ): Promise<Transfer[]> {
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
  public async collectionIDLookup(
    metaplexMint = '',
    marketplaceCollectionId = '',
    marketplaceName: Marketplace = 'opensea',
  ) {
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

  /**
   * This endpoint is commonly used to provide the summary metadata of specific collections.
   * To understand more about the difference between Collections and Contracts, please refer to our FAQ
   * @param collectionId The unique identifier of the collection (obtainable from an NFT response, or from the Collection ID Lookup endpoint)
   */
  public async collectionsByIDs(collectionIds: string[]) {
    const chunkSize = 50;
    const chunks = collectionIds.reduce<string[][]>((result, item, index) => {
      const chunkIndex = Math.floor(index / chunkSize);
      if (!result[chunkIndex]) {
        result[chunkIndex] = [];
      }
      result[chunkIndex].push(item);
      return result;
    }, []);
    const collections: Collection[] = [];
    for (const chunk of chunks) {
      const path = `collections/ids?collection_ids=${chunk.join(',')}`;
      const data = await this.getPaginated<Collection>(path, 'collections');
      collections.push(...data);
    }
    return collections;
  }

  /**
   * This endpoint is commonly used to retrieve the floor prices for each of the traits of a given NFT.
   * For example, this endpoint can be used to find the maximum trait floor price for a token.
   * Results are sorted by floor price, descending. A maximum of 50 trait floor prices are returned.
   * 
   * @param chain Name of the chain
   * @param contractAddress Address of the NFT contract
   * @param tokenId Token ID of the given NFT
   */
  public async traitFloorPriceByNft(chain: string, contractAddress: string, tokenId: string) {
    const url = `traits/${chain}/${contractAddress}/${tokenId}/floors`;
    return this.getPaginated<FloorPrice>(url, 'trait_floor_prices');
  }

  /**
   * This endpoint is currently in beta for Arbitrum, Base, Base-Sepolia, Bitcoin (Runes), 
   * Blast, Optimism, Palm, Scroll, Sei (v2), Xai, and Zora
   * 
   * This endpoint is commonly used to pass specific wallet addresses to 
   * get a list of fungibles balances ordered by `last_transferred_date`.
   * 
   * @param chains array of chains
   * @param walletAddresses array of wallet addresses
   * @param includePrices boolean to include prices
   */
  public async fungiblesBalanceByWallets(chains: Chain[], walletAddresses: string[], includePrices = false) {
    const chain = chains.join(',');
    const wallet = walletAddresses.join(',');
    const url = `balances?chains=${chain}&wallet_addresses=${wallet}&include_prices=${includePrices ? 1 : 0}`;
    const rawResponse = await this.getPaginated<FungibleToken>(url, 'fungibles', 'fungibles');
    rawResponse.forEach((token) => {
      const tokenAddress = token.fungible_id.split('.')[1];
      token.token_address = tokenAddress;
    });
    return rawResponse;
  }

  /**
   * This endpoint is currently in beta for Arbitrum, Base, Base-Sepolia, Bitcoin (Runes), 
   * Blast, Optimism, Palm, Scroll, Sei (v2), Xai, and Zora
   * 
   * This endpoint is commonly used to pass specific wallet addresses 
   * to get back a list of inbound and outbound fungible transfers:
   * 
   * @param chains chain(s) (e.g., optimism), comma-separated for multiple values (e.g, optimism,ethereum)
   * @param walletAddresses wallet address(es), comma-separated for multiple values (e.g., 0xa12,0xb34). Limit of 20 addresses.
   * @param fundgibleIds fungible token id(s), comma-separated for multiple values (e.g., 0xa12,0xb34). Limit of 20 addresses.
   * @param fromTimestamp Lower bound timestamp (inclusive). Seconds since the Unix epoch.
   * @param toTimestamp Upper bound timestamp (inclusive). Seconds since the Unix epoch.
   * @returns 
   */
  public async fungibleSalesAndTransfersByWallets(chains: Chain[], walletAddresses: string[], fundgibleIds: string[] = [], fromTimestamp?: number, toTimestamp?: number) {
    const chain = chains.join(',');
    const wallet = walletAddresses.join(',');
    let url = `transfers/wallets?chains=${chain}&wallet_addresses=${wallet}`;
    if (fundgibleIds.length > 0) {
      url += `&fungible_ids=${fundgibleIds.join(',')}`;
    }
    if (fromTimestamp) {
      url += `&from_timestamp=${fromTimestamp}`;
    }
    if (toTimestamp) {
      url += `&to_timestamp=${toTimestamp}`;
    }
    return this.getPaginated<Transfer>(url, 'transfers', 'fungibles');
  }

  private async getPaginated<T>(path: string, fieldName: string, category: 'nfts' | 'fungibles' = 'nfts'): Promise<T[]> {
    const url = `${this.options.endPoint}${category}/${path}`;
    const results: T[] = [];

    const { next, [fieldName]: data, count } = await this.get<any>(url);
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

  private async getPaginatedSingleThread<T>(path: string, fieldName: string, category: 'nfts' | 'fungibles' = 'nfts'): Promise<T[]> {
    const url = `${this.options.endPoint}${category}/${path}`;
    const results = [];

    const { next, [fieldName]: data } = await this.get<any>(url);
    results.push(...data);

    let nextUrl = next;
    if (nextUrl) {
      while (nextUrl != null) {
        const { next, [fieldName]: data } = await this.get<any>(nextUrl);
        nextUrl = next;
        results.push(...data);
      }
    }
    return results;
  }

  private async get<T>(fullUrl: string, params = {}): Promise<T> {
    await this.waitForFloodControl();
    try {
      const response = await axios.get<T>(fullUrl, {
        params,
        headers: {
          Accept: 'application/json',
          'x-api-key': this.apiKey,
        },
      });
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

function createApi(apiKey: string, options?: Partial<Options>) {
  return new SimpleHashAPI(apiKey, options);
}

export { createApi, Options };
