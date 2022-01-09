import React, { FC, useState, useEffect } from 'react';
import { makeStyles } from '@mui/styles';
import {
    Box,
    Button,
    IconButton,
    InputBase,
    Typography
} from '@mui/material';
import cn from 'classnames';

import { Exchange, Compare } from '../../../components/icons';
import SelectAsset from '../selectAsset';
import { Asset } from '../../../interfaces';
import normalizeBalance from '../../../helpers/normalizeBalance';

const useStyles = makeStyles({
    swapContainer: {
        background: '#2a2d3a',
        borderRadius: '4px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px'
    },
    assetContainer: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%'
    },
    assetDetail: {
        color: '#FFFFFFD9',
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '10px',
        '& .MuiTypography-root': {
            lineHeight: '19px'
        }
    },
    assetInput: {
        background: '#373944',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        padding: '8px'
    },
    baseInput: {
        flexGrow: 1,
        padding: '0 8px',
        '& input': {
            color: '#FFF',
            padding: 0,
            fontSize: '16px',
            fontWeight: '500'
        }
    },
    maxButton: {
        color: '#FFFFFFA6',
        cursor: 'pointer',
        fontSize: '14px',
        lineHeight: '17px',
        marginRight: '8px'
    },
    exchangeButton: {
        alignSelf: 'center',
        background: '#373944 !important',
        borderRadius: '4px !important',
        width: '32px',
        height: '32px',
        margin: '24px 0 !important',
        '& svg': {
            width: '20px',
            height: '20px',
            transform: 'rotate(90deg)'
        }
    },
    priceDetail: {
        display: 'flex',
        flexDirection: 'column',
        marginTop: '24px',
        width: '100%'
    },
    priceStatus: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        color: '#FFFFFFD9 !important',
    },
    statusType: {
        fontSize: '14px !important',
        lineHeight: '17px !important'
    },
    statusInfo: {
        fontSize: '14px !important',
        lineHeight: '17px !important',
        textAlign: 'right',
        '& > div': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            marginBottom: '2px',
            '& > svg': {
                color: '#FFFFFFA6',
                marginLeft: '6px',
                width: '16px',
                height: '17px',
            }
        }
    },
    priceImpact: {
        display: 'flex',
        alignItems: 'center',
        marginTop: '10px'
    },
    impactTitle: {
        color: '#FFFFFFA6',
        fontSize: '14px !important',
        lineHeight: '17px !important',
        textDecoration: 'underline'
    },
    impactLine: {
        flexGrow: '1',
        borderBottom: '1px dashed #FFFFFF40',
        margin: '0 6px 0 20px'
    },
    impactInfo: {
        fontSize: '14px !important',
        lineHeight: '17px !important',
        textAlign: 'right',
        width: '60px'
    },
    goodPrice: {
        color: '#19CE9D'
    },
    badPrice: {
        color: '#EFBF13'
    },
    swapButton: {
        background: 'linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%) !important',
        borderRadius: '6px !important',
        color: '#FFF !important',
        fontSize: '16px !important',
        marginTop: '43px !important',
        lineHeight: '24px !important',
        textTransform: 'initial !important' as any,
        padding: '16px !important',
        width: '100%',
        '&.Mui-disabled': {
            background: '#FFFFFF40 !important',
            color: '#FFFFFF73 !important'
        }
    }
})

interface SwapAssetProps {
    from: Asset;
    to: Asset;
    changeAsset(type: string): void;
    exchange(): void;
}

const SwapAsset: FC<SwapAssetProps> = ({ from, to, changeAsset, exchange }) => {
    const classes = useStyles();

    const [fromAmount, setFromAmount] = useState('0');
    const [toAmount, setToAmount] = useState('0');
    const rate = 1;
    const [showPriceDetail, setShowPriceDetail] = useState(true);

    useEffect(() => {
        if(Number(fromAmount) && Number(toAmount))
            setShowPriceDetail(true);
        else
            setShowPriceDetail(false);
    }, [fromAmount, toAmount]);

    const handleFromAmountChange = (value: string) => {
        if(from.symbol)
            setFromAmount(value);

        if(to.symbol) {
            const tempToAmount = Number(value) * rate;
            setToAmount(tempToAmount.toString());
        } else {
            setToAmount('0');
        }
    }

    const handleToAmountChange = (value: string) => {
        if(to.symbol)
            setToAmount(value);

        if(from.symbol) {
            const tempFromAmount = Number(value) / rate;
            setFromAmount(tempFromAmount.toString());
        } else {
            setFromAmount('0');
        }
    }

    const SwapButtonContent = () => {
        if(!from.symbol || !to.symbol)
            return 'Select a token';
        return 'Approve';
    }

    return (
        <>
            <Box className={classes.swapContainer}>
                <Box className={classes.assetContainer}>
                    <Box>
                        <Box className={classes.assetDetail}>
                            <Typography>From</Typography>
                            <Typography>Balance: {normalizeBalance(from.balance)}</Typography>
                        </Box>
                        <Box className={classes.assetInput}>
                            <InputBase
                                className={classes.baseInput}
                                value={fromAmount}
                                placeholder='0'
                                onChange={(
                                    event: React.ChangeEvent<HTMLInputElement>
                                ) => handleFromAmountChange(event.target.value)}
                            />
                            <span className={classes.maxButton}>Max</span>
                            <SelectAsset asset={from} changeAsset={() => changeAsset('From')} />
                        </Box>
                    </Box>
                    <IconButton className={classes.exchangeButton} onClick={exchange}>
                        <Exchange />
                    </IconButton>
                    <Box>
                        <Box className={classes.assetDetail}>
                            <Typography>To</Typography>
                            <Typography>Balance: {normalizeBalance(to.balance)}</Typography>
                        </Box>
                        <Box className={classes.assetInput}>
                            <InputBase
                                className={classes.baseInput}
                                value={toAmount}
                                placeholder='0'
                                onChange={(
                                    event: React.ChangeEvent<HTMLInputElement>
                                ) => handleToAmountChange(event.target.value)}
                            />
                            <SelectAsset asset={to} changeAsset={() => changeAsset('To')} />
                        </Box>
                    </Box>
                </Box>
                {showPriceDetail && (
                    <Box className={classes.priceDetail}>
                        <Box className={classes.priceStatus}>
                            <Typography className={cn(classes.statusType, classes.goodPrice)}>
                                Great Price
                            </Typography>
                            <Typography className={classes.statusInfo} component="div">
                                <Box>
                                    <span>1 {from.symbol} = 2 {to.symbol}</span> <Compare />
                                </Box>
                                <span className={classes.goodPrice}>1.5% Better than market</span>
                            </Typography>
                        </Box>
                        <Box className={classes.priceImpact}>
                            <Typography className={classes.impactTitle}>
                                Price Impact
                            </Typography>
                            <Box className={classes.impactLine}></Box>
                            <Typography className={cn(classes.impactInfo, classes.goodPrice)}>
                                {'< 0.01%'}
                            </Typography>
                        </Box>
                    </Box>
                )}
                {/*<Button className={classes.swapButton}>
                    Connect Wallet
                </Button>*/}
                <Button className={classes.swapButton} disabled={!from.symbol || !to.symbol || Number(fromAmount) <= 0 || Number(toAmount) <= 0}>
                    {SwapButtonContent()}
                </Button>
            </Box>
        </>
    )
}

export default SwapAsset;