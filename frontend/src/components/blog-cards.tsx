"use client"

import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Edit, Trash } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import Link from "next/link"
import { useEffect, useState } from "react"

interface Blog {
  id: number;
  title: string;
  content: string;
  category: string;
  author: string;
  created_at: string;
  status: string;
}

interface BlogCardsProps {
  posts?: Blog[];
  fetchPosts?: boolean;
}

async function getBlogs(): Promise<Blog[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
    if (!baseUrl) {
      throw new Error('API URL is not defined in environment variables');
    }
    
    const response = await fetch(`${baseUrl}/posts/`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Fetched data:', data);
    return data.results || [];
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

function truncateContent(content: string, wordCount = 50): string {
  const words = content.split(" ")
  if (words.length <= wordCount) return content
  return words.slice(0, wordCount).join(" ") + "..."
}

export default function BlogCards({ posts: initialPosts, fetchPosts = true }: BlogCardsProps) {
  const { user, accessToken } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>(initialPosts || []);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(fetchPosts);

  useEffect(() => {
    const fetchBlogs = async () => {
      if (!fetchPosts) return;
      
      try {
        const fetchedBlogs = await getBlogs();
        setBlogs(fetchedBlogs);
      } catch (error) {
        console.error('Failed to fetch blogs:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogs();
  }, [fetchPosts]);

  const handleDelete = async (id: number) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/posts/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || `Failed to delete post: ${response.status} ${response.statusText}`);
      }

      toast.success('Post deleted successfully');
      setBlogs(blogs.filter(blog => blog.id !== id));
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete post');
    }
  };

  if (error) {
    return (
      <div className="text-center text-lg text-muted-foreground">
        Failed to fetch blogs. {error}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center text-lg text-muted-foreground">
        Loading blogs...
      </div>
    );
  }

  if (blogs.length === 0) {
    return (
      <div className="text-center text-lg text-muted-foreground">
        No blogs found
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {blogs.map((blog) => (
        <Card key={blog.id} className="flex flex-col h-full">
          <div className="flex flex-col h-full">
            <Link href={`/blog/${blog.id}`} className="flex flex-col h-full">
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
            </Link>
            <CardFooter className="flex justify-between items-center">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                {blog.status}
              </div>
              {(user?.isAdmin || user?.username === blog.author) && (
                <div className="flex gap-2">
                  <Link href={`/blog/edit/${blog.id}`}>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDelete(blog.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardFooter>
          </div>
        </Card>
      ))}
    </div>
  );
}

