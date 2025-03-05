# Course Guider Agent Implementation Guide

## Name
course-guider-agent

## Description
The Course Guider Agent is an intelligent learning companion that transforms any course or subject into a structured, actionable roadmap. It breaks down complex topics into manageable steps, identifies prerequisites and tools, maps skills to real-world job roles, and presents information in an engaging, emoji-rich format tailored to the user's timeline.

## Implementation

### Core Modules Integration

#### llm-chain Integration
The Course Guider Agent uses llm-chain to orchestrate the complex workflow of course analysis and roadmap generation:

```javascript
// n8n workflow implementation using llm-chain concepts
const courseAnalysisChain = {
  nodes: [
    {
      name: "Course Analysis",
      type: "Function",
      parameters: {
        functionCode: `
          // Analyze course content to identify core concepts and structure
          function analyzeCourse(courseDetails) {
            return {
              coreConcepts: extractCoreConcepts(courseDetails),
              difficulty: assessDifficulty(courseDetails),
              estimatedTimeToComplete: calculateTimeEstimate(courseDetails),
              prerequisites: identifyPrerequisites(courseDetails)
            };
          }
        `
      }
    },
    {
      name: "Learning Path Generation",
      type: "Function",
      parameters: {
        functionCode: `
          // Generate a structured learning path based on course analysis
          function generateLearningPath(courseAnalysis, userTimeline) {
            const { coreConcepts, difficulty, estimatedTimeToComplete, prerequisites } = courseAnalysis;
            
            // Adjust learning path based on user's timeline
            const adjustedPath = adaptToTimeline(coreConcepts, userTimeline);
            
            // Structure into modules and steps
            return {
              modules: createModules(adjustedPath),
              milestones: defineMilestones(adjustedPath),
              resources: recommendResources(adjustedPath)
            };
          }
        `
      }
    },
    {
      name: "Career Mapping",
      type: "Function",
      parameters: {
        functionCode: `
          // Map skills from the learning path to career opportunities
          function mapToCareerOpportunities(learningPath) {
            return {
              relevantRoles: identifyRelevantJobs(learningPath),
              skillsGained: extractSkillsGained(learningPath),
              careerProgression: suggestCareerProgression(learningPath)
            };
          }
        `
      }
    },
    {
      name: "Response Formatting",
      type: "OpenAI",
      parameters: {
        model: "gpt-4",
        systemPrompt: "You are a course guider assistant. Format the learning roadmap in an engaging, emoji-rich format that is easy to understand and share.",
        temperature: 0.7
      }
    }
  ],
  connections: [
    {
      source: "Course Analysis",
      target: "Learning Path Generation"
    },
    {
      source: "Learning Path Generation",
      target: "Career Mapping"
    },
    {
      source: "Career Mapping",
      target: "Response Formatting"
    }
  ]
};
```

#### llguidance Integration
The agent uses llguidance to ensure structured outputs for learning roadmaps and career mappings:

```javascript
// Structured output schema for course roadmaps
const roadmapSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "The title of the learning roadmap"
    },
    overview: {
      type: "string",
      description: "A brief overview of the course and what will be learned"
    },
    prerequisites: {
      type: "array",
      items: {
        type: "object",
        properties: {
          skill: { type: "string" },
          importance: { type: "string", enum: ["essential", "recommended", "optional"] },
          resources: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    },
    modules: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          duration: { type: "string" },
          steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                resources: {
                  type: "array",
                  items: { type: "string" }
                }
              }
            }
          }
        }
      }
    },
    careerOutcomes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          role: { type: "string" },
          relevance: { type: "number" },
          requiredSkills: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    },
    timeline: {
      type: "object",
      properties: {
        totalDuration: { type: "string" },
        milestones: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              timepoint: { type: "string" },
              achievements: {
                type: "array",
                items: { type: "string" }
              }
            }
          }
        }
      }
    }
  },
  required: ["title", "overview", "modules", "timeline"]
};
```

#### aici Integration
The agent implements aici concepts for real-time control over roadmap generation:

