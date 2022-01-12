import React, { useState, useEffect } from 'react';
import { makeStyles } from '@mui/styles';
import { Box, IconButton, Typography } from '@mui/material';
import toast from 'react-hot-toast';

import { Gear, CheckMark, Close } from '../../components/icons';
import USDT from '../../assets/images/symbols/usdt.png';
import { Asset } from '../../interfaces';
import SwapAsset from './swapAsset';
import SwapSettingModal from './modals/swapSetting';
import AssetListModal from './modals/assetList';
import ConfirmSwapModal from './modals/confirmSwap';
import SwapStatus from './modals/swapStatus';
import usePages from '../usePages';

const useStyles = makeStyles({
    swapContent: {
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '450px',
        width: '100%'
    },
    actionRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
    },
    title: {
        color: '#FFF',
        fontSize: '20px',
        fontWeight: '500',
        lineHeight: '24px'
    },
    swapIcons: {
        display: 'flex',
        alignItems: 'center',
        '& .MuiSvgIcon-root': {
            width: '20px',
            height: '20px',
            color: '#FFFFFFA6'
        },
        '& .MuiIconButton-root': {
            padding: '0'
        }
    },
    swapAssets: {
        background: 'linear-gradient(180deg, rgba(41, 255, 200, 0.25) 0%, rgba(1, 207, 237, 0) 100%)',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        padding: '2px'
    },
    routeContainer: {
        background: '#262936',
        borderRadius: '6px',
        padding: '20px 32px',
        margin: '2px'
    },
    routeTitle: {
        color: '#FFFFFFA6 !important',
        fontSize: '14px !important',
        lineHeight: '17px !important',
        textDecoration: 'underline',
        marginBottom: '16px !important'
    },
    routeDetail: {
        display: 'flex'
    },
    assetItem: {
        color: '#FFFFFFD9',
        display: 'flex',
        alignItems: 'center',
        marginRight: '12px',
        '& img': {
            marginRight: '4px',
            width: '20px',
            height: '20px'
        },
        '& span': {
            fontSize: '14px',
            lineHeight: '17px'
        },
        '&:last-of-type': {
            marginRight: '0'
        }
    },
    successToast: {
        background: 'linear-gradient(180deg, rgba(41, 255, 200, 0.25) 0%, rgba(1, 207, 237, 0) 100%)',
        borderRadius: '6px',
        padding: '1px',
        position: 'relative'
    },
    toastClose: {
        padding: '0 !important',
        position: 'absolute !important' as any,
        top: '28px',
        right: '20px',
        '& > svg': {
            color: '#FFFFFF73',
            width: '14px !important',
            height: '14px !important'
        }
    },
    toastContent: {
        background: '#313C4E',
        borderRadius: '5px',
        display: 'flex',
        alignItems: 'center',
        padding: '24px 72px 24px 24px',
        '& > svg': {
            color: 'transparent',
            marginRight: '16px'
        },
        '& p': {
            color: '#FFFFFFD9',
            fontSize: '14px !important',
            lineHeight: '17px !important',
            marginBottom: '7px'
        },
        '& span': {
            backgroundImage: 'linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)',
            backgroundSize: '100%',
            backgroundRepeat: 'repeat',
            '-webkit-background-clip': 'text',
            '-webkit-text-fill-color': 'transparent',
            '-moz-background-clip': 'text',
            '-moz-text-fill-color': 'transparent',
            cursor: 'pointer',
            fontSize: '14px !important',
            lineHeight: '17px !important',
            textDecoration: 'underline',
            position: 'relative',
            '&::after': {
                content: "''",
                position: 'absolute',
                bottom: '0',
                left: 0,
                height: '1px',
                width: '100%',
                backgroundImage: 'linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)'
            }
        }
    },
    toastFooter: {
        background: 'linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)',
        display: 'block',
        position: 'absolute',
        left: '24px',
        bottom: '1px',
        width: 'calc(100% - 48px)',
        height: '2px',
    }
})

const initialAsset = {
    icon: '',
    symbol: '',
    balance: 0
}

