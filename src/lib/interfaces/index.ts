import { Chain } from '../types';

export interface SaleDetails {
  marketplace_name: string;
  is_bundle_sale: boolean;
  payment_token: PaymentToken;
  unit_price: number;
  total_price: number;
}

export interface Transfer {
  nft_id: string;
  chain: Chain;
  contract_address: string;
  token_id: null;
  from_address?: string;
  to_address: string;
  quantity: number;
  timestamp: string;
  block_number: number;
  block_hash?: string;
  transaction: string;
  log_index: number;
  batch_transfer_index: number;
  sale_details?: SaleDetails;
}

export interface PaymentToken {
  payment_token_id: string;
  name: string;
  symbol: string;
  address?: string;
  decimals: number;
}

export interface Sale {
  from_address?: string;
  to_address?: string;
  quantity: number;
  timestamp: string;
  transaction: string;
  marketplace_name: string;
  is_bundle_sale: boolean;
  payment_token: PaymentToken;
  unit_price: number;
  total_price: number;
}

export interface CollectionInfo {
  id: string;
  name: string;
  description: string;
  chain: Chain;
}

export interface Owner {
  nft_id?: string;
  owner_address: string;
  quantity: number;
  first_acquired_date: string;
  last_acquired_date: string;
}

export interface Collection {
  collection_id: string;
  name: string;
  description: string;
  image_url?: string;
  banner_image_url?: string;
  external_url?: string;
  twitter_username?: string;
  discord_url?: string;
  marketplace_pages: {
    marketplace_name: string;
    marketplace_collection_id: string;
    collection_url: string;
    verified: boolean;
  }[];
  metaplex_mint?: string;
  metaplex_first_verified_creator?: string;
  spam_score: number;
  floor_prices: FloorPrice[];
  top_contracts: string[];
}

export interface FloorPrice {
  marketplace_id: string;
  value: number;
  payment_token: PaymentToken;
  value_usd_cents: number;
}

export interface TokenQuantity {
  address: string;
  quantity: number;
  quantity_string: string;
  first_acquired_date: string;
  last_acquired_date: string;
}

export interface NFTPreview {
  image_small_url?: string;
  image_medium_url?: string;
  image_large_url?: string;
  image_opengraph_url?: string;
  blurhash?: string;
}

export interface TokenContract {
  type: string;
  name: string;
  symbol: string;
}

export interface NFT {
  nft_id: string;
  chain: Chain;
  contract_address: string;
  token_id: string;
  name?: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  audio_url?: string;
  model_url?: string;
  previews: NFTPreview;
  background_color?: string;
  external_url?: string;
  created_date?: Date;
  status: 'minted' | 'burned';
  token_count: number;
  owner_count: number;
  owners: Owner[];
  last_sale?: Sale;
  contract: TokenContract;
  collection: Collection;
  extra_metadata?: {
    [key: string]: any;
    image_original_url?: string;
    animation_original_url?: string;
    attributes?: {
      trait_type: string;
      value: string | number;
    }[];
  };
  queried_wallet_balances?: TokenQuantity[];
}

export interface TokenQuantityFungible extends TokenQuantity {
  value_usd_cents: number | null;
  value_usd_cents_string: string | null;
}

export interface FungiblePrice {
  marketplace_id: string;
  marketplace_name: string;
  value_usd_cents: number;
  value_usd_cents_string: string;
}

export interface FungibleToken {
  fungible_id: string;
  name: string;
  symbol: string;
  decimals: number;
  chain: Chain;
  token_address: string;
  prices: FungiblePrice[];
  total_quantity: bigint;
  total_quantity_string: string;
  total_value_usd_cents: number | null;
  total_value_usd_cents_string: string | null;
  queried_wallet_balances: TokenQuantityFungible[];
}

export interface FungibleTokenTransfer {
  fungible_id: string;
  chain: Chain;
  from_address: string;
  to_address: string;
  quantity: number;
  quantity_string: string;
  timestamp: string;
  block_number: number;
  block_hash: string;
  transaction_index: number;
  log_index: number;
  batch_transfer_index: bigint;
  transaction_hash: string;
}

export interface CollectionRoyalties {
  source: string;
  total_creator_fee_basis_points: number;
  recipients: any[];
}

export interface ImageProperties {
  width: number;
  height: number;
  mime_type: string;
}

export interface MarketplacePage {
  marketplace_id: string;
  marketplace_name: string;
  marketplace_collection_id: string;
  collection_url: string;
  verified: boolean | null;
}

export interface CollectionDetails {
  collection_id: string;
  name: string;
  description: string;
  image_url: string;
  image_properties: ImageProperties;
  banner_image_url: string | null;
  category: string | null;
  is_nsfw: boolean;
  external_url: string | null;
  twitter_username: string | null;
  discord_url: string | null;
  instagram_username: string | null;
  medium_username: string | null;
  telegram_url: string | null;
  marketplace_pages: MarketplacePage[];
  metaplex_mint: string | null;
  metaplex_candy_machine: string | null;
  metaplex_first_verified_creator: string | null;
  mpl_core_collection_address: string | null;
  floor_prices: any[];
  top_bids: any[];
  distinct_owner_count: number;
  distinct_nft_count: number;
  total_quantity: number;
  chains: string[];
  top_contracts: string[];
  collection_royalties: CollectionRoyalties[];
}

export interface NFTContract {
  primary_key: string;
  chain: string;
  contract_address: string;
  name: string;
  type: string;
  has_multiple_collections: boolean;
  distinct_nfts_owned: number;
  distinct_nfts_owned_string: string;
  total_copies_owned: number;
  total_copies_owned_string: string;
  last_acquired_date: string;
  collections: CollectionDetails[];
}