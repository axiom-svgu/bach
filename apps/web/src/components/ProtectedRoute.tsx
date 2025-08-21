"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const hydrateFromSession = useAuthStore((s) => s.hydrateFromSession);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const authenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    hydrateFromSession();
  }, [hydrateFromSession]);

  useEffect(() => {
    if (isHydrated && !authenticated) {
      router.replace("/login");
    }
  }, [isHydrated, authenticated, router]);

  if (!isHydrated) {
    return <div>Loading...</div>;
  }
  return <div>{children}</div>;
}
