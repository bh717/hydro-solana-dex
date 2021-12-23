import { Fragment, useState, useEffect } from 'react';
import { makeStyles } from '@mui/styles';
import {
    Box,
    IconButton,
    Typography
} from '@mui/material';

import { Info, Gear, Exchange } from '../../components/icons';
import { Asset } from '../../interfaces';
import HYSD from '../../assets/images/symbols/hysd.png';
import SOL from '../../assets/images/symbols/sol.png';
import SelectAsset from './selectAsset';
import SwapAsset from './swapAsset';
import SwapSettingModal from './setting';

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
    icon: <></>,
    symbol: '',
    balance: 0
}

const Swap = () => {
    const classes = useStyles();

    const [fromAsset, setFromAsset] = useState<Asset>(initialAsset);
    const [toAsset, setToAsset] = useState<Asset>(initialAsset);
    const [slippage, setSlippage] = useState('1.0');
    const [openSettingModal, setOpenSettingModal] = useState(false);

    useEffect(() => {
        setFromAsset({
            icon: <img src={HYSD} alt="Asset" />,
            symbol: 'HYSD',
            balance: 0
        });
        setToAsset({
            icon: <img src={SOL} alt="Asset" />,
            symbol: 'SOL',
            balance: 0
        })
    }, []);

    const handleHideSettingModal = () => {
        if(parseFloat(slippage) > 0)
            setOpenSettingModal(false)
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
                    <SelectAsset type="From" asset={fromAsset} />
                    <IconButton className={classes.exchangeButton}>
                        <Exchange />
                    </IconButton>
                    <SelectAsset type="To" asset={toAsset} />
                </Box>
                <Box className={classes.swapAssets}>
                    <SwapAsset from={fromAsset} to={toAsset} />
                    <Box className={classes.slippage}>
                        <Typography>Slippage Tolerance</Typography>
                        <Typography>{Number(slippage)}%</Typography>
                    </Box>
                </Box>
            </Box>
            <SwapSettingModal
                open={openSettingModal}
                onClose={() => handleHideSettingModal()}
                slippage={slippage}
                setSlippage={(value) => setSlippage(value)}
            />
        </Fragment>
    )
}

export default Swap;