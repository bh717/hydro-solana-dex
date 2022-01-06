import { useState, useEffect } from "react";
import { makeStyles } from '@mui/styles';
import MuiDrawer from '@mui/material/Drawer';
import {
    List,
    ListSubheader,
    Box,
    IconButton,
    Link,
    Typography
} from '@mui/material';
import cn from 'classnames';

import Logo from '../../assets/images/logo.png';
import LogoSM from '../../assets/images/logo_sm.png';
import Collapse from '../../assets/images/collapse.png';
import Expand from '../../assets/images/expand.png';
import {
    MenuOpen,
    MenuClose,
    Trading,
    ActiveTrading,
    Swap,
    ActiveSwap,
    Pools,
    ActivePools,
    Stake,
    ActiveStake,
    Doc,
    List as Menu,
    Share,
    Twitter,
    Telegram,
    Speaker,
    Medium,
    Discord
} from '../icons';
import ListItem from './list-item';

const useStyles = makeStyles({
    drawer: {
        height: '100%',
        width: '240px',
        '& .MuiDrawer-paper': {
            background: '#262936',
            borderRight: 'none',
            width: '100%',
            height: '100vh',
            position: 'static',
            justifyContent: 'space-between',
            overflow: 'visible'
        },
        '&.collapsed': {
            width: '104px'
        },
        '&.expanded': {
            '& .MuiDrawer-paper': {
                position: 'fixed'
            }
        },
        '@media (max-width:600px)': {
            width: '100%',
            height: '60px',
            overflow: 'hidden'
        }
    },
    drawerHeader: {
        backgroundColor: 'transparent !important',
        borderBottom: '1px solid #FFFFFF0A',
        lineHeight: 'initial !important',
        padding: '24px !important',
        display: 'flex',
        '& img': {
            height: '36px'
        },
        '&.collapsed': {
            justifyContent: 'center',
            padding: '12px 16px !important',
        },
        '@media (max-width:600px)': {
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px !important',
            height: '60px',
            '& img': {
                width: '150px'
            }
        }
    },
    mobileHandler: {
        padding: '0 !important'
    },
    list: {
        '& *': {
            transition: 'width .3s !important',
            color: '#FFFFFF73'
        },
        '& .MuiListItemButton-root': {
            padding: '12px 24px',
            '& .MuiListItemIcon-root': {
                minWidth: 'initial',
                '& svg': {
                    width: '28px',
                    height: '28px',
                    marginRight: '8px'
                }
            },
            '& .MuiListItemText-root': {
                marginTop: 0,
                marginBottom: 0,
                '& span': {
                    fontSize: '16px',
                    lineHeight: '28px'
                }
            },
            '&:hover': {
                '& *': {
                    color: '#FFF'
                }
            }
        },
        '&.collapsed': {
            '& .MuiListItemButton-root': {
                flexDirection: 'column',
                '& .MuiListItemIcon-root': {
                    '& svg': {
                        marginRight: 0,
                        marginBottom: '8px'
                    }
                }
            }
        }
    },
    links: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px',
        position: 'relative',
        '& .MuiLink-root': {
            color: '#FFFFFF73',
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px',
            padding: '5px 10px',
            margin: '10px 0',
            width: 'calc(100% - 22px)',
            justifyContent: 'center',
            '& svg': {
                width: '20px',
                height: '20px',
                margin: '0 10px'
            },
            '&:hover': {
                color: '#FFF'
            }
        },
        '&.expanded': {
            padding: '0 16px 8px'
        }
    },
    linkWrapper: {
        position: 'relative',
        height: '51px',
        width: '210px',
        '& .MuiLink-root': {
            position: 'absolute',
            justifyContent: 'flex-start'
        },
        '&.collapsed': {
            width: '38.5px',
            overflow: 'hidden',
            '& .MuiLink-root': {
                border: '1px solid hsla(0,0%,100%,.5)',
                borderRadius: '15px',
                justifyContent: 'flex-start',
                '& svg': {
                    marginLeft: '-1px'
                },
                '& span': {
                    whiteSpace: 'nowrap'
                }
            },
            '&:hover': {
                overflow: 'visible',
                '& .MuiLink-root': {
                    width: 'initial'
                }
            }
        }
    },
    handler: {
        padding: '0 !important',
        position: 'absolute !important' as any,
        width: '12px',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        '& img': {
            width: '100%'
        }
    },
    socialWrapper: {
        position: 'relative',
        height: '50px',
        width: '210px',
        '&.collapsed': {
            width: '39px',
            overflow: 'hidden',
            '&:hover': {
                overflow: 'visible',
                '& .MuiBox-root': {
                    width: 'initial'
                }
            }
        }
    },
    social: {
        display: 'flex',
        margin: '10px 0',
        padding: '5px 10px',
        position: 'absolute',
        width: 'calc(100% - 22px)',
        '& .MuiLink-root': {
            border: 'none',
            width: 'initial',
            padding: '0',
            margin: '0',
            '& svg': {
                margin: '0 10px',
            },
            '&:last-of-type': {
                '& svg': {
                    marginRight: 0
                }
            }
        },
        '& > svg': {
            color: 'hsla(0,0%,100%,.5)',
            marginRight: '20px',
            width: '20px',
            height: '20px',
            cursor: 'pointer'
        },
        '&.collapsed': {
            border: '1px solid hsla(0,0%,100%,.5)',
            borderRadius: '15px',
            '& > svg': {
                marginLeft: '-1px',
                marginRight: '10px'
            }
        }
    }
})

