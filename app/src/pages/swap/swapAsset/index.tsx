import { FC } from 'react';
import { makeStyles } from '@mui/styles';
import { Box, Button, IconButton } from '@mui/material';

import { Exchange } from '../../../components/icons';
import SelectAsset from '../selectAsset';
import TextInput from '../../../components/input';
import { Asset } from '../../../interfaces';

const useStyles = makeStyles({
    swapContainer: {
        borderRadius: '12px',
        border: '1px solid rgba(7, 235, 173, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px'
    },
    assetContainer: {
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        width: '100%'
    },
    assetRow: {
        background: '#292535',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'flex-start',
        padding: '8px',
        position: 'relative',
        marginBottom: '8px',
        width: 'calc(100% - 16px)',
        '&:last-of-type': {
            marginBottom: 0
        },
        '@media (max-width: 600px)': {
            '& > .MuiBox-root': {
                '&:first-child': {
                    display: 'none'
                }
            }
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
            height: '12px',
            transform: 'rotate(90deg)'
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
    swapButton: {
        backgroundColor: '#07ebad !important',
        borderRadius: '12px !important',
        color: '#292535 !important',
        fontFamily: 'Rubik, sans-serif !important',
        fontSize: '16px !important',
        fontWeight: '500 !important',
        marginTop: '10px !important',
        textTransform: 'capitalize !important' as any,
        height: '56px',
        width: '100%',
        '@media (max-width:600px)': {
            height: '44px'
        }
    }
})

interface SwapAssetProps {
    from: Asset;
    to: Asset
}

const SwapAsset: FC<SwapAssetProps> = ({ from, to }) => {
    const classes = useStyles();

    return (
        <Box className={classes.swapContainer}>
            <Box className={classes.assetContainer}>
                <Box className={classes.assetRow}>
                    <SelectAsset asset={from} />
                    <TextInput />
                </Box>
                <IconButton className={classes.exchangeButton}>
                    <Exchange />
                </IconButton>
                <Box className={classes.assetRow}>
                    <SelectAsset asset={to} />
                    <TextInput />
                </Box>
            </Box>
            <Button className={classes.swapButton}>
                Connect Wallet
            </Button>
        </Box>
    )
}

export default SwapAsset;