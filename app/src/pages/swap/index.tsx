import { useState, useEffect } from 'react';
import { makeStyles } from '@mui/styles';
import { Box, IconButton } from '@mui/material';

import { Gear } from '../../components/icons';
import { Asset } from '../../interfaces';
import SwapAsset from './swapAsset';
import SwapSettingModal from './setting';
import TokenListModal from './tokenList';
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