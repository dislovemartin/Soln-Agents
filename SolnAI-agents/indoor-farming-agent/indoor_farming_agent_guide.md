# Indoor Farming Agent Implementation Guide

## Name
indoor-farming-agent

## Description
The Indoor Farming Agent is a smart assistant for indoor farms, greenhouses, or growing spaces that integrates with IoT sensors to monitor environmental conditions, provide data visualization, offer plant care recommendations, and enable remote monitoring and control. It helps users maintain optimal growing conditions by analyzing real-time data, identifying trends, and providing actionable insights for plant health and growth optimization.

## Implementation

### Core Modules Integration

#### llm-chain Integration
The Indoor Farming Agent uses llm-chain to orchestrate the complex workflow of sensor data analysis and recommendation generation:

```javascript
// n8n workflow implementation using llm-chain concepts
const farmingAssistantChain = {
  nodes: [
    {
      name: "Sensor Data Collection",
      type: "Function",
      parameters: {
        functionCode: `
          // Collect data from multiple IoT sensors
          async function collectSensorData(greenhouseId) {
            // Connect to sensor API endpoints
            const temperatureSensor = await fetchSensorData(greenhouseId, 'temperature');
            const humiditySensor = await fetchSensorData(greenhouseId, 'humidity');
            const soilMoistureSensor = await fetchSensorData(greenhouseId, 'soil_moisture');
            const lightSensor = await fetchSensorData(greenhouseId, 'light_intensity');
            
            return {
              temperature: temperatureSensor.value,
              humidity: humiditySensor.value,
              soilMoisture: soilMoistureSensor.value,
              lightIntensity: lightSensor.value,
              timestamp: new Date().toISOString()
            };
          }
        `
      }
    },
    {
      name: "Data Analysis",
      type: "Function",
      parameters: {
        functionCode: `
          // Analyze sensor data against optimal ranges for specific plants
          function analyzeSensorData(sensorData, plantProfiles) {
            const analysis = {};
            
            for (const [parameter, value] of Object.entries(sensorData)) {
              if (parameter === 'timestamp') continue;
              
              const optimalRanges = {};
              for (const plant of plantProfiles) {
                optimalRanges[plant.name] = plant.optimalRanges[parameter];
              }
              
              analysis[parameter] = {
                currentValue: value,
                optimalRanges,
                status: determineStatus(value, optimalRanges),
                trend: calculateTrend(parameter, value)
              };
            }
            
            return analysis;
          }
        `
      }
    },
    {
      name: "Recommendation Generation",
      type: "Function",
      parameters: {
        functionCode: `
          // Generate recommendations based on data analysis
          function generateRecommendations(analysis, plantProfiles) {
            const recommendations = [];
            
            for (const [parameter, data] of Object.entries(analysis)) {
              if (data.status !== 'optimal') {
                recommendations.push({
                  parameter,
                  currentValue: data.currentValue,
                  recommendation: createParameterRecommendation(parameter, data, plantProfiles),
                  priority: determinePriority(parameter, data.status)
                });
              }
            }
            
            return recommendations.sort((a, b) => b.priority - a.priority);
          }
        `
      }
    },
    {
      name: "Response Formatting",
      type: "OpenAI",
      parameters: {
        model: "gpt-4",
        systemPrompt: "You are an indoor farming assistant. Format the analysis and recommendations in a clear, actionable way that helps the user maintain optimal growing conditions.",
        temperature: 0.3
      }
    }
  ],
  connections: [
    {
      source: "Sensor Data Collection",
      target: "Data Analysis"
    },
    {
      source: "Data Analysis",
      target: "Recommendation Generation"
    },
    {
      source: "Recommendation Generation",
      target: "Response Formatting"
    }
  ]
};
```

#### llguidance Integration
The agent uses llguidance to ensure structured outputs for environmental analysis and recommendations:

```javascript
// Structured output schema for greenhouse status reports
const greenhouseStatusSchema = {
  type: "object",
  properties: {
    greenhouseName: {
      type: "string",
      description: "The name of the greenhouse being analyzed"
    },
    timestamp: {
      type: "string",
      description: "ISO timestamp of when the data was collected"
    },
    environmentalConditions: {
      type: "object",
      properties: {
        temperature: {
          type: "object",
          properties: {
            value: { type: "number" },
            unit: { type: "string" },
            status: { type: "string", enum: ["critical_low", "low", "optimal", "high", "critical_high"] },
            trend: { type: "string", enum: ["rising", "falling", "stable"] }
          }
        },
        humidity: {
          type: "object",
          properties: {
            value: { type: "number" },
            unit: { type: "string" },
            status: { type: "string", enum: ["critical_low", "low", "optimal", "high", "critical_high"] },
            trend: { type: "string", enum: ["rising", "falling", "stable"] }
          }
        },
        soilMoisture: {
          type: "object",
          properties: {
            value: { type: "number" },
            unit: { type: "string" },
            status: { type: "string", enum: ["critical_low", "low", "optimal", "high", "critical_high"] },
            trend: { type: "string", enum: ["rising", "falling", "stable"] }
          }
        },
        lightIntensity: {
          type: "object",
          properties: {
            value: { type: "number" },
            unit: { type: "string" },
            status: { type: "string", enum: ["critical_low", "low", "optimal", "high", "critical_high"] },
            trend: { type: "string", enum: ["rising", "falling", "stable"] }
          }
        }
      }
    },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          parameter: { type: "string" },
          action: { type: "string" },
          reasoning: { type: "string" },
          priority: { type: "string", enum: ["urgent", "high", "medium", "low"] }
        }
      }
    },
    plantHealthSummary: {
      type: "array",
      items: {
        type: "object",
        properties: {
          plantName: { type: "string" },
          overallStatus: { type: "string", enum: ["excellent", "good", "fair", "poor", "critical"] },
          specificConcerns: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    }
  },
  required: ["greenhouseName", "timestamp", "environmentalConditions", "recommendations"]
};
```

