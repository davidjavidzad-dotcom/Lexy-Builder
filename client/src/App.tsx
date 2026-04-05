import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from "@/components/Layout";
import { Home } from "@/pages/Home";
import { Workflows } from "@/pages/Workflows";
import { WorkflowRunner } from "@/pages/WorkflowRunner";
import { Directory } from "@/pages/Directory";
import NotFound from "@/pages/not-found";
import GoodlegalWorkflow from './components/GoodlegalWorkflow';

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/workflows" component={GoodlegalWorkflow} />
        <Route path="/workflow/:workflowId" component={WorkflowRunner} />
        <Route path="/directory" component={Directory} />
        {/* Admin route optional, can point to Directory for demo */}
        <Route path="/admin" component={Directory} /> 
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
    </QueryClientProvider>
  );
}

export default App;
