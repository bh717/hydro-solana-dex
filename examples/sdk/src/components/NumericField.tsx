import { TextField } from "@mui/material";
import React, { useCallback, useState } from "react";

export function NumericField({
  value,
  onFocus,
  onChange,
}: {
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => void;
  value: number;
  onChange: (value: number) => void;
}) {
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
      if (!isNaN(num)) {
        onChange(num);
      }
    },
    [onChange]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const num = Number(localState);
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
      fullWidth
      error={!!error}
      value={draftMode ? localState : value.toString()}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
    />
  );
}
