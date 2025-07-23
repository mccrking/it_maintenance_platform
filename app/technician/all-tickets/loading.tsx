import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">All Tickets</h1>
      <div className="grid gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="relative animate-pulse">
            <CardHeader>
              <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-6 w-24" />
              </CardTitle>
              <Skeleton className="h-4 w-1/3 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-1/4 mb-2" />
              <Skeleton className="h-4 w-1/4" />
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-8 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
