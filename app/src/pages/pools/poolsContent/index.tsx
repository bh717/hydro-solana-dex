import React, { useState } from 'react';
import { makeStyles } from '@mui/styles';
import { Box, Tabs, Tab } from '@mui/material';

import PoolsTab from './tabs/poolsTab';
import LiquidityTab from './tabs/liquidityTab';
import DoubleDipTab from './tabs/doubleDipTab';
import ClosedTab from "./tabs/closedTab";

const useStyles = makeStyles({
    poolsContent: {
        marginTop: '32px',
        '@media (max-width: 600px)': {
            margin: '12px'
        }
    },
    contentTabs: {
        borderBottom: '1px solid #FFFFFF0F',
        marginBottom: '14px',
        '& .MuiTabs-scroller': {
            '& .MuiTabs-flexContainer': {
                '& .MuiTab-root': {
                    color: '#FFFFFFA6',
                    fontSize: '16px',
                    fontWeight: 400,
                    lineHeight: '19px',
                    padding: 0,
                    margin: '12px 12px',
                    minWidth: 'initial',
                    minHeight: 'initial',
                    textTransform: 'capitalize',
                    '&.Mui-selected': {
                        color: '#19CE9D'
                    },
                    '& span': {
                        display: 'none'
                    },
                    '&:first-of-type': {
                        marginLeft: 0
                    },
                    '&:last-of-type': {
                        marginRight: 0
                    }
                },
                '@media (max-width: 600px)': {
                    justifyContent: 'space-between',
                    width: '100%'
                }
            },
            '& .MuiTabs-indicator': {
                display: 'flex',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                '& .MuiTabs-indicatorSpan': {
                    maxWidth: '32px',
                    width: '100%',
                    background: 'linear-gradient(88.14deg, #918EFF 16.49%, #19CE9D 86.39%)'
                }
            }
        },
        '@media (max-width: 600px)': {
            marginBottom: '6px'
        }
    }
})

const PoolsContent = () => {
    const classes = useStyles();

    const [tab, setTab] = useState(0);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setTab(newValue);
    };

    return (
        <Box className={classes.poolsContent}>
            <Tabs
                className={classes.contentTabs}
                value={tab}
                onChange={handleChange}
                TabIndicatorProps={{ children: <span className="MuiTabs-indicatorSpan" /> }}
            >
                <Tab label="Pools" />
                <Tab label="My liquidity" />
                <Tab label="Double Dip" />
                <Tab label="Closed" />
            </Tabs>
            {tab === 0 && <PoolsTab />}
            {tab === 1 && <LiquidityTab />}
            {tab === 2 && <DoubleDipTab />}
            {tab === 3 && <ClosedTab />}
        </Box>
    )
}

export default PoolsContent;