import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

interface Blog {
  title: string
  content: string
  category: string // Changed from number to string
  author: string   // Changed from number to string
  created_at: string
  status: string
}

async function getBlogs(): Promise<Blog[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      throw new Error('API URL is not defined in environment variables');
    }
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Fetched data:', data);
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error; // Re-throw the error so the outer try-catch can handle it
  }
}

function truncateContent(content: string, wordCount = 50): string {
  const words = content.split(" ")
  if (words.length <= wordCount) return content
  return words.slice(0, wordCount).join(" ") + "..."
}

export default async function BlogCards() {
  let blogs: Blog[] = [];
  try {
    blogs = await getBlogs();
  } catch (error) {
    console.error('Failed to fetch blogs:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return (
      <div className="text-center text-lg text-muted-foreground">
        Failed to fetch blogs. {errorMessage}
      </div>
    )
  }
  if (blogs.length === 0) {
    console.log('No blogs found');
    return (
      <div className="text-center text-lg text-muted-foreground">
        No blogs found
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {blogs.map((blog, index) => (
        <Card key={index} className="flex flex-col h-full">
          <div className="relative w-full pt-[56.25%]">
            <Image
              src={`/file.svg?height=300&width=500`}
              alt={blog.title}
              fill
              className="object-cover rounded-t-lg"
            />
          </div>
          <CardHeader>
            <div className="space-y-1">
              <h3 className="text-xl font-bold leading-tight line-clamp-2">{blog.title}</h3>
              <p className="text-sm text-muted-foreground">
                By {blog.author} • Category: {blog.category} • {formatDistanceToNow(new Date(blog.created_at), { addSuffix: true })}
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-muted-foreground">{truncateContent(blog.content)}</p>
          </CardContent>
          <CardFooter>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {blog.status}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

