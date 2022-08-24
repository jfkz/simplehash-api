# SimpleHash API

[![NPM](https://nodei.co/npm/simplehash-api.png)](https://nodei.co/npm/simplehash-api/)

## Introduction

SimpleHash is Multi-chain NFT API. Live on Ethereum, Polygon, Solana, Optimism and Arbitrum.

Read more about it [here](https://simplehash.com/).

## Installation

```bash
npm i simplehash-api
```

## Example usage

```node
import * as SimpleHash from 'simplehash-api';

(async () => {
  const simpleHash = SimpleHash.createApi(API_KEY);

  const transfers = await simpleHash.transfersByNft('solana', 'FmhJc5zWfifRi9azMBtWnhAqXNwqwvzV7kqX5M5zGyL4');
  console.log(transfers);
})();

```

## TODO

* Add more APIs
* Add more examples
* Add more tests
* Add more documentation

&copy; 2022, [@jfkz](https://github.com/jfkz)