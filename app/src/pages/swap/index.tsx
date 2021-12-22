import { Fragment, useState, useEffect } from 'react';
import { makeStyles } from '@mui/styles';
import {
    Box,
    IconButton,
    CircularProgress
} from '@mui/material';

import { Info, Gear, Exchange } from '../../components/icons';
import { Asset } from '../../interfaces';
import SOL from '../../assets/images/symbols/sol.png';
import ETH from '../../assets/images/symbols/eth.png';
import SelectAsset from './selectAsset';
import SwapAsset from './swapAsset';
import SwapSettingModal from './setting';

const useStyles = makeStyles({
    swapContent: {
        display: 'flex',
        flexDirection: 'column',
        padding: '0 30px',
        maxWidth: '660px',
        width: '100%',
        '@media (max-width: 600px)': {
            padding: '0 20px'
        }
    },
    actionRow: {
        backgroundColor: 'transparent !important',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '25px',
        '@media (max-width: 600px)': {
            marginBottom: '20px'
        }
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
            color: '#303133'
        },
        '& .MuiIconButton-root': {
            padding: 0,
        }
    },
    svgInfo: {
        '& path:last-of-type': {
            color: '#409EFF',
            opacity: '0.85'
        }
    },
    countDownWrapper: {
        position: 'relative',
        width: '20px',
        height: '20px',
        margin: '0 20px',
        '& .MuiCircularProgress-root': {
            width: '100% !important',
            height: '100% !important',
            '&:first-of-type': {
                color: '#303133'
            },
            '&:last-of-type': {
                position: 'absolute',
                left: 0
            }
        }
    },
    assetRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '40px',
        '@media (max-width: 600px)': {
            marginBottom: '20px'
        }
    },
    exchangeButton: {
        background: 'linear-gradient(270deg, #00FFB7 -1.85%, #00BFFF 50.25%, #FF1A7F 102.1%)',
        padding: '0 !important',
        margin: '0 20px !important',
        height: '44px',
        width: '44px',
        '@media (max-width: 600px)': {
            margin: '0 5px !important',
            height: '32px',
            width: '32px',
            '& svg': {
                width: '14px',
                height: '14px'
            }
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

    const [countDown, setCountDown] = useState(0);
    const [fromAsset, setFromAsset] = useState<Asset>(initialAsset);
    const [toAsset, setToAsset] = useState<Asset>(initialAsset);
    const [slippage, setSlippage] = useState('1.0');
    const [openSettingModal, setOpenSettingModal] = useState(false);

    useEffect(() => {
        const timeInterval = setInterval(() => {
            setCountDown((countDown + 1) % 60); 
        }, 1000);

        setFromAsset({
            icon: <img src={SOL} alt="Asset" />,
            symbol: 'SOL',
            balance: 0
        });
        setToAsset({
            icon: <img src={ETH} alt="Asset" />,
            symbol: 'ETH',
            balance: 0
        })

        return () => clearInterval(timeInterval);
    }, [countDown]);

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
                            <Info className={classes.svgInfo} />
                        </IconButton>
                        <Box className={classes.countDownWrapper}>
                            <CircularProgress variant="determinate" value={100} />
                            <CircularProgress variant="determinate" value={100 * countDown / 60} />
                        </Box>
                        <IconButton onClick={() => setOpenSettingModal(true)}>
                            <Gear />
                        </IconButton>
                    </div>
                </Box>
                <Box className={classes.assetRow}>
                    <SelectAsset type="From" asset={fromAsset} />
                    <IconButton className={classes.exchangeButton}>
                        <Exchange />
                    </IconButton>
                    <SelectAsset type="To" asset={toAsset} />
                </Box>
                <SwapAsset from={fromAsset} to={toAsset} slippage={slippage} />
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