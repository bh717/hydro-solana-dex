import React, { FC, useState, useEffect } from 'react';
import { Box, Menu, IconButton, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useWallet } from '@solana/wallet-adapter-react';
import cn from 'classnames';

import { CaretDown, Wallet as WalletSVG, Tokens, ActiveTokens } from '../icons';
import USDC from '../../assets/images/symbols/usdc.png';
import HYSD from '../../assets/images/symbols/hysd.png';
import BNB from '../../assets/images/symbols/bnb.png';
import WalletModal from './walletModal';
import { normalizeAddress } from '../../helpers/normalize';

const useStyles = makeStyles({
    connectButton: {
        background: 'linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)',
        borderRadius: '6px !important',
        display: 'flex',
        alignItems: 'center',
        padding: '12px 20px !important',
        '& > svg': {
            color: '#FFF',
            width: '16px !important',
            height: '16px !important',
            marginRight: '8px',
        },
        '& > p': {
            color: '#FFF'
        },
        '@media (max-width: 600px)': {
            padding: '8px 20px !important',
            '& > p': {
                fontSize: '14px !important',
                lineHeight: '20px !important'
            }
        }
    },
    walletButton: {
        borderRadius: '6px !important',
        padding: '14px 12px !important',
        '& > svg': {
            '&:first-of-type': {
                padding: '2px',
                width: '16px',
                height: '16px',
                marginRight: '10px',
                color: '#FFFFFFD9'
            },
            '&:last-of-type': {
                width: '9px',
                height: '6px',
                marginLeft: '10px',
                color: '#FFFFFF73'
            }
        },
        '& > p': {
            color: '#FFFFFFD9 !important',
            lineHeight: '17px !important',
            '&:first-of-type': {
                borderRight: '1px solid #FFFFFFD9',
                paddingRight: '9px',
                marginRight: '9px'
            }
        },
        '&::before': {
            content: "''",
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            borderRadius: '6px',
            padding: '1px',
            background: '#FFFFFF26',
            '-webkit-mask': 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            '-webkit-mask-composite': 'destination-out',
            pointerEvents: 'none'
        },
        '&:hover': {
            '&::before': {
                background: 'linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)',
            }
        },
        '@media (max-width: 600px)': {
            padding: '8px 12px !important',
            '& > p': {
                fontSize: '14px !important',
                lineHeight: '20px !important'
            }
        }
    },
    tokensButton: {
        borderRadius: '6px !important',
        padding: '14px 12px !important',
        marginRight: '8px !important',
        '& > svg': {
            width: '24px !important',
            height: '20px !important'
        },
        '&::before': {
            content: "''",
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            borderRadius: '6px',
            padding: '1px',
            background: '#FFFFFF26',
            '-webkit-mask': 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            '-webkit-mask-composite': 'destination-out',
            pointerEvents: 'none'
        },
        '&:hover': {
            '&::before': {
                background: 'linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)'
            }
        },
        '@media (max-width: 600px)': {
            padding: '8px 12px !important'
        }
    },
    activeTokensButton: {
        '&::before': {
            background: 'linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%) !important'
        }
    },
    tokensWrapper: {
        '& .MuiPaper-root': {
            backgroundColor: 'initial !important',
            marginTop: '4px',
            '@media (max-width: 600px)': {
                marginTop: '-4px'
            }
        },
        '& .MuiList-root': {
            background: 'linear-gradient(180deg, rgba(41, 255, 200, 0.25) 0%, rgba(1, 207, 237, 0) 100%)',
            borderRadius: '6px',
            padding: '1px'
        }
    },
    tokensContent: {
        background: '#2d3444',
        borderRadius: '5px',
        width: '300px',
        '& > p': {
            borderBottom: '1px solid #FFFFFF0A',
            color: '#FFFFFFD9',
            fontSize: '18px !important',
            lineHeight: '21px !important',
            padding: '15px 23px'
        }
    },
    tokensList: {
        padding: '0 23px',
        maxHeight: '300px',
        overflowY: 'auto'
    },
    tokenItem: {
        borderBottom: '1px solid #FFFFFF0A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '14px 0',
        '& > img': {
            width: '32px',
            height: '32px',
            marginRight: '10px'
        },
        '& > div': {
            '& > p': {
                '&:first-of-type': {
                    color: '#FFF',
                    fontSize: '14px !important',
                    fontWeight: '500 !important',
                    lineHeight: '17px !important',
                    marginBottom: '4px'
                },
                '&:last-of-type': {
                    color: '#FFFFFFA6',
                    fontSize: '12px !important',
                    lineHeight: '14px !important'
                }
            }
        },
        '&:last-of-type': {
            borderBottom: 'none'
        }
    }
})

