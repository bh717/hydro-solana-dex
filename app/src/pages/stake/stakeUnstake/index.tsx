import React, { FC, useState } from 'react';
import { makeStyles } from '@mui/styles';
import {
    Box,
    Tabs,
    Tab,
    Typography
} from '@mui/material';

import TabPanel from './tabPanel';

const useStyles = makeStyles({
    stakeContainer: {
        background: 'linear-gradient(180deg, rgba(41, 255, 200, 0.25) 0%, rgba(1, 207, 237, 0) 100%)',
        borderRadius: '6px',
        padding: '2px'
    },
    stakeContent: {
        background: '#292c39',
        borderRadius: '4px'
    },
    contentHeader: {
        padding: '0 31px 0 19px',
        borderBottom: '1px solid #FFFFFF0F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        '@media (max-width: 600px)': {
            padding: '0 23px 0 11px'
        }
    },
    optionTabs: {
        '& .MuiTabs-scroller': {
            '& .MuiTabs-flexContainer': {
                '& .MuiTab-root': {
                    color: '#FFFFFFA6 !important',
                    fontSize: '20px !important',
                    lineHeight: '24px !important',
                    padding: '19px 12px !important',
                    minWidth: 'initial !important',
                    maxWidth: 'initial !important',
                    textTransform: 'capitalize !important',
                    '&.Mui-selected': {
                        color: '#19CE9D !important'
                    },
                    '& span': {
                        display: 'none'
                    }
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
        }
    },
    stakePercent: {
        display: 'flex',
        alignItems: 'center',
        '& > p': {
            '&:first-of-type': {
                color: '#FFFFFFA6',
                fontSize: '14px !important',
                lineHeight: '17px !important',
                marginRight: '4px'
            },
            '&:last-of-type': {
                color: '#19CE9D',
                fontSize: '20px !important',
                lineHeight: '24px !important'
            }
        }
    }
})

interface StakeUnstakeProps {
    walletConnect(): void;
}

const StakeUnstake: FC<StakeUnstakeProps> = ({ walletConnect }) => {
    const classes = useStyles();

    const [tab, setTab] = useState(0);
    const [stakeAmount, setStakeAmount] = useState('0');
    const [unstakeAmount, setUnstakeAmount] = useState('0');

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setTab(newValue);
    };

    const handleAction = (type: string) => {
        console.log(type);
    }

    return (
        <Box className={classes.stakeContainer}>
            <Box className={classes.stakeContent}>
                <Box className={classes.contentHeader}>
                    <Tabs
                        className={classes.optionTabs}
                        value={tab}
                        onChange={handleChange}
                        TabIndicatorProps={{ children: <span className="MuiTabs-indicatorSpan" /> }}
                    >
                        <Tab label="Stake" />
                        <Tab label="Unstake" />
                    </Tabs>
                    <Box className={classes.stakePercent}>
                        <Typography>APR:</Typography>
                        <Typography>59%</Typography>
                    </Box>
                </Box>
                {tab === 0 && (
                    <TabPanel
                        type={'stake'}
                        balance={'890,240,380.5219'}
                        amount={stakeAmount}
                        setAmount={setStakeAmount}
                        onWalletConnect={walletConnect}
                        onAction={handleAction}
                    />
                )}
                {tab === 1 && (
                    <TabPanel
                        type={'unstake'}
                        balance={'890,240,380.5219'}
                        amount={unstakeAmount}
                        setAmount={setUnstakeAmount}
                        onWalletConnect={walletConnect}
                        onAction={handleAction}
                    />
                )}
            </Box>
        </Box>
    )
}

export default StakeUnstake;