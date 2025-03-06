import React from 'react';
import Layout from '../../components/Layout';
import AgentCatalog from '../../components/SolnAgents';

export default function SolnAgentsCatalogPage() {
  return (
    <Layout>
      <div className="h-full overflow-hidden bg-theme-bg-primary">
        <AgentCatalog />
      </div>
    </Layout>
  );
}