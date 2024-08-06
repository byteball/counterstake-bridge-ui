import appConfig from "appConfig"

const multiCalls = {
    Ethereum: {
        mainnet: "0x5ba1e12693dc8f9c48aad8770482f4739beed696",
        testnet: "0x5ba1e12693dc8f9c48aad8770482f4739beed696" // rinkeby (deprecated)
    },
    BSC: {
        mainnet: "0x1Ee38d535d541c55C9dae27B12edf090C608E6Fb",
        testnet: "0xa6949b8fba9df546b9c66f98cfca960a96e3b68e"
    },
    Polygon: {
        mainnet: "0x275617327c958bD06b5D6b871E7f491D76113dd8",
        testnet: "0xe9939e7Ea7D7fb619Ac57f648Da7B1D425832631", // mumbai
    },
    Kava: {
        mainnet: "0x30A62aA52Fa099C4B227869EB6aeaDEda054d121",
        testnet: "0x2EF217760a2694D4cb51697BD8BC4F3eC8221E7b"
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