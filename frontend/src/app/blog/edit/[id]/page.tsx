"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { use } from "react"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  content: z.string().min(20, {
    message: "Content must be at least 20 characters.",
  }),
  category_id: z.string().min(1, {
    message: "Please select a category.",
  }),
  status: z.enum(["draft", "published"]),
})

interface Category {
  id: number;
  name: string;
}

interface BlogPost {
  id: number;
  title: string;
  content: string;
  category_id: string;
  status: string;
  author: string;
}

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter()
  const { isAuthenticated, accessToken, user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [blog, setBlog] = useState<BlogPost | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      category_id: "",
      status: "draft",
    },
  })

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      toast.error("You must be logged in to edit a blog post")
      router.push("/login")
      return
    }

    // Fetch blog post and check authorization
    const fetchBlog = async () => {
      if (!accessToken) {
        toast.error("You must be logged in to edit a blog post");
        router.push("/login");
        return;
      }

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
        const response = await fetch(`${baseUrl}/posts/${resolvedParams.id}/`, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "application/json",
          },
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.detail || `Failed to fetch blog post: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setBlog(data);

        // Check if user is authorized to edit
        if (!user?.isAdmin && user?.username !== data.author) {
          toast.error("You are not authorized to edit this post")
          router.push("/")
          return
        }

        // Set form values
        form.reset({
          title: data.title,
          content: data.content,
          category_id: data.category_id,
          status: data.status,
        })
      } catch (error) {
        console.error("Error fetching blog post:", error);
        toast.error(error instanceof Error ? error.message : "Failed to load blog post");
        router.push("/");
      }
    }

    // Fetch categories
    const fetchCategories = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
        const response = await fetch(`${baseUrl}/categories/`, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "application/json",
          },
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.detail || `Failed to fetch categories: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error(error instanceof Error ? error.message : "Failed to load categories");
      }
    }
    
    fetchBlog()
    fetchCategories()
  }, [isAuthenticated, router, accessToken, user, resolvedParams.id, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isAuthenticated || !accessToken) {
      toast.error("You must be logged in to edit a blog post")
      router.push("/login")
      return
    }

    setIsLoading(true)

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
      const url = `${baseUrl}/posts/${resolvedParams.id}/`
      
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || `Failed to update blog post: ${response.status} ${response.statusText}`);
      }

      toast.success("Blog post updated successfully!")
      router.push("/")
    } catch (error) {
      console.error("Error updating blog post:", error);
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false)
    }
  }

  if (!blog) {
    return (
      <div className="text-center py-10">
        Loading...
      </div>
    )
  }

  return (
    <div className="container max-w-3xl py-10 mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Blog Post</h1>
        <p className="text-muted-foreground mt-2">
          Make changes to your blog post
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter blog title" {...field} />
                </FormControl>
                <FormDescription>
                  The title of your blog post.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Write your blog content here..."
                    className="min-h-[200px]"
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  The main content of your blog post.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem 
                          key={category.id} 
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the category for your blog post.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Set the status of your blog post.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              className="mr-2"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Blog Post"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
} 