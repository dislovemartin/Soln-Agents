process.env.NODE_ENV === "development"
  ? require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` })
  : require("dotenv").config();

require("./utils/logger")();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const { reqBody } = require("./utils/http");
const { systemEndpoints } = require("./endpoints/system");
const { workspaceEndpoints } = require("./endpoints/workspaces");
const { chatEndpoints } = require("./endpoints/chat");
const { embeddedEndpoints } = require("./endpoints/embed");
const { embedManagementEndpoints } = require("./endpoints/embedManagement");
const { getVectorDbClass } = require("./utils/helpers");
const { adminEndpoints } = require("./endpoints/admin");
const { inviteEndpoints } = require("./endpoints/invite");
const { utilEndpoints } = require("./endpoints/utils");
const { developerEndpoints } = require("./endpoints/api");
const { extensionEndpoints } = require("./endpoints/extensions");
const { bootHTTP, bootSSL } = require("./utils/boot");
const { workspaceThreadEndpoints } = require("./endpoints/workspaceThreads");
const { documentEndpoints } = require("./endpoints/document");
const { agentWebsocket } = require("./endpoints/agentWebsocket");
const { experimentalEndpoints } = require("./endpoints/experimental");
const { autogenStudio } = require("./endpoints/experimental/autogen-studio");
const { browserExtensionEndpoints } = require("./endpoints/browserExtension");
const { communityHubEndpoints } = require("./endpoints/communityHub");
const { agentFlowEndpoints } = require("./endpoints/agentFlows");
const agentInterfaceRouter = require("./endpoints/agentInterface");
const archonAgentRouter = require("./endpoints/archonAgent");
const solnAgentsRouter = require("./endpoints/solnAgents");
const crewaiRouter = require("./endpoints/crewai");
const app = express();
const apiRouter = express.Router();
const FILE_LIMIT = "3GB";

app.use(cors({ origin: true }));
app.use(bodyParser.text({ limit: FILE_LIMIT }));
app.use(bodyParser.json({ limit: FILE_LIMIT }));
app.use(
  bodyParser.urlencoded({
    limit: FILE_LIMIT,
    extended: true,
  })
);

if (!!process.env.ENABLE_HTTPS) {
  const server = bootSSL(app, process.env.SERVER_PORT || 3001);

  // Initialize WebSocket bridge for AutoGen Studio integration in HTTPS mode
  autogenStudio.initializeWebSocketBridge(server);

  // Handle WebSocket upgrade requests for AutoGen Studio in HTTPS mode
  server.on('upgrade', (request, socket, head) => {
    // Parse the URL to determine which WebSocket endpoint to use
    const url = new URL(request.url, `https://${request.headers.host}`);
    const pathname = url.pathname;

    console.log(`WebSocket upgrade request for: ${pathname} (HTTPS mode)`);

    if (pathname.startsWith('/api/experimental/autogen-studio/ws')) {
      console.log('Routing to AutoGen Studio WebSocket handler (HTTPS mode)');
      autogenStudio.handleWebSocketUpgrade(request, socket, head);
    } else {
      // No handler found, reject the connection
      socket.destroy();
    }
  });
} else {
  require("@mintplex-labs/express-ws").default(app); // load WebSockets in non-SSL mode.
}

app.use("/api", apiRouter);
systemEndpoints(apiRouter);
extensionEndpoints(apiRouter);
workspaceEndpoints(apiRouter);
workspaceThreadEndpoints(apiRouter);
chatEndpoints(apiRouter);
adminEndpoints(apiRouter);
inviteEndpoints(apiRouter);
embedManagementEndpoints(apiRouter);
utilEndpoints(apiRouter);
documentEndpoints(apiRouter);
agentWebsocket(apiRouter);
experimentalEndpoints(apiRouter);
developerEndpoints(app, apiRouter);
communityHubEndpoints(apiRouter);
agentFlowEndpoints(apiRouter);
apiRouter.use(agentInterfaceRouter);
apiRouter.use(archonAgentRouter);
apiRouter.use(solnAgentsRouter);
apiRouter.use(crewaiRouter);

// LangGraph and LangSmith endpoints
const langGraphRouter = require("./endpoints/langgraph");
const langSmithRouter = require("./endpoints/langsmith");
apiRouter.use("/langgraph", langGraphRouter);
apiRouter.use("/langsmith", langSmithRouter);

// Externally facing embedder endpoints
embeddedEndpoints(apiRouter);

// Externally facing browser extension endpoints
browserExtensionEndpoints(apiRouter);

if (process.env.NODE_ENV !== "development") {
  const { MetaGenerator } = require("./utils/boot/MetaGenerator");
  const IndexPage = new MetaGenerator();

  app.use(
    express.static(path.resolve(__dirname, "public"), {
      extensions: ["js"],
      setHeaders: (res) => {
        // Disable I-framing of entire site UI
        res.removeHeader("X-Powered-By");
        res.setHeader("X-Frame-Options", "DENY");
      },
    })
  );

  app.use("/", function (_, response) {
    IndexPage.generate(response);
    return;
  });

  app.get("/robots.txt", function (_, response) {
    response.type("text/plain");
    response.send("User-agent: *\nDisallow: /").end();
  });
} else {
  // Debug route for development connections to vectorDBs
  apiRouter.post("/v/:command", async (request, response) => {
    try {
      const VectorDb = getVectorDbClass();
      const { command } = request.params;
      if (!Object.getOwnPropertyNames(VectorDb).includes(command)) {
        response.status(500).json({
          message: "invalid interface command",
          commands: Object.getOwnPropertyNames(VectorDb),
        });
        return;
      }

      try {
        const body = reqBody(request);
        const resBody = await VectorDb[command](body);
        response.status(200).json({ ...resBody });
      } catch (e) {
        // console.error(e)
        console.error(JSON.stringify(e));
        response.status(500).json({ error: e.message });
      }
      return;
    } catch (e) {
      console.error(e.message, e);
      response.sendStatus(500).end();
    }
  });
}

app.all("*", function (_, response) {
  response.sendStatus(404);
});

// In non-https mode we need to boot at the end since the server has not yet
// started and is `.listen`ing.
if (!process.env.ENABLE_HTTPS) {
  const server = bootHTTP(app, process.env.SERVER_PORT || 3001);

  // Initialize WebSocket bridge for AutoGen Studio integration
  autogenStudio.initializeWebSocketBridge(server);

  // Handle WebSocket upgrade requests for AutoGen Studio
  server.on('upgrade', (request, socket, head) => {
    // Parse the URL to determine which WebSocket endpoint to use
    const url = new URL(request.url, `http://${request.headers.host}`);
    const pathname = url.pathname;

    console.log(`WebSocket upgrade request for: ${pathname}`);

    if (pathname.startsWith('/api/experimental/autogen-studio/ws')) {
      console.log('Routing to AutoGen Studio WebSocket handler');
      autogenStudio.handleWebSocketUpgrade(request, socket, head);
    } else {
      // No handler found, reject the connection
      socket.destroy();
    }
  });
}
