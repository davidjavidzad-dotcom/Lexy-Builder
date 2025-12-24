import { WorkflowDefinition } from '../types';

export const entityFormation: WorkflowDefinition = {
  id: 'entity-formation',
  title: 'Entity Formation',
  description: 'Form an LLC or corporation with guided steps.',
  initialStepId: 'state',

  steps: [
    {
      id: 'state',
      title: 'Where will your company be formed?',
      type: 'select',
      options: [
        { label: 'Delaware', value: 'DE' },
        { label: 'California', value: 'CA' }
      ],
      nextStepId: 'entityType'
    },
    {
      id: 'entityType',
      title: 'Entity Type',
      type: 'radio',
      options: [
        { label: 'LLC', value: 'llc' },
        { label: 'C-Corporation', value: 'c-corp' }
      ]
    }
  ]
};