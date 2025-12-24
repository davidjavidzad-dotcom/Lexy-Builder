import { entityFormation } from './entityFormation';
import { personalInjury } from './personalInjury';

export const workflowDefinitions = {
  'entity-formation': entityFormation,
  'personal-injury': personalInjury,
} as const;