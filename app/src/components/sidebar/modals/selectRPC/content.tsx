import React, { FC } from 'react';
import { makeStyles } from '@mui/styles';
import {
    Box,
    Typography,
    Button
} from '@mui/material';

import { Check } from '../../../icons';
import { RPC } from '../../../../interfaces';

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
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 0px',
        '& > .MuiButton-root': {
            color: '#FFFFFFD9',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '18px !important',
            fontWeight: '400 !important',
            lineHeight: '21px !important',
            padding: '18px 19px !important',
            textTransform: 'capitalize !important' as any,
            '& > svg': {
                fill: '#19CE9D',
                width: '21px !important',
                height: '15px !important'
            },
            '& > .MuiTouchRipple-root': {
                display: 'none'
            },
            '&:hover': {
                backgroundColor: '#FFFFFF0F'
            }
        }
    }
})

const networks = [
    {
        id: 1,
        name: 'Solend Node 1'
    },
    {
        id: 2,
        name: 'Public Mainnet RPC'
    },
    {
        id: 3,
        name: 'Serum RPC'
    },
    {
        id: 4,
        name: 'RPCPool RPC'
    }
]

interface ContentProps {
    data: RPC;
    setData(value: RPC): void;
}

const Content: FC<ContentProps> = ({ data, setData }) => {
    const classes = useStyles();

    return (
        <>
            <Typography className={classes.contentTitle}>Select Environment</Typography>
            <Box className={classes.contentWrapper}>
                {networks.map((network, index) => (
                    <Button
                        key={index}
                        onClick={() => setData(network)}
                    >
                        <span>{network.name}</span>
                        {data.id === network.id && <Check />}
                    </Button>
                ))}
            </Box>
        </>
    )
}

export default Content;