"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { Edit, Trash } from "lucide-react"
import Link from "next/link"
import { use } from "react"

import { Button } from "@/components/ui/button"

interface BlogPost {
  id: number;
  title: string;
  content: string;
  category: string;
  author: string;
  created_at: string;
  status: string;
}

export default function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter()
  const { isAuthenticated, accessToken, user } = useAuth()
  const [blog, setBlog] = useState<BlogPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
        const response = await fetch(`${baseUrl}/posts/${resolvedParams.id}/`, {
          headers: {
            "Accept": "application/json",
          },
        })
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to fetch blog post");
        }
        
        const data = await response.json();
        setBlog(data);
      } catch (error) {
        console.error("Error fetching blog post:", error);
        toast.error(error instanceof Error ? error.message : "Failed to load blog post");
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    }

    fetchBlog();
  }, [resolvedParams.id, router]);

  const handleDelete = async () => {
    if (!isAuthenticated || !accessToken) {
      toast.error("You must be logged in to delete a blog post");
      router.push("/login");
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/posts/${resolvedParams.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete post");
      }

      toast.success('Post deleted successfully');
      router.push("/");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete post");
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-3xl py-10 mx-auto">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="container max-w-3xl py-10 mx-auto">
        <div className="text-center text-red-500">Blog post not found</div>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-10 mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{blog.title}</h1>
            <div className="text-sm text-muted-foreground">
              By {blog.author} • Category: {blog.category} • {formatDistanceToNow(new Date(blog.created_at), { addSuffix: true })}
            </div>
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
                onClick={handleDelete}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mt-4">
          {blog.status}
        </div>
      </div>

      <div className="prose prose-lg max-w-none">
        {blog.content.split('\n').map((paragraph, index) => (
          <p key={index} className="mb-4">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
} 