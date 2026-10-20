import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import PwaRegister from "@/app/pwa-register";
import "./globals.css";
import "./pwa.css";

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://namane-tyres.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Namane Tyres | Gaborone", template: "%s | Namane Tyres" },
  description: "Namane Tyres — tyre fitting, puncture repair, pressure checks, tyre sales, light wash and roadside assistance in Gaborone.",
  applicationName: "Namane Tyres",
  keywords: ["Namane Tyres", "Gaborone tyres", "tyre fitting", "puncture repair", "roadside assistance"],
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: siteUrl, siteName: "Namane Tyres", title: "Namane Tyres | Gaborone", description: "Tyre fitting, repairs, sales and roadside assistance in Gaborone." },
  twitter: { card: "summary", title: "Namane Tyres | Gaborone", description: "Tyre fitting, repairs, sales and roadside assistance in Gaborone." },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Namane Tyres", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#111827", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><PwaRegister />{children}<Analytics /><SpeedInsights /></body></html>;
}
