import React, { useState, useEffect } from 'react';
import { useAutoGenStudio } from '../hooks/useAutoGenStudio';

interface TeamSelectorProps {
  onTeamSelect: (teamId: string) => void;
  onTeamImport?: (config: object) => Promise<string | null>;
  selectedTeamId?: string;
}

/**
 * TeamSelector Component
 * 
 * Allows users to select from available teams or import new team configurations.
 */
const TeamSelector: React.FC<TeamSelectorProps> = ({
  onTeamSelect,
  onTeamImport,
  selectedTeamId
}) => {
  // State
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'file' | 'paste' | 'template' | null>(null);
  const [teamConfig, setTeamConfig] = useState<string>('');
  const [teamName, setTeamName] = useState<string>('');
  const [pastedJson, setPastedJson] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  
  // Templates for team configuration
  const teamTemplates = [
    { id: 'enterprise', name: 'Enterprise Dream Team (20 agents)' },
    { id: 'research', name: 'Research Team (5 agents)' },
    { id: 'development', name: 'Software Development Team (8 agents)' },
    { id: 'marketing', name: 'Marketing Team (6 agents)' }
  ];

  // Services
  const { fetchTeams } = useAutoGenStudio();
  
  // Fetch available teams
  useEffect(() => {
    const loadTeams = async () => {
      setLoading(true);
      try {
        const result = await fetchTeams();
        if (result) {
          setTeams(result);
        }
      } catch (err) {
        setError(`Error fetching teams: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadTeams();
  }, [fetchTeams]);
  
  // Open import modal
  const handleOpenImport = () => {
    setImportMode('file');
    setTeamConfig('');
    setTeamName('');
    setPastedJson('');
    setSelectedTemplate('');
    setShowModal(true);
  };
  
  // Close import modal
  const handleCloseImport = () => {
    setShowModal(false);
  };
  
  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        // Validate JSON
        JSON.parse(content);
        setPastedJson(content);
      } catch (err) {
        setError("Invalid JSON file");
      }
    };
    
    reader.readAsText(file);
  };
  
  // Handle team import
  const handleImportTeam = async () => {
    if (!onTeamImport) return;
    
    setLoading(true);
    try {
      let configToImport;
      
      if (importMode === 'file' || importMode === 'paste') {
        // Use file upload or pasted JSON
        const jsonContent = importMode === 'file' ? pastedJson : pastedJson;
        configToImport = JSON.parse(jsonContent);
      } else if (importMode === 'template') {
        // Fetch template configuration
        // In a real implementation, this would load the selected template
        // For this example, we'll use a placeholder
        configToImport = { templateId: selectedTemplate };
      }
      
      // Add team name to configuration if provided
      if (teamName && configToImport) {
        configToImport.label = teamName;
      }
      
      // Import the team
      const teamId = await onTeamImport(configToImport);
      if (teamId) {
        // Refresh teams list
        const updatedTeams = await fetchTeams();
        setTeams(updatedTeams);
        
        // Select the newly imported team
        onTeamSelect(teamId);
        
        // Close modal
        setShowModal(false);
      } else {
        setError("Failed to import team");
      }
    } catch (err) {
      setError(`Error importing team: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="team-selector-container">
      <div className="team-selector-header">
        <h2>Agent Teams</h2>
        {onTeamImport && (
          <button 
            className="import-team-button"
            onClick={handleOpenImport}
          >
            Import Team
          </button>
        )}
      </div>
      
      {/* Error display */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      {/* Teams list */}
      <div className="teams-list">
        {loading && <div className="loading-spinner">Loading teams...</div>}
        
        {!loading && teams.length === 0 ? (
          <div className="empty-state">
            No teams available. Import a team to get started.
          </div>
        ) : (
          <ul>
            {teams.map(team => (
              <li 
                key={team.id}
                className={selectedTeamId === team.id ? 'selected' : ''}
                onClick={() => onTeamSelect(team.id)}
              >
                <div className="team-info">
                  <span className="team-name">{team.name}</span>
                  <span className="team-size">
                    {team.agentCount} agent{team.agentCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="team-description">{team.description}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Import modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Import Team Configuration</h3>
              <button className="close-button" onClick={handleCloseImport}>×</button>
            </div>
            
            <div className="modal-body">
              {/* Import options */}
              <div className="import-options">
                <label>
                  <input 
                    type="radio" 
                    checked={importMode === 'file'}
                    onChange={() => setImportMode('file')}
                  />
                  Upload JSON file
                </label>
                
                <label>
                  <input 
                    type="radio" 
                    checked={importMode === 'paste'}
                    onChange={() => setImportMode('paste')}
                  />
                  Paste JSON configuration
                </label>
                
                <label>
                  <input 
                    type="radio" 
                    checked={importMode === 'template'}
                    onChange={() => setImportMode('template')}
                  />
                  Start from template
                </label>
              </div>
              
              {/* File upload */}
              {importMode === 'file' && (
                <div className="file-upload">
                  <input 
                    type="file" 
                    accept=".json"
                    onChange={handleFileUpload}
                  />
                </div>
              )}
              
              {/* JSON paste */}
              {importMode === 'paste' && (
                <div className="json-paste">
                  <textarea
                    placeholder="Paste JSON configuration here..."
                    value={pastedJson}
                    onChange={(e) => setPastedJson(e.target.value)}
                    rows={10}
                  />
                </div>
              )}
              
              {/* Template selection */}
              {importMode === 'template' && (
                <div className="template-selection">
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                  >
                    <option value="">Select a template</option>
                    {teamTemplates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Team name */}
              <div className="team-name-input">
                <label>
                  Team name (optional):
                  <input 
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="My Awesome Team"
                  />
                </label>
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={handleCloseImport}>Cancel</button>
              <button 
                onClick={handleImportTeam}
                disabled={
                  loading || 
                  (importMode === 'file' && !pastedJson) ||
                  (importMode === 'paste' && !pastedJson) ||
                  (importMode === 'template' && !selectedTemplate)
                }
              >
                {loading ? 'Importing...' : 'Import Team'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSelector;