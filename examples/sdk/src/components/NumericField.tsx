import { TextField, TextFieldProps } from "@mui/material";
import React from "react";
import { useNumericField } from "hydra-react-ts";

export type NumericFieldProps = Omit<
  TextFieldProps,
  "onFocus" | "value" | "onChange"
> & {
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  value: number;
  onChange?: (value: number) => void;
};

export function NumericField({
  value,
  onFocus,
  onChange,
  fullWidth = true,
  ...props
}: NumericFieldProps) {
  const numericProps = useNumericField({ value, onFocus, onChange });
  return <TextField {...props} fullWidth={fullWidth} {...numericProps} />;
}
