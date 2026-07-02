"use client";

import { useEffect } from "react";

const PRINT_BLOCKED_STYLE_ID = "print-blocked";

export function usePrintBlocker(canPrint: boolean) {
  useEffect(() => {
    if (canPrint) return;

    const style = document.createElement("style");
    style.id = PRINT_BLOCKED_STYLE_ID;
    style.textContent = "@media print { body { display: none !important; } }";
    document.head.appendChild(style);

    return () => document.getElementById(PRINT_BLOCKED_STYLE_ID)?.remove();
  }, [canPrint]);
}