```javascript
// Conceptual implementation of aici in n8n context
function dynamicRoadmapControl(courseDetails, userPreferences) {
  // Detect if user is a beginner
  if (isBeginnerUser(userPreferences)) {
    return {
      responsePrefix: "🌟 **Beginner-Friendly Roadmap** 🌟\n\nDon't worry if you're just starting out! This roadmap is designed to guide you step-by-step:\n\n",
      emphasizeBasics: true,
      includeExtraResources: true,
      simplifyLanguage: true
    };
  }
  
  // Detect if user is advanced
  if (isAdvancedUser(userPreferences)) {
    return {
      responsePrefix: "🚀 **Advanced Learning Path** 🚀\n\nSince you already have experience, this roadmap focuses on advanced concepts:\n\n",
      skipBasics: true,
      emphasizeProjects: true,
      includeIndustryTrends: true
    };
  }
  
  // Detect if user has specific career goals
  if (hasCareerGoals(userPreferences)) {
    return {
      responsePrefix: `🎯 **Career-Focused Roadmap: ${userPreferences.careerGoal}** 🎯\n\nThis roadmap is optimized for your specific career goal:\n\n`,
      prioritizeRelevantSkills: true,
      includeJobMarketInsights: true,
      addPortfolioSuggestions: true
    };
  }
  
  // Default response format
  return {
    responsePrefix: "📚 **Customized Learning Roadmap** 📚\n\nHere's your personalized path to mastery:\n\n",
    balancedApproach: true
  };
}
```

### Architecture
The Course Guider Agent uses a single-agent architecture with specialized components:

1. **Course Analyzer**: Breaks down course content into core concepts and structure
2. **Learning Path Generator**: Creates a structured learning path based on user timeline
3. **Career Mapper**: Maps skills to job roles and career opportunities
4. **Response Formatter**: Presents information in an engaging, emoji-rich format

### Performance Optimization
- **Caching**: Common course analyses are cached for faster response
- **Template-based Generation**: Using templates for common course types
- **Progressive Loading**: Generating roadmap sections progressively for faster initial response

### Ethical Considerations
- **Accessibility**: Ensuring roadmaps are accessible to users with different learning styles
- **Realistic Expectations**: Setting realistic timelines and expectations for learning
- **Diverse Career Paths**: Presenting diverse career options without bias

## Example Usage

### Basic Course Roadmap Generation
```javascript
// Example n8n workflow execution
const workflow = {
  execute: async (input) => {
    const courseDetails = input.courseDetails;
    const userTimeline = input.userTimeline;
    
    // Execute the course analysis chain
    const courseAnalysis = await executeNode("Course Analysis", { courseDetails });
    const learningPath = await executeNode("Learning Path Generation", { courseAnalysis, userTimeline });
    const careerMapping = await executeNode("Career Mapping", { learningPath });
    const formattedResponse = await executeNode("Response Formatting", {
      courseAnalysis,
      learningPath,
      careerMapping,
      outputFormat: roadmapSchema
    });
    
    return formattedResponse;
  }
};

// Example execution
const result = await workflow.execute({
  courseDetails: {
    title: "Machine Learning Fundamentals",
    description: "A comprehensive introduction to machine learning concepts and algorithms",
    topics: ["Supervised Learning", "Unsupervised Learning", "Neural Networks", "Model Evaluation"]
  },
  userTimeline: {
    availableHours: 10,
    durationWeeks: 12,
    priorExperience: "Some programming experience in Python"
  }
});

console.log(result.title);
console.log(result.modules);
```

### Personalized Learning Experience
```javascript
// Example of personalized roadmap generation
const personalizedWorkflow = {
  execute: async (input) => {
    const courseDetails = input.courseDetails;
    const userProfile = input.userProfile;
    
    // Personalize the learning experience
    const personalizedCourseAnalysis = await executeNode("Personalized Course Analysis", { 
      courseDetails, 
      learningStyle: userProfile.learningStyle,
      priorKnowledge: userProfile.priorKnowledge
    });
    
    // Generate personalized roadmap
    return generatePersonalizedRoadmap(personalizedCourseAnalysis, userProfile);
  }
};
```

## Testing
The agent includes comprehensive testing for:
- Roadmap generation accuracy
- Adaptation to different user timelines
- Career mapping relevance
- Formatting and presentation quality

Tests are automated using n8n's testing framework and run against a variety of course types and user profiles to ensure consistent performance.
