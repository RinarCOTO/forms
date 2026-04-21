import { KeyboardEvent } from "react";

export function useSubmitOnEnter(onSubmit: () => void, disabled?: boolean) {
  return (e: KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !disabled) {
      e.preventDefault();
      onSubmit();
    }
  };
}

export function useSubmitOnEnterSingleLine(onSubmit: () => void, disabled?: boolean) {
  return (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey && !disabled) {
      e.preventDefault();
      onSubmit();
    }
  };
}
