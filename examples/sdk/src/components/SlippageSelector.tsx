import { Paper } from "@mui/material";
import { Box } from "@mui/system";
import { NumericField } from "../components/NumericField";
import { Button } from "@mui/material";
import { useCallback } from "react";

export function SlippageButton({
  children,
  amount,
  onClick,
}: {
  children: React.ReactNode;
  amount: bigint;
  onClick: (amount: bigint) => void;
}) {
  const handleClick = useCallback(() => {
    onClick(amount);
  }, [onClick, amount]);

  return <Button onClick={handleClick}>{children}</Button>;
}

export function SlippageSelector({
  onSelected,
  slippage,
}: {
  slippage: bigint;
  onSelected: (amount: bigint) => void;
}) {
  return (
    <Box>
      <Paper>
        <Box padding={2} flexDirection={"row"}>
          <SlippageButton amount={10n} onClick={onSelected}>
            0.1%
          </SlippageButton>
          <SlippageButton amount={50n} onClick={onSelected}>
            0.5%
          </SlippageButton>
          <SlippageButton amount={100n} onClick={onSelected}>
            1.0%
          </SlippageButton>
          <NumericField fullWidth={false} value={Number(slippage) / 100} />
        </Box>
      </Paper>
    </Box>
  );
}
