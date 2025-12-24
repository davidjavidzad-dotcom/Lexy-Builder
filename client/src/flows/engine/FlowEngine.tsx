import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { WorkflowDefinition, WorkflowStep } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProgressBar } from "@/components/ui/progress-bar";
import { CheckCircle2, Circle, ArrowRight, ArrowLeft, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FlowEngineProps {
  workflow: WorkflowDefinition;
}

export function FlowEngine({ workflow }: FlowEngineProps) {
  const [_, setLocation] = useLocation();
  
  // State initialization
  const [currentStepId, setCurrentStepId] = useState(workflow.initialStepId);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [history, setHistory] = useState<string[]>([]); // To handle "Back" correctly with branching

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`workflow-${workflow.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAnswers(parsed);
      } catch (e) {
        console.error("Failed to load saved answers", e);
      }
    }
  }, [workflow.id]);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem(`workflow-${workflow.id}`, JSON.stringify(answers));
  }, [workflow.id, answers]);

  const currentStep = workflow.steps.find(s => s.id === currentStepId);

  // Helper to calculate progress
  const currentStepIndex = workflow.steps.findIndex(s => s.id === currentStepId);
  const totalSteps = workflow.steps.length;
  // This is a naive progress calc because of branching, but sufficient for mockup
  const progress = ((currentStepIndex + 1) / totalSteps) * 100;

  if (!currentStep) return <div>Step not found</div>;

  const handleNext = () => {
    // Basic validation
    if (currentStep.validation?.required && !answers[currentStepId] && currentStep.type !== 'info') {
      alert("Please complete this field.");
      return;
    }

    if (currentStep.nextStepId === "complete") {
      // Submit
      const intakePayload = {
        workflowId: workflow.id,
        workflowTitle: workflow.title,
        data: answers,
        completedAt: new Date().toISOString()
      };
      
      // In a real app, we'd POST this. Here we pass it via state or just assume it's "saved"
      // and redirect to directory with some filters pre-filled.
      localStorage.setItem("latestIntake", JSON.stringify(intakePayload));
      setLocation(`/directory?source=${workflow.id}`);
    } else if (currentStep.nextStepId) {
      setHistory([...history, currentStepId]);
      setCurrentStepId(currentStep.nextStepId);
    }
  };

  const handleBack = () => {
    const prev = history[history.length - 1];
    if (prev) {
      setHistory(history.slice(0, -1));
      setCurrentStepId(prev);
    }
  };

  const handleChange = (value: any) => {
    setAnswers({ ...answers, [currentStepId]: value });
  };

  // Step Renderer
  const renderStepInput = (step: WorkflowStep) => {
    const value = answers[step.id] || "";

    switch (step.type) {
      case 'text':
      case 'address':
        return (
          <Input 
            value={value} 
            onChange={(e) => handleChange(e.target.value)} 
            placeholder={step.placeholder}
            className="text-lg py-6"
            autoFocus
          />
        );
      case 'number':
        return (
          <Input 
            type="number"
            value={value} 
            onChange={(e) => handleChange(e.target.value)} 
            placeholder={step.placeholder}
            className="text-lg py-6"
          />
        );
      case 'textarea':
        return (
          <Textarea 
            value={value} 
            onChange={(e) => handleChange(e.target.value)} 
            placeholder={step.placeholder}
            className="min-h-[150px] text-lg"
          />
        );
      case 'select':
        return (
          <Select value={value} onValueChange={handleChange}>
            <SelectTrigger className="w-full text-lg py-6">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {step.options?.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'radio':
        return (
          <RadioGroup value={value} onValueChange={handleChange} className="space-y-3">
            {step.options?.map(opt => (
              <div key={opt.value} className="flex items-center space-x-2 border p-4 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors">
                <RadioGroupItem value={opt.value} id={opt.value} />
                <Label htmlFor={opt.value} className="flex-1 cursor-pointer font-medium">{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      case 'date':
        return (
          <Input 
            type="date" 
            value={value} 
            onChange={(e) => handleChange(e.target.value)}
            className="text-lg py-6"
          />
        );
      case 'file':
        return (
          <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:bg-secondary/50 transition-colors cursor-pointer">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-medium">Drag & drop files here, or click to select</p>
            <p className="text-xs text-muted-foreground mt-2">(This is a placeholder)</p>
          </div>
        );
      case 'info':
        return (
          <div className="bg-secondary/30 p-6 rounded-lg space-y-4">
             <div className="flex items-center gap-3 text-primary">
                <CheckCircle2 className="h-6 w-6" />
                <h3 className="font-bold text-lg">Ready to Submit</h3>
             </div>
             <div className="space-y-2">
                {Object.entries(answers).map(([key, val]) => {
                  const stepTitle = workflow.steps.find(s => s.id === key)?.title || key;
                  return (
                    <div key={key} className="flex justify-between border-b border-border/50 pb-2">
                       <span className="text-muted-foreground">{stepTitle}</span>
                       <span className="font-medium max-w-[50%] truncate">{String(val)}</span>
                    </div>
                  );
                })}
             </div>
          </div>
        );
      default:
        return <div>Unsupported step type</div>;
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)] bg-background">
      {/* Sidebar */}
      <div className="w-full md:w-64 border-r border-border bg-card p-6 hidden md:block">
        <h2 className="font-bold text-lg mb-6">{workflow.title}</h2>
        <div className="space-y-1">
          {workflow.steps.map((step) => {
            const isCompleted = answers[step.id] !== undefined;
            const isCurrent = step.id === currentStepId;
            
            return (
              <div 
                key={step.id} 
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isCurrent ? "bg-secondary text-primary" : "text-muted-foreground",
                  isCompleted && !isCurrent ? "text-foreground" : ""
                )}
              >
                {isCompleted ? (
                   <CheckCircle2 className="w-4 h-4 text-primary" />
                ) : (
                   <Circle className={cn("w-4 h-4", isCurrent ? "text-primary" : "text-muted-foreground/30")} />
                )}
                {step.title}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Progress */}
        <div className="md:hidden p-4 border-b border-border">
          <ProgressBar value={progress} className="h-1 mb-2" />
          <div className="text-sm font-medium text-muted-foreground flex justify-between">
             <span>{workflow.title}</span>
             <span>Step {currentStepIndex + 1} of {totalSteps}</span>
          </div>
        </div>

        <div className="flex-1 p-6 md:p-12 max-w-3xl mx-auto w-full flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepId}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div>
                <div className="text-sm font-bold text-primary mb-2 uppercase tracking-wider">
                  Step {currentStepIndex + 1}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">{currentStep.title}</h1>
                <p className="text-lg text-muted-foreground">{currentStep.description}</p>
              </div>

              <div className="space-y-4">
                {currentStep.fieldLabel && (
                  <Label className="text-base font-semibold">{currentStep.fieldLabel}</Label>
                )}
                {renderStepInput(currentStep)}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-border p-6 bg-background">
          <div className="max-w-3xl mx-auto w-full flex justify-between items-center">
             <Button 
               variant="ghost" 
               onClick={handleBack} 
               disabled={history.length === 0}
               className="text-muted-foreground"
             >
               <ArrowLeft className="mr-2 h-4 w-4" /> Back
             </Button>
             
             <Button 
               onClick={handleNext}
               className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg rounded-full shadow-lg shadow-primary/20"
             >
               {currentStep.nextStepId === 'complete' ? 'Submit Workflow' : 'Continue'} 
               <ArrowRight className="ml-2 h-5 w-5" />
             </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
