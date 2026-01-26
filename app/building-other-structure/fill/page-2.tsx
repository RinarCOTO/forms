"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page2Redirect() {
  const router = useRouter();
  useEffect(() => {
    // Redirect legacy route to the new fill landing page
    router.replace("/building-other-structure/fill");
  }, [router]);
  return null;
}
