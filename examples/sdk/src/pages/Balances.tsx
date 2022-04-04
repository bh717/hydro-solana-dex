import {
  Paper,
  Typography,
  Table,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { toFormat } from "../utils/toFormat";
import { Box } from "@mui/system";
import { useHydraClient } from "../components/HydraClientProvider";
import { useAssetBalances } from "../hooks/useAssetBalances";

export function Balances() {
  const client = useHydraClient();
  const balances = useAssetBalances();

  return (
    <Box>
      <Paper sx={{ padding: 6, minWidth: 400 }}>
        <Box alignItems={"center"} gap={1} textAlign="center">
          <Typography textAlign="center" variant="h6" component="h6">
            Wallets
          </Typography>

          {!client.ctx.isSignedIn() ? (
            <Box>No wallet connected. Please connect a wallet.</Box>
          ) : (
            <Table>
              <TableBody>
                {balances.map((balance) => (
                  <TableRow key={balance.address}>
                    <TableCell>{balance.symbol}</TableCell>
                    <TableCell align="right">
                      {toFormat(balance.balance, balance.decimals)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
