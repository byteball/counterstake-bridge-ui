import appConfig from "appConfig"

const multiCalls = {
    Ethereum: {
        mainnet: "0x5ba1e12693dc8f9c48aad8770482f4739beed696",
        testnet: "0x5ba1e12693dc8f9c48aad8770482f4739beed696" // rinkeby (deprecated)
    },
    BSC: {
        mainnet: "0x1Ee38d535d541c55C9dae27B12edf090C608E6Fb",
        testnet: "0x1Ee38d535d541c55C9dae27B12edf090C608E6Fb"
    },
    Polygon: {
        mainnet: "0x275617327c958bD06b5D6b871E7f491D76113dd8",
        testnet: "0xca11bde05977b3631167028862be2a173976ca11", // mumbai
    },
    Kava: {
        mainnet: "0x30A62aA52Fa099C4B227869EB6aeaDEda054d121",
        testnet: "0x30A62aA52Fa099C4B227869EB6aeaDEda054d121"
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