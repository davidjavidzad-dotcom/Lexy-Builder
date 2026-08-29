import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  BriefcaseBusiness,
  CheckCircle2,
  Download,
  FileText,
  HelpCircle,
  Home,
  Mail,
  Printer,
  RotateCcw,
  Scale,
  Upload,
} from "lucide-react";
import workflowConfigJson from "../workflows/workflows.json";
import type { Field, Option, Section, Workflow, WorkflowConfig, WorkflowStep } from "../workflows/workflow-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const workflowConfig = workflowConfigJson as WorkflowConfig;

type WorkflowNode = Workflow & { reference?: string };

type HistoryEntry = {
  stepId: string;
  data: Record<string, unknown>;
};

type SavedWorkflowState = {
  selectedWorkflowId: string | null;
  currentStepId: string | null;
  formData: Record<string, unknown>;
  history: HistoryEntry[];
  completedWorkflowIds: string[];
  submittedIntakeId: string | null;
  submitStatus: "idle" | "submitted" | "local";
  updatedAt: string;
};

const STORAGE_KEY = "lexy.workflow.session.v1";
const AUTOSAVE_DELAY = 350;
const CONSENT_FIELD_ID = "goodlegal_submission_consent";

const defaultVehicleColors: Option[] = [
  { label: "White", value: "white" },
  { label: "Black", value: "black" },
  { label: "Gray", value: "gray" },
  { label: "Silver", value: "silver" },
  { label: "Blue", value: "blue" },
  { label: "Red", value: "red" },
  { label: "Green", value: "green" },
  { label: "Brown", value: "brown" },
  { label: "Gold", value: "gold" },
  { label: "Other", value: "other" },
];

const colorSwatchHex: Record<string, string> = {
  white: "#ffffff",
  black: "#111111",
  gray: "#6b7280",
  silver: "#cbd5e1",
  blue: "#2563eb",
  red: "#dc2626",
  green: "#16a34a",
  brown: "#8b5e34",
  gold: "#d4a017",
  other: "linear-gradient(135deg, #ef4444, #f59e0b, #22c55e, #3b82f6)",
};

const stateOptions = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "IA", "ID", "IL", "IN", "KS",
  "KY", "LA", "MA", "MD", "ME", "MI", "MN", "MO", "MS", "MT", "NC", "ND", "NE", "NH", "NJ", "NM",
  "NV", "NY", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VA", "VT", "WA", "WI",
  "WV", "WY",
];

function normalizeOptions(options?: Array<string | Option>): Option[] {
  return (options || []).map((option) =>
    typeof option === "string" ? { label: option, value: option } : option,
  );
}

function isBlank(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function getNestedValue(data: Record<string, unknown>, key: string): unknown {
  return key.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) {
      return (current as Record<string, unknown>)[part];
    }
    return undefined;
  }, data);
}

