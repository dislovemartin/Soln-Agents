import React, { useState } from 'react';
import TeamSelector from './TeamSelectorComponent';
import TeamChat from './TeamChatComponent';
import { createAgentExchangeService } from '../services/agent-exchange';
import { useAutoGenStudio } from '../hooks/useAutoGenStudio';
import { useServices } from '../context/ServiceContext';

interface AutoGenTeamPageProps {
  onExportToSolnAI?: (results: any[]) => void;
}

/**
 * AutoGenTeamPage Component
 * 
 * Main container component for the multi-agent team interface.
 * Integrates TeamSelector and TeamChat components.
 */
const AutoGenTeamPage: React.FC<AutoGenTeamPageProps> = ({
  onExportToSolnAI
}) => {
  // State
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [showAgentDetails, setShowAgentDetails] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Services
  const { api } = useServices();
  const { getAgentDetails } = useAutoGenStudio();
  
  const exchangeService = React.useMemo(() => createAgentExchangeService({
    apiService: api,
    autogenApiUrl: 'http://localhost:8081/api'
  }), [api]);
  
  // Handle team selection
  const handleTeamSelect = (teamId: string) => {
    setSelectedTeamId(teamId);
    setCurrentSessionId(null);
    setSelectedAgent(null);
  };
  
  // Handle team import
  const handleTeamImport = async (config: object): Promise<string | null> => {
    setLoading(true);
    try {
      // This would use our extended importAutoGenTeamConfig method
      const teamId = await exchangeService.importAutoGenTeamConfig(config);
      return teamId;
    } catch (err) {
      setError(`Error importing team: ${err.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Handle session creation
  const handleSessionCreated = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };
  
  // Handle agent selection for details panel
  const handleAgentSelect = async (agentId: string) => {
    if (!agentId) {
      setSelectedAgent(null);
      return;
    }
    
    setLoading(true);
    try {
      const agentDetails = await getAgentDetails(agentId);
      setSelectedAgent(agentDetails);
      setShowAgentDetails(true);
    } catch (err) {
      setError(`Error fetching agent details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle export to SolnAI
  const handleExportResults = (results: any[]) => {
    if (onExportToSolnAI) {
      onExportToSolnAI(results);
    }
  };
  
  return (
    <div className="autogen-team-page">
      {/* Error display */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      <div className="team-interface-layout">
        {/* Left panel - Team selector */}
        <div className="team-sidebar">
          <TeamSelector
            onTeamSelect={handleTeamSelect}
            onTeamImport={handleTeamImport}
            selectedTeamId={selectedTeamId || undefined}
          />
        </div>
        
        {/* Main area - Team chat or placeholder */}
        <div className="team-main-area">
          {selectedTeamId ? (
            <TeamChat
              teamId={selectedTeamId}
              sessionId={currentSessionId || undefined}
              onSessionCreated={handleSessionCreated}
              onExportResults={handleExportResults}
            />
          ) : (
            <div className="team-placeholder">
              <div className="placeholder-content">
                <h2>Select or Import a Team</h2>
                <p>
                  Choose a team from the list or import a new team configuration 
                  to start collaborating with multiple specialized AI agents.
                </p>
                <div className="placeholder-teams">
                  <div className="placeholder-team-card">
                    <h3>Enterprise Dream Team</h3>
                    <p>20 specialized agents covering various domains</p>
                    <button onClick={() => handleTeamImport({
                      templateId: 'enterprise'
                    })}>
                      Import Enterprise Team
                    </button>
                  </div>
                  <div className="placeholder-team-card">
                    <h3>Development Team</h3>
                    <p>8 agents focused on software development</p>
                    <button onClick={() => handleTeamImport({
                      templateId: 'development'
                    })}>
                      Import Dev Team
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Right panel - Agent details */}
        <div className={`agent-details-panel ${showAgentDetails ? 'open' : 'closed'}`}>
          {selectedAgent ? (
            <>
              <div className="panel-header">
                <h3>{selectedAgent.name}</h3>
                <button 
                  className="close-panel"
                  onClick={() => setShowAgentDetails(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="agent-details-content">
                <div className="agent-role">
                  Role: {selectedAgent.label || 'Specialist'}
                </div>
                
                <div className="agent-description">
                  {selectedAgent.description}
                </div>
                
                {selectedAgent.config?.llm_config && (
                  <div className="agent-model">
                    <h4>Model</h4>
                    <div>
                      {selectedAgent.config.llm_config.config?.model || 'Default Model'}
                    </div>
                    <div>
                      Temperature: {selectedAgent.config.llm_config.config?.temperature || 'Default'}
                    </div>
                  </div>
                )}
                
                {selectedAgent.config?.tools && selectedAgent.config.tools.length > 0 && (
                  <div className="agent-tools">
                    <h4>Tools</h4>
                    <ul>
                      {selectedAgent.config.tools.map((tool: any, index: number) => (
                        <li key={index}>
                          {tool.label || tool.provider.split('.').pop()}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="agent-actions">
                  <button>Message Directly</button>
                  <button>View All Contributions</button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-details">
              <p>Select an agent to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoGenTeamPage;