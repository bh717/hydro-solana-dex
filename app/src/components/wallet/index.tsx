import React, { useState, useEffect } from 'react';
import { IconButton, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useWallet } from '@solana/wallet-adapter-react';

import { CaretDown, Wallet as WalletSVG } from '../icons';
import WalletModal from './wallet-modal';
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
        }
    }
})

const Wallet = () => {
    const classes = useStyles();

    const { connected, publicKey } = useWallet();
    const [address, setAddress] = useState('');
    const [openWalletModal, setOpenWalletModal] = useState(false);

    useEffect(() => {
        if(connected) {
            const base58 = publicKey ? publicKey.toBase58() : '';
            setAddress(base58);
            setOpenWalletModal(false);
        }
    }, [connected, publicKey]);

    return (
        <>
            {connected && (
                <IconButton className={classes.walletButton}>
                    <WalletSVG />
                    <Typography>Solana</Typography>
                    <Typography>{normalizeAddress(address)}</Typography>
                    <CaretDown />
                </IconButton>
            )}
            {!connected && (
                <IconButton
                    className={classes.connectButton}
                    onClick={() => setOpenWalletModal(true)}
                >
                    <WalletSVG />
                    <Typography>Connect Wallet</Typography>
                </IconButton>
            )}
            <WalletModal
                open={openWalletModal}
                onClose={() => setOpenWalletModal(false)}
            />
        </>
    )
}

export default Wallet