  import React, { useState } from 'react';
  import workflowConfig from '../workflows/workflows.json';

  export const GoodlegalWorkflow = () => {
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    const [currentStepId, setCurrentStepId] = useState(null);
    const [formData, setFormData] = useState({});
    const [stepHistory, setStepHistory] = useState([]);

    // Get list of workflows
    const workflows = Object.entries(workflowConfig.workflows).map(([id, workflow]) => ({
      id,
      title: workflow.title,
      description: workflow.description
    }));

    // Get current workflow
    const getWorkflow = (id) => {
      const parts = id.split('.');
      let current = workflowConfig.workflows[parts[0]];
      for (let i = 1; i < parts.length; i++) {
        if (current.subtypes) {
          current = current.subtypes[parts[i]];
        }
      }
      return current;
    };

    // Get current step
    const getCurrentStep = () => {
      if (!selectedWorkflow || !currentStepId) return null;
      const workflow = getWorkflow(selectedWorkflow);
      if (!workflow || !workflow.steps) return null;
      return workflow.steps[currentStepId];
    };

    // Handle answer submission
    const handleAnswer = (answer) => {
      const currentStep = getCurrentStep();
      if (!currentStep) return;

      // Save answer
      const newFormData = { ...formData, [currentStepId]: answer };
      setFormData(newFormData);

      // Add to history
      setStepHistory([...stepHistory, currentStepId]);

      // Determine next step
      let nextStepId = null;

      if (currentStep.type === 'decision' && currentStep.options) {
        const selectedOption = currentStep.options.find(opt => opt.value === answer);
        nextStepId = selectedOption?.next;
      } else if (currentStep.type === 'selection' && currentStep.options) {
        const selectedOption = currentStep.options.find(opt => opt.value === answer);
        nextStepId = selectedOption?.next;
      } else if (currentStep.next) {
        nextStepId = currentStep.next;
      }

      if (nextStepId) {
        setCurrentStepId(nextStepId);
      } else {
        // Workflow complete
        alert(`Workflow complete! Collected data: ${JSON.stringify(newFormData, null, 2)}`);
        setSelectedWorkflow(null);
        setCurrentStepId(null);
        setFormData({});
        setStepHistory([]);
      }
    };

    // Start a workflow
    const startWorkflow = (workflowId) => {
      setSelectedWorkflow(workflowId);
      const workflow = getWorkflow(workflowId);
      if (workflow && workflow.steps) {
        const firstStepId = Object.keys(workflow.steps)[0];
        setCurrentStepId(firstStepId);
      } else if (workflow && workflow.subtypes) {
        // Show subtype selection
        setCurrentStepId('_select_subtype');
      }
    };

    // Go back
    const goBack = () => {
      if (stepHistory.length > 0) {
        const newHistory = [...stepHistory];
        const previousStep = newHistory.pop();
        setStepHistory(newHistory);
        setCurrentStepId(previousStep);
      } else {
        setSelectedWorkflow(null);
        setCurrentStepId(null);
      }
    };

    // Render current step
    if (selectedWorkflow && currentStepId) {
      const workflow = getWorkflow(selectedWorkflow);

      // Special case: subtype selection
      if (currentStepId === '_select_subtype' && workflow.subtypes) {
        const subtypes = Object.entries(workflow.subtypes).map(([id, subtype]) => ({
          id: `${selectedWorkflow}.${id}`,
          title: subtype.title,
          description: subtype.description
        }));

        return (
          <div style={{
            maxWidth: '800px',
            margin: '50px auto',
            padding: '40px',
            background: 'white',
            borderRadius: '12px'
          }}>
            <button onClick={goBack} style={{
              marginBottom: '30px',
              padding: '10px 20px',
              background: '#f0f0f0',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}>
              ← Back
            </button>

            <h2 style={{ marginBottom: '30px' }}>Select Type</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {subtypes.map(subtype => (
                <button
                  key={subtype.id}
                  onClick={() => startWorkflow(subtype.id)}
                  style={{
                    padding: '20px',
                    background: '#f8f9fa',
                    border: '2px solid #dee2e6',
                    borderRadius: '8px',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <h4 style={{ margin: '0 0 10px 0' }}>{subtype.title}</h4>
                  <p style={{ margin: 0, color: '#6c757d' }}>{subtype.description}</p>
                </button>
              ))}
            </div>
          </div>
        );
      }

      const currentStep = getCurrentStep();
      if (!currentStep) {
        return <div>Step not found</div>;
      }

      return (
        <div style={{
          maxWidth: '700px',
          margin: '50px auto',
          padding: '40px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <button onClick={goBack} style={{
            marginBottom: '30px',
            padding: '10px 20px',
            background: '#f0f0f0',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}>
            ← Back
          </button>

          <div style={{ marginBottom: '20px', color: '#666' }}>
            Step {stepHistory.length + 1}
          </div>

          {currentStep.title && (
            <h2 style={{ marginBottom: '30px' }}>{currentStep.title}</h2>
          )}

          {currentStep.question && (
            <h3 style={{ marginBottom: '30px' }}>{currentStep.question}</h3>
          )}

          {currentStep.type === 'decision' && currentStep.options && (
            <div style={{ display: 'flex', gap: '20px' }}>
              {currentStep.options.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  style={{
                    flex: 1,
                    padding: '20px',
                    background: option.value === 'yes' ? '#28a745' : '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '18px',
                    cursor: 'pointer'
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {currentStep.type === 'selection' && currentStep.options && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {currentStep.options.map(option => (
                <button
                  key={option.value}
                  onClick={() => handleAnswer(option.value)}
                  style={{
                    padding: '20px',
                    background: '#f8f9fa',
                    border: '2px solid #dee2e6',
                    borderRadius: '8px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {currentStep.type === 'form' && (
            <div>
              <p style={{ marginBottom: '20px' }}>
                This is a form step with multiple fields. 
                In the full version, each field would be rendered here.
              </p>
              {currentStep.fields && (
                <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>Fields in this form:</p>
                  <ul>
                    {currentStep.fields.slice(0, 5).map(field => (
                      <li key={field.id}>{field.label}</li>
                    ))}
                    {currentStep.fields.length > 5 && (
                      <li>...and {currentStep.fields.length - 5} more fields</li>
                    )}
                  </ul>
                </div>
              )}
              <button
                onClick={() => handleAnswer('form_completed')}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '18px',
                  cursor: 'pointer'
                }}
              >
                Continue
              </button>
            </div>
          )}

          {!['decision', 'selection', 'form'].includes(currentStep.type) && (
            <div>
              <p style={{ marginBottom: '20px' }}>
                Step type: {currentStep.type}
              </p>
              <button
                onClick={() => handleAnswer('continue')}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '18px',
                  cursor: 'pointer'
                }}
              >
                Continue
              </button>
            </div>
          )}
        </div>
      );
    }

    // Workflow selection screen
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '50px auto',
        padding: '20px'
      }}>
        <h1 style={{ 
          textAlign: 'center', 
          marginBottom: '50px',
          fontSize: '36px'
        }}>
          Select a Legal Service
        </h1>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '25px'
        }}>
          {workflows.map(workflow => (
            <div 
              key={workflow.id} 
              onClick={() => startWorkflow(workflow.id)}
              style={{
                padding: '30px',
                background: 'white',
                border: '2px solid #e9ecef',
                borderRadius: '12px',
                cursor: 'pointer'
              }}
            >
              <h3 style={{ marginBottom: '15px' }}>
                {workflow.title}
              </h3>
              <p style={{ color: '#6c757d' }}>
                {workflow.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  export default GoodlegalWorkflow;