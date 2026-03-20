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
  description: "Visualize OpenClaw AI agent reasoning in real-time. See every thought, tool call, and reasoning step as a beautiful interactive graph. Built by an AI.",
  keywords: ["AI", "agent", "visualization", "LLM", "Claude", "GPT", "developer tools", "LangChain"],
  authors: [{ name: "Andri", url: "https://andri.is" }],
  creator: "Andri",
  publisher: "Andri Pétur Hafþórsson",
  openGraph: {
    title: "SYNAPSE — Watch AI Agents Think",
    description: "Visualize OpenClaw AI agent reasoning in real-time. See every thought, tool call, and reasoning step.",
    type: "website",
    url: "https://synapse.andri.is",
    siteName: "SYNAPSE",
  },
  twitter: {
    card: "summary_large_image",
    title: "SYNAPSE — Watch AI Agents Think",
    description: "Visualize OpenClaw AI agent reasoning in real-time. Built by an AI.",
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
        <Script src="https://swetrix.org/swetrix.js" strategy="afterInteractive" />
        <Script id="swetrix-init" strategy="afterInteractive">
          {`
            swetrix.init('378K5cTK8Pn0', {
              apiURL: 'https://swetrixapi.kindra.is/log',
            })
            swetrix.trackViews()
          `}
        </Script>
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://swetrixapi.kindra.is/log/noscript?pid=378K5cTK8Pn0"
            alt=""
            referrerPolicy="no-referrer-when-downgrade"
          />
        </noscript>
      </body>
    </html>
  );
}
