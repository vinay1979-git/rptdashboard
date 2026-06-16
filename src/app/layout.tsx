import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Product Reporting Dashboard - Executive Status Reports",
  description: "Executive reporting dashboard and status compiler",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-50 antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
