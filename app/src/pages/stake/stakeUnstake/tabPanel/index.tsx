import React, { FC } from 'react';
import { makeStyles } from '@mui/styles';
import {
    Box,
    Typography,
    TextField,
    InputAdornment,
    Button
} from '@mui/material';
import { useWallet } from '@solana/wallet-adapter-react';

const useStyles = makeStyles({
    tabPanel: {
        padding: '30px',
        '@media (max-width: 600px)': {
            padding: '30px 22px'
        }
    },
    inputDetail: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        '& > p': {
            fontSize: '16px !important',
            lineHeight: '19px !important',
            '&:first-of-type': {
                color: '#FFFFFFA6'
            },
            '&:last-of-type': {
                color: '#FFF',
                textDecoration: 'underline'
            }
        }
    },
    panelInput: {
        background: '#333641',
        borderRadius: '6px',
        marginTop: '12px !important',
        width: '100%',
        '& .MuiInputBase-root': {
            paddingRight: '16px !important',
            '&:hover': {
                '& fieldset': {
                    background: 'linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)',
                }
            }
        },
        '& .Mui-focused': {
            '& fieldset': {
                background: 'linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)',
            }
        },
        '& fieldset': {
            border: 'none',
            borderRadius: '6px',
            padding: '1px',
            background: '#FFFFFF40',
            '-webkit-mask': 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            '-webkit-mask-composite': 'destination-out',
            pointerEvents: 'none'
        },
        '& input': {
            color: '#FFFFFFD9',
            fontSize: '20px',
            lineHeight: '24px',
            padding: '16px 0 16px 16px'
        },
        '& .MuiInputAdornment-root': {
            '& p': {
                color: '#FFF',
                fontSize: '20px',
                lineHeight: '24px'
            }
        }
    },
    panelButton: {
        background: 'linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)',
        borderRadius: '6px !important',
        color: '#FFF !important',
        fontSize: '16px !important',
        lineHeight: '24px !important',
        padding: '16px !important',
        marginTop: '48px !important',
        textTransform: 'capitalize !important' as any,
        width: '100%',
        '&.Mui-disabled': {
            background: '#FFFFFF40',
            color: '#FFFFFF73 !important'
        }
    }
})

interface TabPanelProps {
    type: string;
    balance: string;
    amount: string;
    setAmount(value: string): void;
    onWalletConnect(): void;
    onAction(type: string): void;
}

const TabPanel: FC<TabPanelProps> = ({ type, balance, amount, setAmount, onWalletConnect, onAction }) => {
    const classes = useStyles();

    const { connected } = useWallet();

    return (
        <Box className={classes.tabPanel}>
            <Box className={classes.inputDetail}>
                <Typography>{type === 'stake' ? 'Balance' : 'Avail'}</Typography>
                <Typography>{balance}</Typography>
            </Box>
            <TextField
                className={classes.panelInput}
                hiddenLabel
                type="number"
                InputProps={{
                    endAdornment: <InputAdornment position="end">{type === 'stake' ? 'HYSD' : 'xHYSD'}</InputAdornment>
                }}
                value={amount}
                onChangeCapture={(
                    event: React.ChangeEvent<HTMLInputElement>
                ) => setAmount(event.target.value)}
            />
            {connected ? (
                <Button
                    className={classes.panelButton}
                    onClick={() => onAction(type)}
                    disabled={parseFloat(amount) === 0}
                >
                    {type === 'stake' ? 'Stake' : 'Unstake'}
                </Button>
            ) : (
                <Button
                    className={classes.panelButton}
                    onClick={onWalletConnect}
                >
                    Connect Wallet
                </Button>
            )}
        </Box>
    )
}

export default TabPanel;