function evaluateCondition(condition: string | undefined, data: Record<string, unknown>): boolean {
  if (!condition) return true;

  const trimmed = condition.trim();
  const includesMatch = trimmed.match(/^(.+)\.includes\(['"](.+)['"]\)$/);
  if (includesMatch) {
    const value = getNestedValue(data, includesMatch[1].trim());
    return Array.isArray(value) && value.includes(includesMatch[2]);
  }

  if (trimmed.includes("==")) {
    const [field, expected] = trimmed.split("==");
    return String(getNestedValue(data, field.trim()) ?? "") === expected.trim().replace(/^['"]|['"]$/g, "");
  }

  if (trimmed.includes("!=")) {
    const [field, expected] = trimmed.split("!=");
    return String(getNestedValue(data, field.trim()) ?? "") !== expected.trim().replace(/^['"]|['"]$/g, "");
  }

  return Boolean(getNestedValue(data, trimmed));
}

function getWorkflowById(workflowId: string): WorkflowNode | null {
  const parts = workflowId.split(".");
  let current: WorkflowNode | undefined = workflowConfig.workflows[parts[0]] as WorkflowNode | undefined;

  for (let index = 1; index < parts.length; index += 1) {
    current = current?.subtypes?.[parts[index]] as WorkflowNode | undefined;
  }

  if (current?.reference) {
    return getWorkflowById(current.reference);
  }

  return current || null;
}

function getWorkflowCards() {
  return Object.entries(workflowConfig.workflows).map(([id, workflow]) => ({
    id,
    title: workflow.title,
    description: workflow.description,
    category: workflow.category,
    icon: workflow.icon,
    subtypes: workflow.subtypes,
    steps: workflow.steps,
  }));
}

function getFirstStepId(workflow: WorkflowNode): string | null {
  const stepIds = Object.keys(workflow.steps || {});
  return stepIds[0] || null;
}

function getFields(step: WorkflowStep): Field[] {
  const sectionFields = (step.sections || []).flatMap((section) => section.fields || []);
  return [...(step.fields || []), ...sectionFields];
}

function getVisibleFields(step: WorkflowStep, data: Record<string, unknown>): Field[] {
  return getFields(step).filter((field) => evaluateCondition(field.conditional, data));
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null || value === "") return "Not provided";
  if (Array.isArray(value)) {
    return value.map(formatValue).join(", ");
  }
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

function parseListInput(value: string): string[] {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function createExportPayload(workflowId: string, workflow: WorkflowNode, data: Record<string, unknown>) {
  return {
    workflowId,
    workflowTitle: workflow.title,
    generatedAt: new Date().toISOString(),
    data,
  };
}

function downloadText(filename: string, text: string, mimeType: string) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function buildDocumentHtml(workflowTitle: string, data: Record<string, unknown>) {
  const rows = Object.entries(data)
    .map(([key, value]) => `<tr><th>${key}</th><td><pre>${formatValue(value)}</pre></td></tr>`)
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${workflowTitle}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.45; color: #172017; padding: 32px; }
    h1 { font-size: 24px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #d8ded8; padding: 10px; vertical-align: top; text-align: left; }
    th { width: 28%; background: #f4f7f2; }
    pre { white-space: pre-wrap; font-family: inherit; margin: 0; }
  </style>
</head>
<body>
  <h1>${workflowTitle}</h1>
  <p>Generated by Lexy on ${new Date().toLocaleString()}.</p>
  <table>${rows}</table>
</body>
</html>`;
}

export const GoodlegalWorkflow = () => {
  const [, setLocation] = useLocation();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [completedWorkflowIds, setCompletedWorkflowIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState("Saved locally");
  const [submittedIntakeId, setSubmittedIntakeId] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitted" | "local">("idle");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as SavedWorkflowState;
      setSelectedWorkflowId(parsed.selectedWorkflowId);
      setCurrentStepId(parsed.currentStepId);
      setFormData(parsed.formData || {});
      setHistory(parsed.history || []);
      setCompletedWorkflowIds(parsed.completedWorkflowIds || []);
      setSubmittedIntakeId(parsed.submittedIntakeId || null);
      setSubmitStatus(parsed.submitStatus || "idle");
      setSaveStatus(parsed.updatedAt ? `Restored ${new Date(parsed.updatedAt).toLocaleString()}` : "Restored");
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    setSaveStatus("Saving...");
    const timeout = window.setTimeout(() => {
      const payload: SavedWorkflowState = {
        selectedWorkflowId,
        currentStepId,
        formData,
        history,
        completedWorkflowIds,
        submittedIntakeId,
        submitStatus,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setSaveStatus("Saved locally");
    }, AUTOSAVE_DELAY);

    return () => window.clearTimeout(timeout);
  }, [selectedWorkflowId, currentStepId, formData, history, completedWorkflowIds, submittedIntakeId, submitStatus]);

  const workflow = selectedWorkflowId ? getWorkflowById(selectedWorkflowId) : null;
  const currentStep = workflow?.steps && currentStepId ? workflow.steps[currentStepId] : null;
  const workflowCards = useMemo(getWorkflowCards, []);
  const stepIds = useMemo(() => Object.keys(workflow?.steps || {}), [workflow]);
  const progress = currentStepId && stepIds.length > 0 ? ((stepIds.indexOf(currentStepId) + 1) / stepIds.length) * 100 : 0;

  const startWorkflow = useCallback((workflowId: string) => {
    const nextWorkflow = getWorkflowById(workflowId);
    setErrors({});
    setFormData({});
    setHistory([]);
    setSelectedWorkflowId(workflowId);
    setSubmittedIntakeId(null);
    setSubmitStatus("idle");

    if (!nextWorkflow) {
      setCurrentStepId(null);
      return;
    }

    if (nextWorkflow.subtypes && !nextWorkflow.steps) {
      setCurrentStepId("_select_subtype");
      return;
    }

    setCurrentStepId(getFirstStepId(nextWorkflow));
  }, []);

  const resetSession = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSelectedWorkflowId(null);
    setCurrentStepId(null);
    setFormData({});
    setHistory([]);
    setErrors({});
    setSubmittedIntakeId(null);
    setSubmitStatus("idle");
    setSaveStatus("Cleared");
  };

  const updateValue = (fieldId: string, value: unknown) => {
    setFormData((current) => ({ ...current, [fieldId]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[fieldId];
      return next;
    });
  };

  const validateCurrentStep = (): Record<string, string> => {
    if (!currentStep) return {};
    const nextErrors: Record<string, string> = {};

    if (currentStep.type === "decision" || currentStep.type === "selection") {
      if (isBlank(formData[currentStepId || ""])) {
        nextErrors[currentStepId || "selection"] = "Please select an option.";
      }
      return nextErrors;
    }

    if (currentStep.type === "summary" && formData[CONSENT_FIELD_ID] !== true) {
      nextErrors[CONSENT_FIELD_ID] = "Please confirm before submitting.";
      return nextErrors;
    }

    for (const field of getVisibleFields(currentStep, formData)) {
      const value = formData[field.id];
      if (field.required && isBlank(value)) {
        nextErrors[field.id] = `${field.label} is required.`;
      }
      if (!isBlank(value) && field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        nextErrors[field.id] = "Enter a valid email address.";
      }
      if (!isBlank(value) && field.type === "url" && !/^https?:\/\/.+\..+/.test(String(value))) {
        nextErrors[field.id] = "Enter a valid URL beginning with http:// or https://.";
      }
      if (!isBlank(value) && field.pattern && !new RegExp(field.pattern).test(String(value))) {
        nextErrors[field.id] = "Enter this value in the requested format.";
      }
      if (!isBlank(value) && typeof field.min === "number" && Number(value) < field.min) {
        nextErrors[field.id] = `Value must be at least ${field.min}.`;
      }
      if (!isBlank(value) && typeof field.max === "number" && Number(value) > field.max) {
        nextErrors[field.id] = `Value must be no more than ${field.max}.`;
      }
    }

    return nextErrors;
  };

  const completeWorkflow = async () => {
    if (!workflow || !selectedWorkflowId) return;
    const payload = createExportPayload(selectedWorkflowId, workflow, formData);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/intakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: payload.workflowId,
          workflowTitle: payload.workflowTitle,
          data: payload.data,
        }),
      });
      if (!response.ok) throw new Error("Intake submission failed");
      const intake = await response.json() as { id?: string };
      setSubmittedIntakeId(intake.id || null);
      setSubmitStatus("submitted");
    } catch {
      setSubmittedIntakeId(null);
      setSubmitStatus("local");
      // Local persistence still protects the user's answers when the backend is unavailable.
    } finally {
      setIsSubmitting(false);
      setCompletedWorkflowIds((current) => Array.from(new Set([...current, selectedWorkflowId])));
      setCurrentStepId("_complete");
    }
  };

  const goNext = async () => {
    if (!currentStep || !currentStepId || !workflow) return;

    const validationErrors = validateCurrentStep();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    let nextStepId: string | null = currentStep.next || null;
    if ((currentStep.type === "decision" || currentStep.type === "selection") && currentStep.options) {
      const selected = normalizeOptions(currentStep.options).find((option) => option.value === formData[currentStepId]);
      nextStepId = selected?.next || nextStepId;
    }

    setHistory((current) => [...current, { stepId: currentStepId, data: { ...formData } }]);

    if (!nextStepId || !workflow.steps?.[nextStepId]) {
      await completeWorkflow();
      return;
    }

    setCurrentStepId(nextStepId);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    if (currentStepId === "_select_subtype" || currentStepId === "_complete" || history.length === 0) {
      setSelectedWorkflowId(null);
      setCurrentStepId(null);
      setErrors({});
      return;
    }

    const previous = history[history.length - 1];
    setHistory((current) => current.slice(0, -1));
    setCurrentStepId(previous.stepId);
    setFormData(previous.data);
    setErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const exportJson = () => {
    if (!workflow || !selectedWorkflowId) return;
    downloadText(
      `${selectedWorkflowId.replaceAll(".", "-")}-intake.json`,
      JSON.stringify(createExportPayload(selectedWorkflowId, workflow, formData), null, 2),
      "application/json",
    );
  };

  const exportDoc = () => {
    if (!workflow || !selectedWorkflowId) return;
    downloadText(
      `${selectedWorkflowId.replaceAll(".", "-")}-intake.doc`,
      buildDocumentHtml(workflow.title, formData),
      "application/msword",
    );
  };

  const sendEmail = () => {
    if (!workflow || !selectedWorkflowId) return;
    const subject = encodeURIComponent(`Lexy intake: ${workflow.title}`);
    const body = encodeURIComponent(JSON.stringify(createExportPayload(selectedWorkflowId, workflow, formData), null, 2));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const renderField = (field: Field) => {
    if (!evaluateCondition(field.conditional, formData)) return null;

    const value = formData[field.id];
    const error = errors[field.id];
    const options = field.type === "state_selector" ? stateOptions.map((state) => ({ label: state, value: state })) : normalizeOptions(field.options);
    const baseInputClass = cn("mt-2 h-12 text-base", error && "border-destructive focus-visible:ring-destructive");

    const label = (
      <div className="flex items-center gap-2">
        <Label htmlFor={field.id} className="text-sm font-semibold">
          {field.label} {field.required && <span className="text-destructive">*</span>}
        </Label>
        {field.conditional && (
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>This appears based on an earlier answer.</TooltipContent>
          </Tooltip>
        )}
      </div>
    );

    const fieldShell = (control: React.ReactNode) => (
      <div key={field.id} className="space-y-1">
        {field.type !== "checkbox" && label}
        {control}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );

    switch (field.type) {
      case "textarea":
      case "address":
      case "address_search":
        return fieldShell(
          <Textarea
            id={field.id}
            value={String(value || "")}
            onChange={(event) => updateValue(field.id, event.target.value)}
            placeholder={field.placeholder}
            rows={field.rows || 4}
            maxLength={field.maxLength}
            className={cn("mt-2 min-h-32 text-base", error && "border-destructive focus-visible:ring-destructive")}
          />,
        );

      case "email":
      case "phone":
      case "date":
      case "datetime":
      case "number":
      case "currency":
      case "percentage":
      case "url":
      case "ssn":
      case "ein":
      case "text": {
        const type =
          field.type === "phone" ? "tel" :
          field.type === "datetime" ? "datetime-local" :
          field.type === "currency" || field.type === "percentage" ? "number" :
          field.type === "ssn" || field.type === "ein" ? "text" :
          field.type;

        return fieldShell(
          <div className="relative">
            {field.type === "currency" && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>}
            <Input
              id={field.id}
              type={type}
              value={String(value || "")}
              onChange={(event) => updateValue(field.id, event.target.value)}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              maxLength={field.maxLength}
              className={cn(baseInputClass, field.type === "currency" && "pl-8")}
            />
            {field.type === "percentage" && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>}
          </div>,
        );
      }

      case "select":
      case "state_selector":
        return fieldShell(
          <select
            id={field.id}
            value={String(value || "")}
            onChange={(event) => updateValue(field.id, event.target.value)}
            className={cn("mt-2 h-12 w-full rounded-md border border-input bg-background px-3 text-base", error && "border-destructive")}
          >
            <option value="">Select...</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>,
        );

      case "yes_no":
        return fieldShell(
          <div className="mt-2 grid grid-cols-2 gap-3">
            {["yes", "no"].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => updateValue(field.id, option)}
                className={cn(
                  "h-12 rounded-md border text-sm font-semibold capitalize transition-colors",
                  value === option ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-secondary",
                )}
              >
                {option}
              </button>
            ))}
          </div>,
        );

      case "checkbox":
        return fieldShell(
          <label className={cn("mt-2 flex items-start gap-3 rounded-md border p-4", error && "border-destructive")}>
            <input
              id={field.id}
              type="checkbox"
              checked={value === true}
              onChange={(event) => updateValue(field.id, event.target.checked)}
              className="mt-1 h-4 w-4 accent-primary"
            />
            <span className="text-sm font-medium">
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </span>
          </label>,
        );

      case "multi_select":
        if (options.length === 0) {
          const textValue = Array.isArray(value) ? value.join("\n") : String(value || "");
          return fieldShell(
            <Textarea
              id={field.id}
              value={textValue}
              onChange={(event) => updateValue(field.id, parseListInput(event.target.value))}
              placeholder={field.source ? `Enter ${field.label.toLowerCase()}, one per line` : "Enter each item on its own line"}
              rows={4}
              className={cn("mt-2 min-h-28 text-base", error && "border-destructive focus-visible:ring-destructive")}
            />,
          );
        }

        return fieldShell(
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {options.map((option) => {
              const values = Array.isArray(value) ? value : [];
              const selected = values.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateValue(field.id, selected ? values.filter((item) => item !== option.value) : [...values, option.value])}
                  className={cn(
                    "rounded-md border p-3 text-left text-sm font-medium transition-colors",
                    selected ? "border-primary bg-accent text-accent-foreground" : "border-input hover:bg-secondary",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>,
        );

      case "color_swatch": {
        const colorOptions = options.length > 0 ? options : defaultVehicleColors;
        const selectedValue = String(value || "");

        return fieldShell(
          <div className="mt-2 space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {colorOptions.map((option) => {
                const isOther = option.value === "other";
                const selected = selectedValue === option.value || (isOther && selectedValue.startsWith("other:"));
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateValue(field.id, isOther ? "other:" : option.value)}
                    className={cn(
                      "flex h-12 items-center gap-3 rounded-md border px-3 text-left text-sm font-medium transition-colors",
                      selected ? "border-primary bg-accent text-accent-foreground" : "border-input hover:bg-secondary",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="h-6 w-6 shrink-0 rounded-full border border-border shadow-sm"
                      style={{ background: colorSwatchHex[option.value.toLowerCase()] || option.value }}
                    />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
            {selectedValue.startsWith("other:") && (
              <Input
                value={selectedValue.replace(/^other:/, "")}
                onChange={(event) => updateValue(field.id, `other:${event.target.value}`)}
                placeholder="Describe the vehicle color"
                className={baseInputClass}
              />
            )}
          </div>,
        );
      }

      case "file_upload":
      case "file_or_text":
        return fieldShell(
          <div className="mt-2 space-y-3">
            <label className={cn("flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed p-6 text-center hover:bg-secondary/60", error && "border-destructive")}>
              <Upload className="mb-2 h-7 w-7 text-muted-foreground" />
              <span className="text-sm font-medium">Upload files</span>
              <span className="text-xs text-muted-foreground">{field.accept || "PDF, images, and documents"}</span>
              <input
                id={field.id}
                type="file"
                accept={field.accept}
                multiple={field.multiple}
                className="sr-only"
                onChange={(event) => {
                  const files = Array.from(event.target.files || []).map((file) => ({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    lastModified: file.lastModified,
                  }));
                  updateValue(field.id, field.multiple ? files : files[0]);
                }}
              />
            </label>
            {field.type === "file_or_text" && (
              <Textarea
                value={typeof value === "string" ? value : ""}
                onChange={(event) => updateValue(field.id, event.target.value)}
                placeholder="Or paste the relevant text here..."
              />
            )}
            {!isBlank(value) && <p className="text-xs text-muted-foreground">Saved: {formatValue(value)}</p>}
          </div>,
        );

      case "percentage_allocation":
        return fieldShell(
          <Textarea
            id={field.id}
            value={String(value || "")}
            onChange={(event) => updateValue(field.id, event.target.value)}
            placeholder={field.placeholder || "Example: Jane 50%, John 50%"}
            rows={4}
            className={cn("mt-2 min-h-28 text-base", error && "border-destructive focus-visible:ring-destructive")}
          />,
        );

      default:
        return fieldShell(
          <Input
            id={field.id}
            value={String(value || "")}
            onChange={(event) => updateValue(field.id, event.target.value)}
            placeholder={field.placeholder}
            className={baseInputClass}
          />,
        );
    }
  };

  const renderFormStep = (step: WorkflowStep) => {
    if (step.sections?.length) {
      return (
        <div className="space-y-8">
          {step.sections.map((section: Section, index) => (
            <section key={section.id || section.title || index} className="space-y-4">
              {section.title && <h3 className="text-lg font-semibold">{section.title}</h3>}
              {section.info && <p className="text-sm leading-6 text-muted-foreground">{section.info}</p>}
              <div className="grid gap-5">{section.fields?.map(renderField)}</div>
            </section>
          ))}
        </div>
      );
    }

    return <div className="grid gap-5">{step.fields?.map(renderField)}</div>;
  };

  const renderDecisionStep = (step: WorkflowStep) => {
    const selectionKey = currentStepId || "selection";
    const selectedValue = formData[selectionKey];
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {normalizeOptions(step.options).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => updateValue(selectionKey, option.value)}
            className={cn(
              "rounded-md border p-5 text-left transition-colors",
              selectedValue === option.value ? "border-primary bg-accent text-accent-foreground" : "border-input hover:bg-secondary",
            )}
          >
            <span className="block font-semibold">{option.label}</span>
          </button>
        ))}
        {errors[selectionKey] && <p className="sm:col-span-2 text-sm text-destructive">{errors[selectionKey]}</p>}
      </div>
    );
  };

  const renderUtilityStep = (step: WorkflowStep) => {
    const dataEntries = Object.entries(formData).filter(([key]) => key !== CONSENT_FIELD_ID);

    if (step.type === "summary" || step.type === "confirmation") {
      return (
        <div className="space-y-4">
          <div className="rounded-md border bg-secondary/35">
            {dataEntries.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">No answers collected yet.</p>
            ) : (
              dataEntries.map(([key, value]) => (
                <div key={key} className="grid gap-2 border-b p-4 last:border-b-0 sm:grid-cols-[220px_1fr]">
                  <div className="text-sm font-semibold">{key.replaceAll("_", " ")}</div>
                  <div className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{formatValue(value)}</div>
                </div>
              ))
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={exportJson}><Download className="mr-2 h-4 w-4" /> JSON</Button>
            <Button type="button" variant="outline" onClick={exportDoc}><FileText className="mr-2 h-4 w-4" /> DOC</Button>
            <Button type="button" variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> PDF</Button>
            <Button type="button" variant="outline" onClick={sendEmail}><Mail className="mr-2 h-4 w-4" /> Email</Button>
          </div>
          {step.type === "summary" && (
            <label className={cn("flex items-start gap-3 rounded-md border p-4", errors[CONSENT_FIELD_ID] && "border-destructive bg-destructive/5")}>
              <input
                type="checkbox"
                checked={formData[CONSENT_FIELD_ID] === true}
                onChange={(event) => updateValue(CONSENT_FIELD_ID, event.target.checked)}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <span className="text-sm leading-6 text-muted-foreground">
                I understand Lexy is not a lawyer, GoodLegal is not providing legal advice through this intake, and submitting this form allows GoodLegal to review my answers and contact me or match me with legal help.
                {errors[CONSENT_FIELD_ID] && <span className="mt-1 block text-destructive">{errors[CONSENT_FIELD_ID]}</span>}
              </span>
            </label>
          )}
        </div>
      );
    }

    if (step.type === "lawyer_finder") {
      return (
        <div className="rounded-md border bg-secondary/35 p-6">
          <p className="mb-4 text-muted-foreground">{step.message || step.content || "Lexy can match this intake with a relevant legal professional."}</p>
          <Button type="button" onClick={() => setLocation(`/directory?source=${selectedWorkflowId}`)}>Find matched lawyers</Button>
        </div>
      );
    }

    if (step.type === "document_selection" || step.type === "document_preview" || step.type === "ai_analysis" || step.type === "integrated_search") {
      return (
        <div className="rounded-md border bg-secondary/35 p-6 text-sm leading-6 text-muted-foreground">
          <p>{step.content || step.message || step.dynamic_content || "This production hook is ready for a connected document or AI service."}</p>
        </div>
      );
    }

    return (
      <div className="rounded-md border bg-secondary/35 p-6 text-sm leading-6 text-muted-foreground">
        <p>{step.content || step.note || step.message || "Continue to the next step."}</p>
        {step.links?.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {step.links.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="text-primary underline">
                {link.label}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    );
  };

  const renderStepBody = () => {
    if (!currentStep) return null;

    if (currentStep.type === "form") return renderFormStep(currentStep);
    if (currentStep.type === "decision" || currentStep.type === "selection") return renderDecisionStep(currentStep);
    return renderUtilityStep(currentStep);
  };

  if (selectedWorkflowId && currentStepId === "_select_subtype") {
    const selected = getWorkflowById(selectedWorkflowId);
    const subtypes = Object.entries(selected?.subtypes || {});

    return (
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Button variant="ghost" onClick={goBack} className="mb-6"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{selected?.title}</h1>
          <p className="mt-2 text-muted-foreground">{selected?.description}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {subtypes.map(([subtypeId, subtype]) => {
            const fullId = `${selectedWorkflowId}.${subtypeId}`;
            const isReady = Boolean((subtype as WorkflowNode).steps && Object.keys((subtype as WorkflowNode).steps || {}).length);
            return (
              <Card key={fullId} className="border-border">
                <CardHeader>
                  <CardTitle>{subtype.title}</CardTitle>
                  <CardDescription>{subtype.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant={isReady ? "default" : "outline"} onClick={() => startWorkflow(fullId)}>
                    {isReady ? "Start" : "Create intake shell"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  if (selectedWorkflowId && currentStepId === "_complete" && workflow) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-14">
        <div className="rounded-md border bg-card p-8 text-center">
          <CheckCircle2 className="mx-auto mb-5 h-12 w-12 text-primary" />
          <h1 className="text-3xl font-bold">{submitStatus === "submitted" ? "Submitted to GoodLegal" : "Lexy Complete"}</h1>
          <p className="mt-3 text-muted-foreground">
            {submitStatus === "submitted"
              ? "Lexy organized your answers into an intake GoodLegal can review and match with the right legal help."
              : "Your answers are saved in this browser. You can export them now, and GoodLegal will submit them once the server is reachable."}
          </p>
          {submittedIntakeId && (
            <div className="mx-auto mt-5 max-w-md rounded-md border bg-secondary/35 px-4 py-3 text-sm">
              Intake ID: <span className="font-semibold">{submittedIntakeId}</span>
            </div>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={exportJson} variant="outline"><Download className="mr-2 h-4 w-4" /> JSON</Button>
            <Button onClick={exportDoc} variant="outline"><FileText className="mr-2 h-4 w-4" /> DOC</Button>
            <Button onClick={() => window.print()} variant="outline"><Printer className="mr-2 h-4 w-4" /> PDF</Button>
            <Button onClick={() => setLocation(`/directory?source=${selectedWorkflowId}${submittedIntakeId ? `&intake=${submittedIntakeId}` : ""}`)}>Find Lawyers</Button>
          </div>
          <Button variant="ghost" onClick={resetSession} className="mt-6"><RotateCcw className="mr-2 h-4 w-4" /> Start over</Button>
        </div>
      </div>
    );
  }

  if (selectedWorkflowId && workflow && !currentStep) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-14">
        <div className="rounded-md border bg-card p-8">
          <Badge variant="outline" className="mb-4">Intake shell</Badge>
          <h1 className="text-3xl font-bold">{workflow.title}</h1>
          <p className="mt-3 text-muted-foreground">
            This Lexy track is present in the GoodLegal schema, but its step sequence has not been filled in yet.
            The renderer is ready for it as soon as steps are added to the existing JSON.
          </p>
          <div className="mt-8 flex gap-3">
            <Button variant="outline" onClick={goBack}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
            <Button onClick={resetSession}>Return to Lexy</Button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedWorkflowId && workflow && currentStep) {
    return (
      <TooltipProvider>
        <div className="min-h-[calc(100vh-64px)] bg-background">
          <div className="border-b bg-card">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Link href="/lexy" className="hover:text-foreground">Lexy</Link>
                    <span>/</span>
                    <span>{workflow.title}</span>
                  </div>
                  <h1 className="mt-1 text-2xl font-bold">{workflow.title}</h1>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">{saveStatus}</Badge>
                  <Button variant="outline" size="sm" onClick={resetSession}><RotateCcw className="mr-2 h-4 w-4" /> Reset</Button>
                </div>
              </div>
              <div className="mt-4">
                <Progress value={progress} />
                <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                  <span>{currentStepId}</span>
                  <span>{Math.max(1, stepIds.indexOf(currentStepId || "") + 1)} of {stepIds.length}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto grid gap-8 px-4 py-8 lg:grid-cols-[260px_1fr]">
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-2">
                {stepIds.map((stepId) => {
                  const isCurrent = stepId === currentStepId;
                  const isVisited = history.some((entry) => entry.stepId === stepId);
                  return (
                    <div
                      key={stepId}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                        isCurrent ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                      )}
                    >
                      {isVisited ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <span className="h-4 w-4 rounded-full border" />}
                      <span className="truncate">{workflow.steps?.[stepId]?.title || workflow.steps?.[stepId]?.question || stepId}</span>
                    </div>
                  );
                })}
              </div>
            </aside>

            <main className="mx-auto w-full max-w-3xl">
              <div className="mb-8">
                {currentStep.type && <Badge variant="outline" className="mb-3">{currentStep.type.replaceAll("_", " ")}</Badge>}
                <h2 className="text-3xl font-bold">{currentStep.title || currentStep.question || "Next Step"}</h2>
                {currentStep.question && currentStep.title && <p className="mt-3 text-lg text-muted-foreground">{currentStep.question}</p>}
                {currentStep.note && <p className="mt-3 rounded-md border bg-secondary/50 p-3 text-sm text-muted-foreground">{currentStep.note}</p>}
                {currentStep.info && <p className="mt-3 text-sm leading-6 text-muted-foreground">{currentStep.info}</p>}
              </div>

              {Object.keys(errors).length > 0 && (
                <div className="mb-6 flex gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4" />
                  <span>Please complete the highlighted items before continuing.</span>
                </div>
              )}

              {renderStepBody()}

              <div className="mt-10 flex items-center justify-between border-t pt-6">
                <Button variant="ghost" onClick={goBack}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
                <Button onClick={goNext} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : currentStep.type === "summary" ? "Submit" : "Continue"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </main>
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold">Lexy</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
            Lexy asks the right questions, saves your progress, and helps GoodLegal find the best legal help for your situation.
          </p>
        </div>
        {selectedWorkflowId || Object.keys(formData).length ? (
          <Button variant="outline" onClick={resetSession}><RotateCcw className="mr-2 h-4 w-4" /> Clear saved progress</Button>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {workflowCards.map((workflowCard) => {
          const Icon =
            workflowCard.category === "personal_injury" ? Scale :
            workflowCard.category === "employment" ? BriefcaseBusiness :
            workflowCard.category === "real_estate" ? Home :
            workflowCard.category === "business" ? BadgeDollarSign :
            FileText;
          const stepCount = Object.keys(workflowCard.steps || {}).length;
          const subtypeCount = Object.keys(workflowCard.subtypes || {}).length;
          const complete = completedWorkflowIds.includes(workflowCard.id);

          return (
            <Card key={workflowCard.id} className="flex min-h-64 flex-col border-border transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle>{workflowCard.title}</CardTitle>
                <CardDescription>{workflowCard.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <div className="mb-4 flex flex-wrap gap-2">
                  <Badge variant="secondary">{subtypeCount ? `${subtypeCount} tracks` : `${stepCount} steps`}</Badge>
                  {complete && <Badge className="bg-primary text-primary-foreground">Completed</Badge>}
                </div>
                <Button className="w-full" onClick={() => startWorkflow(workflowCard.id)}>
                  Start <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default GoodlegalWorkflow;
