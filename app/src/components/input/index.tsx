import { makeStyles } from '@mui/styles';
import { Box, InputBase, Typography } from '@mui/material';
import cn from 'classnames';

import { Wallet } from '../icons';

const useStyles = makeStyles({
    inputWrapper: {
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
    },
    inputDetail: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 8px 0'
    },
    typography: {
        color: 'rgba(255, 255, 255, 0.5)',
        display: 'flex',
        alignItems: 'center',
        fontFamily: 'Rubik, sans-serif !important',
        fontSize: '12px !important',
        lineHeight: '18px !important',
        '& svg': {
            fill: '#FFF',
            width: '14px',
            height: '14px',
            marginRight: '4px'
        }
    },
    baseInput: {
        padding: '0 8px 8px',
        '& input': {
            color: '#FFF',
            padding: 0,
            fontFamily: 'Rubik, sans-serif',
            fontSize: '16px',
            fontWeight: '500'
        }
    }
})

const TextInput = () => {
    const classes = useStyles();

    return (
        <Box className={classes.inputWrapper}>
            <Box className={classes.inputDetail}>
                <Typography className={classes.typography}>From</Typography>
                <Typography className={cn(classes.typography)}>
                    <Wallet /> <span>0</span>
                </Typography>
            </Box>
            <InputBase className={classes.baseInput} placeholder='0.00' />
        </Box>
    )
}

export default TextInput;