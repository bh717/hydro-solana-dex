import { FC } from 'react';
import { makeStyles } from '@mui/styles';
import { Box, Button, Typography } from '@mui/material';

import { Down } from '../../../components/icons';
import { Asset } from '../../../interfaces';

const useStyles = makeStyles({
    assetContainer: {
        position: 'relative',
        padding: '20px',
        width: 'calc((100% - 84px) / 2)',
        '&::before': {
            content: "''",
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            borderRadius: '30px',
            padding: '3px',
            background: 'linear-gradient(137.26deg, rgba(255, 34, 146, 0.350034) 3.65%, rgba(0, 255, 246, 0.347892) 99.98%)',
            '-webkit-mask': 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            '-webkit-mask-composite': 'destination-out',
            pointerEvents: 'none'
        },
        '@media (max-width: 600px)': {
            padding: '12px',
            width: 'calc((100% - 60px) / 2)',
            '&::before': {
                borderRadius: '10px',
                padding: '2px'
            }
        }
    },
    assetDetail: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
    },
    typography: {
        color: '#FFF',
        fontFamily: 'Rubik, sans-serif !important',
        fontWeight: '500 !important',
        fontSize: '14px !important',
        lineHeight: '17px !important',
        letterSpacing: 'normal',
        '& span': {
            color: 'rgba(255, 255, 255, 0.298842)',
            fontWeight: 'normal',
            marginRight: '8px',
            '@media (max-width: 750px)': {
                display: 'none'
            }
        },
        '@media (max-width: 600px)': {
            fontSize: '12px',
            lineHeight: '14px'
        }
    },
    buttonWrapper: {
        display: 'flex',
        justifyContent: 'center',
        '@media (max-width: 700px)': {
            justifyContent: 'flex-start',
        }
    },
    assetButton: {
        padding: '0 !important',
        '& img': {
            width: '36px',
            height: '36px',
            '@media (max-width: 600px)': {
                width: '24px',
                height: '24px'
            }
        },
        '& span': {
            color: '#FFF',
            fontFamily: 'Rubik, sans-serif',
            fontSize: '20px',
            fontWeight: '500',
            lineHeight:' 24px',
            margin: '0 28px 0 24px',
            '@media (max-width: 700px)': {
                margin: '0 14px 0 7px'
            },
            '@media (max-width: 600px)': {
                flexGrow: 1,
                textAlign: 'left',
                fontSize: '16px',
                lineHeight: '16px'
            }
        },
        '& svg': {
            width: '12px',
            height: '12px',
            color: '#000'
        },
        '&:hover': {
            backgroundColor: 'transparent !important'
        },
        '@media (max-width: 600px)': {
            width: '100%',
        }
    }
});

interface SelectAssetProps {
    type: string;
    asset: Asset;
}

const SelectAsset: FC<SelectAssetProps> = ({ type, asset }) => {
    const classes = useStyles();

    return (
        <Box className={classes.assetContainer}>
            <Box className={classes.assetDetail}>
                <Typography className={classes.typography}>{type}</Typography>
                <Typography className={classes.typography}>
                    <span>Balance</span> {asset.balance.toFixed(2)}
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