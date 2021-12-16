import { FC, useState, useEffect } from 'react';
import { makeStyles } from '@mui/styles';
import {
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Collapse
} from '@mui/material';
import cn from 'classnames';

import { Down, Up } from '../../icons';
import Preview from '../../../assets/images/preview.png';

const useStyles = makeStyles({
    collapse: {
        '& .MuiListItemButton-root': {
            paddingLeft: '56px',
            position: 'relative',
            '& .MuiListItemText-root': {
                margin: '0 !important',
                '& span': {
                    fontSize: '13px !important'
                },
            },
            '& img': {
                position: 'absolute',
                width: '46px',
                left: '150px',
                top: '2px'
            },
            '&:hover': {
                '& .MuiListItemText-root': {
                    '& span': {
                        color: '#07ebad !important'
                    }
                }
            }
        },
        '&.minized': {
            '& .MuiList-root': {
                background: '#0F1C29',
                padding: '0 8px',
                '& .MuiListItemButton-root': {
                    padding: '8px 0 !important',
                    borderBottom: '1px solid #1B2934',
                    '&:last-of-type': {
                        border: 'none'
                    },
                    '& .MuiListItemText-root': {
                        margin: '0 !important',
                        '& span': {
                            fontSize: '12px !important'
                        },
                    },
                    '& img': {
                        display: 'none'
                    }
                }
            }
        }
    }
})

interface ListItem {
    name: string;
    preview?: boolean;
}

interface ListItemCollapsibleProps {
    icon: JSX.Element;
    name: string;
    childs: Array<ListItem>,
    isCollapsed: boolean;
    isMobile: boolean;
}

const ListItemCollapsible: FC<ListItemCollapsibleProps> = ({
    icon,
    name,
    childs,
    isCollapsed,
    isMobile
}) => {
    const classes = useStyles();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if(isCollapsed)
            setOpen(true);
    }, [isCollapsed]);

    const handleExpand = () => {
        if(!isCollapsed || isMobile)
            setOpen(!open);
    }
    
    return (
        <>
            <ListItemButton onClick={handleExpand}>
                <ListItemIcon>
                    {icon}
                </ListItemIcon>
                <ListItemText primary={name} />
                {(!isCollapsed && open) ? <Up /> : <Down />}
            </ListItemButton>
            <Collapse className={cn(classes.collapse, {'minized': isCollapsed && !isMobile})} in={open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    {childs.map((child: ListItem, index: number) => {
                        return (
                            <ListItemButton sx={{ pl: 4 }} key={index}>
                                <ListItemText primary={child.name} />
                                {child.preview && <img src={Preview} alt="Preview" />}
                            </ListItemButton>
                        )
                    })}
                </List>
            </Collapse>
        </>
    )
}

export default ListItemCollapsible;