#### aici Integration
The agent implements aici concepts for real-time control over response generation:

```javascript
// Conceptual implementation of aici in n8n context
function dynamicResponseControl(greenhouseData, userQuery) {
  // Detect if query is about critical conditions
  if (hasCriticalConditions(greenhouseData)) {
    return {
      responsePrefix: "⚠️ **ALERT: Critical Conditions Detected** ⚠️\n\n",
      highlightCriticalParameters: true,
      prioritizeUrgentActions: true,
      includeTimeEstimates: true
    };
  }
  
  // Detect if query is about specific plant health
  if (isPlantSpecificQuery(userQuery)) {
    const plantName = extractPlantName(userQuery);
    return {
      responsePrefix: `🌱 **${plantName} Health Report** 🌱\n\n`,
      focusOnSpecificPlant: plantName,
      includeGrowthStageInfo: true,
      addCareInstructions: true
    };
  }
  
  // Detect if query is about data visualization
  if (isDataVisualizationQuery(userQuery)) {
    return {
      responsePrefix: "📊 **Greenhouse Data Visualization** 📊\n\n",
      includeChartMarkdown: true,
      showHistoricalComparison: true,
      formatDataTables: true
    };
  }
  
  // Default response format
  return {
    responsePrefix: "🌿 **Greenhouse Status Update** 🌿\n\n",
    balancedInfoDisplay: true
  };
}
```

### Architecture
The Indoor Farming Agent uses a single-agent architecture with specialized components:

1. **Sensor Interface**: Connects to and retrieves data from IoT sensors
2. **Data Analyzer**: Processes sensor data and identifies trends or issues
3. **Plant Knowledge Base**: Maintains information about optimal conditions for different plants
4. **Recommendation Engine**: Generates actionable advice based on current conditions
5. **Camera Interface**: Connects to IoT cameras for visual monitoring

### Performance Optimization
- **Caching**: Sensor data is cached to reduce API calls
- **Incremental Analysis**: Only analyzing changed parameters since last check
- **Scheduled Monitoring**: Periodic checks rather than continuous monitoring to save resources

### Ethical Considerations
- **Energy Efficiency**: Optimizing sensor polling to minimize energy consumption
- **Water Conservation**: Recommendations prioritize water-efficient practices
- **Sustainable Growing**: Guidance focuses on sustainable farming practices

## Example Usage

### Basic Greenhouse Monitoring
```javascript
// Example n8n workflow execution
const workflow = {
  execute: async (input) => {
    const greenhouseId = input.greenhouseId;
    const plantProfiles = input.plantProfiles;
    
    // Execute the farming assistant chain
    const sensorData = await executeNode("Sensor Data Collection", { greenhouseId });
    const analysis = await executeNode("Data Analysis", { sensorData, plantProfiles });
    const recommendations = await executeNode("Recommendation Generation", { analysis, plantProfiles });
    const formattedResponse = await executeNode("Response Formatting", {
      greenhouseId,
      sensorData,
      analysis,
      recommendations,
      outputFormat: greenhouseStatusSchema
    });
    
    return formattedResponse;
  }
};

// Example execution
const result = await workflow.execute({
  greenhouseId: "tropical-greenhouse",
  plantProfiles: [
    {
      name: "Basil",
      optimalRanges: {
        temperature: { min: 18, max: 30, unit: "°C" },
        humidity: { min: 40, max: 60, unit: "%" },
        soilMoisture: { min: 60, max: 80, unit: "%" },
        lightIntensity: { min: 5000, max: 10000, unit: "lux" }
      }
    },
    // More plant profiles...
  ]
});

console.log(result.environmentalConditions);
console.log(result.recommendations);
```

### Remote Camera Monitoring
```javascript
// Example of remote camera monitoring
const cameraMonitoringWorkflow = {
  execute: async (input) => {
    const greenhouseId = input.greenhouseId;
    const cameraId = input.cameraId;
    
    // Retrieve camera image
    const cameraImage = await executeNode("Retrieve Camera Image", { 
      greenhouseId, 
      cameraId 
    });
    
    // Analyze image for plant health
    const imageAnalysis = await executeNode("Analyze Plant Image", { 
      image: cameraImage,
      plantProfiles: input.plantProfiles
    });
    
    return {
      image: cameraImage,
      analysis: imageAnalysis
    };
  }
};
```

## Testing
The agent includes comprehensive testing for:
- Sensor data accuracy and reliability
- Recommendation quality and relevance
- Response to different environmental conditions
- Integration with various IoT devices

Tests are automated using n8n's testing framework and run against simulated greenhouse environments to ensure consistent performance across different scenarios.
