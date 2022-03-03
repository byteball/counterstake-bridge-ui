export const counterstakeFactoryAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_exportMaster",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_importMaster",
        "type": "address"
      },
      {
        "internalType": "contract GovernanceFactory",
        "name": "_governanceFactory",
        "type": "address"
      },
      {
        "internalType": "contract VotedValueFactory",
        "name": "_votedValueFactory",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "contractAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "foreign_network",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "foreign_asset",
        "type": "string"
      }
    ],
    "name": "NewExport",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "contractAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "home_network",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "home_asset",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "stakeTokenAddress",
        "type": "address"
      }
    ],
    "name": "NewImport",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "exportMaster",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "importMaster",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "foreign_network",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "foreign_asset",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "tokenAddr",
        "type": "address"
      },
      {
        "internalType": "uint16",
        "name": "counterstake_coef100",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "ratio100",
        "type": "uint16"
      },
      {
        "internalType": "uint256",
        "name": "large_threshold",
        "type": "uint256"
      },
      {
        "internalType": "uint256[]",
        "name": "challenging_periods",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256[]",
        "name": "large_challenging_periods",
        "type": "uint256[]"
      }
    ],
    "name": "createExport",
    "outputs": [
      {
        "internalType": "contract Export",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "home_network",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "home_asset",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "name",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "stakeTokenAddr",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "oracleAddr",
        "type": "address"
      },
      {
        "internalType": "uint16",
        "name": "counterstake_coef100",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "ratio100",
        "type": "uint16"
      },
      {
        "internalType": "uint256",
        "name": "large_threshold",
        "type": "uint256"
      },
      {
        "internalType": "uint256[]",
        "name": "challenging_periods",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256[]",
        "name": "large_challenging_periods",
        "type": "uint256[]"
      }
    ],
    "name": "createImport",
    "outputs": [
      {
        "internalType": "contract Import",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];