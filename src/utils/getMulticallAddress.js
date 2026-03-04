import appConfig from "appConfig"

// Multicall3 canonical address — deployed on all major EVM chains
const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";

const multiCalls = {
    Ethereum: {
        mainnet: MULTICALL3_ADDRESS,
        testnet: MULTICALL3_ADDRESS
    },
    BSC: {
        mainnet: MULTICALL3_ADDRESS,
        testnet: MULTICALL3_ADDRESS
    },
    Polygon: {
        mainnet: MULTICALL3_ADDRESS,
        testnet: MULTICALL3_ADDRESS,
    },
    Kava: {
        mainnet: MULTICALL3_ADDRESS,
        testnet: MULTICALL3_ADDRESS
    }
}

export const getMultiCallAddress = (network) => {
    if (network in multiCalls) {
        if (appConfig.ENVIRONMENT === "mainnet" || appConfig.ENVIRONMENT === "testnet") {
            return multiCalls[network][appConfig.ENVIRONMENT];
        } else {
            throw new Error(`Environment ${appConfig.ENVIRONMENT} not supported`);
        }
    } else {
        throw new Error(`Network ${network} not supported`)
    }
}