const Swap = () => {
    const classes = useStyles();
    const { assets } = usePages();

    const [fromAsset, setFromAsset] = useState<Asset>(initialAsset);
    const [fromAmount, setFromAmount] = useState(0);
    const [toAsset, setToAsset] = useState<Asset>(initialAsset);
    const [toAmount, setToAmount] = useState(0);
    const [swapRate, setSwapRate] = useState(0);
    const [activeAsset, setActiveAsset] = useState('');
    const [slippage, setSlippage] = useState('1.0');
    const [openSettingModal, setOpenSettingModal] = useState(false);
    const [openAssetListModal, setOpenAssetListModal] = useState(false);
    const [openConfirmSwapModal, setOpenConfirmSwapModal] = useState(false);
    const [openSwapStatusModal, setOpenSwapStatusModal] = useState(false);

    useEffect(() => {
        if(assets.length)
            setFromAsset(assets[0]);

        setSwapRate(1);
    }, [setFromAsset, assets]);

    useEffect(() => {
        toast.custom(<SwapSuccessToast />);
        // eslint-disable-next-line
    }, [])

    const handleSettingModal = () => {
        if(parseFloat(slippage) > 0)
            setOpenSettingModal(false)
    }

    const exchangeAssets = () => {
        const tempAsset = JSON.parse(JSON.stringify(fromAsset));
        setFromAsset(toAsset);
        setToAsset(tempAsset);
    }

    const handleChangeAsset = (type: string) => {
        setActiveAsset(type);
        setOpenAssetListModal(true);
    }

    const handleChangeAmount = (type: string, amount: number) => {
        if(type === 'From')
            setFromAmount(amount);

        if(type === 'To')
            setToAmount(amount);
    }

    const changeAsset = (asset: Asset) => {
        const tempAsset = JSON.parse(JSON.stringify(asset));

        if(activeAsset === 'From') {
            if(toAsset.symbol === tempAsset.symbol)
                setToAsset(initialAsset);
            setFromAsset(tempAsset);
        } else {
            if(fromAsset.symbol === tempAsset.symbol)
                setFromAsset(initialAsset);
            setToAsset(tempAsset);
        }

        setActiveAsset('');
        setOpenAssetListModal(false);
    }

    const handleSwapApprove = () => {
        setOpenConfirmSwapModal(false);
        setOpenSwapStatusModal(true);
    }

    const SwapSuccessToast = () => (
        <Box className={classes.successToast}>
            <IconButton
                className={classes.toastClose}
                onClick={() => toast.dismiss()}
            >
                <Close />
            </IconButton>
            <Box className={classes.toastContent}>
                <CheckMark />
                <Box>
                    <Typography>Swap 100 USDC for 100 HYSD</Typography>
                    <Typography component="span">View on Solana Mainnet</Typography>
                </Box>
            </Box>
            <span className={classes.toastFooter} />
        </Box>
    );

    return (
        <>
            <Box className={classes.swapContent}>
                <Box className={classes.actionRow}>
                    <span className={classes.title}>Swap</span>
                    <div className={classes.swapIcons}>
                        <IconButton onClick={() => setOpenSettingModal(true)}>
                            <Gear />
                        </IconButton>
                    </div>
                </Box>
                <Box className={classes.swapAssets}>
                    <SwapAsset
                        fromAsset={fromAsset}
                        fromAmount={fromAmount}
                        toAsset={toAsset}
                        toAmount={toAmount}
                        changeAsset={handleChangeAsset}
                        changeAmount={handleChangeAmount}
                        swapRate={swapRate}
                        exchange={exchangeAssets}
                        confirmSwap={() => setOpenConfirmSwapModal(true)}
                    />
                </Box>
                {fromAsset.symbol !== '' && toAsset.symbol !== '' && (
                    <Box className={classes.routeContainer}>
                        <Typography className={classes.routeTitle}>
                            Route
                        </Typography>
                        <Box className={classes.routeDetail}>
                            <Box className={classes.assetItem}>
                                <img src={fromAsset.icon} alt="Asset" />
                                <span>{`${fromAsset.symbol} >`}</span>
                            </Box>
                            <Box className={classes.assetItem}>
                                <img src={USDT} alt="Asset" />
                                <span>{'USDT >'}</span>
                            </Box>
                            <Box className={classes.assetItem}>
                                <img src={toAsset.icon} alt="Asset" />
                                <span>{toAsset.symbol}</span>
                            </Box>
                        </Box>
                    </Box>
                )}
            </Box>
            <SwapSettingModal
                open={openSettingModal}
                onClose={() => handleSettingModal()}
                slippage={slippage}
                setSlippage={(value) => setSlippage(value)}
            />
            <AssetListModal
                open={openAssetListModal}
                onClose={() => setOpenAssetListModal(false)}
                assetList={assets}
                setAsset={changeAsset}
            />
            <ConfirmSwapModal
                open={openConfirmSwapModal}
                onClose={() => setOpenConfirmSwapModal(false)}
                fromAsset={fromAsset}
                fromAmount={fromAmount}
                toAsset={toAsset}
                toAmount={toAmount}
                swapRate={swapRate}
                slippage={slippage}
                onApprove={handleSwapApprove}
            />
            <SwapStatus
                open={openSwapStatusModal}
                onClose={() => setOpenSwapStatusModal(false)}
            />
        </>
    )
}

export default Swap;