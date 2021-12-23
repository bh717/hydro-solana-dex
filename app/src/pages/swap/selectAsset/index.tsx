import { FC } from 'react';
import { makeStyles } from '@mui/styles';
import { Box, Button, Typography } from '@mui/material';

import { Down } from '../../../components/icons';
import { Asset } from '../../../interfaces';

const useStyles = makeStyles({
    assetContainer: {
        background: 'rgba(0, 0, 0, 0.1)',
        borderRadius: '10px',
        position: 'relative',
        padding: '20px 10px',
        width: '130px',
        '@media (max-width: 600px)': {
            background: '#292535',
            padding: '0 10px 10px',
            width: 'calc((100% - 44px) / 2)',
        }
    },
    assetDetail: {
        display: 'none',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 8px 2px',
        '@media (max-width: 600px)': {
            display: 'flex'
        }
    },
    typography: {
        color: '#FFF',
        fontFamily: 'Rubik, sans-serif !important',
        fontSize: '12px !important',
        lineHeight: '18px !important',
        letterSpacing: 'normal'
    },
    buttonWrapper: {
        display: 'flex',
        justifyContent: 'flex-start',
        '@media (max-width: 600px)': {
            justifyContent: 'center',
        }
    },
    assetButton: {
        padding: '0 !important',
        '& img': {
            width: '30px',
            height: '30px',
        },
        '& span': {
            color: '#FFF',
            fontFamily: 'Rubik, sans-serif',
            fontSize: '16px',
            lineHeight:' 24px',
            margin: '0 10px'
        },
        '& svg': {
            width: '12px',
            height: '12px',
            color: '#FFF'
        },
        '&:hover': {
            backgroundColor: 'transparent !important'
        }
    }
});

interface SelectAssetProps {
    type?: string;
    asset: Asset;
}

const SelectAsset: FC<SelectAssetProps> = ({ type, asset }) => {
    const classes = useStyles();

    return (
        <Box className={classes.assetContainer}>
            <Box className={classes.assetDetail}>
                <Typography className={classes.typography}>{type}</Typography>
                <Typography className={classes.typography}>
                    {asset.balance.toFixed(2)}
                </Typography>
            </Box>
            <Box className={classes.buttonWrapper}>
                <Button className={classes.assetButton} disableRipple={true}>
                    {asset.icon}
                    <span>{asset.symbol}</span>
                    <Down />
                </Button>
            </Box>
        </Box>
    )
}

export default SelectAsset;