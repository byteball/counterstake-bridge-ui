const environment = process.env.REACT_APP_ENVIRONMENT;

export const descOfManagers = environment === "mainnet"
  ? {
    KUNNTFAD3G55IWXSNKTDRKH222E4DF7R: {
      name: "tonych (Obyte)",
      desc: "Founder of Obyte"
    },
    "0x05CF60Df7ad9BBc89cE591c4DBcA4BD58135f166": {
      name: "tonych (EVM)",
      desc: "Founder of Obyte"
    }
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