import React, { FC, useState, useEffect } from 'react';
import { makeStyles } from '@mui/styles';
import {
    Box,
    Button,
    IconButton,
    InputBase,
    Typography
} from '@mui/material';
import { useWallet } from '@solana/wallet-adapter-react';
import cn from 'classnames';

import { Exchange, Compare } from '../../../components/icons';
import SelectAsset from '../selectAsset';
import { Asset } from '../../../interfaces';
import { normalizeBalance } from '../../../helpers/normalize';

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
    fromAsset: Asset;
    fromAmount: number;
    toAsset: Asset;
    toAmount: number;
    changeAsset(type: string): void;
    changeAmount(type: string, amount: number): void;
    swapRate: number;
    exchange(): void;
    confirmSwap(): void;
    walletConnect(): void;
}

const SwapAsset: FC<SwapAssetProps> = ({ fromAsset, fromAmount, toAsset, toAmount, changeAsset, changeAmount, swapRate, exchange, confirmSwap, walletConnect }) => {
    const classes = useStyles();

    const { connected } = useWallet();
    const [showPriceDetail, setShowPriceDetail] = useState(true);

    useEffect(() => {
        if(fromAmount && toAmount)
            setShowPriceDetail(true);
        else
            setShowPriceDetail(false);
    }, [fromAmount, toAmount]);

    const handleFromAmountChange = (value: string) => {
        if(fromAsset.symbol)
            changeAmount('From', Number(value))

        if(toAsset.symbol) {
            const tempToAmount = Number(value) * swapRate;
            changeAmount('To', tempToAmount);
        } else {
            changeAmount('To', 0);
        }
    }

    const handleToAmountChange = (value: string) => {
        if(toAsset.symbol)
            changeAmount('To', Number(value));

        if(fromAsset.symbol) {
            const tempFromAmount = Number(value) / swapRate;
            changeAmount('From', tempFromAmount);
        } else {
            changeAmount('From', 0);
        }
    }

    const SwapButtonContent = () => {
        if(!fromAsset.symbol || !toAsset.symbol)
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
                            <Typography>Balance: {normalizeBalance(fromAsset.balance)}</Typography>
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
                            <SelectAsset asset={fromAsset} changeAsset={() => changeAsset('From')} />
                        </Box>
                    </Box>
                    <IconButton className={classes.exchangeButton} onClick={exchange}>
                        <Exchange />
                    </IconButton>
                    <Box>
                        <Box className={classes.assetDetail}>
                            <Typography>To</Typography>
                            <Typography>Balance: {normalizeBalance(toAsset.balance)}</Typography>
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
                            <SelectAsset asset={toAsset} changeAsset={() => changeAsset('To')} />
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
                                    <span>1 {fromAsset.symbol} = 2 {toAsset.symbol}</span> <Compare />
                                </Box>
                                <span className={classes.goodPrice}>1.5% Better than market</span>
                            </Typography>
                        </Box>
                        <Box className={classes.priceImpact}>
                            <Typography className={classes.impactTitle}>
                                Price Impact
                            </Typography>
                            <Box className={classes.impactLine} />
                            <Typography className={cn(classes.impactInfo, classes.goodPrice)}>
                                {'< 0.01%'}
                            </Typography>
                        </Box>
                    </Box>
                )}
                {connected ? (
                    <Button
                        className={classes.swapButton}
                        disabled={!fromAsset.symbol || !toAsset.symbol || fromAmount <= 0 || toAmount <= 0}
                        onClick={confirmSwap}
                    >
                        {SwapButtonContent()}
                    </Button>
                ) : (
                    <Button
                        className={classes.swapButton}
                        onClick={walletConnect}
                    >
                        Connect Wallet
                    </Button>
                )}
            </Box>
        </>
    )
}

export default SwapAsset;