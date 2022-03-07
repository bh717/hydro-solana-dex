export type HydraLiquidityPools = {
  version: "0.1.0";
  name: "hydra_liquidity_pools";
  instructions: [
    {
      name: "initialize";
      accounts: [
        {
          name: "authority";
          isMut: false;
          isSigner: true;
        },
        {
          name: "payer";
          isMut: true;
          isSigner: true;
        },
        {
          name: "poolState";
          isMut: true;
          isSigner: false;
        },
        {
          name: "baseTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "quoteTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "lpTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "baseTokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "quoteTokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lpTokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "systemProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        },
        {
          name: "rent";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "baseTokenVaultBump";
          type: "u8";
        },
        {
          name: "quoteTokenVaultBump";
          type: "u8";
        },
        {
          name: "poolStateBump";
          type: "u8";
        },
        {
          name: "lpTokenVaultBump";
          type: "u8";
        }
      ];
    },
    {
      name: "addLiquidity";
      accounts: [
        {
          name: "user";
          isMut: false;
          isSigner: true;
        },
        {
          name: "poolState";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lpTokenMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userBaseToken";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userQuoteToken";
          isMut: true;
          isSigner: false;
        },
        {
          name: "baseTokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "quoteTokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lpTokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lpTokenTo";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "baseTokensMaxAmount";
          type: "u64";
        },
        {
          name: "quoteTokensMaxAmount";
          type: "u64";
        },
        {
          name: "expectedLpTokens";
          type: "u64";
        }
      ];
    },
    {
      name: "removeLiquidity";
      accounts: [
        {
          name: "poolState";
          isMut: true;
          isSigner: false;
        },
        {
          name: "user";
          isMut: false;
          isSigner: true;
        },
        {
          name: "userRedeemableLpTokens";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userBaseTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userQuoteTokenAccount";
          isMut: true;
          isSigner: false;
        },
        {
          name: "baseTokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "quoteTokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "lpTokenMint";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "lpTokensToBurn";
          type: "u64";
        }
      ];
    },
    {
      name: "swapCpmm";
      accounts: [
        {
          name: "user";
          isMut: false;
          isSigner: true;
        },
        {
          name: "poolState";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userBaseToken";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userQuoteToken";
          isMut: true;
          isSigner: false;
        },
        {
          name: "baseTokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "quoteTokenVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenProgram";
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: "baseTokenMaxAmount";
          type: "u64";
        },
        {
          name: "quoteTokenMaxAmount";
          type: "u64";
        }
      ];
    }
  ];
  accounts: [
    {
      name: "poolState";
      type: {
        kind: "struct";
        fields: [
          {
            name: "authority";
            type: "publicKey";
          },
          {
            name: "baseTokenVault";
            type: "publicKey";
          },
          {
            name: "quoteTokenVault";
            type: "publicKey";
          },
          {
            name: "baseTokenMint";
            type: "publicKey";
          },
          {
            name: "quoteTokenMint";
            type: "publicKey";
          },
          {
            name: "lpTokenMint";
            type: "publicKey";
          },
          {
            name: "poolStateBump";
            type: "u8";
          },
          {
            name: "baseTokenVaultBump";
            type: "u8";
          },
          {
            name: "quoteTokenVaultBump";
            type: "u8";
          },
          {
            name: "lpTokenVaultBump";
            type: "u8";
          },
          {
            name: "debug";
            type: "bool";
          }
        ];
      };
    }
  ];
  types: [
    {
      name: "ErrorCode";
      type: {
        kind: "enum";
        variants: [
          {
            name: "SlippageExceeded";
          }
        ];
      };
    }
  ];
  events: [
    {
      name: "LiquidityAdded";
      fields: [
        {
          name: "baseTokensTransferred";
          type: "u64";
          index: false;
        },
        {
          name: "quoteTokensTransferred";
          type: "u64";
          index: false;
        },
        {
          name: "lpTokensMinted";
          type: "u64";
          index: false;
        }
      ];
    },
    {
      name: "LiquidityRemoved";
      fields: [
        {
          name: "tokensACredited";
          type: "u64";
          index: false;
        },
        {
          name: "tokensBCredited";
          type: "u64";
          index: false;
        },
        {
          name: "lpTokensBurnt";
          type: "u64";
          index: false;
        }
      ];
    },
    {
      name: "SlippageExceeded";
      fields: [
        {
          name: "baseTokenToDebit";
          type: "u64";
          index: false;
        },
        {
          name: "quoteTokenToDebit";
          type: "u64";
          index: false;
        },
        {
          name: "baseTokenMaxAmount";
          type: "u64";
          index: false;
        },
        {
          name: "quoteTokenMaxAmount";
          type: "u64";
          index: false;
        }
      ];
    }
  ];
};

