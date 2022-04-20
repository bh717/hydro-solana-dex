import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import { Network, useNetworkProvider } from "./NetworkProvider";

export function NetworkSelector(props: any) {
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
      <InputLabel id="demo-select-small">Network</InputLabel>
      <Select
        {...props}
        labelId="demo-simple-select-label"
        id="demo-simple-select"
        value={network}
        label="Network"
        onChange={handleChange}
      >
        {networks.map(({ name, network }) => (
          <MenuItem key={network} value={network}>
            {name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
