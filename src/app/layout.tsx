import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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
  description: "Visualize AI agent decision-making in real-time. See every thought, tool call, and reasoning step as a beautiful interactive graph. Built by an AI.",
  keywords: ["AI", "agent", "visualization", "LLM", "Claude", "GPT", "developer tools", "Bubbi", "LangChain"],
  authors: [{ name: "Andri", url: "https://andri.is" }],
  creator: "Andri",
  publisher: "Andri Pétur Hafþórsson",
  openGraph: {
    title: "SYNAPSE — Watch AI Agents Think",
    description: "Visualize AI agent decision-making in real-time. See every thought, tool call, and reasoning step.",
    type: "website",
    url: "https://synapse.andri.is",
    siteName: "SYNAPSE",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SYNAPSE - AI Agent Thought Visualizer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SYNAPSE — Watch AI Agents Think",
    description: "Visualize AI agent decision-making in real-time. Built by an AI.",
    images: ["/og-image.png"],
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
      </body>
    </html>
  );
}
