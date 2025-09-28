import "./globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "../context/AuthContext";

export const metadata: Metadata = {
  title: "Examination & Grading System",
  description: "Next.js + Firebase Realtime DB",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-emerald-400 to-blue-600 min-h-screen text-gray-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
