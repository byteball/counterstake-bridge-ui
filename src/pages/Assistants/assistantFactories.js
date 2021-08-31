const env = process.env;

// const environment = process.env.REACT_APP_ENVIRONMENT;
export const assistantFactories = {
  mainnet: {
    Obyte: {
      import: "BRDUWQBFJZ277E3QUQXTMDGP3LLLGUO3",
      export: "EKZPWMJOKI6LTRKQTEUD7IFK4BBR5GMK",
    },
    Ethereum: {
      import: "0x12d40AA1861f32a08508ecE504269a1f12759F72",
      export: "0x12d40AA1861f32a08508ecE504269a1f12759F72",
    },
    BSC: {
      import: "0xd634330ca14524A43d193E1c2e92cbaB72952896",
      export: "0xd634330ca14524A43d193E1c2e92cbaB72952896",
    },
    Polygon: {
      import: "0xE740C62aC78bB2666Fa9465052D0a292D7C27A11",
      export: "0xE740C62aC78bB2666Fa9465052D0a292D7C27A11",
    },
  },
  testnet: {
    Obyte: {
      import: "BRDUWQBFJZ277E3QUQXTMDGP3LLLGUO3",
      export: "EKZPWMJOKI6LTRKQTEUD7IFK4BBR5GMK",
    },
    Ethereum: {
      import: "0x39F9CC0a70a5327e129B1Aab6b3B265fA0C03C01",
      export: "0x39F9CC0a70a5327e129B1Aab6b3B265fA0C03C01",
    },
    BSC: {
      import: "0x426D200d3572febdc2C154A58043bF9f857fb7E6",
      export: "0x426D200d3572febdc2C154A58043bF9f857fb7E6",
    },
    Polygon: {
      import: "0xd8BF89335214Caf4724739F52621bC6D70eF87bF",
      export: "0xd8BF89335214Caf4724739F52621bC6D70eF87bF",
    },
  },
  devnet: {
    Obyte: {
      import: env.REACT_APP_OBYTE_IMPORT_ASSISTANT_FACTORY,
      export: env.REACT_APP_OBYTE_EXPORT_ASSISTANT_FACTORY,
    },
    Ethereum: {
      import: env.REACT_APP_ETH_ASSISTANT_FACTORY,
      export: env.REACT_APP_ETH_ASSISTANT_FACTORY,
    },
    BSC: {
      import: env.REACT_APP_BSC_ASSISTANT_FACTORY,
      export: env.REACT_APP_BSC_ASSISTANT_FACTORY,
    },
    Polygon: {
      import: env.REACT_APP_POLYGON_ASSISTANT_FACTORY,
      export: env.REACT_APP_POLYGON_ASSISTANT_FACTORY,
    },
  },
};