export type StepType = 
  | 'text' 
  | 'textarea' 
  | 'select' 
  | 'multi-select' 
  | 'radio' 
  | 'checkbox' 
  | 'date' 
  | 'number' 
  | 'address' // Simplified to text for now
  | 'file' // Placeholder
  | 'info'; // Just text display

export interface WorkflowStep {
  id: string;
  title: string;
  description?: string;
  type: StepType;
  options?: { label: string; value: string }[]; // For select, radio, etc.
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
  fieldLabel?: string;
  placeholder?: string;
  defaultValue?: any;
  nextStepId?: string; // If simplified flow
}

export interface WorkflowDefinition {
  id: string;
  title: string;
  description: string;
  steps: WorkflowStep[];
  initialStepId: string;
}

export interface WorkflowState {
  answers: Record<string, any>; // stepId -> value
  currentStepId: string;
  isComplete: boolean;
}
