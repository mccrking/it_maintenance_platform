"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Shield, User } from "lucide-react"

export default function SettingsHomePage() {
  return (
    <main className="flex items-center justify-center min-h-[calc(100vh-120px)] px-4" role="main">
      <Card className="w-full max-w-md" role="region" aria-label="Settings">
        <CardHeader>
          <CardTitle className="text-2xl" tabIndex={0}>Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex flex-col gap-4">
            <Button asChild variant="outline">
              <Link href="/settings/profile" className="flex items-center gap-2">
                <User className="h-5 w-5" /> Profile
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/settings/security" className="flex items-center gap-2">
                <Shield className="h-5 w-5" /> Security
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
