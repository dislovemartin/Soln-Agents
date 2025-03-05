import React, { useState } from "react";

export default function TextProcessingNode({
  config,
  onConfigChange,
  renderVariableSelect,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Define available operations
  const availableOperations = [
    { id: "chunk", label: "Chunk Text", description: "Split text into smaller chunks" },
    { id: "count_tokens", label: "Count Tokens", description: "Count tokens in text" },
    { id: "lowercase", label: "Lowercase", description: "Convert text to lowercase" },
    { id: "uppercase", label: "Uppercase", description: "Convert text to uppercase" },
    { id: "trim", label: "Trim", description: "Remove leading/trailing whitespace" },
    { id: "remove_html", label: "Remove HTML", description: "Strip HTML tags from text" },
    { id: "extract_keywords", label: "Extract Keywords", description: "Extract key terms from text" },
  ];

  // Initialize operations if not set
  const operations = config?.operations || [];

  const toggleOperation = (operationId) => {
    const newOperations = operations.includes(operationId)
      ? operations.filter((id) => id !== operationId)
      : [...operations, operationId];

    onConfigChange({
      ...config,
      operations: newOperations,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-theme-text-primary mb-2">
          Input Variable
        </label>
        {renderVariableSelect(
          config.inputVariable,
          (value) => onConfigChange({ ...config, inputVariable: value }),
          "Select input variable"
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-theme-text-primary mb-2">
          Processing Operations
        </label>
        <div className="grid grid-cols-2 gap-2">
          {availableOperations.map((operation) => (
            <div
              key={operation.id}
              className={`p-2 border rounded-lg cursor-pointer transition-colors ${operations.includes(operation.id) 
                ? "border-primary-button bg-primary-button/10" 
                : "border-white/10 hover:bg-theme-action-menu-item-hover"}`}
              onClick={() => toggleOperation(operation.id)}
            >
              <div className="font-medium text-sm">{operation.label}</div>
              <div className="text-xs text-theme-text-secondary">{operation.description}</div>
            </div>
          ))}
        </div>
      </div>

      {operations.includes("chunk") && (
        <div>
          <label className="block text-sm font-medium text-theme-text-primary mb-2">
            Chunk Size (tokens)
          </label>
          <input
            type="number"
            value={config?.chunkSize || 1000}
            onChange={(e) =>
              onConfigChange({
                ...config,
                chunkSize: parseInt(e.target.value) || 1000,
              })
            }
            className="w-full border-none bg-theme-settings-input-bg text-theme-text-primary placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none p-2.5"
            placeholder="1000"
            min="100"
            max="8000"
          />
        </div>
      )}

      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-theme-text-secondary hover:text-theme-text-primary transition-colors"
        >
          {showAdvanced ? "Hide" : "Show"} Advanced Options
        </button>
      </div>

      {showAdvanced && (
        <div className="space-y-4 pt-2 border-t border-white/10">
          <div>
            <label className="block text-sm font-medium text-theme-text-primary mb-2">
              Model Name (optional)
            </label>
            <input
              type="text"
              value={config?.modelName || ""}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  modelName: e.target.value,
                })
              }
              className="w-full border-none bg-theme-settings-input-bg text-theme-text-primary placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none p-2.5"
              placeholder="e.g., gpt-4"
            />
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={config?.useRustExtensions !== false}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    useRustExtensions: e.target.checked,
                  })
                }
                className="rounded border-gray-300 text-primary-button focus:ring-primary-button"
              />
              <span className="text-sm font-medium text-theme-text-primary">
                Use high-performance Rust extensions
              </span>
            </label>
            <p className="text-xs text-theme-text-secondary mt-1 ml-6">
              Significantly improves performance for large text processing operations
            </p>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-theme-text-primary mb-2">
          Result Variable
        </label>
        {renderVariableSelect(
          config.resultVariable,
          (value) => onConfigChange({ ...config, resultVariable: value }),
          "Select or create variable",
          true
        )}
      </div>
    </div>
  );
}
