
export const multicallAbi = [
    {
        "constant": true,
        "inputs": [
            {
                "components": [
                    {
                        "name": "target",
                        "type": "address"
                    },
                    {
                        "name": "callData",
                        "type": "bytes"
                    }
                ],
                "name": "calls",
                "type": "tuple[]"
            }
        ],
        "name": "aggregate",
        "outputs": [
            {
                "name": "blockNumber",
                "type": "uint256"
            },
            {
                "name": "returnData",
                "type": "bytes[]"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "name": "requireSuccess",
                "type": "bool"
            },
            {
                "components": [
                    {
                        "name": "target",
                        "type": "address"
                    },
                    {
                        "name": "callData",
                        "type": "bytes"
                    }
                ],
                "name": "calls",
                "type": "tuple[]"
            }
        ],
        "name": "tryAggregate",
        "outputs": [
            {
                "components": [
                    {
                        "name": "success",
                        "type": "bool"
                    },
                    {
                        "name": "returnData",
                        "type": "bytes"
                    }
                ],
                "name": "returnData",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "name": "addr",
                "type": "address"
            }
        ],
        "name": "getEthBalance",
        "outputs": [
            {
                "name": "balance",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];