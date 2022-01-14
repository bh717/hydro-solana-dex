import React, { FC, useEffect, useState, useCallback } from 'react';
import { makeStyles } from '@mui/styles';
import {
    Box,
    Typography,
    Button,
    TextField,
    InputAdornment
} from '@mui/material';
import cn from 'classnames';
import debounce from 'lodash.debounce';

const useStyles = makeStyles({
    contentTitle: {
        borderBottom: '1px solid #FFFFFF0F',
        color: '#FFF',
        fontSize: '18px !important',
        fontWeight: '500 !important',
        lineHeight: '22px !important',
        padding: '23px 20px',
        margin: '0 3px'
    },
    contentWrapper: {
        padding: '32px 23px'
    },
    typography: {
        color: '#FFF',
        fontSize: '14px !important',
        lineHeight: '16px !important',
        opacity: '0.6'
    },
    optionWrapper: {
        display: 'flex',
        marginTop: '13px',
        justifyContent: 'space-between',
        '& button': {
            border: '1px solid #FFFFFF40',
            borderRadius: '4px',
            color: '#FFF',
            fontSize: '18px',
            fontWeight: '400',
            height: '48px',
            padding: '14px 6px !important',
            width: '70px',
            marginTop: '12px',
            marginRight: '12px',
            '&:last-of-type': {
                marginRight: '24px'
            }
        },
        '@media (max-width: 600px)': {
            flexWrap: 'wrap',
            '& button': {
                marginRight: '0 !important',
                width: '30%'
            }
        }
    },
    optionActive: {
        background: 'linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%) !important',
        border: 'none !important'
    },
    optionInput: {
        marginTop: '12px !important',
        '& .MuiInputBase-root': {
            padding: '0 16px 0 0',
            height: '48px',
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
        '& input': {
            color: '#FFF',
            fontSize: '18px',
            fontWeight: '400',
            padding: '14px 8px 14px 16px',
            '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                '-webkit-appearance': 'none',
                margin: 0
            }
        },
        '& .MuiInputAdornment-root': {
            marginLeft: '4px',
            '& p': {
                color: '#FFF',
                fontSize: '18px',
                fontWeight: '400',
                lineHeight: '21px'
            }
        },
        '& fieldset': {
            border: 'none',
            borderRadius: '4px',
            padding: '1px',
            background: '#FFFFFF40',
            '-webkit-mask': 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            '-webkit-mask-composite': 'destination-out',
            pointerEvents: 'none'
        },
        '@media (max-width: 600px)': {
            order: '-1',
            width: '100%'
        }
    },
    inputError: {
        '& fieldset': {
            background: '#F74949'
        },
        '& .MuiInputBase-root': {
            '&:hover': {
                '& fieldset': {
                    background: '#F74949'
                }
            }
        },
        '& .Mui-focused': {
            '& fieldset': {
                background: '#F74949'
            }
        }
    },
    inputActive: {
        '& fieldset': {
            background: 'linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)'
        }
    },
    error: {
        color: '#F74949',
        fontSize: '14px !important',
        lineHeight: '16px !important',
        marginTop: '16px !important'
    }
})

interface ContentProps {
    slippage: string;
    setSlippage(value: string): void;
}

const Content: FC<ContentProps> = ({ slippage, setSlippage }) => {
    const classes = useStyles();
    const [tempSlippage, setTempSlippage] = useState('');

    useEffect(() => {
        if([0.1, 0.5, 1].indexOf(parseFloat(slippage)) < 0)
            setTempSlippage(slippage);
        else
            setTempSlippage('');
    }, [slippage]);

    // eslint-disable-next-line
    const debouncedSet = useCallback(debounce(value => setSlippage(value), 1000), []);

    const handleChangeValue = (value: string) => {
        setTempSlippage(value);
        debouncedSet(value);
    }

    return (
        <>
            <Typography className={classes.contentTitle}>Settings</Typography>
            <Box className={classes.contentWrapper}>
                <Typography className={classes.typography}>
                    Slippage Tolerance
                </Typography>
                <Box className={classes.optionWrapper}>
                    <Button
                        className={cn({[classes.optionActive]: parseFloat(slippage) === 0.1})}
                        onClick={() => setSlippage('0.1')}
                    >
                        0.1%
                    </Button>
                    <Button
                        className={cn({[classes.optionActive]: parseFloat(slippage) === 0.5})}
                        onClick={() => setSlippage('0.5')}
                    >
                        0.5%
                    </Button>
                    <Button
                        className={cn({[classes.optionActive]: parseFloat(slippage) === 1})}
                        onClick={() => setSlippage('1')}
                    >
                        1.0%
                    </Button>
                    <TextField
                        className={cn(classes.optionInput, {[classes.inputError]: parseFloat(slippage) < 0.01, [classes.inputActive]: parseFloat(tempSlippage) >= 0.01})}
                        hiddenLabel
                        type="number"
                        InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>
                        }}
                        value={tempSlippage}
                        onChangeCapture={(
                            event: React.ChangeEvent<HTMLInputElement>
                        ) => handleChangeValue(event.target.value)}
                    />
                </Box>
                {parseFloat(slippage) <= 0.01 && (
                    <Typography className={classes.error}>
                        Enter a valid slippage percentage
                    </Typography>
                )}
            </Box>
        </>
    )
}

export default Content;