import { FC } from 'react';
import { makeStyles } from '@mui/styles';
import { Box, TextField, Button } from '@mui/material';
import cn from 'classnames';

const useStyles = makeStyles({
    inputWrapper: {
        flexGrow: 1,
        position: 'relative',
        '& .MuiTextField-root': {
            width: '100%'
        },
        '& input': {
            color: '#FFF',
            fontFamily: 'Rubik, sans-serif',
            fontSize: '20px',
            fontWeight: '500',
            lineHeight: '24px',
            padding: '14px 34px',
            height: 'initial',
        },
        '& fieldset': {
            border: 'none',
            borderRadius: '32px',
            padding: '3px',
            background: 'linear-gradient(137.26deg, #FF0081 3.65%, #00FFF6 99.96%)',
            opacity: '0.5',
            '-webkit-mask': 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            '-webkit-mask-composite': 'destination-out',
            pointerEvents: 'none'
        },
        '& .Mui-focused': {
            '& fieldset': {
                opacity: 1
            }
        },
        '@media (max-width: 600px)': {
            '& input': {
                fontSize: '15px',
                lineHeight: '18px',
                padding: '11px 12px 11px 42px'
            },
            '& fieldset': {
                borderRadius: '36px',
                padding: '2px'
            }
        }
    },
    hasMax: {
        '& input': {
            paddingRight: '135px !important',
            '@media (max-width: 600px)': {
                paddingRight: '65px !important'
            }
        }
    },
    inputAppendix: {
        display: 'flex',
        position: 'absolute',
        height: '34px',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        '@media (max-width: 600px)': {
            height: '20px'
        }
    },
    divider: {
        background: 'linear-gradient(137.26deg, #FF0081 3.65%, #00FFF6 99.94%)',
        borderRadius: '24px',
        display: 'block',
        height: '34px',
        width: '2px',
        marginRight: '16px',
        '@media (max-width: 600px)': {
            display: 'none'
        }
    },
    maxButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.37) !important',
        borderRadius: '17px !important',
        color: '#FFF !important',
        fontFamily: 'Rubik, sans-serif !important',
        fontSize: '18px !important',
        fontWeight: '500 !important',
        lineHeight: '21px !important',
        padding: '6px 14px !important',
        marginRight: '15px !important',
        '@media (max-width: 600px)': {
            padding: '4px 10px !important',
            fontSize: '12px !important',
            lineHeight: '12px !important',
            height: '20px',
            minWidth: 'initial !important',
            marginRight: '10px !important',
        }
    }
})

interface TextInputProps {
    hasMax?: boolean
}

const TextInput: FC<TextInputProps> = ({ hasMax }) => {
    const classes = useStyles();

    return (
        <Box className={classes.inputWrapper}>
            <TextField className={cn({[classes.hasMax]: hasMax})} hiddenLabel />
            {hasMax && (
                <Box className={classes.inputAppendix}>
                    <span className={classes.divider}></span>
                    <Button className={classes.maxButton} disableRipple>MAX</Button>
                </Box>
            )}
        </Box>
    )
}

export default TextInput;