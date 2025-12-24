import { Link } from "wouter";
import { workflows } from "../flows/library";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileType, Activity } from "lucide-react";

export function Workflows() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Workflow Library</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Select a workflow to begin. Our guided process ensures you collect all the necessary information correctly.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workflows.map(flow => (
          <Card key={flow.id} className="hover:shadow-lg transition-shadow border-border">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                {flow.id.includes('injury') ? <Activity /> : <FileType />}
              </div>
              <CardTitle className="text-xl">{flow.title}</CardTitle>
              <CardDescription className="text-base mt-2">{flow.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                {flow.steps.length} Steps • Est. 5 mins
              </div>
            </CardContent>
            <CardFooter>
              <Link href={`/workflow/${flow.id}`} className="w-full">
                <Button className="w-full group">
                  Start Workflow 
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}

        {/* Placeholder for Coming Soon */}
        <Card className="border-dashed border-border bg-secondary/20 flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
           <div className="text-muted-foreground font-medium">More workflows coming soon...</div>
        </Card>
      </div>
    </div>
  );
}
