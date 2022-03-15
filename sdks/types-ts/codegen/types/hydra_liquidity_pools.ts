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
          name: "tokenXMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenYMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "lpTokenMint";
          isMut: false;
          isSigner: false;
        },
        {
          name: "tokenXVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenYVault";
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
          name: "tokenXVaultBump";
          type: "u8";
        },
        {
          name: "tokenYVaultBump";
          type: "u8";
        },
        {
          name: "poolStateBump";
          type: "u8";
        },
        {
          name: "lpTokenVaultBump";
          type: "u8";
        },
        {
          name: "compensationParameter";
          type: "u16";
        },
        {
          name: "fees";
          type: {
            defined: "Fees";
          };
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
          name: "userTokenX";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userTokenY";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenXVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenYVault";
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
          name: "tokensXMaxAmount";
          type: "u64";
        },
        {
          name: "tokensYMaxAmount";
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
          name: "userTokenX";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userTokenY";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenXVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenYVault";
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
      name: "swap";
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
          name: "userFromToken";
          isMut: true;
          isSigner: false;
        },
        {
          name: "userToToken";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenXVault";
          isMut: true;
          isSigner: false;
        },
        {
          name: "tokenYVault";
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
          name: "amountIn";
          type: "u64";
        },
        {
          name: "minimumAmountOut";
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
            name: "tokenXVault";
            type: "publicKey";
          },
          {
            name: "tokenYVault";
            type: "publicKey";
          },
          {
            name: "tokenXMint";
            type: "publicKey";
          },
          {
            name: "tokenYMint";
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
            name: "tokenXVaultBump";
            type: "u8";
          },
          {
            name: "tokenYVaultBump";
            type: "u8";
          },
          {
            name: "lpTokenVaultBump";
            type: "u8";
          },
          {
            name: "compensationParameter";
            type: "u16";
          },
          {
            name: "fees";
            type: {
              defined: "Fees";
            };
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
      name: "Fees";
      type: {
        kind: "struct";
        fields: [
          {
            name: "swapFeeNumerator";
            type: "u64";
          },
          {
            name: "swapFeeDenominator";
            type: "u64";
          },
          {
            name: "ownerTradeFeeNumerator";
            type: "u64";
          },
          {
            name: "ownerTradeFeeDenominator";
            type: "u64";
          },
          {
            name: "ownerWithdrawFeeNumerator";
            type: "u64";
          },
          {
            name: "ownerWithdrawFeeDenominator";
            type: "u64";
          },
          {
            name: "hostFeeNumerator";
            type: "u64";
          },
          {
            name: "hostFeeDenominator";
            type: "u64";
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
          name: "tokensXTransferred";
          type: "u64";
          index: false;
        },
        {
          name: "tokensYTransferred";
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
          name: "tokensXCredited";
          type: "u64";
          index: false;
        },
        {
          name: "tokensYCredited";
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
          name: "tokenXToDebit";
          type: "u64";
          index: false;
        },
        {
          name: "tokenYToDebit";
          type: "u64";
          index: false;
        },
        {
          name: "tokenXMaxAmount";
          type: "u64";
          index: false;
        },
        {
          name: "tokenYMaxAmount";
          type: "u64";
          index: false;
        }
      ];
    }
  ];
  errors: [
    {
      code: 6000;
      name: "SlippageExceeded";
      msg: "Slippage Amount Exceeded";
    },
    {
      code: 6001;
      name: "InvalidVaultToSwapResultAmounts";
      msg: "Invalid vault to SwapResult amounts";
    },
    {
      code: 6002;
      name: "InvalidMintAddress";
      msg: "Mint address provided doesn't match pools";
    },
    {
      code: 6003;
      name: "InvalidFee";
      msg: "Invalid Fee input";
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
          name: "tokenXMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenYMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "lpTokenMint",
          isMut: false,
          isSigner: false,
        },
        {
          name: "tokenXVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenYVault",
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
          name: "tokenXVaultBump",
          type: "u8",
        },
        {
          name: "tokenYVaultBump",
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
        {
          name: "compensationParameter",
          type: "u16",
        },
        {
          name: "fees",
          type: {
            defined: "Fees",
          },
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
          name: "userTokenX",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTokenY",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenXVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenYVault",
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
          name: "tokensXMaxAmount",
          type: "u64",
        },
        {
          name: "tokensYMaxAmount",
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
          name: "userTokenX",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userTokenY",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenXVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenYVault",
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
      name: "swap",
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
          name: "userFromToken",
          isMut: true,
          isSigner: false,
        },
        {
          name: "userToToken",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenXVault",
          isMut: true,
          isSigner: false,
        },
        {
          name: "tokenYVault",
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
          name: "amountIn",
          type: "u64",
        },
        {
          name: "minimumAmountOut",
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
            name: "tokenXVault",
            type: "publicKey",
          },
          {
            name: "tokenYVault",
            type: "publicKey",
          },
          {
            name: "tokenXMint",
            type: "publicKey",
          },
          {
            name: "tokenYMint",
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
            name: "tokenXVaultBump",
            type: "u8",
          },
          {
            name: "tokenYVaultBump",
            type: "u8",
          },
          {
            name: "lpTokenVaultBump",
            type: "u8",
          },
          {
            name: "compensationParameter",
            type: "u16",
          },
          {
            name: "fees",
            type: {
              defined: "Fees",
            },
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
      name: "Fees",
      type: {
        kind: "struct",
        fields: [
          {
            name: "swapFeeNumerator",
            type: "u64",
          },
          {
            name: "swapFeeDenominator",
            type: "u64",
          },
          {
            name: "ownerTradeFeeNumerator",
            type: "u64",
          },
          {
            name: "ownerTradeFeeDenominator",
            type: "u64",
          },
          {
            name: "ownerWithdrawFeeNumerator",
            type: "u64",
          },
          {
            name: "ownerWithdrawFeeDenominator",
            type: "u64",
          },
          {
            name: "hostFeeNumerator",
            type: "u64",
          },
          {
            name: "hostFeeDenominator",
            type: "u64",
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
          name: "tokensXTransferred",
          type: "u64",
          index: false,
        },
        {
          name: "tokensYTransferred",
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
          name: "tokensXCredited",
          type: "u64",
          index: false,
        },
        {
          name: "tokensYCredited",
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
          name: "tokenXToDebit",
          type: "u64",
          index: false,
        },
        {
          name: "tokenYToDebit",
          type: "u64",
          index: false,
        },
        {
          name: "tokenXMaxAmount",
          type: "u64",
          index: false,
        },
        {
          name: "tokenYMaxAmount",
          type: "u64",
          index: false,
        },
      ],
    },
  ],
  errors: [
    {
      code: 6000,
      name: "SlippageExceeded",
      msg: "Slippage Amount Exceeded",
    },
    {
      code: 6001,
      name: "InvalidVaultToSwapResultAmounts",
      msg: "Invalid vault to SwapResult amounts",
    },
    {
      code: 6002,
      name: "InvalidMintAddress",
      msg: "Mint address provided doesn't match pools",
    },
    {
      code: 6003,
      name: "InvalidFee",
      msg: "Invalid Fee input",
    },
  ],
};
