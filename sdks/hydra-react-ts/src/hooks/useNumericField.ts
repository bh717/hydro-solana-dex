import React, { useCallback, useState } from "react";

export type NumericFieldProps = {
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  value: number;
  onChange?: (inputValue: number) => void;
};

export function useNumericField({
  value: inputValue,
  onFocus: inputOnFocus,
  onChange: inputOnChange,
}: NumericFieldProps) {
  const [draftMode, setDraftMode] = useState(false);
  const [localState, setLocalState] = useState("0");
  const [internalError, setError] = useState("");

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError("");

      const rawValue = e.target.value;
      const allowedString = rawValue.replace(/[^0-9\\.]/, "");
      setLocalState(allowedString);
      const num = Number(allowedString);
      if (!isNaN(num)) {
        inputOnChange && inputOnChange(num);
      }
    },
    [inputOnChange]
  );

  const onBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const num = Number(localState);
      if (isNaN(num)) {
        setError("Number is not valid");
        return;
      }
      inputOnChange && inputOnChange(num);
      setDraftMode(false);
      setLocalState(inputValue.toString());
    },
    [localState, inputValue, inputOnChange]
  );

  const onFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setTimeout(() => {
        setDraftMode(true);
        inputOnFocus && inputOnFocus(e);
      }, 100);
    },
    [inputValue, inputOnFocus, internalError]
  );

  useEffect(() => {
    if (!draftMode && !internalError) setLocalState(inputValue.toString());
  }, [inputValue, draftMode, internalError]);

  const value = draftMode ? localState : inputValue.toString();
  const error = !!internalError;
  return {
    error,
    value,
    onChange,
    onBlur,
    onFocus,
  };
}
