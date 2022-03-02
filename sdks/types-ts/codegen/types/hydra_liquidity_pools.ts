export type HydraLiquidityPools = {
  "version": "0.1.0",
  "name": "hydra_liquidity_pools",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "poolState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenBMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lpTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpTokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tokenAVaultBump",
          "type": "u8"
        },
        {
          "name": "tokenBVaultBump",
          "type": "u8"
        },
        {
          "name": "poolStateBump",
          "type": "u8"
        },
        {
          "name": "lpTokenVaultBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "addLiquidity",
      "accounts": [
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "poolState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpTokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpTokenTo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tokensAMaxAmount",
          "type": "u64"
        },
        {
          "name": "tokensBMaxAmount",
          "type": "u64"
        },
        {
          "name": "expectedLpTokens",
          "type": "u64"
        }
      ]
    },
    {
      "name": "removeLiquidity",
      "accounts": [
        {
          "name": "poolState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "userRedeemableLpTokens",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenBAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "lpTokensToBurn",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "poolState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "tokenAVault",
            "type": "publicKey"
          },
          {
            "name": "tokenBVault",
            "type": "publicKey"
          },
          {
            "name": "tokenAMint",
            "type": "publicKey"
          },
          {
            "name": "tokenBMint",
            "type": "publicKey"
          },
          {
            "name": "lpTokenMint",
            "type": "publicKey"
          },
          {
            "name": "poolStateBump",
            "type": "u8"
          },
          {
            "name": "tokenAVaultBump",
            "type": "u8"
          },
          {
            "name": "tokenBVaultBump",
            "type": "u8"
          },
          {
            "name": "lpTokenVaultBump",
            "type": "u8"
          },
          {
            "name": "debug",
            "type": "bool"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "ErrorCode",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "SlippageExceeded"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "LiquidityAdded",
      "fields": [
        {
          "name": "tokensATransferred",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokensBTransferred",
          "type": "u64",
          "index": false
        },
        {
          "name": "lpTokensMinted",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "LiquidityRemoved",
      "fields": [
        {
          "name": "tokensACredited",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokensBCredited",
          "type": "u64",
          "index": false
        },
        {
          "name": "lpTokensBurnt",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "SlippageExceeded",
      "fields": [
        {
          "name": "tokenAToDebit",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenBToDebit",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenAMaxAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenBMaxAmount",
          "type": "u64",
          "index": false
        }
      ]
    }
  ]
};

export const IDL: HydraLiquidityPools = {
  "version": "0.1.0",
  "name": "hydra_liquidity_pools",
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "poolState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenBMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lpTokenMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpTokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tokenAVaultBump",
          "type": "u8"
        },
        {
          "name": "tokenBVaultBump",
          "type": "u8"
        },
        {
          "name": "poolStateBump",
          "type": "u8"
        },
        {
          "name": "lpTokenVaultBump",
          "type": "u8"
        }
      ]
    },
    {
      "name": "addLiquidity",
      "accounts": [
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "poolState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenA",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenB",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpTokenVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpTokenTo",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "tokensAMaxAmount",
          "type": "u64"
        },
        {
          "name": "tokensBMaxAmount",
          "type": "u64"
        },
        {
          "name": "expectedLpTokens",
          "type": "u64"
        }
      ]
    },
    {
      "name": "removeLiquidity",
      "accounts": [
        {
          "name": "poolState",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "userRedeemableLpTokens",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenAAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenBAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenAVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenBVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lpTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "lpTokensToBurn",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "poolState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "tokenAVault",
            "type": "publicKey"
          },
          {
            "name": "tokenBVault",
            "type": "publicKey"
          },
          {
            "name": "tokenAMint",
            "type": "publicKey"
          },
          {
            "name": "tokenBMint",
            "type": "publicKey"
          },
          {
            "name": "lpTokenMint",
            "type": "publicKey"
          },
          {
            "name": "poolStateBump",
            "type": "u8"
          },
          {
            "name": "tokenAVaultBump",
            "type": "u8"
          },
          {
            "name": "tokenBVaultBump",
            "type": "u8"
          },
          {
            "name": "lpTokenVaultBump",
            "type": "u8"
          },
          {
            "name": "debug",
            "type": "bool"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "ErrorCode",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "SlippageExceeded"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "LiquidityAdded",
      "fields": [
        {
          "name": "tokensATransferred",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokensBTransferred",
          "type": "u64",
          "index": false
        },
        {
          "name": "lpTokensMinted",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "LiquidityRemoved",
      "fields": [
        {
          "name": "tokensACredited",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokensBCredited",
          "type": "u64",
          "index": false
        },
        {
          "name": "lpTokensBurnt",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "SlippageExceeded",
      "fields": [
        {
          "name": "tokenAToDebit",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenBToDebit",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenAMaxAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenBMaxAmount",
          "type": "u64",
          "index": false
        }
      ]
    }
  ]
};
