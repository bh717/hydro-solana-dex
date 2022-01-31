import { FC, useState, useEffect } from "react";
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
    Menu as MenuHandler,
    Trading,
    ActiveTrading,
    Swap,
    ActiveSwap,
    Pools,
    ActivePools,
    Stake,
    ActiveStake,
    Network,
    Doc,
    Bars,
    Share,
    Twitter,
    Telegram,
    Speaker,
    Medium,
    Discord
} from '../icons';
import ListItem from './listItem';
import { WalletButton } from '../wallet';
import SelectRPCModal from './modals/selectRPC';
import { RPC } from '../../interfaces';

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
    mobileActionWrapper: {

    },
    menuHandler: {
        padding: '0 !important',
        marginLeft: '16px !important',
        '& svg': {
            fill: '#FFFFFFD9',
            width: '22px !important',
            height: '17px !important'
        }
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
                },
                '&.active': {
                    '& span': {
                        color: '#19CE9D'
                    }
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
        padding: '24px 24px',
        position: 'relative',
        '& .MuiLink-root': {
            color: '#FFFFFF73',
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px',
            padding: '5px 6px',
            margin: '5px 0',
            width: 'calc(100% - 14px)',
            justifyContent: 'center',
            '& svg': {
                width: '20px',
                height: '20px',
                margin: '0 10px 0 0'
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
        height: '41px',
        width: '192px',
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
                boxSizing: 'content-box',
                justifyContent: 'flex-start',
                '& svg': {
                    marginLeft: '2.5px'
                },
                '& span': {
                    whiteSpace: 'nowrap',
                    marginRight: '2.5px'
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
        width: '192px',
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
        padding: '5px 6px',
        position: 'absolute',
        width: 'calc(100% - 14px)',
        '& .MuiLink-root': {
            border: 'none',
            width: 'initial',
            padding: '0',
            margin: '0',
            '& svg': {
                margin: '0 10px',
            },
            '&:first-of-type': {
                '& svg': {
                    marginLeft: 0
                }
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
                marginLeft: '2.5px',
                marginRight: '10px'
            },
            '& .MuiLink-root': {
                '&:first-of-type': {
                    '& svg': {
                        marginLeft: '10px'
                    }
                },
                '&:last-of-type': {
                    '& svg': {
                        marginRight: '2.5px'
                    }
                }
            }
        }
    },
    bottomLinks: {
        margin: '0 24px',
        '& .MuiListItemButton-root': {
            padding: '12px 0',
            '&:first-of-type': {
                borderTop: '1px solid #FFFFFF0A',
                borderBottom: '1px solid #FFFFFF0A'
            }
        }
    }
})

const SidebarItems = [
    {
        name: 'Trading',
        icon: <Trading />,
        activeIcon: <ActiveTrading />,
        link: '#'
    },
    {
        name: 'Swap',
        icon: <Swap />,
        activeIcon: <ActiveSwap />,
        link: '/swap'
    },
    {
        name: 'Pools',
        icon: <Pools />,
        activeIcon: <ActivePools />,
        link: '/pools'
    },
    {
        name: 'Stake',
        icon: <Stake />,
        activeIcon: <ActiveStake />,
        link: '/stake'
    }
]

interface SidebarProps {
    openWalletModal(): void;
    address: string;
    rpc: RPC;
    changeRPC(value: RPC): void;
    networks: Array<RPC>;
}

const Sidebar: FC<SidebarProps> = ({ openWalletModal, address, rpc, changeRPC, networks }) => {
    const classes = useStyles();
    const [open, setOpen] = useState(true);
    const [mobile, setMobile] = useState(false);
    const [openRPCModal, setOpenRPCModal] = useState(false);

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
        <>
            <MuiDrawer className={cn(classes.drawer, {'collapsed': !open && !mobile, 'expanded': !open && mobile})} variant="permanent">
                <List
                    className={cn(classes.list, {'collapsed': !open && !mobile, 'expanded': !open && mobile})}
                    component="nav"
                    subheader={
                        <ListSubheader className={cn(classes.drawerHeader, {'collapsed': !open && !mobile, 'expanded': !open && mobile})} component="div">
                            {(open || mobile) && <img src={Logo} alt="Hydraswap" />}
                            {(!open && !mobile) && <img src={LogoSM} alt="Hydraswap" />}
                            {mobile && (
                                <Box className={classes.mobileActionWrapper}>
                                    <WalletButton openWalletModal={openWalletModal} />
                                    <IconButton className={classes.menuHandler} onClick={handleDrawer}>
                                        <MenuHandler />
                                    </IconButton>
                                </Box>
                            )}
                        </ListSubheader>
                    }
                >
                    {SidebarItems.map((item, index) => (
                        <ListItem
                            icon={item.icon}
                            activeIcon={item.activeIcon}
                            name={item.name}
                            link={item.link}
                            key={index}
                        />
                    ))}
                    {mobile && (
                        <Box className={classes.bottomLinks}>
                            <ListItem
                                icon={<Network />}
                                name={rpc.name}
                                onClick={() => setOpenRPCModal(true)}
                            />
                            <ListItem icon={<Doc />} name="Test Guide" />
                            <ListItem icon={<Bars />} name="Docs" />
                        </Box>
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
                            <Link component="button" underline="none" onClick={() => setOpenRPCModal(true)}>
                                <Network /><Typography variant="body2" component="span">{rpc.name}</Typography>
                            </Link>
                        </Box>
                    )}
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
                                <Bars /><Typography variant="body2" component="span">Paper & Docs</Typography>
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
            <SelectRPCModal
                open={openRPCModal}
                onClose={() => setOpenRPCModal(false)}
                rpc={rpc}
                changeRPC={changeRPC}
                networks={networks}
            />
        </>
    )
}

export default Sidebar;