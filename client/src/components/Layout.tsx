import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground">
      <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <a className="text-xl font-bold tracking-tight flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded-sm"></div>
              GoodLegal
            </a>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="/lexy">
              <a className={cn("hover:text-foreground transition-colors", (location.startsWith("/lexy") || location.startsWith("/workflows")) && "text-foreground")}>
                Lexy
              </a>
            </Link>
            <Link href="/directory">
              <a className={cn("hover:text-foreground transition-colors", location.startsWith("/directory") && "text-foreground")}>
                Find a Lawyer
              </a>
            </Link>
            <Link href="/admin">
              <a className={cn("hover:text-foreground transition-colors", location === "/admin" && "text-foreground")}>
                Admin
              </a>
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <button className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Sign In
            </button>
            <Link href="/lexy">
              <a className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:brightness-110 transition-all">
                Ask Lexy
              </a>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border py-12 bg-secondary/30">
        <div className="container mx-auto px-4 grid md:grid-cols-4 gap-8 text-sm text-muted-foreground">
          <div>
            <div className="font-bold text-foreground mb-4 flex items-center gap-2">
              <div className="w-4 h-4 bg-primary rounded-sm"></div>
              GoodLegal
            </div>
            <p>GoodLegal helps people use Lexy to get organized and find the right legal help.</p>
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-4">Product</h4>
            <ul className="space-y-2">
              <li>Lexy</li>
              <li>Find a Lawyer</li>
              <li>Pricing</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-4">Company</h4>
            <ul className="space-y-2">
              <li>About</li>
              <li>Blog</li>
              <li>Careers</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>Privacy</li>
              <li>Terms</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
