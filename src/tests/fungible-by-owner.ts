import dotenv from 'dotenv';
dotenv.config();

import { createApi } from '../lib';

const apiKey = `${process.env.SIMPLEHASH_API_KEY}`;
const owner = `${process.env.FUNGIBLE_TOKEN_OWNER}`;

const simpleHashApi = createApi(apiKey, {
  debugMode: true,
  floodControl: false,
  parallelRequests: 10,
});

(async () => {
  const tokens = await simpleHashApi.fungiblesBalanceByWallets(['ethereum'], [owner]);
  console.log(tokens.length);
  const transfers = await simpleHashApi.fungibleSalesAndTransfersByWallets(['ethereum'], [owner]);
  console.log(transfers.length);
})();