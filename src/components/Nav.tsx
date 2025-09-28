"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function Nav() {
  const { user, role, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (!user) return null;

  return (
    <nav className="flex justify-between items-center bg-black/30 text-white px-6 py-3 rounded-lg mb-6">
      <div>
        <span className="font-semibold">{user.email}</span> —{" "}
        <span className="italic">{role}</span>
      </div>
      <button
        onClick={handleLogout}
        className="px-3 py-1 bg-red-500 rounded hover:opacity-80"
      >
        Sign Out
      </button>
    </nav>
  );
}
