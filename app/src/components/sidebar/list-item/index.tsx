import { FC } from 'react';
import {
    ListItemButton,
    ListItemIcon,
    ListItemText
} from '@mui/material';

interface ListItemProps {
    name: string;
    icon: JSX.Element;
}

const ListItem: FC<ListItemProps> = ({ name, icon }) => {
    return (
        <ListItemButton>
            <ListItemIcon>
                {icon}
            </ListItemIcon>
            <ListItemText primary={name} />
        </ListItemButton>
    )
}

export default ListItem;