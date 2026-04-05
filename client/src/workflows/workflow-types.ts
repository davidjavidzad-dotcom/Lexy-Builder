// Workflow Type Definitions for Goodlegal

export interface WorkflowConfig {
  workflows: Record<string, Workflow>;
  global_components: GlobalComponents;
  configuration: Configuration;
}

export interface Workflow {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  steps?: Record<string, WorkflowStep>;
  subtypes?: Record<string, SubWorkflow>;
}

export interface SubWorkflow {
  id: string;
  title: string;
  description: string;
  steps?: Record<string, WorkflowStep>;
  subtypes?: Record<string, SubWorkflow>;
  reference?: string; // Reference to another workflow
}

export interface WorkflowStep {
  type: StepType;
  title?: string;
  question?: string;
  options?: Option[];
  fields?: Field[];
  sections?: Section[];
  next?: string;
  features?: string[];
  content?: string;
  note?: string;
  repeatable?: boolean;
  info?: string;
  action?: string;
  database?: string[];
  auto_populate?: boolean;
  dynamic_content?: string;
  actions?: Action[];
  source?: string;
  display?: string;
  criteria?: string[];
  ranking_factors?: any;
  results_count?: string;
  specialization?: string;
  message?: string;
  links?: Link[];
}

export type StepType = 
  | 'decision'
  | 'selection'
  | 'form'
  | 'summary'
  | 'document_selection'
  | 'document_preview'
  | 'lawyer_finder'
  | 'confirmation'
  | 'information'
  | 'ai_analysis'
  | 'instructions'
  | 'auto_action'
  | 'integrated_search'
  | 'component';

export interface Option {
  label: string;
  value: string;
  next?: string;
  default?: boolean;
}

export interface Field {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[] | Option[];
  conditional?: string;
  rows?: number;
  accept?: string;
  multiple?: boolean;
  unit?: string;
  source?: string;
  minItems?: number;
  sumTo?: number;
  encrypted?: boolean;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  format?: string;
}

export type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'date'
  | 'datetime'
  | 'address'
  | 'address_search'
  | 'currency'
  | 'percentage'
  | 'yes_no'
  | 'file_upload'
  | 'file_or_text'
  | 'multi_select'
  | 'select'
  | 'percentage_allocation'
  | 'ssn'
  | 'ein'
  | 'state_selector'
  | 'url'
  | 'number'
  | 'color_swatch'
  | 'checkbox';

export interface Section {
  title?: string;
  type?: string;
  fields?: Field[];
  info?: string;
  repeatable?: boolean;
  action?: string;
  source?: string;
  text?: string;
  id?: string;
  label?: string;
  next?: string;
  method?: string;
}

export interface Action {
  label: string;
  next?: string;
  action?: string;
}

export interface Link {
  label: string;
  url: string;
}

export interface GlobalComponents {
  lawyer_finder: LawyerFinderComponent;
  field_types: Record<string, FieldTypeDefinition>;
  actions: Record<string, ActionDefinition>;
  navigation: NavigationConfig;
  ui_components: UIComponentsConfig;
  data_handling: DataHandlingConfig;
}

export interface LawyerFinderComponent {
  id: string;
  type: string;
  title: string;
  description: string;
  features: {
    criteria: string[];
    display_options: string[];
    ranking_factors: {
      ratings: string[];
      credentials: string[];
      firm_info: string[];
    };
    results: {
      count: string;
      sort_by: string;
      filters: string[];
    };
  };
}

export interface FieldTypeDefinition {
  validation: string;
  maxLength?: number;
  pattern?: string;
  format?: string;
  min?: number;
  max?: number;
  fields?: string[];
  minItems?: number;
  sumTo?: number;
  encrypted?: boolean;
  options?: string[];
  maxSize?: string;
  accept?: string[];
}

export interface ActionDefinition {
  type: string;
  service?: string;
  action?: string;
  target?: string;
  notification?: string;
  templates?: string;
  format?: string;
  provider?: string;
}

export interface NavigationConfig {
  conditional_logic: {
    operators: string[];
    combinators: string[];
  };
  flow_control: {
    jump_to: string;
    skip_if: string;
    loop: string;
    branch: string;
  };
}

export interface UIComponentsConfig {
  form_layouts: string[];
  input_enhancements: {
    autocomplete: boolean;
    real_time_validation: boolean;
    smart_defaults: boolean;
    progressive_disclosure: boolean;
  };
  accessibility: {
    aria_labels: boolean;
    keyboard_navigation: boolean;
    screen_reader_support: boolean;
    high_contrast_mode: boolean;
  };
}

export interface DataHandlingConfig {
  storage: {
    encryption: string;
    retention: string;
    backup: string;
  };
  privacy: {
    gdpr_compliant: boolean;
    ccpa_compliant: boolean;
    data_minimization: boolean;
  };
  export_formats: string[];
}

export interface Configuration {
  version: string;
  last_updated: string;
  author: string;
  license: string;
}

// State management for workflow execution
export interface WorkflowState {
  currentWorkflowId: string;
  currentStepId: string;
  data: Record<string, any>;
  history: StepHistory[];
  completedSteps: string[];
}

export interface StepHistory {
  stepId: string;
  timestamp: Date;
  data: Record<string, any>;
}

// Validation types
export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

export interface ValidationError {
  fieldId: string;
  message: string;
}
