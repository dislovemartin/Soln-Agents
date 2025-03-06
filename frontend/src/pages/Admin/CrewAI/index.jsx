import React from 'react';
import { AdminLayout } from '../../../layouts/AdminLayout';
import { CrewWorkflowBuilder } from '../../../components/CrewAI/CrewWorkflowBuilder';

export const CrewAIPage = () => {
  return (
    <AdminLayout>
      <CrewWorkflowBuilder />
    </AdminLayout>
  );
};

export default CrewAIPage;