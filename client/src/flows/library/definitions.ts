import { WorkflowDefinition } from "../types";

export const entityFormationFlow: WorkflowDefinition = {
  id: "entity-formation",
  title: "Entity Formation",
  description: "Form a new Delaware C-Corp or LLC quickly and correctly.",
  initialStepId: "state-selection",
  steps: [
    {
      id: "state-selection",
      title: "Formation State",
      description: "Where would you like to incorporate?",
      type: "select",
      fieldLabel: "State",
      options: [
        { label: "Delaware (Recommended)", value: "DE" },
        { label: "California", value: "CA" },
        { label: "New York", value: "NY" },
        { label: "Wyoming", value: "WY" }
      ],
      validation: { required: true },
      nextStepId: "entity-type"
    },
    {
      id: "entity-type",
      title: "Entity Type",
      description: "Choose the type of legal entity.",
      type: "radio",
      fieldLabel: "Type",
      options: [
        { label: "C-Corporation (Best for VC)", value: "c-corp" },
        { label: "LLC (Best for flexibility)", value: "llc" },
        { label: "Public Benefit Corp", value: "pbc" }
      ],
      validation: { required: true },
      nextStepId: "company-name"
    },
    {
      id: "company-name",
      title: "Company Name",
      description: "What is the name of your new company?",
      type: "text",
      fieldLabel: "Company Name",
      placeholder: "e.g., Acme Innovations Inc.",
      validation: { required: true },
      nextStepId: "founders"
    },
    {
      id: "founders",
      title: "Founders",
      description: "List the names of the founders (comma separated for now).",
      type: "text",
      fieldLabel: "Founders",
      placeholder: "Jane Doe, John Smith",
      validation: { required: true },
      nextStepId: "ownership"
    },
    {
      id: "ownership",
      title: "Ownership Split",
      description: "Describe how ownership is split (e.g., 50/50).",
      type: "text",
      fieldLabel: "Split",
      placeholder: "50% Jane, 50% John",
      validation: { required: true },
      nextStepId: "summary"
    },
    {
      id: "summary",
      title: "Review & Submit",
      description: "Review your details before submitting.",
      type: "info",
      fieldLabel: "",
      nextStepId: "complete"
    }
  ]
};

export const personalInjuryFlow: WorkflowDefinition = {
  id: "personal-injury",
  title: "Personal Injury Intake",
  description: "Start your claim process for a personal injury.",
  initialStepId: "personal-info",
  steps: [
    {
      id: "personal-info",
      title: "Personal Information",
      description: "Your full legal name.",
      type: "text",
      fieldLabel: "Full Name",
      validation: { required: true },
      nextStepId: "incident-date"
    },
    {
      id: "incident-date",
      title: "Incident Date",
      description: "When did the incident occur?",
      type: "date",
      fieldLabel: "Date",
      validation: { required: true },
      nextStepId: "incident-type"
    },
    {
      id: "incident-type",
      title: "Incident Type",
      description: "What kind of incident was it?",
      type: "select",
      fieldLabel: "Type",
      options: [
        { label: "Car Accident", value: "car_accident" },
        { label: "Slip and Fall", value: "slip_fall" },
        { label: "Medical Malpractice", value: "medical_malpractice" },
        { label: "Workplace Injury", value: "workplace" }
      ],
      validation: { required: true },
      nextStepId: "injuries"
    },
    {
      id: "injuries",
      title: "Injuries & Treatment",
      description: "Briefly describe your injuries.",
      type: "textarea",
      fieldLabel: "Description",
      validation: { required: true },
      nextStepId: "evidence"
    },
    {
      id: "evidence",
      title: "Evidence",
      description: "Do you have photos or reports? (Placeholder upload)",
      type: "file",
      fieldLabel: "Upload Files",
      nextStepId: "summary"
    },
    {
      id: "summary",
      title: "Summary",
      description: "Ready to submit your claim for review.",
      type: "info",
      nextStepId: "complete"
    }
  ]
};

// TODO: Add more workflow definitions here
// Import your large workflow JSON and add to this file
