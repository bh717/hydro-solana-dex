import { AccountLoader } from "hydra-ts";
import React from "react";
import { TableCell, TableRow } from "@mui/material";
import { TokenAccount } from "hydra-ts/src/types/token-account";
import { trunc } from "../utils/trunc";

export function DisplayToken({
  token,
}: {
  token?: AccountLoader.AccountData<TokenAccount>;
}) {
  if (!token) return null;
  return (
    <TableRow key={`${token.pubkey}`}>
      <TableCell>{trunc(`${token.pubkey}`)}</TableCell>
      <TableCell>{trunc(`${token.account.data.mint}`)}</TableCell>
      <TableCell>{trunc(`${token.account.data.owner}`)}</TableCell>
      <TableCell>{`${token.account.data.amount}`}</TableCell>
    </TableRow>
  );
}
