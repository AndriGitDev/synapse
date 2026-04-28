import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://synapse.andri.is'),
  title: "SYNAPSE — Watch AI Agents Think",
  description: "Visualize Claude Code and OpenClaw agent reasoning in real-time. Tail any session as a live, interactive graph — every thought, tool call, sub-agent spawn, and decision. Built by an AI.",
  keywords: ["AI", "agent", "visualization", "LLM", "Claude", "Claude Code", "GPT", "developer tools", "LangChain", "OpenClaw"],
  authors: [{ name: "Andri", url: "https://andri.is" }],
  creator: "Andri",
  publisher: "Andri Pétur Hafþórsson",
  openGraph: {
    title: "SYNAPSE — Watch AI Agents Think",
    description: "Visualize Claude Code and OpenClaw agent reasoning in real-time. Every thought, tool call, sub-agent spawn, and decision — as a live interactive graph.",
    type: "website",
    url: "https://synapse.andri.is",
    siteName: "SYNAPSE",
  },
  twitter: {
    card: "summary_large_image",
    title: "SYNAPSE — Watch AI Agents Think",
    description: "Tail Claude Code and OpenClaw sessions as live, interactive graphs. Built by an AI.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-slate-950`}>
        {children}
        <Script src="https://cdn.jsdelivr.net/npm/swetrix@latest/dist/swetrix.js" strategy="afterInteractive" />
        <Script id="swetrix-init" strategy="afterInteractive">
          {`
            document.addEventListener('DOMContentLoaded', function() {
              if (window.swetrix) {
                swetrix.init('9U8WieznN7O2', {
                  apiURL: 'https://swetrixapi.kastro.is/log',
                });
                swetrix.trackViews();
              }
            });
            if (document.readyState !== 'loading' && window.swetrix) {
              swetrix.init('9U8WieznN7O2', {
                apiURL: 'https://swetrixapi.kastro.is/log',
              });
              swetrix.trackViews();
            }
          `}
        </Script>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://swetrixapi.kastro.is/log/noscript?pid=9U8WieznN7O2"
            alt=""
            referrerPolicy="no-referrer-when-downgrade"
          />
        </noscript>
      </body>
    </html>
  );
}
