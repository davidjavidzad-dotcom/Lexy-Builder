// Re-export all workflow definitions from definitions.ts
export { entityFormationFlow, personalInjuryFlow } from "./definitions";

import { entityFormationFlow, personalInjuryFlow } from "./definitions";

// Aggregate all workflows into a single array
export const workflows = [entityFormationFlow, personalInjuryFlow];

// Helper to get a workflow by ID
export const getWorkflow = (id: string) => workflows.find(w => w.id === id);
