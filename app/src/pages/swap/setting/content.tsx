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
    typography: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontFamily: 'Rubik, sans-serif !important',
        fontSize: '14px !important',
        lineHeight: '17px !important'
    },
    optionWrapper: {
        display: 'flex',
        marginTop: '26px',
        '& button': {
            border: '1px solid #07EBAD',
            borderRadius: '10px',
            color: '#FFF',
            fontFamily: 'Rubik, sans-serif !important',
            fontSize: '18px',
            lineHeight: '21px',
            padding: '14px 6px !important',
            width: '70px',
            marginTop: '8px',
            marginRight: '8px'
        },
        '@media (max-width: 600px)': {
            flexWrap: 'wrap'
        }
    },
    optionActive: {
        backgroundColor: '#07EBAD !important',
        color: '#1A4E3F !important'
    },
    optionInput: {
        marginTop: '8px !important',
        '& .MuiInputBase-root': {
            padding: '0 12px 0 0',
            '&:hover': {
                '& fieldset': {
                    borderColor: '#07EBAD'
                }
            }
        },
        '& .Mui-focused': {
            '& fieldset': {
                borderColor: '#07EBAD !important'
            }
        },
        '& input': {
            color: '#FFF',
            fontFamily: 'Rubik, sans-serif !important',
            fontSize: '18px',
            fontWeight: '500',
            lineHeight: '21px',
            textAlign: 'right',
            padding: '14px 0 14px 12px',
            width: '50px'
        },
        '& .MuiInputAdornment-root': {
            marginLeft: '4px',
            '& p': {
                color: '#FFF',
                fontFamily: 'Rubik, sans-serif !important',
                fontSize: '18px',
                fontWeight: '500',
                lineHeight: '21px'
            }
        },
        '& fieldset': {
            borderColor: 'rgba(255, 255, 255, 0.6)',
            borderRadius: '10px'
        }
    },
    inputError: {
        '& fieldset': {
            borderColor: '#FF0032B3',
        },
        '& .MuiInputBase-root': {
            '&:hover': {
                '& fieldset': {
                    borderColor: '#FF0032B3 !important'
                }
            }
        },
        '& .Mui-focused': {
            '& fieldset': {
                borderColor: '#FF0032B3 !important'
            }
        }
    },
    error: {
        color: '#FF0032B3',
        fontFamily: 'Rubik, sans-serif !important',
        fontSize: '14px',
        lineHeight: '17px',
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
        if([0.01, 0.05, 1, 2].indexOf(parseFloat(slippage)) < 0)
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
            <Typography className={classes.typography}>
                Slippage Tolerance
            </Typography>
            <Box className={classes.optionWrapper}>
                <Button
                    className={cn({[classes.optionActive]: parseFloat(slippage) === 0.01})}
                    onClick={() => setSlippage('0.01')}
                >
                    0.01%
                </Button>
                <Button
                    className={cn({[classes.optionActive]: parseFloat(slippage) === 0.05})}
                    onClick={() => setSlippage('0.05')}
                >
                    0.05%
                </Button>
                <Button
                    className={cn({[classes.optionActive]: parseFloat(slippage) === 1})}
                    onClick={() => setSlippage('1')}
                >
                    1.0%
                </Button>
                <Button
                    className={cn({[classes.optionActive]: parseFloat(slippage) === 2})}
                    onClick={() => setSlippage('2')}
                >
                    2.0%
                </Button>
                <TextField
                    className={cn(classes.optionInput, {[classes.inputError]: parseFloat(slippage) <= 0})}
                    hiddenLabel
                    InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>
                    }}
                    value={tempSlippage}
                    onChangeCapture={(
                        event: React.ChangeEvent<HTMLInputElement>
                    ) => handleChangeValue(event.target.value)}
                />
            </Box>
            {parseFloat(slippage) <= 0 && (
                <Typography className={classes.error}>
                    Enter a valid slippage percentage
                </Typography>
            )}
        </>
    )
}

export default Content;