const SidebarItems = [
    {
        name: 'Trading',
        icon: <Trading />,
        activeIcon: <ActiveTrading />
    },
    {
        name: 'Swap',
        icon: <Swap />,
        activeIcon: <ActiveSwap />
    },
    {
        name: 'Pools',
        icon: <Pools />,
        activeIcon: <ActivePools />
    },
    {
        name: 'Stake',
        icon: <Stake />,
        activeIicon: <ActiveStake />,
    }
]

const Sidebar = () => {
    const classes = useStyles();
    const [open, setOpen] = useState(true);
    const [mobile, setMobile] = useState(false);

    useEffect(() => {
        // Windows Resize Handler
        function handleResize() {
            setOpen(window.innerWidth > 900 || window.innerWidth <= 600);
            setMobile(window.innerWidth <= 600);
        }

        // Add event listener
        window.addEventListener("resize", handleResize);

        handleResize();

        // Remove event listener on cleanup
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleDrawer = () => {
        setOpen(!open);
    }

    return (
        <MuiDrawer className={cn(classes.drawer, {'collapsed': !open && !mobile, 'expanded': !open && mobile})} variant="permanent">
            <List
                className={cn(classes.list, {'collapsed': !open && !mobile, 'expanded': !open && mobile})}
                component="nav"
                subheader={
                    <ListSubheader className={cn(classes.drawerHeader, {'collapsed': !open && !mobile, 'expanded': !open && mobile})} component="div">
                        {(open || mobile) && <img src={Logo} alt="Hydraswap" />}
                        {(!open && !mobile) && <img src={LogoSM} alt="Hydraswap" />}
                        {mobile && (
                            <IconButton className={classes.mobileHandler} onClick={handleDrawer}>
                                {open ? <MenuClose /> : <MenuOpen />}
                            </IconButton>
                        )}
                    </ListSubheader>
                }
            >
                {SidebarItems.map((item, index) => (
                    <ListItem icon={item.icon} name={item.name} key={index} />
                ))}
                {mobile && (
                    <>
                        <ListItem icon={<Doc />} name="Test Guide" />
                        <ListItem icon={<Menu />} name="Docs" />
                    </>
                )}
            </List>
            {!mobile && (
                <IconButton className={classes.handler} onClick={handleDrawer}>
                    {open ? <img src={Collapse} alt="Menu" /> : <img src={Expand} alt="Menu" />}
                </IconButton>
            )}
            <Box className={cn(classes.links, {'collapsed': !open && !mobile, 'expanded': !open && mobile})}>
                {!mobile && (
                    <Box className={cn(classes.linkWrapper, {'collapsed': !open && !mobile})}>
                        <Link href="https://hydraswap.gitbook.io/hydra-beta-testing-guide" underline="none">
                            <Doc /><Typography variant="body2" component="span">Test Guide</Typography>
                        </Link>
                    </Box>
                )}
                {!mobile && (
                    <Box className={cn(classes.linkWrapper, {'collapsed': !open && !mobile})}>
                        <Link href="https://hydraswap.gitbook.io/hydraswap-gitbook/" underline="none">
                            <Menu /><Typography variant="body2" component="span">Paper & Docs</Typography>
                        </Link>
                    </Box>
                )}
                <Box className={cn(classes.socialWrapper, {'collapsed': !open && !mobile})}>
                    <Box className={cn(classes.social, {'collapsed': !open && !mobile})}>
                        {(!open && !mobile) && <Share />}
                        <Link href="https://twitter.com/HydraSwap_io" underline="none">
                            <Twitter />
                        </Link>
                        <Link href="https://t.me/hydraswap" underline="none">
                            <Telegram />
                        </Link>
                        <Link href="https://t.me/hydraswap_ANN" underline="none">
                            <Speaker />
                        </Link>
                        <Link href="https://medium.com/@HydraSwap" underline="none">
                            <Medium />
                        </Link>
                        <Link href="https://discord.gg/AA26dw6Hpm" underline="none">
                            <Discord />
                        </Link>
                    </Box>
                </Box>
            </Box>
        </MuiDrawer>
    )
}

export default Sidebar;