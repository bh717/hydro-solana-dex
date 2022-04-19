import React, { useCallback, useState, FC } from "react";
import { makeStyles } from "@mui/styles";
import { TextField } from "@mui/material";

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

interface NumericFieldProps {
  value: number;
  onFocus(event: React.FocusEvent<HTMLInputElement>): void;
  onChange(value: number): void;
}

const NumericField: FC<NumericFieldProps> = ({ value, onFocus, onChange }) => {
  const classes = useStyles();

  const [draftMode, setDraftMode] = useState(false);
  const [localState, setLocalState] = useState("0");
  const [error, setError] = useState("");

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError("");

      const rawValue = e.target.value;
      const allowedString = rawValue.replace(/[^0-9\\.]/, "");
      setLocalState(allowedString);
      const num = Number(allowedString);
      console.log(isNaN(num));
      if (!isNaN(num)) {
        onChange(num);
      }
    },
    [onChange]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const num = Number(localState);
      console.log(isNaN(num));
      if (isNaN(num)) {
        setError("Number is not valid");
        return;
      }
      onChange(num);
      setDraftMode(false);
      setLocalState(value.toString());
    },
    [localState, value, onChange]
  );

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setDraftMode(true);
      if (!error) setLocalState(`${value}`);
      onFocus(e);
    },
    [value, onFocus, error]
  );

  return (
    <TextField
      className={classes.textField}
      fullWidth
      value={draftMode ? localState : value.toString()}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
    />
  );
};

export default NumericField;
