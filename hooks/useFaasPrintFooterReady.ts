"use client";

import { useEffect, useState } from "react";

export function useFaasPrintFooterReady(enabled: boolean) {
  const [footerReady, setFooterReady] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setFooterReady(false);
      return;
    }

    setFooterReady(false);

    const checkFooterReady = () => {
      if (document.querySelector('[data-faas-footer-ready="true"]')) {
        setFooterReady(true);
      }
    };

    checkFooterReady();

    const observer = new MutationObserver(checkFooterReady);
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-faas-footer-ready"],
    });

    return () => observer.disconnect();
  }, [enabled]);

  return footerReady;
}