export const IDL: HydraLiquidityPools = {
  version: "0.1.0",
  name: "hydra_liquidity_pools",
  instructions: [
    {
      name: "initialize",
      accounts: [
        {
          name: "authority",
          isMut: false,
          isSigner: true,
        },
        {
          name: "payer",
          isMut: true,
          isSigner: true,
        },
        {
          name: "poolState",
          isMut: true,
          isSigner: false,
        },
        {
          name: "baseTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "quoteTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "lpTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "baseTokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "quoteTokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lpTokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "systemProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
        {
          name: "rent",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "baseTokenVaultBump",
          type: "u8",
        },
        {
          name: "quoteTokenVaultBump",
          type: "u8",
        },
        {
          name: "poolStateBump",
          type: "u8",
        },
        {
          name: "lpTokenVaultBump",
          type: "u8",
        },
      ],
    },
    {
      name: "addLiquidity",
      accounts: [
        {
          name: "user",
          isMut: false,
          isSigner: true,
        },
        {
          name: "poolState",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lpTokenMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userBaseToken",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userQuoteToken",
          isMut: true,
          isSigner: false,
        },
        {
          name: "baseTokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "quoteTokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lpTokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lpTokenTo",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "baseTokensMaxAmount",
          type: "u64",
        },
        {
          name: "quoteTokensMaxAmount",
          type: "u64",
        },
        {
          name: "expectedLpTokens",
          type: "u64",
        },
      ],
    },
    {
      name: "removeLiquidity",
      accounts: [
        {
          name: "poolState",
          isMut: true,
          isSigner: false,
        },
        {
          name: "user",
          isMut: false,
          isSigner: true,
        },
        {
          name: "userRedeemableLpTokens",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userBaseTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userQuoteTokenAccount",
          isMut: true,
          isSigner: false,
        },
        {
          name: "baseTokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "quoteTokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "lpTokenMint",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "lpTokensToBurn",
          type: "u64",
        },
      ],
    },
    {
      name: "swapCpmm",
      accounts: [
        {
          name: "user",
          isMut: false,
          isSigner: true,
        },
        {
          name: "poolState",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userBaseToken",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userQuoteToken",
          isMut: true,
          isSigner: false,
        },
        {
          name: "baseTokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "quoteTokenVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenProgram",
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: "baseTokenMaxAmount",
          type: "u64",
        },
        {
          name: "quoteTokenMaxAmount",
          type: "u64",
        },
      ],
    },
  ],
  accounts: [
    {
      name: "poolState",
      type: {
        kind: "struct",
        fields: [
          {
            name: "authority",
            type: "publicKey",
          },
          {
            name: "baseTokenVault",
            type: "publicKey",
          },
          {
            name: "quoteTokenVault",
            type: "publicKey",
          },
          {
            name: "baseTokenMint",
            type: "publicKey",
          },
          {
            name: "quoteTokenMint",
            type: "publicKey",
          },
          {
            name: "lpTokenMint",
            type: "publicKey",
          },
          {
            name: "poolStateBump",
            type: "u8",
          },
          {
            name: "baseTokenVaultBump",
            type: "u8",
          },
          {
            name: "quoteTokenVaultBump",
            type: "u8",
          },
          {
            name: "lpTokenVaultBump",
            type: "u8",
          },
          {
            name: "debug",
            type: "bool",
          },
        ],
      },
    },
  ],
  types: [
    {
      name: "ErrorCode",
      type: {
        kind: "enum",
        variants: [
          {
            name: "SlippageExceeded",
          },
        ],
      },
    },
  ],
  events: [
    {
      name: "LiquidityAdded",
      fields: [
        {
          name: "baseTokensTransferred",
          type: "u64",
          index: false,
        },
        {
          name: "quoteTokensTransferred",
          type: "u64",
          index: false,
        },
        {
          name: "lpTokensMinted",
          type: "u64",
          index: false,
        },
      ],
    },
    {
      name: "LiquidityRemoved",
      fields: [
        {
          name: "tokensACredited",
          type: "u64",
          index: false,
        },
        {
          name: "tokensBCredited",
          type: "u64",
          index: false,
        },
        {
          name: "lpTokensBurnt",
          type: "u64",
          index: false,
        },
      ],
    },
    {
      name: "SlippageExceeded",
      fields: [
        {
          name: "baseTokenToDebit",
          type: "u64",
          index: false,
        },
        {
          name: "quoteTokenToDebit",
          type: "u64",
          index: false,
        },
        {
          name: "baseTokenMaxAmount",
          type: "u64",
          index: false,
        },
        {
          name: "quoteTokenMaxAmount",
          type: "u64",
          index: false,
        },
      ],
    },
  ],
};
