// Workflow Engine for Goodlegal
import { 
  WorkflowConfig, 
  Workflow, 
  WorkflowStep, 
  WorkflowState, 
  ValidationResult,
  Field,
  StepHistory 
} from './workflow-types';

export class WorkflowEngine {
  private config: WorkflowConfig;
  private state: WorkflowState;
  private onStateChange?: (state: WorkflowState) => void;
  private onComplete?: (data: Record<string, any>) => void;

  constructor(config: WorkflowConfig) {
    this.config = config;
    this.state = this.initializeState();
  }

  private initializeState(): WorkflowState {
    return {
      currentWorkflowId: '',
      currentStepId: '',
      data: {},
      history: [],
      completedSteps: []
    };
  }

  // Start a new workflow
  public startWorkflow(workflowId: string): WorkflowStep | null {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    this.state = {
      ...this.initializeState(),
      currentWorkflowId: workflowId,
      currentStepId: this.getFirstStepId(workflow)
    };

    this.notifyStateChange();
    return this.getCurrentStep();
  }

  // Get the current step
  public getCurrentStep(): WorkflowStep | null {
    const workflow = this.getWorkflow(this.state.currentWorkflowId);
    if (!workflow || !workflow.steps) return null;
    
    return workflow.steps[this.state.currentStepId] || null;
  }

  // Process user input and move to next step
  public processStep(data: Record<string, any>): WorkflowStep | null {
    const currentStep = this.getCurrentStep();
    if (!currentStep) return null;

    // Validate input
    const validation = this.validateStep(currentStep, data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
    }

    // Save data
    this.state.data = { ...this.state.data, ...data };
    
    // Add to history
    this.state.history.push({
      stepId: this.state.currentStepId,
      timestamp: new Date(),
      data: data
    });

    // Mark step as completed
    this.state.completedSteps.push(this.state.currentStepId);

    // Determine next step
    const nextStepId = this.getNextStepId(currentStep, data);
    
    if (!nextStepId) {
      // Workflow complete
      this.handleWorkflowComplete();
      return null;
    }

    // Move to next step
    this.state.currentStepId = nextStepId;
    this.notifyStateChange();
    
    return this.getCurrentStep();
  }

  // Navigate to previous step
  public goBack(): WorkflowStep | null {
    if (this.state.history.length === 0) return null;

    const previousStep = this.state.history.pop();
    if (!previousStep) return null;

    // Remove from completed steps
    const index = this.state.completedSteps.indexOf(previousStep.stepId);
    if (index > -1) {
      this.state.completedSteps.splice(index, 1);
    }

    // Restore previous state
    this.state.currentStepId = previousStep.stepId;
    
    // Remove the data from that step
    Object.keys(previousStep.data).forEach(key => {
      delete this.state.data[key];
    });

    this.notifyStateChange();
    return this.getCurrentStep();
  }

  // Get workflow by ID, handling nested subtypes
  private getWorkflow(workflowId: string): Workflow | null {
    const parts = workflowId.split('.');
    let current: any = this.config.workflows[parts[0]];
    
    for (let i = 1; i < parts.length; i++) {
      if (!current || !current.subtypes) return null;
      current = current.subtypes[parts[i]];
    }
    
    return current as Workflow;
  }

  // Get the first step ID of a workflow
  private getFirstStepId(workflow: Workflow): string {
    if (!workflow.steps) {
      // If workflow has subtypes, return empty
      if (workflow.subtypes) {
        return 'select_subtype';
      }
      return '';
    }
    const stepIds = Object.keys(workflow.steps);
    return stepIds[0] || '';
  }

  // Determine next step based on current step and data
  private getNextStepId(step: WorkflowStep, data: Record<string, any>): string | null {
    // Handle decision steps
    if (step.type === 'decision' && step.options) {
      const selectedOption = step.options.find(opt => 
        data[this.state.currentStepId] === opt.value
      );
      return selectedOption?.next || null;
    }

    // Handle selection steps
    if (step.type === 'selection' && step.options) {
      const selectedOption = step.options.find(opt => 
        data[this.state.currentStepId] === opt.value
      );
      return selectedOption?.next || null;
    }

    // Default next step
    return step.next || null;
  }

  // Validate step data
  private validateStep(step: WorkflowStep, data: Record<string, any>): ValidationResult {
    const errors: any[] = [];

    if (step.type === 'form' && step.fields) {
      step.fields.forEach(field => {
        if (field.required && !data[field.id]) {
          errors.push({
            fieldId: field.id,
            message: `${field.label} is required`
          });
        }

        // Check conditional fields
        if (field.conditional) {
          const shouldShow = this.evaluateCondition(field.conditional, this.state.data);
          if (shouldShow && field.required && !data[field.id]) {
            errors.push({
              fieldId: field.id,
              message: `${field.label} is required`
            });
          }
        }
      });
    }

    if (step.type === 'decision' && !data[this.state.currentStepId]) {
      errors.push({
        fieldId: this.state.currentStepId,
        message: 'Please select an option'
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  // Evaluate conditional expressions
  private evaluateCondition(condition: string, data: Record<string, any>): boolean {
    // Simple conditional evaluation
    if (condition.includes('==')) {
      const [field, value] = condition.split('==');
      return data[field.trim()] === value.trim();
    }
    
    if (condition.includes('!=')) {
      const [field, value] = condition.split('!=');
      return data[field.trim()] !== value.trim();
    }
    
    return false;
  }

  // Handle workflow completion
  private handleWorkflowComplete(): void {
    if (this.onComplete) {
      this.onComplete(this.state.data);
    }
  }

  // Notify state changes
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  // Set state change listener
  public setStateChangeListener(listener: (state: WorkflowState) => void): void {
    this.onStateChange = listener;
  }

  // Set completion listener
  public setCompletionListener(listener: (data: Record<string, any>) => void): void {
    this.onComplete = listener;
  }

  // Get current state
  public getState(): WorkflowState {
    return { ...this.state };
  }

  // Get collected data
  public getData(): Record<string, any> {
    return { ...this.state.data };
  }

  // Save state (for persistence)
  public saveState(): string {
    return JSON.stringify(this.state);
  }

  // Load state (from persistence)
  public loadState(savedState: string): void {
    try {
      this.state = JSON.parse(savedState);
      this.notifyStateChange();
    } catch (error) {
      console.error('Failed to load state:', error);
    }
  }
}
