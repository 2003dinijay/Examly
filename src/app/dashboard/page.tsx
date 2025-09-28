"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "../../lib/firebase";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }
      const snap = await get(ref(db, `users/${user.uid}`));
      const data = snap.val();
      if (!data) {
        router.push("/");
        return;
      }
      if (data.role === "admin") router.push("/admin");
      else if (data.role === "professor") router.push("/professor");
      else router.push("/student");
    });
    return () => unsub();
  }, []);

  return (
    <div className="flex items-center justify-center h-screen text-white">
      Redirecting...
    </div>
  );
}
