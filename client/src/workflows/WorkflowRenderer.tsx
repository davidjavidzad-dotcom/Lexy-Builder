// React Component for Rendering Workflow Steps
import React, { useState, useEffect } from 'react';
import { WorkflowEngine } from './workflow-engine';
import { WorkflowStep, Field, Option } from './workflow-types';
import workflowConfig from './workflows.json';

interface WorkflowRendererProps {
  workflowId: string;
  onComplete?: (data: Record<string, any>) => void;
}

export const WorkflowRenderer: React.FC<WorkflowRendererProps> = ({ 
  workflowId, 
  onComplete 
}) => {
  const [engine] = useState(() => new WorkflowEngine(workflowConfig));
  const [currentStep, setCurrentStep] = useState<WorkflowStep | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize workflow
    const step = engine.startWorkflow(workflowId);
    setCurrentStep(step);

    // Set up listeners
    engine.setStateChangeListener((state) => {
      console.log('State changed:', state);
    });

    if (onComplete) {
      engine.setCompletionListener(onComplete);
    }
  }, [workflowId]);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    // Clear error for this field
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldId];
      return newErrors;
    });
  };

  const handleNext = async () => {
    if (!currentStep) return;

    try {
      setLoading(true);
      setErrors({});

      // Prepare data based on step type
      let stepData: Record<string, any> = {};
      
      if (currentStep.type === 'form' && currentStep.fields) {
        stepData = formData;
      } else if (currentStep.type === 'decision' || currentStep.type === 'selection') {
        stepData = { [engine.getState().currentStepId]: formData.selectedOption };
      }

      // Process step
      const nextStep = engine.processStep(stepData);
      setCurrentStep(nextStep);
      setFormData({}); // Clear form for next step
    } catch (error: any) {
      console.error('Error processing step:', error);
      if (error.message.includes('Validation failed')) {
        const validationErrors = JSON.parse(
          error.message.replace('Validation failed: ', '')
        );
        const errorMap: Record<string, string> = {};
        validationErrors.forEach((err: any) => {
          errorMap[err.fieldId] = err.message;
        });
        setErrors(errorMap);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    const previousStep = engine.goBack();
    setCurrentStep(previousStep);
    setFormData({});
    setErrors({});
  };

  const renderField = (field: Field) => {
    // Check conditional rendering
    if (field.conditional) {
      const shouldShow = evaluateCondition(field.conditional, engine.getData());
      if (!shouldShow) return null;
    }

    const value = formData[field.id] || '';
    const error = errors[field.id];

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.id} className="form-field">
            <label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <input
              id={field.id}
              type={field.type === 'email' ? 'email' : 'text'}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className={error ? 'error' : ''}
            />
            {error && <span className="error-message">{error}</span>}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className="form-field">
            <label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <textarea
              id={field.id}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              rows={field.rows || 4}
              className={error ? 'error' : ''}
            />
            {error && <span className="error-message">{error}</span>}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} className="form-field">
            <label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <select
              id={field.id}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={error ? 'error' : ''}
            >
              <option value="">Select...</option>
              {field.options?.map((option) => {
                if (typeof option === 'string') {
                  return <option key={option} value={option}>{option}</option>;
                } else {
                  return <option key={option.value} value={option.value}>{option.label}</option>;
                }
              })}
            </select>
            {error && <span className="error-message">{error}</span>}
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className="form-field">
            <label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <input
              id={field.id}
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={error ? 'error' : ''}
            />
            {error && <span className="error-message">{error}</span>}
          </div>
        );

      case 'yes_no':
        return (
          <div key={field.id} className="form-field">
            <label>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name={field.id}
                  value="yes"
                  checked={value === 'yes'}
                  onChange={() => handleFieldChange(field.id, 'yes')}
                />
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name={field.id}
                  value="no"
                  checked={value === 'no'}
                  onChange={() => handleFieldChange(field.id, 'no')}
                />
                No
              </label>
            </div>
            {error && <span className="error-message">{error}</span>}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} className="form-field checkbox-field">
            <label>
              <input
                type="checkbox"
                checked={value === true}
                onChange={(e) => handleFieldChange(field.id, e.target.checked)}
              />
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            {error && <span className="error-message">{error}</span>}
          </div>
        );

      case 'multi_select':
        return (
          <div key={field.id} className="form-field">
            <label>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <div className="checkbox-group">
              {field.options?.map((option) => {
                const optionValue = typeof option === 'string' ? option : option.value;
                const optionLabel = typeof option === 'string' ? option : option.label;
                const isChecked = Array.isArray(value) && value.includes(optionValue);
                
                return (
                  <label key={optionValue}>
                    <input
                      type="checkbox"
                      value={optionValue}
                      checked={isChecked}
                      onChange={(e) => {
                        const currentValues = Array.isArray(value) ? value : [];
                        const newValues = e.target.checked
                          ? [...currentValues, optionValue]
                          : currentValues.filter(v => v !== optionValue);
                        handleFieldChange(field.id, newValues);
                      }}
                    />
                    {optionLabel}
                  </label>
                );
              })}
            </div>
            {error && <span className="error-message">{error}</span>}
          </div>
        );

      case 'file_upload':
        return (
          <div key={field.id} className="form-field">
            <label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <input
              id={field.id}
              type="file"
              accept={field.accept}
              multiple={field.multiple}
              onChange={(e) => handleFieldChange(field.id, e.target.files)}
              className={error ? 'error' : ''}
            />
            {error && <span className="error-message">{error}</span>}
          </div>
        );

      default:
        return (
          <div key={field.id} className="form-field">
            <label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            <input
              id={field.id}
              type="text"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={error ? 'error' : ''}
            />
            {error && <span className="error-message">{error}</span>}
          </div>
        );
    }
  };

  const renderStep = () => {
    if (!currentStep) {
      return <div>Workflow completed!</div>;
    }

    switch (currentStep.type) {
      case 'form':
        return (
          <div className="workflow-form">
            {currentStep.title && <h2>{currentStep.title}</h2>}
            {currentStep.note && <p className="note">{currentStep.note}</p>}
            
            {currentStep.sections ? (
              currentStep.sections.map((section, index) => (
                <div key={index} className="form-section">
                  {section.title && <h3>{section.title}</h3>}
                  {section.info && <p className="info">{section.info}</p>}
                  {section.fields?.map(renderField)}
                </div>
              ))
            ) : (
              currentStep.fields?.map(renderField)
            )}
          </div>
        );

      case 'decision':
      case 'selection':
        return (
          <div className="workflow-decision">
            {currentStep.title && <h2>{currentStep.title}</h2>}
            {currentStep.question && <p className="question">{currentStep.question}</p>}
            
            <div className="options">
              {currentStep.options?.map((option) => (
                <label key={option.value} className="option">
                  <input
                    type="radio"
                    name="decision"
                    value={option.value}
                    checked={formData.selectedOption === option.value}
                    onChange={() => setFormData({ selectedOption: option.value })}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'information':
        return (
          <div className="workflow-information">
            {currentStep.title && <h2>{currentStep.title}</h2>}
            {currentStep.content && <div dangerouslySetInnerHTML={{ __html: currentStep.content }} />}
            {currentStep.links && (
              <div className="links">
                {currentStep.links.map((link) => (
                  <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        );

      case 'summary':
        return (
          <div className="workflow-summary">
            {currentStep.title && <h2>{currentStep.title}</h2>}
            <div className="summary-content">
              {/* Render summary of collected data */}
              <pre>{JSON.stringify(engine.getData(), null, 2)}</pre>
            </div>
          </div>
        );

      default:
        return <div>Step type not implemented: {currentStep.type}</div>;
    }
  };

  const evaluateCondition = (condition: string, data: Record<string, any>): boolean => {
    if (condition.includes('==')) {
      const [field, value] = condition.split('==');
      return data[field.trim()] === value.trim();
    }
    return true;
  };

  return (
    <div className="workflow-renderer">
      <div className="workflow-content">
        {renderStep()}
      </div>
      
      <div className="workflow-navigation">
        <button 
          onClick={handleBack} 
          disabled={engine.getState().history.length === 0}
          className="btn btn-secondary"
        >
          Back
        </button>
        <button 
          onClick={handleNext} 
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Processing...' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default WorkflowRenderer;
