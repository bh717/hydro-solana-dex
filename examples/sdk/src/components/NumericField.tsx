import { TextField, TextFieldProps } from "@mui/material";
import React from "react";
import { useNumericField } from "hydra-react-ts/src/hooks/useNumericField";

export type NumericFieldProps = TextFieldProps & {
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
  const { fieldError, fieldValue, handleChange, handleBlur, handleFocus } =
    useNumericField({ value, onFocus, onChange });

  return (
    <TextField
      {...props}
      error={fieldError}
      value={fieldValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
    />
  );
}
