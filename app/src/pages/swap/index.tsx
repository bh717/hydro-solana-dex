import React, { useState, useEffect } from 'react';
import { makeStyles } from '@mui/styles';
import {Box, IconButton, Typography} from '@mui/material';

import { Gear } from '../../components/icons';
import { Asset } from '../../interfaces';
import SwapAsset from './swapAsset';
import SwapSettingModal from './modals/setting';
import TokenListModal from './modals/tokenList';
import usePages from '../usePages';
import USDT from '../../assets/images/symbols/usdt.png';

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
    const [toAsset, setToAsset] = useState<Asset>(initialAsset);
    const [activeAsset, setActiveAsset] = useState('');
    const [slippage, setSlippage] = useState('1.0');
    const [openSettingModal, setOpenSettingModal] = useState(false);
    const [openAssetModal, setOpenAssetModal] = useState(false);

    useEffect(() => {
        if(assets.length)
            setFromAsset(assets[0]);
    }, [setFromAsset, assets]);

    const handleSettingModal = () => {
        if(parseFloat(slippage) > 0)
            setOpenSettingModal(false)
    }

    const exchangeAssets = () => {
        const tempAsset = JSON.parse(JSON.stringify(fromAsset));
        setFromAsset(toAsset);
        setToAsset(tempAsset);
    }

    const handleAssetModal = (type: string) => {
        setActiveAsset(type);
        setOpenAssetModal(true);
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
        setOpenAssetModal(false);
    }

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
                        from={fromAsset}
                        to={toAsset}
                        changeAsset={handleAssetModal}
                        exchange={exchangeAssets}
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
            <TokenListModal
                open={openAssetModal}
                onClose={() => setOpenAssetModal(false)}
                assetList={assets}
                setAsset={changeAsset}
            />
        </>
    )
}

export default Swap;