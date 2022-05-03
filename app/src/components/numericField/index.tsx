import React from "react";
import { makeStyles } from "@mui/styles";
import { TextField, TextFieldProps } from "@mui/material";
import { useNumericField } from "hydra-react-ts";

const useStyles = makeStyles({
  textField: {
    "& > .MuiInputBase-root": {
      padding: "0 8px",
      "& input": {
        color: "#FFF",
        padding: 0,
        fontSize: "16px",
        fontWeight: "500",
      },
      "& > fieldset": {
        display: "none",
      },
    },
  },
});

type NumericFieldProps = Omit<
  TextFieldProps,
  "onFocus" | "value" | "onChange"
> & {
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  value: number;
  onChange?: (value: number) => void;
};

function NumericField({
  value,
  onFocus,
  onChange,
  fullWidth = true,
  ...props
}: NumericFieldProps) {
  const classes = useStyles();
  const numericProps = useNumericField({ value, onFocus, onChange });

  return (
    <TextField
      className={classes.textField}
      fullWidth={fullWidth}
      {...numericProps}
      {...props}
    />
  );
}

export default NumericField;
