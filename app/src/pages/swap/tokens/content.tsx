import React, { FC, useEffect, useState } from 'react';
import { makeStyles } from '@mui/styles';
import {
    Box,
    Typography,
    InputBase,
    IconButton
} from '@mui/material';

import { Asset } from '../../../interfaces';
import Empty from '../../../assets/images/empty.png';

const useStyles = makeStyles({
    inputBase: {
        borderRadius: '24px',
        padding: '2px',
        background: 'linear-gradient(270deg,rgba(0,255,183,.5),rgba(0,191,255,.5) 50%,rgba(255,26,127,.5))',
        '& input': {
            background: '#000',
            borderRadius: '24px',
            color: '#f1f1f2',
            fontFamily: 'Rubik, sans-serif',
            padding: '8px 16px',
            width: '300px',
            '@media (max-width: 600px)': {
                width: '100%'
            }
        }
    },
    typography: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontFamily: 'Rubik, sans-serif !important',
        fontSize: '14px !important',
        lineHeight: '17px !important',
        padding: '20px 0'
    },
    tokenWrapper: {
        display: 'flex',
        alignItems: 'flex-start',
        flexDirection: 'column',
        padding: '0 8px'
    },
    iconButton: {
        padding: '8px 0 !important',
        color: '#FFF !important',
        fontFamily: 'Rubik, sans-serif !important',
        fontSize: '16px !important',
        fontWeight: '500',
        letterSpacing: '2px',
        '& img': {
            width: '30px',
            height: '30px',
            marginRight: '8px'
        },
        '&:first-of-type': {
            paddingTop: '0 !important'
        },
        '&:last-of-type': {
            paddingBottom: '0 !important'
        }
    },
    noTokens: {
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        '& img': {
            width: '60px',
            height: '60px',
            marginBottom: '20px'
        },
        '& p': {
            color: '#FFF !important',
            fontFamily: 'Rubik, sans-serif !important',
            fontSize: '16px !important',
            fontWeight: '500',
        }
    }
})

interface ContentProps {
    assetList: Array<Asset>;
    setAsset(asset: Asset): void;
}

const Content: FC<ContentProps> = ({ assetList, setAsset }) => {
    const classes = useStyles();
    const [search, setSearch] = useState('');
    const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);

    useEffect(() => {
        const tempAssets = assetList.filter(asset => asset.symbol.toLowerCase().includes(search.toLowerCase()));
        setFilteredAssets(tempAssets);
    }, [assetList, search]);

    return (
        <>
            <InputBase
                className={classes.inputBase}
                value={search}
                onChange={(
                    event: React.ChangeEvent<HTMLInputElement>
                ) => setSearch(event.target.value)}
            />
            <Typography className={classes.typography}>
                Token List
            </Typography>

            {filteredAssets.length > 0 && (
                <Box className={classes.tokenWrapper}>
                    {filteredAssets.map((asset, index) => (
                        <IconButton
                            className={classes.iconButton}
                            key={index}
                            onClick={() => setAsset(asset)}
                            disableRipple
                        >
                            <img src={asset.icon} alt="Asset" />
                            {asset.symbol}
                        </IconButton>
                    ))}
                </Box>
            )}

            {filteredAssets.length === 0 && (
                <Box className={classes.noTokens}>
                    <img src={Empty} alt="Empty" />
                    <Typography>No Data</Typography>
                </Box>
            )}
        </>
    )
}

export default Content;