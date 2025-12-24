import { useRoute } from "wouter";
import { getWorkflow } from "../flows/library";
import { FlowEngine } from "../flows/engine/FlowEngine";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function WorkflowRunner() {
  const [match, params] = useRoute("/workflow/:workflowId");
  const workflowId = match ? params?.workflowId : null;
  const workflow = workflowId ? getWorkflow(workflowId) : null;

  if (!workflow) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h1 className="text-2xl font-bold mb-4">Workflow Not Found</h1>
        <Link href="/workflows">
          <Button>Return to Library</Button>
        </Link>
      </div>
    );
  }

  return <FlowEngine workflow={workflow} />;
}
