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
  title: "SYNAPSE — Watch AI Agents Think",
  description: "Visualize AI agent decision-making in real-time. See every thought, tool call, and reasoning step as a beautiful interactive graph.",
  keywords: ["AI", "agent", "visualization", "LLM", "Claude", "GPT", "developer tools"],
  authors: [{ name: "Data", url: "https://andri.is" }],
  openGraph: {
    title: "SYNAPSE — Watch AI Agents Think",
    description: "Visualize AI agent decision-making in real-time",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SYNAPSE — Watch AI Agents Think",
    description: "Visualize AI agent decision-making in real-time",
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
