import { ethers } from "ethers";

import { nativeSymbols } from "nativeSymbols";
import config from "appConfig";

const environment = config.ENVIRONMENT;

const cache_lifetime = 10 * 60 * 1000; // 10 minutes

class Cache {
  #data = {};

  get(key) {
    const record = this.#data[key];
    if (!record)
      return null;
    if (record.ts < Date.now() - cache_lifetime) // expired
      return null;
    return record.value;
  }

  put(key, value) {
    this.#data[key] = { value, ts: Date.now() };
  }
}

const cache = new Cache();

function cachify(func, count_args) {
  return async function () {
    const cached = arguments[count_args]; // the last arg is optional
    const args = [];
    for (let i = 0; i < count_args; i++) // not including the 'cached' arg
      args[i] = arguments[i];
    const key = func.name + '_' + args.join(',');
    if (cached) {
      const value = cache.get(key);
      if (value !== null) {
        return value;
      }
    }
    const value = await func.apply(null, args);
    cache.put(key, value);
    return value
  }
}

const request = async (url, options) => {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    ...options
  })
  if (!response.ok) {
    const error = await response.text()
    console.error('-- error', error)
    throw new Error(error)
  }
  const data = await response.json()
  return data
}

export const fetchERC20ExchangeRate = async (chain, token_address, quote) => {
  if (token_address === '0x4DBCdF9B62e891a7cec5A2568C3F4FAF9E8Abe2b') // USDC rinkeby
    token_address = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
  if (token_address === '0xbF7A7169562078c96f0eC1A8aFD6aE50f12e5A99') // BAT rinkeby
    token_address = '0x0D8775F648430679A709E98d2b0Cb6250d2887EF';
  if (token_address === '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee') // BUSD testnet
    token_address = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56';
  if (token_address === '0xB554fCeDb8E4E0DFDebbE7e58Ee566437A19bfB2') // DAI devnet
    token_address = '0x6b175474e89094c44da98b954eedeac495271d0f';
  const data = await request(`https://api.coingecko.com/api/v3/coins/${chain}/contract/${token_address.toLowerCase()}`)
  const prices = data.market_data.current_price

  quote = quote.toLowerCase()
  if (!prices[quote])
    throw new Error(`no ${quote} in response ${JSON.stringify(data)}`);
  return prices[quote]
}

export const fetchCryptocompareExchangeRate = async (in_currency, out_currency) => {
  const data = await request(`https://min-api.cryptocompare.com/data/price?fsym=${in_currency}&tsyms=${out_currency}`)
  if (!data[out_currency])
    throw new Error(`no ${out_currency} in response ${JSON.stringify(data)}`);
  return data[out_currency]
}

export const fetchObyteTokenPrices = async () => {
  const data = await request(environment === "mainnet" ? "https://referrals.ostable.org/prices" : "https://testnet.ostable.org/r/prices");
  const prices = data.data
  if (!prices)
    throw Error(`no prices from referrals ${data.error}`);
  return prices
}


const fetchERC20ExchangeRateCached = cachify(fetchERC20ExchangeRate, 3)
export const fetchCryptocompareExchangeRateCached = cachify(fetchCryptocompareExchangeRate, 2)
const fetchObyteTokenPricesCached = cachify(fetchObyteTokenPrices, 0)

const coingeckoChainIds = {
  Ethereum: 'ethereum',
  BSC: 'binance-smart-chain',
  Polygon: 'polygon-pos',
};

async function tryGetTokenPrice(network, token_address, nativeSymbol, cached) {
  switch (network) {
    case 'Ethereum':
    case 'BSC':
    case 'Polygon':
      try {
        const chain = coingeckoChainIds[network];
        return await fetchERC20ExchangeRateCached(chain, token_address, nativeSymbol, cached);
      }
      catch (e) {
        console.log(`fetchERC20ExchangeRate for ${network} ${token_address}/${nativeSymbol} failed`, e);
      }
      break;
    
    default: {
      break;
    }
  }
  return null;
}

export const fetchExchangeRateInUSD = async (network, asset, cached) => {
  if (network === 'Obyte') {
    if (asset === 'base')
      return await fetchCryptocompareExchangeRateCached('GBYTE', 'USD', cached);
    const prices = await fetchObyteTokenPricesCached(cached);
    const price_in_usd = prices[asset];
    return price_in_usd || null;
  }
  if (asset === ethers.constants.AddressZero)
    return await fetchCryptocompareExchangeRateCached(nativeSymbols[network], 'USD', cached);
  return await tryGetTokenPrice(network, asset, 'USD', cached);
}