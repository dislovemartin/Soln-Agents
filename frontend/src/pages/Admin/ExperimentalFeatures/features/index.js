import React from "react";
import LiveSync from "./LiveSync";
import paths from "../../../../utils/paths";
import { Link } from "react-router-dom";

function AutoGenStudioFeature({ enabled, feature, onToggle }) {
  return (
    <div className="flex flex-col gap-y-4">
      <div className="text-xl font-medium text-theme-text-primary mb-2">
        AutoGen Studio Integration
      </div>
      <div className="text-theme-text-primary">
        <p className="mb-4">
          Integrate SolnAI with Microsoft's AutoGen Studio to create advanced agent workflows
          that leverage both platforms.
        </p>
        <p className="mb-4">
          AutoGen Studio is a powerful tool for creating and managing AI agents. By integrating it
          with SolnAI, you can use SolnAI components in AutoGen Studio and vice versa.
        </p>
        <div className="mt-6 space-y-4">
          <Link
            to={paths.admin.autogenStudioSettings}
            className="px-4 py-2 bg-blue-600 text-white rounded-md inline-flex items-center hover:bg-blue-700 transition-all"
          >
            Configure AutoGen Studio Integration
          </Link>
          <Link
            to={paths.admin.autogenStudioDocs}
            className="ml-4 px-4 py-2 bg-gray-600 text-white rounded-md inline-flex items-center hover:bg-gray-700 transition-all"
          >
            View Documentation
          </Link>
        </div>
      </div>
    </div>
  );
}

export const configurableFeatures = {
  experimental_live_file_sync: {
    key: "experimental_live_file_sync",
    title: "Live Document Sync",
    component: LiveSync,
  },
  autogen_studio_integration: {
    key: "autogen_studio_integration",
    title: "AutoGen Studio Integration",
    component: AutoGenStudioFeature,
  },
};