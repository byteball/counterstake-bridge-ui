import { chainIds } from "chainIds";

const environment = process.env.REACT_APP_ENVIRONMENT;

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