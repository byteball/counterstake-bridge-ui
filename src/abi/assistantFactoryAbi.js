export const assistantFactoryAbi = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_exportAssistantMaster",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_importAssistantMaster",
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
        "name": "bridgeAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "manager",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      }
    ],
    "name": "NewExportAssistant",
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
        "internalType": "address",
        "name": "bridgeAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "manager",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      }
    ],
    "name": "NewImportAssistant",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "exportAssistantMaster",
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
    "name": "importAssistantMaster",
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
        "internalType": "address",
        "name": "bridgeAddr",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "managerAddr",
        "type": "address"
      },
      {
        "internalType": "uint16",
        "name": "_management_fee10000",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "_success_fee10000",
        "type": "uint16"
      },
      {
        "internalType": "address",
        "name": "oracleAddr",
        "type": "address"
      },
      {
        "internalType": "uint8",
        "name": "_exponent",
        "type": "uint8"
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
      }
    ],
    "name": "createExportAssistant",
    "outputs": [
      {
        "internalType": "contract ExportAssistant",
        "name": "exportAssistant",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "bridgeAddr",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "managerAddr",
        "type": "address"
      },
      {
        "internalType": "uint16",
        "name": "_management_fee10000",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "_success_fee10000",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "_swap_fee10000",
        "type": "uint16"
      },
      {
        "internalType": "uint8",
        "name": "_exponent",
        "type": "uint8"
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
      }
    ],
    "name": "createImportAssistant",
    "outputs": [
      {
        "internalType": "contract ImportAssistant",
        "name": "importAssistant",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]