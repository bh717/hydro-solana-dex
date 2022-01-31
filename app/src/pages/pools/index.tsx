import React, { useState } from 'react';
import { makeStyles } from '@mui/styles';
import { Box, Typography } from "@mui/material";
import cn from 'classnames';

import { Hydraswap, Lock, Volume, Deposit, CaretDown } from "../../components/icons";
import Banner from "../../assets/images/pools/banner.png";
import PoolsContent from './poolsContent';

const useStyles = makeStyles({
    poolsContainer: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '1100px',
    },
    poolsBanner: {
        background: '#FFFFFF05',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        height: '200px',
        width: '100%',
        '@media (max-width: 800px)': {
            flexDirection: 'column',
            height: 'initial',
            padding: '20px 24px',
            width: 'calc(100% - 48px)'
        }
    },
    bannerLeft: {
        backgroundImage: `url(${Banner})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% 100%',
        flexGrow: 1,
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        height: '100%',
        '@media (max-width: 800px)': {
            background: 'none',
            justifyContent: 'center',
            width: '100%',
            paddingBottom: '20px'
        },
        '@media (max-width: 600px)': {
            justifyContent: 'flex-start',
            paddingBottom: '0'
        }
    },
    bannerIcon: {
        position: 'relative',
        padding: '12px',
        margin: '0 50px',
        '& > svg': {
            width: '97px !important',
            height: '93px !important'
        },
        '&::before': {
            content: "''",
            position: 'absolute',
            width: '80%',
            height: '80%',
            top: '10%',
            left: '10%',
            background: 'linear-gradient(226deg, #2FE4C9 15.08%, #39B5F1 29.84%, #6C83E1 56.57%, #CF489D 86.03%)',
            opacity: '0.4',
            filter: 'blur(24px)'
        },
        '@media (max-width: 1400px)': {
            margin: '0 20px',
            '& > svg': {
                width: '78px !important',
                height: '75px !important'
            }
        },
        '@media (min-width: 801px) and (max-width: 1100px)': {
            display: 'none'
        },
        '@media (max-width: 600px)': {
            display: 'none'
        }
    },
    bannerTitle: {
        maxWidth: '250px',
        '& > p': {
            lineHeight: '24px !important',
            '&:first-of-type': {
                color: '#19CE9D',
                fontSize: '32px !important',
                fontWeight: '700 !important',
                marginBottom: '24px',
                '& svg': {
                    color: '#FFFFFF40',
                    width: '20px',
                    height: '20px'
                }
            },
            '&:last-of-type': {
                color: '#FFF',
                fontSize:' 16px !important'
            }
        },
        '@media (max-width: 1150px)': {
            maxWidth: '200px'
        },
        '@media (max-width: 1100px)': {
            paddingLeft: '20px'
        },
        '@media (max-width: 800px)': {
            maxWidth: 'initial',
            padding: '0 24px',
            '& > p': {
                '&:first-of-type': {
                    marginBottom: '16px !important'
                }
            }
        },
        '@media (max-width: 600px)': {
            padding: 0
        }
    },
    bannerRight: {
        display: 'flex',
        alignItems: 'center',
        paddingRight: '39px',
        '@media (max-width: 1400px)': {
            paddingRight: '9px'
        },
        '@media (max-width: 800px)': {
            borderTop: '1px solid #FFFFFF05',
            paddingTop: '20px',
            justifyContent: 'space-around',
            width: '100%'
        },
        '@media (max-width: 600px)': {
            display: 'none',
            paddingRight: 0,
            marginTop: '20px'
        }
    },
    showStatus: {
        display: 'flex'
    },
    reportItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '0 22px',
        '& > svg': {
            width: '32px !important',
            height: '32px !important',
            marginBottom: '10px'
        },
        '& > p': {
            lineHeight: '24px',
            '&:first-of-type': {
                color: '#FFFFFFA6',
                fontSize: '14px'
            },
            '&:last-of-type': {
                color: '#FFF',
                fontSize: '24px',
                fontWeight: '500'
            }
        },
        '&:first-of-type': {
            marginLeft: '11px'
        },
        '&:last-of-type': {
            marginRight: '11px'
        },
        '@media (max-width: 1250px)': {
            margin: '0 11px',
            '& > svg': {
                width: '23px !important',
                height: '23px !important'
            },
            '& > p': {
                lineHeight: '20px',
                '&:first-of-type': {
                    fontSize: '12px !important',
                },
                '&:last-of-type': {
                    fontSize: '20px !important',
                }
            }
        },
        '@media (max-width: 960px)': {
            margin: '0 5px',
            '& > p': {
                '&:last-of-type': {
                    fontSize: '16px !important',
                }
            }
        },
        '@media (max-width: 600px)': {
            margin: 0,
            '& > p': {
                '&:first-of-type': {
                    fontSize: '10px !important',
                    lineHeight: '12px',
                    marginBottom: '5px'
                },
                '&:last-of-type': {
                    fontSize: '12px !important',
                    lineHeight: '15px'
                }
            }
        }
    },
    poolsContent: {

    }
})

const Pools = () => {
    const classes = useStyles();

    const [showPoolsStatus, setShowPoolsStatus] = useState(false);

    return (
        <Box className={classes.poolsContainer}>
            <Box className={classes.poolsBanner}>
                <Box className={classes.bannerLeft}>
                    <Box className={classes.bannerIcon}>
                        <Hydraswap />
                    </Box>
                    <Box className={classes.bannerTitle}>
                        <Typography>
                            Pools <CaretDown onClick={() => setShowPoolsStatus(!showPoolsStatus)} />
                        </Typography>
                        <Typography>Providing liquidity can earn swap fee and farm income.</Typography>
                    </Box>
                </Box>
                <Box className={cn(classes.bannerRight, {[classes.showStatus]: showPoolsStatus})}>
                    <Box className={classes.reportItem}>
                        <Lock />
                        <Typography>Total Value Locked</Typography>
                        <Typography>$12.56 m</Typography>
                    </Box>
                    <Box className={classes.reportItem}>
                        <Volume />
                        <Typography>Total 24H Volume</Typography>
                        <Typography>$24.16 m</Typography>
                    </Box>
                    <Box className={classes.reportItem}>
                        <Deposit />
                        <Typography>Your Deposits</Typography>
                        <Typography>$467,123.5201</Typography>
                    </Box>
                </Box>
            </Box>

            <PoolsContent />
        </Box>
    )
}

export default Pools;