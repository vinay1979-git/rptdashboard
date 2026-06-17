import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={`${inter.className} bg-[#F9FAFC] text-[#030522] antialiased min-h-screen`}>{children}</body>
    </html>
  );
}
