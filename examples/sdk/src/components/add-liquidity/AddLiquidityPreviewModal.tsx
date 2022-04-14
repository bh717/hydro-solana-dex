import {
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  useMediaQuery,
  // DialogContent,
  // DialogContentText,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { toFormat } from "../../utils/toFormat";
import { Asset } from "../../types";
import { Box } from "@mui/system";

export function AddLiquidityPreviewModal({
  open,
  handleClose,
  tokenAAsset,
  tokenAAmount,
  tokenBAmount,
  tokenBAsset,
  handleSubmit,
}: {
  tokenAAsset: Asset;
  tokenAAmount: bigint;
  tokenBAsset: Asset;
  tokenBAmount: bigint;
  open: boolean;
  handleClose: () => void;
  handleSubmit: () => void;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={handleClose}
      aria-labelledby="responsive-dialog-title"
    >
      <DialogTitle id="responsive-dialog-title">
        <Box>Add liquidity</Box>
        <Box>
          TokenA:
          {toFormat(tokenAAmount, tokenAAsset.decimals)} {tokenAAsset.symbol}
        </Box>
        <Box>
          TokenB:
          {toFormat(tokenBAmount, tokenBAsset.decimals)} {tokenBAsset.symbol}
        </Box>
      </DialogTitle>

      <DialogActions>
        <Button autoFocus onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} autoFocus>
          Add Liquidity
        </Button>
      </DialogActions>
    </Dialog>
  );
}
