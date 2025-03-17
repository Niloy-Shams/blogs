import { Suspense } from "react"
import BlogCards from "./blog-cards"
import BlogCardsSkeleton from "./blog-cards-skeleton"

export default function BlogCardGroup() {
  return (
    <Suspense fallback={<BlogCardsSkeleton />}>
      <BlogCards />
    </Suspense>
  )
}

