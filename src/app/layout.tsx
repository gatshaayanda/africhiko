import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import PwaRegister from "@/app/pwa-register";
import "./globals.css";
import "./pwa.css";
import "./africhiko-experience.css";

const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://africhiko.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Africhiko | Welding & Steel Fabrication", template: "%s | Africhiko" },
  description: "Africhiko — welding and steel fabrication in Botswana. Browse services and submit a project brief for review and quotation.",
  applicationName: "Africhiko",
  keywords: ["Africhiko", "Botswana steel fabrication", "welding", "gates", "steel structures"],
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: siteUrl, siteName: "Africhiko", title: "Africhiko | Welding & Steel Fabrication", description: "Welding and steel fabrication in Botswana. Tell us about your project and request a quotation." },
  twitter: { card: "summary", title: "Africhiko | Welding & Steel Fabrication", description: "Welding and steel fabrication in Botswana. Tell us about your project and request a quotation." },
  icons: { icon: "/africhiko-icon.svg", apple: "/africhiko-icon.svg" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Africhiko", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#6d28d9", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><PwaRegister />{children}<Analytics /><SpeedInsights /></body></html>;
}
