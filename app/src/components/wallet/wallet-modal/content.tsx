import React, { useState, useEffect } from 'react';
import { makeStyles } from '@mui/styles';
import { Box, Typography, Button, IconButton } from '@mui/material';
import { useWallet } from '@solana/wallet-adapter-react';
import { Wallet, WalletName } from '@solana/wallet-adapter-base';

import { Hydraswap } from '../../icons';

const useStyles = makeStyles({
    content: {
        padding: '31px 23px'
    },
    selectTitle: {
        color: '#FFF',
        fontSize: '18px !important',
        fontWeight: '500 !important',
        lineHeight: '22px !important',
        marginBottom: '4px !important'
    },
    selectSubTitle: {
        color: '#FFF',
        lineHeight: '17px !important',
        opacity: '0.6'
    },
    walletList: {
        display: 'flex',
        flexDirection: 'column',
        marginTop: '24px'
    },
    walletItem: {
        alignItems: 'center !important',
        justifyContent: 'flex-start !important',
        backgroundColor: '#394455 !important',
        borderRadius: '6px !important',
        padding: '12px 16px !important',
        marginBottom: '16px !important',
        width: '100%',
        '& > img': {
            width: '32px',
            height: '32px',
            marginRight: '12px'
        },
        '& > p': {
            color: '#FFF',
            lineHeight: '19px !important'
        },
        '&:last-of-type': {
            marginBottom: '0px !important'
        }
    },
    connectTitle: {
        color: '#FFF',
        fontSize: '24px !important',
        fontWeight: '500 !important',
        lineHeight: '29px !important',
        textAlign: 'center',
        marginBottom: '5px !important'
    },
    connectSubTitle: {
        color: '#FFF',
        lineHeight: '19px !important',
        textAlign: 'center',
        marginBottom: '24px !important'
    },
    connectWrapper: {
        borderTop: '1px solid #FFFFFF0F',
        padding: '0 3px'
    },
    connectContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '100px 0',
        '& > img': {
            width: '72px',
            height: '72px'
        },
        '& > svg': {
            width: '72px',
            height: '69px'
        }
    },
    connectBridge: {
        color: '#FFFFFFD9',
        fontSize: '24px',
        lineHeight: '29px',
        margin: '0 40px'
    },
    installTitle: {
        color: '#FFF',
        fontSize: '24px !important',
        lineHeight: '29px !important',
        textAlign: 'center',
        marginBottom: '24px !important'
    },
    installWrapper: {
        borderTop: '1px solid #FFFFFF0F',
        padding: '40px 3px',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        '& > img': {
            width: '64px',
            height: '64px',
            marginBottom: '32px'
        }
    },
    installButton: {
        background: 'linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)',
        borderRadius: '6px !important',
        padding: '12px 56px !important',
        color: '#FFF !important',
        fontSize: '16px !important',
        fontWeight: '400 !important',
        lineHeight: '24px !important',
        marginBottom: '32px !important'
    },
    installGuide: {
        color: '#FFF',
        fontSize: '14px !important',
        lineHeight: '17px !important',
        textAlign: 'center',
        maxWidth: '320px'
    },
    contentFooter: {
        display: 'flex',
        justifyContent: 'center',
        '& > span': {
            color: '#FFFFFF73',
            fontSize: '14px',
            lineHeight: '17px',
            '&:last-of-type': {
                color: '#FFFFFFA6',
                cursor: 'pointer',
                marginLeft: '6px'
            }
        }
    },
})

const Content = () => {
    const classes = useStyles();

    const { wallets, select, wallet, connected } = useWallet();
    const [status, setStatus] = useState('');
    const [activeWallet, setActiveWallet] = useState<Wallet | null>(null);

    useEffect(() => {
        if(wallet && !connected) {
            const adapter = wallet.adapter;

            adapter.ready().then(result => {
                if(result) {
                    setStatus('connecting');
                    adapter.connect().catch(error => {
                        console.log(error);
                    });
                } else {
                    setStatus('install');
                }
            })
        }

        if(connected) {
            setActiveWallet(wallet);
            setStatus('connected');
        }
    }, [wallet, connected])

    const handleWalletInstall = () => {
        if (wallet && window) {
            window.open(wallet.url, '_blank');
        }
    }

    const resetStatus = () => {
        select('' as WalletName);
        setStatus('');
    }

    return (
        <Box className={classes.content}>
            {status === '' && (
                <>
                    <Typography className={classes.selectTitle}>
                        Select a Wallet
                    </Typography>
                    <Typography className={classes.selectSubTitle}>
                        Please select a wallet to connect to this dapp:
                    </Typography>
                    <Box className={classes.walletList}>
                        {wallets.map((wallet, index) => (
                            <IconButton
                                className={classes.walletItem}
                                key={index}
                                onClick={() => select(wallet.name)}
                            >
                                <img src={wallet.icon} alt="Wallet" />
                                <Typography>{wallet.name}</Typography>
                            </IconButton>
                        ))}
                    </Box>
                </>
            )}
            {wallet && status === 'connecting' && (
                <>
                    <Typography className={classes.connectTitle}>
                        Connecting
                    </Typography>
                    <Typography className={classes.connectSubTitle}>
                        Please unlock your {wallet.name} wallet
                    </Typography>
                    <Box className={classes.connectWrapper}>
                        <Box className={classes.connectContent}>
                            <img src={wallet.icon} alt="Wallet" />
                            <span className={classes.connectBridge}>......</span>
                            <Hydraswap />
                        </Box>
                    </Box>
                    <Box className={classes.contentFooter}>
                        <span>Having trouble?</span> <span onClick={() => resetStatus()}>Go back</span>
                    </Box>
                </>
            )}
            {wallet && status === 'install' && (
                <>
                    <Typography className={classes.installTitle}>
                        Wallet is not installed
                    </Typography>
                    <Box className={classes.installWrapper}>
                        <img src={wallet.icon} alt="Wallet" />
                        <Button
                            className={classes.installButton}
                            onClick={handleWalletInstall}
                        >
                            Install
                        </Button>
                        <Typography className={classes.installGuide}>
                            Make sure you only install their wallet from the {wallet.url.includes('chrome.google.com') ? 'Google Chrome Web Store' : `official ${wallet.url} website`}.
                        </Typography>
                    </Box>
                    <Box className={classes.contentFooter}>
                        <span>Having trouble?</span> <span onClick={() => resetStatus()}>Go back</span>
                    </Box>
                </>
            )}
            {activeWallet && status === 'connected' && (
                <>
                </>
            )}
        </Box>
    )
}

export default Content;
