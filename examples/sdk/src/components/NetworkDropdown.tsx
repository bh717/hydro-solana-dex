import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { Network } from "hydra-ts";
import { useNetworkProvider } from "./NetworkProvider";

export function NetworkDropdown(props: any) {
  const { networks, setNetwork, network } = useNetworkProvider();

  const handleChange = (event: SelectChangeEvent) => {
    setNetwork(event.target.value as Network);
  };

  return (
    <FormControl
      variant="filled"
      sx={{ m: 1, minWidth: 120, background: "white" }}
      size="small"
    >
      <InputLabel>Network</InputLabel>
      <Select value={network} label="Network" onChange={handleChange}>
        {networks.map(({ name, network }) => (
          <MenuItem key={network} value={network}>
            {name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
