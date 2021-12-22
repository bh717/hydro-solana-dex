import { FC } from 'react';
import { makeStyles } from '@mui/styles';
import { Box, Button, IconButton } from '@mui/material';

import { Exchange, Info } from '../../../components/icons';
import TextInput from '../../../components/input';
import { Asset } from '../../../interfaces';
import Change from '../../../assets/images/change.png';

const useStyles = makeStyles({
    swapContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 24px',
        position: 'relative',
        width: 'calc(100% - 48px)',
        '&::before': {
            content: "''",
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            borderRadius: '30px',
            padding: '3px',
            background: 'linear-gradient(137.26deg, rgba(255, 34, 146, 0.350034) 3.65%, rgba(0, 255, 246, 0.347892) 99.98%)',
            '-webkit-mask': 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            '-webkit-mask-composite': 'destination-out',
            pointerEvents: 'none'
        },
        '@media (max-width: 600px)': {
            padding: '20px',
            width: 'calc(100% - 40px)',
            '&::before': {
                borderRadius: '10px',
                padding: '2px'
            }
        }
    },
    assetRow: {
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        width: '100%',
        '& > img': {
            width: '36px',
            height: '36px',
            marginRight: '18px',
            '@media (max-width: 600px)': {
                position: 'absolute',
                left: '10px',
                width: '24px',
                height: '24px'
            }
        }
    },
    dividerRow: {
        display: 'flex',
        alignItems: 'center',
        padding: '20px 0',
        width: '100%'
    },
    divider: {
        background: 'linear-gradient(270deg, #FFFFFF 0%, rgba(255, 255, 255, 0.0001) 100%)',
        display: 'block',
        flexGrow: 1,
        height: '1px',
        opacity: '0.4'
    },
    swap: {
        border: '1px solid rgba(255, 255, 255, 0.4)',
        borderRadius: '50%',
        height: '44px',
        width: '44px',
        position: 'relative',
        '& svg': {
            position: 'absolute',
            top: '11px',
            left: '11px',
            transform: 'rotate(90deg)',
            width: '20px',
            height: '20px'
        },
        '@media (max-width: 600px)': {
            height: '32px',
            width: '32px',
            '& svg': {
                top: '9px',
                left: '9px',
                width: '14px',
                height: '14px'
            }
        }
    },
    priceRow: {
        display: 'flex',
        alignItems: 'center',
        margin: '30px 0',
        fontSize: '14px',
        lineHeight: '17px',
        '& label': {
            color: 'rgba(255, 255, 255, 0.6)',
        },
        '& span': {
            color: '#FFF',
            fontWeight: '500',
            margin: '0 12px 0 20px'
        },
        '& button': {
            padding: '0 !important'
        },
        '@media (max-width: 600px)': {
            margin: '20px 0',
            lineHeight: '14px',
            '& span': {
                margin: '0 8px 0 16px'
            }
        }
    },
    swapButton: {
        background: 'linear-gradient(270deg, #00FFB7 -1.85%, #00BFFF 50.25%, #FF1A7F 102.1%)',
        borderRadius: '37.5px !important',
        color: '#FFF !important',
        fontFamily: 'Rubik, sans-serif !important',
        fontSize: '20px !important',
        fontWeight: '500 !important',
        lineHeight: '24px !important',
        padding: '12px !important',
        maxWidth: '400px',
        width: '100%',
        '@media (max-width: 600px)': {
            fontSize: '18px !important',
            lineHeight: '21px !important',
            padding: '10px !important'
        }
    },
    swapDetail: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: '32px',
        width: '100%',
        '@media (max-width: 600px)': {
            marginTop: '24px'
        }
    },
    detailItem: {
        display: 'flex',
        alignItems: 'center',
        fontFamily: 'Rubik, sans-serif',
        fontSize: '14px',
        lineHeight: '17px',
        margin: '8px 0',
        maxWidth: '400px',
        width: '100%',
        '& label': {
            color: 'rgba(255, 255, 255, 0.6)'
        },
        '& svg': {
            width: '14px',
            height: '14px',
            marginLeft: '5px',
            color: '#F3A82B'
        },
        '& span': {
            color: '#FFF',
            fontWeight: '500'
        },
        '&:last-of-type': {
            marginBottom: 0
        },
        '@media (max-width: 600px)': {
            margin: '6px 0'
        }
    },
    dashLine: {
        flexGrow: 1,
        border: '1px dashed #FFFFFF',
        opacity: '0.09',
        margin: '0 20px'
    }
})

interface SwapAssetProps {
    from: Asset;
    to: Asset;
    slippage: string;
}

const SwapAsset: FC<SwapAssetProps> = ({ from, to, slippage }) => {
    const classes = useStyles();

    return (
        <Box className={classes.swapContainer}>
            <Box className={classes.assetRow}>
                {from.icon}
                <TextInput hasMax />
            </Box>
            <Box className={classes.dividerRow}>
                <span className={classes.divider}></span>
                <span className={classes.swap}>
                    <Exchange />
                </span>
            </Box>
            <Box className={classes.assetRow}>
                {to.icon}
                <TextInput />
            </Box>
            <Box className={classes.priceRow}>
                <label>Price</label>
                <span>1 SOL ≈ 0.0021203 ETH</span>
                <IconButton>
                    <img src={Change} alt="Change" />
                </IconButton>
            </Box>
            <Button className={classes.swapButton}>
                Swap
            </Button>
            <Box className={classes.swapDetail}>
                <Box className={classes.detailItem}>
                    <label>Min.Received</label>
                    <Info />
                    <div className={classes.dashLine}></div>
                    <span>0.11200ETH</span>
                </Box>
                <Box className={classes.detailItem}>
                    <label>Slippage Tolerance</label>
                    <Info />
                    <div className={classes.dashLine}></div>
                    <span>{parseFloat(slippage)}%</span>
                </Box>
                <Box className={classes.detailItem}>
                    <label>Hydra Fee</label>
                    <div className={classes.dashLine}></div>
                    <span>--</span>
                </Box>
            </Box>
        </Box>
    )
}

export default SwapAsset;