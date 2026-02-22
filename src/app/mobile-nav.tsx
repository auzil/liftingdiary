"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 mt-4">
            <Button variant="ghost" size="sm" asChild onClick={() => setOpen(false)}>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild onClick={() => setOpen(false)}>
              <Link href="/exercises">Exercises</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild onClick={() => setOpen(false)}>
              <Link href="/analytics/exercises">Analytics</Link>
            </Button>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
