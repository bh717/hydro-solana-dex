import { Fragment, useState, useEffect } from 'react';
import { makeStyles } from '@mui/styles';
import {
    Box,
    IconButton,
    Typography
} from '@mui/material';

import { Info, Gear, Exchange } from '../../components/icons';
import { Asset } from '../../interfaces';
import SelectAsset from './selectAsset';
import SwapAsset from './swapAsset';
import SwapSettingModal from './setting';
import TokenListModal from './tokens';
import usePages from '../usePages';

const useStyles = makeStyles({
    swapContent: {
        background: 'linear-gradient(to bottom right, #bfbcea, #97f2e4, #a9cef5)',
        borderRadius: '30px',
        display: 'flex',
        flexDirection: 'column',
        padding: '0 8px 8px',
        maxWidth: '500px',
        width: '100%'
    },
    actionRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        height: '60px'
    },
    title: {
        color: '#000',
        fontSize: '24px',
        fontWeight: '500',
        lineHeight: '32px'
    },
    swapIcons: {
        display: 'flex',
        alignItems: 'center',
        '& .MuiSvgIcon-root': {
            width: '20px',
            height: '20px',
            color: '#000'
        },
        '& .MuiIconButton-root': {
            padding: '0',
            margin: '0 10px',
            '&:first-of-type': {
                marginLeft: 0
            },
            '&:last-of-type': {
                marginRight: 0
            }
        }
    },
    selectAssets: {
        display: 'none',
        justifyContent: 'space-between',
        position: 'relative',
        '@media (max-width: 600px)': {
            display: 'flex'
        }
    },
    exchangeButton: {
        background: '#514C99 !important',
        border: '3px solid #161720 !important',
        borderRadius: '9px !important',
        padding: '7px !important',
        position: 'absolute !important' as any,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1,
        '& svg': {
            width: '12px',
            height: '12px'
        },
        '&::before': {
            background: 'linear-gradient(226deg, #2FE4C9 15.08%, #39B5F1 29.84%, #6C83E1 56.57%, #CF489D 86.03%)',
            borderRadius: '6px',
            content: "''",
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            opacity: '0.2'
        }
    },
    swapAssets: {
        background: '#161720',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        padding: '8px',
        marginTop: '4px'
    },
    slippage: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '16px 8px 8px',
        '& p': {
            color: 'rgba(255, 255, 255, 0.5)',
            fontFamily: 'Rubik, sans-serif !important',
            fontSize: '14px !important',
            lineHeight: '21px !important'
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
        <Fragment>
            <Box className={classes.swapContent}>
                <Box className={classes.actionRow}>
                    <span className={classes.title}>Swap</span>
                    <div className={classes.swapIcons}>
                        <IconButton>
                            <Info />
                        </IconButton>
                        <IconButton onClick={() => setOpenSettingModal(true)}>
                            <Gear />
                        </IconButton>
                    </div>
                </Box>
                <Box className={classes.selectAssets}>
                    <SelectAsset type="From" asset={fromAsset} changeAsset={() => handleAssetModal('From')} />
                    <IconButton className={classes.exchangeButton} onClick={exchangeAssets}>
                        <Exchange />
                    </IconButton>
                    <SelectAsset type="To" asset={toAsset} changeAsset={() => handleAssetModal('To')} />
                </Box>
                <Box className={classes.swapAssets}>
                    <SwapAsset
                        from={fromAsset}
                        to={toAsset}
                        changeAsset={handleAssetModal}
                        exchange={exchangeAssets}
                    />
                    <Box className={classes.slippage}>
                        <Typography>Slippage Tolerance</Typography>
                        <Typography>{Number(slippage)}%</Typography>
                    </Box>
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
        </Fragment>
    )
}

export default Swap;