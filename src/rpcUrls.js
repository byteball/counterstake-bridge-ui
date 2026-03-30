import config from "appConfig";

export const rpcUrls = {
  Ethereum: {
    devnet: ["http://0.0.0.0:7545"],
    testnet: [],
    mainnet: [
      "https://eth.llamarpc.com",
      config.INFURA_PROJECT_ID && `https://mainnet.infura.io/v3/${config.INFURA_PROJECT_ID}`,
      config.NODEREAL_PROJECT_ID && `https://eth-mainnet.nodereal.io/v1/${config.NODEREAL_PROJECT_ID}`,
    ].filter(Boolean),
  },
  BSC: {
    devnet: [],
    testnet: ["https://bsc-testnet.publicnode.com"],
    mainnet: [
      "https://bsc-dataseed.binance.org",
      "https://bsc-rpc.publicnode.com",
    ],
  },
  Polygon: {
    devnet: [],
    testnet: ["https://lb.drpc.org/ogrpc?network=polygon-mumbai&dkey=Ao-5EFErO0GtsfoqNeD3Dc0fTzGeU_0R77XZvmJKmvm9"],
    mainnet: [
      "https://polygon-bor-rpc.publicnode.com",
    ],
  },
  Kava: {
    devnet: [],
    testnet: ["https://evm.testnet.kava.io"],
    mainnet: [
      "https://evm.kava.io",
      "https://kava-evm-rpc.publicnode.com",
    ],
  },
};
