import dotenv from 'dotenv';
dotenv.config();

import { createApi } from '../lib';

const apiKey = `${process.env.SIMPLEHASH_API_KEY}`;
const owner = `${process.env.NFT_OWNER}`;

const simpleHashApi = createApi(apiKey, {
  debugMode: true,
  floodControl: false,
  parallelRequests: 10,
});

(async () => {
  const nfts = await simpleHashApi.nftsByOwners(['ethereum'], [owner]);
  console.log(nfts.length);
})();