import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, FileText, Users, Building2 } from "lucide-react";

export function Home() {
  return (
    <div className="space-y-24 pb-24">
      {/* Hero */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-green-50/50 via-background to-background"></div>
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-secondary/80 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium text-foreground/80 mb-8 border border-border/50 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="flex h-2 w-2 rounded-full bg-primary"></span>
            Production Ready Legal Ops
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-foreground animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Legal help starts with Lexy. <br/>
            <span className="text-primary">No friction, no guesswork.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Lexy asks the right questions, organizes your facts, and helps GoodLegal find the best legal help for your situation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <Link href="/lexy">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-white w-full sm:w-auto">
                Start with Lexy <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/directory">
              <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-full border-border bg-background hover:bg-secondary w-full sm:w-auto">
                Find a Lawyer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-secondary/30 border border-border/50 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Lexy Intake</h3>
            <p className="text-muted-foreground leading-relaxed">
              Guided, step-by-step form filling that captures the details lawyers need.
            </p>
          </div>
          <div className="p-8 rounded-2xl bg-secondary/30 border border-border/50 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Lawyer Matching</h3>
            <p className="text-muted-foreground leading-relaxed">
              Lexy uses your intake to point you toward relevant legal professionals.
            </p>
          </div>
          <div className="p-8 rounded-2xl bg-secondary/30 border border-border/50 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Entity Management</h3>
            <p className="text-muted-foreground leading-relaxed">
              From formation to annual reports, keep your corporate structure organized and clean.
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof / Trust */}
      <section className="container mx-auto px-4 text-center">
        <div className="flex flex-col items-center">
           <ShieldCheck className="h-12 w-12 text-muted-foreground/30 mb-6" />
           <p className="text-lg font-medium text-muted-foreground">Trusted by forward-thinking founders and legal teams.</p>
        </div>
      </section>
    </div>
  );
}
