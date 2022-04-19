import { Alert, Dialog, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export function AddLiquidityErrorModal({
  open,
  onClose,
  error,
}: {
  error?: string;
  open: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Dialog
      fullScreen={fullScreen}
      onClose={onClose}
      open={open}
      aria-labelledby="responsive-dialog-title"
    >
      <Alert severity="error">{error}</Alert>
    </Dialog>
  );
}
