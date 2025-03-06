# Multi-Agent Team UI Mockup

This document provides a mockup of the user interface components for handling multi-agent team interactions in the SolnAI-AutoGen integration. These components have been implemented as part of Story-3.

## Main Interface Layout

```
+----------------------------------------------------------------------+
|                           HEADER                                      |
+----------------------------------------------------------------------+
|                |                                          |           |
|                |                                          |           |
|                |                                          |           |
|   AGENT        |            CONVERSATION AREA             |  DETAILS  |
|   LIST         |                                          |  PANEL    |
|                |                                          |           |
|                |                                          |           |
|                |                                          |           |
|                |                                          |           |
|                +------------------------------------------+           |
|                |          MESSAGE INPUT AREA              |           |
+----------------+------------------------------------------+-----------+
```

## Agent List Component

The Agent List shows all available agents in the team, with visual indicators for their status.

```
+----------------+
| TEAM: DREAM TEAM |
+----------------+
| AGENTS:        |
|                |
| • TeamLead     |
|   [Coordinator]|
|                |
| • FinanceExpert|
|   [Finance]    |
|                |
| • SoftwareEng  |
|   [Dev]        |
|                |
| • DataScientist|
|   [Data]       |
|                |
| • MarketingExp |
|   [Marketing]  |
|                |
| • SecurityExp  |
|   [Security]   |
|                |
| + 14 more...   |
|                |
+----------------+
| [Import Team]  |
+----------------+
```

## Conversation Area

The conversation area displays messages from all agents with clear attribution and specialized formatting.

```
+------------------------------------------------------------------+
| CONVERSATION: Develop marketing strategy for sustainable product  |
+------------------------------------------------------------------+
|                                                                  |
| [TeamLead] 10:15 AM                                              |
| I'll coordinate our approach to developing a marketing strategy  |
| for this sustainable product. Let's break this down:             |
|                                                                  |
| 1. First, we need market research and target audience analysis   |
| 2. Then, we need product positioning and USP development         |
| 3. Next, marketing channel strategy and budget allocation        |
| 4. Finally, message crafting and campaign planning               |
|                                                                  |
| @ResearchAnalyst, please conduct initial market research on      |
| sustainable product trends and consumer preferences.             |
|                                                                  |
| --------------------------------------------------------------- |
|                                                                  |
| [ResearchAnalyst] 10:18 AM                                       |
| Based on my analysis, the sustainable product market has shown   |
| significant growth in the past 5 years:                          |
|                                                                  |
| • 68% of consumers willing to pay more for sustainable products  |
| • Key demographics: Millennials (73%) and Gen Z (78%)            |
| • Top consumer concerns: packaging waste, carbon footprint       |
|                                                                  |
| [View Full Research Report]                                      |
|                                                                  |
| --------------------------------------------------------------- |
|                                                                  |
| [MarketingExpert] 10:22 AM                                       |
| Based on the research, I recommend the following positioning:    |
|                                                                  |
| • USP: "Eco-friendly without compromise"                         |
| • Primary channels: Instagram, TikTok, sustainability partners   |
| • Message focus: Tangible environmental impact with each purchase|
|                                                                  |
| --------------------------------------------------------------- |
|                                                                  |
+------------------------------------------------------------------+
| Your message:                                                    |
| Can you provide specific campaign ideas for launch?              |
| [Send to: All Agents ▼]                [Send]                    |
+------------------------------------------------------------------+
```

## Details Panel

The Details Panel provides additional information about agents, tools, and outputs.

```
+---------------------------+
| AGENT DETAILS             |
+---------------------------+
| MarketingExpert           |
| Role: Marketing Strategist|
|                           |
| Expertise:                |
| • Marketing campaigns     |
| • Brand development       |
| • Customer engagement     |
| • Market positioning      |
|                           |
| Model: GPT-4o-mini        |
| Temperature: 0.4          |
+---------------------------+
|                           |
| AGENT CONTRIBUTIONS       |
|                           |
| Total messages: 3         |
| Last active: 10:22 AM     |
|                           |
| [View All Contributions]  |
+---------------------------+
|                           |
| EXPORT OPTIONS            |
|                           |
| [Export to SolnAI]        |
| [Save as Report]          |
| [Create SolnAI Agent]     |
+---------------------------+
```

## Agent Response Export Component

This component allows users to export specific agent responses to SolnAI.

```
+------------------------------------------------------------------+
|                       EXPORT TO SOLNAI                           |
+------------------------------------------------------------------+
|                                                                  |
| Select contributions to include:                                 |
|                                                                  |
| [✓] TeamLead (4 messages)                                        |
| [✓] ResearchAnalyst (2 messages)                                 |
| [✓] MarketingExpert (3 messages)                                 |
| [ ] ProductManager (1 message)                                   |
| [ ] SustainabilityExpert (2 messages)                            |
|                                                                  |
| [Select All] [Select None]                                       |
|                                                                  |
| Export format:                                                   |
| (●) Combined summary                                             |
| ( ) Individual agent results                                     |
| ( ) Raw message transcript                                       |
|                                                                  |
| Title: Marketing Strategy Recommendations                        |
|                                                                  |
| [Cancel]                             [Export to SolnAI]          |
+------------------------------------------------------------------+
```

## Mobile Responsive Design

The mobile view adapts the interface for smaller screens.

```
+---------------------+      +---------------------+
|       HEADER        |      |       HEADER        |
+---------------------+      +---------------------+
| TEAM: DREAM TEAM    |      | CONVERSATION        |
| [TeamLead]          |      |                     |
| [FinanceExpert]     |      | [TeamLead] 10:15 AM |
| [SoftwareEng]    ▼  |      | I'll coordinate our |
+---------------------+      | approach to develo..|
| [View Conversation] |      |                     |
+---------------------+      | [ResearchAnal] 10:18|
                            | Based on my analysis,|
                            | the sustainable pro..|
                            |                     |
                            +---------------------+
                            | [Agents] [Details]  |
                            | Your message:       |
                            | _________________   |
                            | [Send]              |
                            +---------------------+
```

## Implementation Details

The implementation includes the following components:

1. **TeamSelector.tsx**: For selecting and importing teams
2. **TeamChat.tsx**: For displaying multi-agent conversations
3. **AutoGenTeamPage.tsx**: Main container component
4. **AutoGenTeam.module.css**: Comprehensive styling for all components

The components are integrated with our enhanced data exchange service that provides:
- Team configuration import
- Multi-agent message processing
- Team session management
- Results export

The UI is designed to be responsive, with specific optimizations for desktop, tablet, and mobile layouts, using CSS grid and flexbox for adaptive layouts.

## Accessibility Considerations

The implementation includes:
- Clear visual attribution for all agent messages
- Keyboard navigation support
- Screen reader compatibility
- High contrast text for readability
- Responsive design that works on all device sizes

## Usage Examples

```jsx
// TeamSelector usage
<TeamSelector 
  onTeamSelect={handleTeamSelect}
  onTeamImport={handleTeamImport}
/>

// TeamChat usage
<TeamChat
  teamId={selectedTeam}
  sessionId={currentSession}
  onSessionCreated={setCurrentSession}
  onExportResults={handleExport}
/>

// Full team page
<AutoGenTeamPage onExportToSolnAI={handleExportToSolnAI} />
```