import { Box, MenuItem, Select, SelectChangeEvent, Stack } from "@mui/material";
import { Asset } from "../types";

export function AssetSelector({
  assets,
  selected,
  onChange,
}: {
  selected?: Asset;
  onChange: (asset: Asset) => void;
  assets: Asset[];
}) {
  const handleChange = (e: SelectChangeEvent<string>) => {
    const [selectedAsset] = assets.filter((a) => a.symbol === e.target.value);
    if (selectedAsset) onChange(selectedAsset);
  };
  return (
    <Select value={selected?.symbol ?? "Select"} onChange={handleChange}>
      {selected?.symbol ? null : <MenuItem value={"Select"}>Select</MenuItem>}
      {assets.map((a: Asset) => {
        return (
          <MenuItem key={a.symbol} value={a.symbol}>
            <Stack direction="row">
              <Box width={"20px"} height={"16px"}>
                <img height="16" src={a.logoURI} alt={a.symbol} />
              </Box>
              <Box>{a.symbol}</Box>
            </Stack>
          </MenuItem>
        );
      })}
    </Select>
  );
}
