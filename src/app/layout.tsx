import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignedOut, SignInButton, SignUpButton, SignedIn, UserButton } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lifting Diary",
  description: "Track your lifting progress",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <header className="flex items-center justify-end gap-3 px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-full hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors cursor-pointer">
                  Sign up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
