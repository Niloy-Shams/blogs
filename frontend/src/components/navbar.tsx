"use client"

import { Plus as PlusIcon } from "lucide-react"
import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/context/auth-context"
import SearchBar from "./SearchBar"

interface NavItem {
  title: string
  href: string
}

const navItems: NavItem[] = [
  {
    title: "Home",
    href: "/",
  },
]

export function Navbar() {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, logout, user } = useAuth()

  const handleLogout = () => {
    logout()
    router.push("/login")
    router.refresh()
  }

  const handleSearch = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/20 bg-background/70 backdrop-blur-md px-2 shadow-sm">
      <div className="container flex h-16 items-center justify-between mx-auto">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-bold text-xl">
            Blog App
          </Link>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === item.href ? "text-primary" : "text-muted-foreground",
              )}
            >
              {item.title}
            </Link>
          ))}

          <div className="w-64">
            <SearchBar onSearch={handleSearch} />
          </div>

          {isAuthenticated && (
            <Link href="/blog/create">
              <Button className="hidden md:inline-flex">
                <PlusIcon className="mr-2 h-4 w-4" />
                New Post
              </Button>
            </Link>
          )}
          
          {isAuthenticated ? (
            <>
              <span className="text-sm font-medium text-muted-foreground">
                {user?.username}
              </span>
              <Button variant="ghost" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/register">
                <Button variant="ghost">Register</Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile navigation */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <div className="flex flex-col space-y-4 mt-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === item.href ? "text-primary" : "text-muted-foreground",
                  )}
                  onClick={() => setOpen(false)}
                >
                  {item.title}
                </Link>
              ))}

              <div className="w-full">
                <SearchBar onSearch={(query) => {
                  handleSearch(query);
                  setOpen(false);
                }} />
              </div>

              {isAuthenticated && (
                <Link href="/blog/create" onClick={() => setOpen(false)}>
                  <Button className="w-full justify-start">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    New Post
                  </Button>
                </Link>
              )}
              
              {isAuthenticated ? (
                <>
                  <span className="text-sm font-medium text-muted-foreground">
                    {user?.username}
                  </span>
                  <Button variant="ghost" onClick={() => {
                    handleLogout();
                    setOpen(false);
                  }}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">Login</Button>
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full">Register</Button>
                  </Link>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}