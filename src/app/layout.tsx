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
      <body className={`${inter.className} bg-[#F9FAFC] text-[#030522] antialiased min-h-screen`}>
        {/* Universal Lentra Header */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-[#E6E9EF] flex items-center justify-between z-40">
          <div className="flex items-center gap-3 px-6 h-full">
            <img src="https://lentra.ai/favicon.ico" alt="Lentra" className="h-8 w-auto" />
            <span className="text-[#030522] font-semibold text-lg border-l border-[#E6E9EF] pl-3">Product Reporting Dashboard</span>
          </div>
        </header>

        {/* Persisted Main Layout Wrapper */}
        <main className="pt-16 p-6">
          {children}
        </main>
      </body>
    </html>
  );
}
