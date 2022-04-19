import { Alert, Dialog, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export function RemoveLiquiditySuccessModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      onClose={onClose}
      aria-labelledby="responsive-dialog-title"
    >
      <Alert severity="success">Success</Alert>
    </Dialog>
  );
}
