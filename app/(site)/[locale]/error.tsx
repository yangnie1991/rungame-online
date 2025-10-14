"use client"

import { useEffect } from "react"
import { Link } from "@/i18n/routing"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center px-4">
      <h1 className="text-9xl font-bold text-destructive">500</h1>
      <h2 className="text-3xl font-semibold">Something went wrong!</h2>
      <p className="text-muted-foreground text-lg max-w-md">
        An unexpected error occurred. Please try again.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-6 py-3 border border-input rounded-lg hover:bg-accent transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
