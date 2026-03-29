import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulse AI",
  description: "Your cardiac rehabilitation companion",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#F8FAFC] min-h-screen">{children}</body>
    </html>
  );
}
