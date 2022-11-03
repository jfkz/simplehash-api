import { Chain } from '../types';

export interface SaleDetails {
  marketplace_name: string;
  is_bundle_sale: boolean;
  payment_token: PaymentToken;
  unit_price: number;
  total_price: number;
}

export interface Transfer {
  nft_id: string,
  chain: Chain,
  contract_address: string,
  token_id: null,
  from_address?: string,
  to_address: string,
  quantity: number,
  timestamp: string,
  block_number: number,
  block_hash?: string,
  transaction: string,
  log_index: number,
  batch_transfer_index: number,
  sale_details?: SaleDetails
}

export interface PaymentToken {
  payment_token_id: string;
  name: string;
  symbol: string;
  address?: string;
  decimals: number;
}

export interface Sale {
  from_address?: string,
  to_address?: string,
  quantity: number,
  timestamp: string,
  transaction: string,
  marketplace_name: string,
  is_bundle_sale: boolean,
  payment_token: PaymentToken,
  unit_price: number,
  total_price: number,
}

export interface CollectionInfo {
  id: string,
  name: string,
  description: string,
  chain: Chain,
}

export interface Owner {
  nft_id?: string,
  owner_address: string,
  quantity: number,
  first_acquired_date: string,
  last_acquired_date: string
}

export interface Collection {
  collection_id: string,
  name: string,
  description: string,
  image_url?: string,
  banner_image_url?: string,
  external_url?: string,
  twitter_username?: string,
  discord_url?: string,
  marketplace_pages: {
    marketplace_name: string,
    marketplace_collection_id: string,
    collection_url: string,
    verified: boolean
  }[],
  metaplex_mint?: string,
  metaplex_first_verified_creator?: string,
  spam_score: number,
  floor_prices: FloorPrice[],
}

export interface FloorPrice {
  marketplace_id: string,
  value: number,
  payment_token: PaymentToken,
}

export interface NFT {
  nft_id: string;
  chain: Chain,
  contract_address: string,
  token_id: string,
  name?: string,
  description?: string,
  image_url?: string,
  video_url?: string,
  audio_url?: string,
  model_url?: string,
  previews: {
    image_small_url?: string,
    image_medium_url?: string,
    image_large_url?: string,
    image_opengraph_url?: string,
    blurhash?: string,
  },
  background_color?: string,
  external_url?: string,
  created_date?: string,
  status: 'minted' | 'burned',
  token_count: number,
  owner_count: number,
  owners: Owner[];
  last_sale?: Sale,
  contract: {
    type: string,
    name: string,
    symbol: string
  },
  collection: Collection,
  extra_metadata?: {
    [key: string]: any,
    image_original_url?: string,
    animation_original_url?: string,
    attributes?: {
      trait_type: string,
      value: string | number,
    }[],
  }
}
