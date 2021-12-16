import { FC } from 'react';
import {
    ListItemButton,
    ListItemIcon,
    ListItemText
} from '@mui/material';

interface ListItemProps {
    icon: JSX.Element;
    name: string;
}

const ListItem: FC<ListItemProps> = ({ icon, name }) => {
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