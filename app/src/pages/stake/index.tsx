import { FC, useEffect, useState } from 'react';
import { makeStyles } from '@mui/styles'
import { Box, Typography } from '@mui/material';
import { Connection, PublicKey, Commitment } from '@solana/web3.js';
import { Idl, Program, Provider, web3, utils, BN } from '@project-serum/anchor';
import { TOKEN_PROGRAM_ID } from '@project-serum/serum/lib/token-instructions';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'react-toastify';

import { Deposit } from '../../components/icons';
import Banner from '../../assets/images/stake/banner.png';
import Diamond from '../../assets/images/stake/diamond.png';
import StakeUnstake from './stakeUnstake';
import StakeStatus from './stakeStatus';
import idl from '../../idls/hydra_staking.json';

const useStyles = makeStyles({
    stakeContainer: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '1100px',
    },
    stakeBanner: {
        background: '#FFFFFF05',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        height: '200px',
        width: '100%',
        '@media (max-width: 600px)': {
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '20px 0',
            height: 'initial',
        }
    },
    bannerLeft: {
        backgroundImage: `url(${Banner})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% 100%',
        flexGrow: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        height: '100%',
        '& > img': {
            width: '140px',
            '&:first-of-type': {
                marginLeft: '50px',
                transform: 'rotate(135deg)'
            },
            '@media (max-width: 1350px)': {
                width: '120px'
            },
            '@media (max-width: 1100px)': {
                width: '90px'
            },
            '@media (max-width: 1000px)': {
                display: 'none'
            }
        },
        '@media (max-width: 600px)': {
            background: 'none',
            display: 'block'
        }
    },
    bannerTitle: {
        padding: '0 24px',
        '& p': {
            '&:first-of-type': {
                color: '#19CE9D',
                fontSize: '32px',
                fontWeight: '600 !important',
                lineHeight: '24px',
                marginBottom: '16px'
            },
            '&:last-of-type': {
                color: '#FFF'
            }
        },
        '@media (max-width: 1000px)': {
            padding: '0 48px 0 24px'
        },
        '@media (max-width: 600px)': {
            padding: '0 24px',
            '& p': {
                '&:first-of-type': {
                    lineHeight: '39px !important',
                }
            }
        }
    },
    bannerRight: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 60px',
        '& svg': {
            width: '32px !important',
            height: '32px !important',
            marginBottom: '11px'
        },
        '& p': {
            lineHeight: '24px !important',
            '&:first-of-type': {
                color: '#FFFFFFA6',
                fontSize: '14px !important',
                marginBottom: '6px !important'
            },
            '&:last-of-type': {
                color: '#FFF',
                fontSize: '32px !important',
                fontWeight: '500 !important'
            }
        },
        '@media (max-width: 1350px)': {
            padding: '0 40px',
            minWidth: '137px'
        },
        '@media (max-width: 1000px)': {
            padding: '0 24px'
        },
        '@media (max-width: 600px)': {
            alignItems: 'flex-start',
            marginTop: '24px',
            '& > svg': {
                display: 'none'
            }
        }
    },
    stakeContent: {
        display: 'flex',
        marginTop: '24px',
        '& > div': {
            height: '100%',
            '&:first-of-type': {
                width: '40%',
            },
            '&:last-of-type': {
                marginLeft: '24px',
                width: 'calc(60% - 24px)'
            },
        },
        '@media (max-width: 1100px)': {
            flexDirection: 'column',
            '& > div': {
                width: 'calc(100% - 4px) !important',
                '&:last-of-type': {
                    marginLeft: '0 !important',
                    marginTop: '24px'
                }
            }
        }
    }
})

const opts = {
    preflightCommitment: "recent" as Commitment
}
const programID = new PublicKey(idl.metadata.address);
const utf8 = utils.bytes.utf8;
const tokenMint = new PublicKey(process.env.REACT_APP_MINT_ADDRESS || '');
const redeemableMint = new PublicKey(process.env.REACT_APP_REDEEM_ADDRESS || '');
const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

interface StakeProps {
    openWalletConnect(): void;
}

const Stake: FC<StakeProps> = ({ openWalletConnect }) => {
    const classes = useStyles();
    const wallet = useWallet();

    const [userPubKey, setUserPubKey] = useState<PublicKey>();
    const [redeemPubKey, setRedeemPubKey] = useState<PublicKey>();
    const [userBalance, setUserBalance] = useState(0);
    const [redeemBalance, setRedeemBalance] = useState(0);
    const [staking, setStaking] = useState(false);
    const [unstaking, setUnstaking] = useState(false);

    const getProvider = async () => {
        /* create the provider and return it to the caller */
        /* network set to local network for now */
        const network = "http://127.0.0.1:8899";
        const connection = new Connection(network, opts.preflightCommitment);

        const provider = new Provider(
            // @ts-ignore
            connection, wallet, opts.preflightCommitment,
        );
        return provider;
    }

    useEffect(() => {
        (async function initialize() {
            if(wallet.publicKey) {
                const provider = await getProvider();

                const tempUserPubKey = await findassociatedTokenAddress(provider.wallet.publicKey, tokenMint);
                const tempRedeemPubKey = await findassociatedTokenAddress(provider.wallet.publicKey, redeemableMint);
                setUserPubKey(tempUserPubKey);
                setRedeemPubKey(tempRedeemPubKey);
                
                getBalances(provider, tempUserPubKey, tempRedeemPubKey);
            }
        })();

        // eslint-disable-next-line
    }, [wallet]);

    const getBalances = async (provider: Provider, userPubKey: PublicKey, redeemPubKey: PublicKey) => {
        const tempUserBalance = await provider.connection.getTokenAccountBalance(userPubKey);
        const tempRedeemBalance = await provider.connection.getTokenAccountBalance(redeemPubKey);

        setUserBalance(tempUserBalance.value.uiAmount || 0);
        setRedeemBalance(tempRedeemBalance.value.uiAmount || 0);
    }
    

    const findassociatedTokenAddress = async (walletAddress: PublicKey, tokenAddress: PublicKey): Promise<PublicKey> => {
        return (await PublicKey.findProgramAddress(
            [
                walletAddress.toBuffer(),
                TOKEN_PROGRAM_ID.toBuffer(),
                tokenAddress.toBuffer()
            ],
            SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
        ))[0];
    };

    const stake = async (amount: number) => {
        const provider = await getProvider();

        /* create the program interface combining the idl, program ID, and provider */
        const program = new Program(idl as Idl, programID, provider);

        const [poolStatePubkey] = await web3.PublicKey.findProgramAddress(
            [utf8.encode("pool_state_seed"), tokenMint.toBuffer(), redeemableMint.toBuffer()],
            program.programId
        );

        const [tokenVaultPubkey] = await web3.PublicKey.findProgramAddress(
            [utf8.encode("token_vault_seed"), tokenMint.toBuffer(), redeemableMint.toBuffer()],
            program.programId
        );
        
        if(userPubKey && redeemPubKey) {
            try {
                setStaking(true);

                await program.rpc.stake(new BN(amount * Math.pow(10, 9)), {
                    accounts: {
                        poolState: poolStatePubkey ,
                        tokenMint: tokenMint,
                        redeemableMint: redeemableMint,
                        userFrom: userPubKey,
                        userFromAuthority: program.provider.wallet.publicKey,
                        tokenVault: tokenVaultPubkey,
                        redeemableTo: redeemPubKey,
                        tokenProgram: TOKEN_PROGRAM_ID
                    }
                });
                await getBalances(provider, userPubKey, redeemPubKey);

                toast.success(`You staked ${amount} HYSD successfully!`);
                setStaking(false);
            } catch(e) {
                console.log(e);
                toast.error(`Something went wrong!`);

                setStaking(false);
            }
        }
    }

    const unstake = async (amount: number) => {
        const provider = await getProvider();

        /* create the program interface combining the idl, program ID, and provider */
        const program = new Program(idl as Idl, programID, provider);

        const [poolStatePubkey] = await web3.PublicKey.findProgramAddress(
            [utf8.encode("pool_state_seed"), tokenMint.toBuffer(), redeemableMint.toBuffer()],
            program.programId
        );

        const [tokenVaultPubkey] = await web3.PublicKey.findProgramAddress(
            [utf8.encode("token_vault_seed"), tokenMint.toBuffer(), redeemableMint.toBuffer()],
            program.programId
        );
        
        if(userPubKey && redeemPubKey) {
            try {
                setUnstaking(true);

                await program.rpc.unstake(new BN(amount * Math.pow(10, 9)), {
                    accounts: {
                        poolState: poolStatePubkey ,
                        tokenMint: tokenMint,
                        redeemableMint: redeemableMint,
                        userTo: userPubKey,
                        tokenVault: tokenVaultPubkey,
                        redeemableFrom: redeemPubKey,
                        redeemableFromAuthority: program.provider.wallet.publicKey,
                        tokenProgram: TOKEN_PROGRAM_ID
                    }
                });
                await getBalances(provider, userPubKey, redeemPubKey);

                toast.success(`You staked ${amount} HYSD successfully!`);
                setUnstaking(false);
            } catch(e) {
                console.log(e);

                toast.error(`Something went wrong!`);
                setUnstaking(false);
            }
        }
    }

    return (
        <Box className={classes.stakeContainer}>
            <Box className={classes.stakeBanner}>
                <Box className={classes.bannerLeft}>
                    <img src={Diamond} alt="Diamond" />
                    <Box className={classes.bannerTitle}>
                        <Typography>Simply stake tokens to earn.</Typography>
                        <Typography>Stake your HYSD maximize your yield. No Impermanent Loss.</Typography>
                    </Box>
                    <img src={Diamond} alt="Diamond" />
                </Box>
                <Box className={classes.bannerRight}>
                    <Deposit />
                    <Typography>Total Staked</Typography>
                    <Typography>$12.56 m</Typography>
                </Box>
            </Box>
            <Box className={classes.stakeContent}>
                <StakeUnstake
                    walletConnect={openWalletConnect}
                    balance={userBalance}
                    xBalance={redeemBalance}
                    onStake={stake}
                    onUnstake={unstake}
                    staking={staking}
                    unstaking={unstaking}
                />
                <StakeStatus
                    balance={redeemBalance}
                />
            </Box>
        </Box>
    )
}

export default Stake;