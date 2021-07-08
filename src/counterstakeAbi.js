export const counterstakeAbi = [
  {
    "inputs": [],
    "name": "settings",
    "outputs": [
      {
        "internalType": "address",
        "name": "tokenAddress",
        "type": "address"
      },
      {
        "internalType": "uint16",
        "name": "ratio100",
        "type": "uint16"
      },
      {
        "internalType": "uint16",
        "name": "counterstake_coef100",
        "type": "uint16"
      },
      {
        "internalType": "uint32",
        "name": "min_tx_age",
        "type": "uint32"
      },
      {
        "internalType": "uint256",
        "name": "min_stake",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "large_threshold",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint16",
        "name": "period_number",
        "type": "uint16"
      },
      {
        "internalType": "bool",
        "name": "bLarge",
        "type": "bool"
      }
    ],
    "name": "getChallengingPeriod",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "claim_num",
        "type": "uint256"
      }
    ],
    "name": "getClaim",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          },
          {
            "internalType": "address payable",
            "name": "recipient_address",
            "type": "address"
          },
          {
            "internalType": "uint32",
            "name": "txts",
            "type": "uint32"
          },
          {
            "internalType": "uint32",
            "name": "ts",
            "type": "uint32"
          },
          {
            "internalType": "address payable",
            "name": "claimant_address",
            "type": "address"
          },
          {
            "internalType": "uint32",
            "name": "expiry_ts",
            "type": "uint32"
          },
          {
            "internalType": "uint16",
            "name": "period_number",
            "type": "uint16"
          },
          {
            "internalType": "enum CounterstakeLibrary.Side",
            "name": "current_outcome",
            "type": "uint8"
          },
          {
            "internalType": "bool",
            "name": "is_large",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "withdrawn",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "finished",
            "type": "bool"
          },
          {
            "internalType": "string",
            "name": "sender_address",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "data",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "yes_stake",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "no_stake",
            "type": "uint256"
          }
        ],
        "internalType": "struct CounterstakeLibrary.Claim",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
]