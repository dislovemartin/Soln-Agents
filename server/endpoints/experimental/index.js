const { liveSyncEndpoints } = require("./liveSync");
const { importedAgentPluginEndpoints } = require("./imported-agent-plugins");
const autogenStudioRouter = require("./autogen-studio");
const agentAnalyticsRouter = require("./agent-analytics");

// All endpoints here are not stable and can move around - have breaking changes
// or are opt-in features that are not fully released.
// When a feature is promoted it should be removed from here and added to the appropriate scope.
function experimentalEndpoints(router) {
  liveSyncEndpoints(router);
  importedAgentPluginEndpoints(router);
  
  // AutoGen Studio integration
  router.use("/autogen-studio", autogenStudioRouter);
  
  // Agent analytics and history dashboard
  router.use("/agent-analytics", agentAnalyticsRouter);
}

module.exports = { experimentalEndpoints };
