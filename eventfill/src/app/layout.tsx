import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap", weight: ["600", "700", "800"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "EventFill — Fill More Seats. Sell More Tickets.", template: "%s · EventFill" },
  description: "EventFill helps event organisers track ticket sales, plan smarter marketing campaigns and act before empty seats turn into lost revenue.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#4F46E5", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${inter.variable} ${jakarta.variable}`}>
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
