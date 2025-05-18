import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ChatProvider } from "@/contexts/ChatContext";
import FloatingChatButton from "../components/chat/FloatingChatButton";
import Link from "next/link";
import Image from "next/image";
import GenoXplainLogo from "./logo/logo.png";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "GenoXplain",
  description: "Interpretable analysis of genetic variants for cancer signaling pathways.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <ChatProvider>
          <div className="relative flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-20 max-w-screen-2xl items-center">
                <div className="mr-4 hidden md:flex">
                  <Link className="mr-6 flex items-center space-x-2" href="/">
                    <Image src={GenoXplainLogo} alt="GenoXplain Logo" width={96} height={96} className="p-1" />
                    <span className="hidden font-bold sm:inline-block text-lg tracking-tight text-black">
                      GenoXplain
                    </span>
                  </Link>
                  <nav className="flex items-center gap-6 text-sm">
                    {/* Add navigation links here if needed */}
                  </nav>
                </div>
                {/* Add mobile menu and theme toggle here later if needed */}
              </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="py-6 md:px-8 md:py-0 border-t border-primary/10">
              <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                  Built by <span className="text-black">GenoXplain Team</span>
                </p>
              </div>
            </footer>
          </div>
          <FloatingChatButton />
        </ChatProvider>
      </body>
    </html>
  );
}
