import { FC } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material";

interface ListItemProps {
  name: string;
  icon: JSX.Element;
  activeIcon?: JSX.Element;
  link?: string;
  onClick?(): void;
}

const ListItem: FC<ListItemProps> = ({
  name,
  icon,
  activeIcon,
  link,
  onClick,
}) => {
  let location = useLocation();
  let navigate = useNavigate();

  const navigatePage = () => {
    if (link) {
      navigate(link, { replace: true });
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <ListItemButton onClick={navigatePage}>
      <ListItemIcon>
        {location.pathname === link ? activeIcon : icon}
      </ListItemIcon>
      <ListItemText
        className={`${location.pathname === link ? "active" : ""}`}
        primary={name}
      />
    </ListItemButton>
  );
};

export default ListItem;
