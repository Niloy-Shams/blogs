"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import BlogCards from "@/components/blog-cards";
import BlogCardsSkeleton from "@/components/blog-cards-skeleton";

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  category: string;
  created_at: string;
  status: string;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!query) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
        const response = await fetch(
          `${baseUrl}/posts/?search=${encodeURIComponent(query)}`,
          {
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }

        const data = await response.json();
        console.log('Search results:', data);
        setPosts(data.results || []);
      } catch (err) {
        console.error('Search error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [query]);

  if (loading) {
    return <BlogCardsSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        Search Results for "{query}"
      </h1>
      {posts.length === 0 ? (
        <p className="text-gray-500">No posts found matching your search.</p>
      ) : (
        <BlogCards posts={posts} fetchPosts={false} />
      )}
    </div>
  );
} 