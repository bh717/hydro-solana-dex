import React, { useCallback } from "react";
import { Button, Paper, Stack, Typography } from "@mui/material";
import { useHydraClient } from "../components/HydraClientProvider";

export function Wasm() {
  const sdk = useHydraClient();

  const handleDemoClicked = useCallback(async () => {
    const answer = await sdk.staking.calculatePoolTokensForDeposit(
      100n,
      2000n,
      100000000n
    );

    alert(answer);
  }, [sdk]);

  return (
    <div>
      <Stack paddingTop={2}>
        <Paper sx={{ padding: 2, marginBottom: 2 }}>
          <Typography variant="h6" component="div">
            Wasm Test
          </Typography>
          <Button variant="contained" onClick={handleDemoClicked}>
            Demonstrate Calculate
          </Button>
        </Paper>
      </Stack>
    </div>
  );
}
