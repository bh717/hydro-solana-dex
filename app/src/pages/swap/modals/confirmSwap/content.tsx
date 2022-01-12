import React, { FC, useState, useEffect } from 'react';
import { makeStyles } from '@mui/styles';
import {
    Box,
    Typography,
    Button
} from '@mui/material';
import cn from 'classnames';

import { ArrowDown, Compare, Warning } from '../../../../components/icons';
import { Asset } from '../../../../interfaces';
import normalizeBalance from '../../../../helpers/normalizeBalance';

const useStyles = makeStyles({
    title: {
        borderBottom: '1px solid #FFFFFF0F',
        color: '#FFFFFFD9',
        fontSize: '18px !important',
        fontWeight: '500 !important',
        lineHeight: '22px !important',
        padding: '23px 23px'
    },
    assetsWrapper: {
        padding: '24px 31px'
    },
    assetRow: {
        display: 'flex',
        alignItems: 'center',
        '& > p': {
            color: '#FFF !important',
            fontSize: '20px !important',
            lineHeight: '24px !important',
            '&:first-of-type': {
                flexGrow: 1,
                padding: '0 10px'
            }
        }
    },
    svgArrowDown: {
        color: '#FFFFFFD9',
        margin: '20px 10px',
        width: '16px !important',
        height: '16px !important'
    },
    priceUpdate: {
        display: 'flex',
        alignItems: 'center',
        marginTop: '24px',
        '& > p': {
            flexGrow: 1,
            fontSize: '14px !important',
            lineHeight: '17px !important',
            padding: '0 6px !important'
        }
    },
    acceptButton: {
        background: 'linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)',
        borderRadius: '6px !important',
        color: '#FFF !important',
        fontSize: '14px !important',
        fontWeight: '500 !important',
        lineHeight: '24px !important',
        padding: '4px 16px !important',
        textTransform: 'initial !important' as any,
    },
    priceDetail: {
        background: '#394455',
        color: '#FFFFFFA6',
        padding: '24px 31px'
    },
    detailTitle: {
        fontSize: '14px !important',
        lineHeight: '17px !important',
        marginBottom: '20px !important'
    },
    detailRow: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '12px',
        '& p, & span': {
            fontSize: '14px !important',
            lineHeight: '17px !important'
        },
        '&:first-of-type': {
            alignItems: 'flex-start',
            justifyContent: 'space-between'
        },
        '&:last-of-type': {
            marginBottom: 0
        }
    },
    rowLine: {
        flexGrow: '1',
        borderBottom: '1px dashed #FFFFFF40',
        margin: '0 10px'
    },
    detailInfo: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginBottom: '2px',
        '& > svg': {
            width: '16px !important',
            height: '16px !important',
            marginRight: '6px'
        },
        '& > span': {
            color: '#FFFFFFD9'
        }
    },
    detailFee: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        '& span': {
            '&:first-of-type': {
                color: '#FFFFFFD9',
                marginBottom: '2px'
            },
            '&:last-of-type': {
                color: '#FFFFFF73'
            }
        }
    },
    goodPrice: {
        color: '#19CE9D'
    },
    badPrice: {
        color: '#EFBF13'
    },
    underLine: {
        textDecoration: 'underline'
    },
    confirmButton: {
        background: 'linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)',
        borderRadius: '6px !important',
        color: '#FFF !important',
        fontSize: '16px !important',
        fontWeight: '500 !important',
        lineHeight: '24px !important',
        padding: '16px !important',
        textTransform: 'initial !important' as any,
        margin: '24px 23px 23px !important',
        width: 'calc(100% - 46px)',
        '&.Mui-disabled': {
            background: '#FFFFFF40 !important',
            color: '#FFFFFF73 !important'
        }
    }
})

interface ContentProps {
    fromAsset: Asset;
    fromAmount: number;
    toAsset: Asset;
    toAmount: number;
    swapRate: number;
    slippage: string;
    onApprove(): void;
}

const Content: FC<ContentProps> = ({ fromAsset, fromAmount, toAsset, toAmount, swapRate, slippage, onApprove }) => {
    const classes = useStyles();

    const [rateUpdated, setRateUpdated] = useState(false);

    useEffect(() => {
        checkRate();
    });

    const checkRate = () => {
        setTimeout(() => {
            setRateUpdated(true);
        }, 10000);
    }

    const acceptPrice = () => {
        setRateUpdated(false);
        checkRate();
    }

    return (
        <>
            <Typography className={classes.title}>Confirm Swap</Typography>
            <Box className={classes.assetsWrapper}>
                <Box className={classes.assetRow}>
                    <img src={fromAsset.icon} alt="Asset" />
                    <Typography>{normalizeBalance(fromAmount)}</Typography>
                    <Typography>{fromAsset.symbol}</Typography>
                </Box>
                <ArrowDown className={classes.svgArrowDown} />
                <Box className={classes.assetRow}>
                    <img src={toAsset.icon} alt="Asset" />
                    <Typography>{normalizeBalance(toAmount)}</Typography>
                    <Typography>{toAsset.symbol}</Typography>
                </Box>
                {rateUpdated && (
                    <Box className={classes.priceUpdate}>
                        <Warning className={classes.badPrice} />
                        <Typography className={classes.badPrice}>Price Updated</Typography>
                        <Button className={classes.acceptButton} onClick={acceptPrice}>
                            Accept
                        </Button>
                    </Box>
                )}
            </Box>
            <Box className={classes.priceDetail}>
                <Typography className={cn(classes.detailTitle, classes.goodPrice)}>Fair Price</Typography>
                <Box className={classes.detailRow}>
                    <Typography>Price</Typography>
                    <Typography component="div">
                        <Box className={classes.detailInfo}>
                            <Compare />
                            <span>1 {fromAsset.symbol} = 2 {toAsset.symbol}</span>
                        </Box>
                        <span className={classes.goodPrice}>Within plus or minus 1% of market</span>
                    </Typography>
                </Box>
                <Box className={classes.detailRow}>
                    <Typography className={classes.underLine}>Price Impact</Typography>
                    <Box className={classes.rowLine} />
                    <Typography className={classes.goodPrice}>
                        {'< 0.01%'}
                    </Typography>
                </Box>
                <Box className={classes.detailRow}>
                    <Typography className={classes.underLine}>Swap Fee</Typography>
                    <Box className={classes.rowLine} />
                    <Typography className={classes.detailFee} component="div">
                        <span>0.3 {toAsset.symbol}</span>
                        <span>Fee Rate: 0.3%</span>
                    </Typography>
                </Box>
                <Box className={classes.detailRow}>
                    <Typography className={classes.underLine}>Minimum Received</Typography>
                    <Box className={classes.rowLine} />
                    <Typography className={classes.detailFee} component="div">
                        <span>198 {toAsset.symbol}</span>
                        <span>Slippage: {slippage}%</span>
                    </Typography>
                </Box>
            </Box>
            <Button
                className={classes.confirmButton}
                disabled={rateUpdated}
                onClick={onApprove}
            >
                Confirm Swap
            </Button>
        </>
    )
}

export default Content;