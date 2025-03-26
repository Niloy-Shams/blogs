"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { useAuth } from "@/context/auth-context";

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  username: z.string().min(1, {
    message: "Username is required.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
});

export function LoginForm() {
    const router = useRouter();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      // Remove any trailing slashes from the API URL
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
      const apiUrl = `${baseUrl}/token/`;
      console.log('Attempting login to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(values),
        credentials: 'include',
      })

      const data = await response.json();

      if (!response.ok) {
        console.error('Login response error:', {
          status: response.status,
          statusText: response.statusText,
          error: data
        });
        throw new Error(data.detail || "Invalid credentials");
      }

      if (!data.access) {
        console.error('No access token in response:', data);
        throw new Error("Invalid response from server");
      }

      console.log('Login successful, token received');
      
      // Only store access token, refresh token is handled by HTTP-only cookie
      login(data.access);
      
      toast.success("Logged in successfully")
      
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error("Login error details:", error)
      toast.error("Login failed", {
        description: error instanceof Error ? error.message : "Please check your credentials and try again",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Log in"}
        </Button>
      </form>
    </Form>
  )
}