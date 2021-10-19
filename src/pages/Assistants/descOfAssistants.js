const environment = process.env.REACT_APP_ENVIRONMENT;

export const descOfAssistants = environment === "mainnet"
  ? {

  }
  : {
    TNM2YRTJOANVGXMCFOH2FBVC3KYHZ4O6: {
      name: "Obyte Foundation (Obyte)",
      desc: "desc"
    },
    "0xEA6D65BAE2E0dDF1A3723B139cb989FAbCD63318": {
      name: "Obyte Foundation (EVM)",
      desc: "desc"
    }
  }