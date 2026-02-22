import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignedOut, SignInButton, SignUpButton, SignedIn, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getActiveWorkoutByUserId } from "@/services/workouts";
import { WorkoutHeaderButton } from "./workout-header-button";
import { MobileNav } from "./mobile-nav";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth()
  const activeWorkout = userId ? await getActiveWorkoutByUserId(userId) : null

  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <header className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border">
            <SignedIn>
              <nav className="hidden md:flex items-center gap-1">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/exercises">Exercises</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/analytics/exercises">Analytics</Link>
                </Button>
              </nav>
              <MobileNav />
              <WorkoutHeaderButton
                activeWorkoutStartedAt={activeWorkout?.startedAt?.toISOString() ?? null}
              />
            </SignedIn>
            <div className="flex items-center gap-3 ml-auto">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm">Sign up</Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
