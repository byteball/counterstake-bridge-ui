import { chainIds } from "chainIds";
import config from "appConfig";

const environment = config.ENVIRONMENT;

const rpcMeta = {
  mainnet: {
    Ethereum: undefined,
    BSC: {
      chainId: '0x38',
      chainName: 'BSC Network',
      nativeCurrency:
      {
        name: 'BNB',
        symbol: 'BNB',
        decimals: 18
      },
      rpcUrls: ['https://bsc-dataseed.binance.org/'],
      blockExplorerUrls: ['https://bscscan.com/'],
    },
    Polygon: {
      chainId: '0x89',
      chainName: 'Polygon Network',
      nativeCurrency:
      {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18
      },
      rpcUrls: ['https://rpc-mainnet.maticvigil.com'],
      blockExplorerUrls: ['https://polygonscan.com/'],
    },
    Kava: {
      chainId: '0x8ae',
      chainName: 'Kava EVM Network',
      nativeCurrency:
      {
        name: 'KAVA',
        symbol: 'KAVA',
        decimals: 18
      },
      rpcUrls: ['https://evm.kava.io'],
      blockExplorerUrls: ['https://explorer.kava.io/'],
    },
  },
  testnet: {
    Ethereum: undefined, // rinkeby
    BSC: {
      chainId: '0x61',
      chainName: 'BSC Test Network',
      nativeCurrency:
      {
        name: 'BNB',
        symbol: 'BNB',
        decimals: 18
      },
      rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545'],
      blockExplorerUrls: ['https://testnet.bscscan.com/'],
    },
    Polygon: {
      chainId: '0x13881',
      chainName: 'Polygon TEST Network',
      nativeCurrency:
      {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18
      },
      rpcUrls: ['https://rpc-mumbai.maticvigil.com'],
      blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
    },
    Kava: {
      chainId: '0x8ad',
      chainName: 'Kava EVM Test Network',
      nativeCurrency:
      {
        name: 'KAVA',
        symbol: 'KAVA',
        decimals: 18
      },
      rpcUrls: ['https://evm.testnet.kava.io'],
      blockExplorerUrls: ['https://explorer.testnet.kava.io/'],
    },
  },
  devnet: {
    Ethereum: 1337, // ganache
    BSC: null,
  },
};

export const changeNetwork = async (network) => {
  const chainId = chainIds[environment][network];
  return await window.ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: `0x${Number(chainId).toString(16)}` }],
  }).catch(async (switchError) => {
    if (switchError.code === 4902) {
      const params = rpcMeta[environment][network];

      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [params],
      });

      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${Number(chainId).toString(16)}` }],
      }).catch((e) => {
        throw new Error("wallet_switchEthereumChain error", e);
      })

      return Promise.resolve()
    } else {
      throw new Error("wallet_switchEthereumChain error");
    }
  });
}