interface WalletProps {
    openModal: boolean;
    handleModal(value: boolean): void;
}

const Wallet: FC<WalletProps> = ({ openModal, handleModal }) => {
    const classes = useStyles();

    const { connected, publicKey } = useWallet();
    const [address, setAddress] = useState('');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const tokenListOpen = Boolean(anchorEl);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        if(connected) {
            const base58 = publicKey ? publicKey.toBase58() : '';
            setAddress(base58);
        }
    }, [connected, publicKey]);

    useEffect(() => {
        // Windows Resize Handler
        function handleResize() {
            setIsMobile(window.innerWidth <= 600);
        }

        // Add event listener
        window.addEventListener("resize", handleResize);

        handleResize();

        // Remove event listener on cleanup
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleOpenTokenList = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    }

    const handleCloseTokenList = () => {
        setAnchorEl(null);
    }

    return (
        <>
            {connected && (
                <>
                    <IconButton
                        className={cn(classes.tokensButton, {[classes.activeTokensButton]: tokenListOpen})}
                        onClick={handleOpenTokenList}
                    >
                        {tokenListOpen ? <ActiveTokens /> : <Tokens />}
                    </IconButton>
                    <Menu
                        className={classes.tokensWrapper}
                        anchorEl={anchorEl}
                        open={tokenListOpen}
                        onClose={handleCloseTokenList}
                        anchorOrigin={isMobile ? {
                            vertical: 'top',
                            horizontal: 'left'
                        } : {
                            vertical: 'bottom',
                            horizontal: 'left'
                        }}
                        transformOrigin={isMobile ? {
                            vertical: 'bottom',
                            horizontal: 'left'
                        } : {
                            vertical: 'top',
                            horizontal: 'left'
                        }}
                    >
                        <Box className={classes.tokensContent}>
                            <Typography>Your Tokens</Typography>
                            <Box className={classes.tokensList}>
                                <Box className={classes.tokenItem}>
                                    <img src={USDC} alt="Token" />
                                    <Box>
                                        <Typography>120,712,560.61242 USDC</Typography>
                                        <Typography>$120,712,560.61242</Typography>
                                    </Box>
                                </Box>
                                <Box className={classes.tokenItem}>
                                    <img src={HYSD} alt="Token" />
                                    <Box>
                                        <Typography>2.9120 HYSD</Typography>
                                        <Typography>$298,145,560.98</Typography>
                                    </Box>
                                </Box>
                                <Box className={classes.tokenItem}>
                                    <img src={BNB} alt="Token" />
                                    <Box>
                                        <Typography>1 BNB</Typography>
                                        <Typography>$601.5098</Typography>
                                    </Box>
                                </Box>
                                <Box className={classes.tokenItem}>
                                    <img src={USDC} alt="Token" />
                                    <Box>
                                        <Typography>120,712,560.61242 USDC</Typography>
                                        <Typography>$120,712,560.61242</Typography>
                                    </Box>
                                </Box>
                                <Box className={classes.tokenItem}>
                                    <img src={HYSD} alt="Token" />
                                    <Box>
                                        <Typography>2.9120 HYSD</Typography>
                                        <Typography>$298,145,560.98</Typography>
                                    </Box>
                                </Box>
                                <Box className={classes.tokenItem}>
                                    <img src={BNB} alt="Token" />
                                    <Box>
                                        <Typography>1 BNB</Typography>
                                        <Typography>$601.5098</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Menu>
                    <IconButton
                        className={classes.walletButton}
                        onClick={() => handleModal(true)}
                    >
                        <WalletSVG />
                        <Typography>Solana</Typography>
                        <Typography>{normalizeAddress(address)}</Typography>
                        <CaretDown />
                    </IconButton>
                </>
            )}
            {!connected && (
                <IconButton
                    className={classes.connectButton}
                    onClick={() => handleModal(true)}
                >
                    <WalletSVG />
                    <Typography>Connect Wallet</Typography>
                </IconButton>
            )}
            <WalletModal
                open={openModal}
                onClose={() => handleModal(false)}
                address={address}
            />
        </>
    )
}

export default Wallet