"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function PrintPreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setPreviewUrl(`/building-other-structure/fill/preview-form?id=${id}`);
    }
  }, [searchParams]);

  return (
    <div style={{ width: "100vw", minHeight: "100vh", background: "#fff", padding: 0, margin: 0 }}>
      {previewUrl ? (
        <iframe
          src={previewUrl}
          title="Print Preview"
          style={{ width: "100%", minHeight: "100vh", border: "none" }}
          allowFullScreen
        />
      ) : null}
    </div>
  );
}
