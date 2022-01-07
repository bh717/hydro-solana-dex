import { FC } from 'react';
import { makeStyles } from '@mui/styles';
import {
    Box,
    Button,
    IconButton,
    InputBase,
    Typography
} from '@mui/material';

import { Exchange } from '../../../components/icons';
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

    return (
        <Box className={classes.swapContainer}>
            <Box className={classes.assetContainer}>
                <Box>
                    <Box className={classes.assetDetail}>
                        <Typography>From</Typography>
                        <Typography>Balance: {normalizeBalance(from.balance)}</Typography>
                    </Box>
                    <Box className={classes.assetInput}>
                        <InputBase className={classes.baseInput} placeholder='0' />
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
                        <InputBase className={classes.baseInput} placeholder='0' />
                        <SelectAsset asset={to} changeAsset={() => changeAsset('To')} />
                    </Box>
                </Box>
            </Box>
            <Button className={classes.swapButton}>
                Connect Wallet
            </Button>
        </Box>
    )
}

export default SwapAsset;