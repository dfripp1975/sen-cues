import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "EventFill — Fill More Seats. Sell More Tickets.", template: "%s · EventFill" },
  description: "EventFill helps event organisers track ticket sales, plan smarter marketing campaigns and act before empty seats turn into lost revenue.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#027653", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={figtree.variable}>
      <body className="min-h-dvh font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lift">
          Skip to content
        </a>
        {children}
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
