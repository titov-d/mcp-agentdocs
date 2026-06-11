import type { Metadata } from "next";
import { Source_Serif_4, Source_Sans_3, JetBrains_Mono } from "next/font/google";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import "./globals.css";

const serif = Source_Serif_4({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--ff-serif" });
const sans = Source_Sans_3({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--ff-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--ff-mono" });

const TITLE = "agentdocs — fresh, verified docs for MCP servers & Claude agents";
const DESCRIPTION =
  "A local MCP server that gives your AI coding assistant current, source-verified documentation for building MCP servers and Claude agents — every doc stamped with its source and verification date.";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "agentdocs",
  keywords: ["agentdocs", "MCP", "Model Context Protocol", "Claude", "AI agents", "documentation", "Claude Code", "Cursor"],
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const NO_FLASH = `try{var t=localStorage.getItem('agentdocs-theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme:dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
      </head>
      <body className="font-sans antialiased">
        {children}
        <GoogleAnalytics measurementId={gaId ?? ""} />
      </body>
    </html>
  );
}
