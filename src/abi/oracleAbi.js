export const oracleAbi = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "base",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "quote",
        "type": "string"
      }
    ],
    "name": "getPrice",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "num",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "den",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]