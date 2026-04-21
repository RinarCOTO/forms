import { useEffect, useRef } from "react";

export function useSaveDraftShortcut(onSave: () => void, disabled?: boolean) {
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "s" && (e.ctrlKey || e.metaKey) && !disabledRef.current) {
        e.preventDefault();
        onSaveRef.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []); // runs once — refs keep values current without re-registering
}
