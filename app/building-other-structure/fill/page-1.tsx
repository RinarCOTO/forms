"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page1Redirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/building-other-structure/fill");
  }, [router]);
  return null;
}
