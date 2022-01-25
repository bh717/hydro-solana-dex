import React from 'react';
import { makeStyles } from '@mui/styles';
import {
    Box,
    Button, Menu, MenuItem,
    Typography
} from '@mui/material';

import { CaretDown } from '../../../../../components/icons';

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
        padding: '32px 23px'
    },
    sortContainer: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '24px',
        '& > .MuiTypography-root': {
            color: '#FFFFFFA6',
            fontSize: '14px',
            lineHeight: '24px',
            marginRight: '4px'
        },
        '& > .MuiButton-root': {
            color: '#FFFFFFA6',
            padding: 0,
            margin: '0 16px',
            minWidth: 'initial',
            '& span': {
                marginRight: '2px',
                fontWeight: '400',
                textTransform: 'capitalize',
                lineHeight: '24px'
            },
            '& .MuiTouchRipple-root': {
                display: 'none'
            },
            '&:first-of-type': {
                marginLeft: 0
            },
            '&:last-of-type': {
                marginRight: 0
            },
            '&:hover': {
                backgroundColor: 'transparent'
            }
        }
    },
    sortBy: {
        width: '12px',
        height: '12px',
        position: 'relative',
        '& > svg': {
            position: 'absolute',
            width: '8px !important',
            height: '4px !important',
            top: '8px',
            left: '2px',
            '&.caretUp': {
                transform: 'rotate(180deg)',
                top: '2px'
            }
        }
    },
    menuContainer: {
        '& > p': {
            color: '#FFFFFFA6',
            fontSize: '14px',
            lineHeight: '24px',
            marginBottom: '12px'
        }
    },
    menuButton: {
        backgroundColor: '#FFFFFF0A !important',
        border: '1px solid #FFFFFF0F !important',
        alignItems: 'center !important',
        justifyContent: 'space-between !important',
        padding: '13px 16px !important',
        width: '100%',
        '& span': {
            color: '#FFFFFFD9',
            fontSize: '18px',
            lineHeight: '21px'
        },
        '& svg': {
            color: '#FFFFFF40',
            marginTop: '3px',
            width: '16px !important',
            height: '8px !important'
        }
    },
    menuContent: {
        '& .MuiMenu-paper': {
            backgroundColor: '#354051',
            borderRadius: '4px',
            marginTop: '4px',
            width: 'calc(100% - 78px)',
            '& .MuiMenu-list': {
                padding: 0,
                '& .MuiMenuItem-root': {
                    color: '#FFFFFFA6',
                    fontSize: '18px',
                    lineHeight: '24px',
                    padding: '12px 16px',
                    '&:hover': {
                        background: '#FFFFFF0A'
                    }
                }
            }
        }
    }
})

const Content = () => {
    const classes = useStyles();

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <>
            <Typography className={classes.contentTitle}>Settings</Typography>
            <Box className={classes.contentWrapper}>
                <Box className={classes.sortContainer}>
                    <Typography>Sort by:</Typography>
                    <Button>
                        <span>Liquidity</span>
                        <Box className={classes.sortBy}>
                            <CaretDown className="caretUp" />
                            <CaretDown />
                        </Box>
                    </Button>
                    <Button>
                        <span>Volume</span>
                        <Box className={classes.sortBy}>
                            <CaretDown className="caretUp" />
                            <CaretDown />
                        </Box>
                    </Button>
                    <Button>
                        <span>APR</span>
                        <Box className={classes.sortBy}>
                            <CaretDown className="caretUp" />
                            <CaretDown />
                        </Box>
                    </Button>
                </Box>
                <Box className={classes.menuContainer}>
                    <Typography>APR Basis</Typography>
                    <Button
                        className={classes.menuButton}
                        onClick={handleClick}
                    >
                        <span>7D</span>
                        <CaretDown />
                    </Button>
                    <Menu
                        className={classes.menuContent}
                        anchorEl={anchorEl}
                        open={open}
                        onClose={handleClose}
                    >
                        <MenuItem onClick={handleClose}>24H</MenuItem>
                        <MenuItem onClick={handleClose}>7D</MenuItem>
                        <MenuItem onClick={handleClose}>30D</MenuItem>
                    </Menu>
                </Box>
            </Box>
        </>
    )
}

export default Content;