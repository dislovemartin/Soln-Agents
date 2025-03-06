import React, { useState, useEffect } from "react";
import { Archon } from "../../../models/archon";
import { Robot, Rocket, Upload, ChatsCircle, NotePencil, ArrowCounterClockwise } from "@phosphor-icons/react";
import showToast from "../../../utils/toast";

export const ArchonPanel = ({ toggleSkill, enabled = false, setHasChanges }) => {
  const [loading, setLoading] = useState(true);
  const [archonStatus, setArchonStatus] = useState({ isInstalled: false });
  const [sessions, setSessions] = useState([]);
  const [refreshingSessions, setRefreshingSessions] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [message, setMessage] = useState("");
  const [sessionResponses, setSessionResponses] = useState({});

  useEffect(() => {
    checkArchonStatus();
  }, []);

  useEffect(() => {
    if (enabled) {
      fetchSessions();
    }
  }, [enabled]);

  const checkArchonStatus = async () => {
    try {
      setLoading(true);
      const response = await Archon.getStatus();
      setArchonStatus(response);
      setLoading(false);
    } catch (error) {
      console.error("Error checking Archon status:", error);
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setRefreshingSessions(true);
      const response = await Archon.listSessions();
      if (response.success) {
        setSessions(response.sessions || []);
      }
      setRefreshingSessions(false);
    } catch (error) {
      console.error("Error fetching Archon sessions:", error);
      setRefreshingSessions(false);
    }
  };

  const createSession = async () => {
    try {
      const response = await Archon.createSession();
      if (response.success) {
        showToast("Archon session created successfully", "success");
        setActiveSession(response.sessionId);
        await fetchSessions();
      } else {
        showToast(response.error || "Failed to create Archon session", "error");
      }
    } catch (error) {
      console.error("Error creating Archon session:", error);
      showToast("Failed to create Archon session", "error");
    }
  };

  const sendMessage = async () => {
    if (!activeSession || !message.trim()) return;

    try {
      // Add user message to the conversation
      setSessionResponses(prev => ({
        ...prev,
        [activeSession]: [
          ...(prev[activeSession] || []),
          { role: "user", content: message }
        ]
      }));

      const response = await Archon.sendMessage(activeSession, message);
      
      if (response.success) {
        // Add AI response to the conversation
        setSessionResponses(prev => ({
          ...prev,
          [activeSession]: [
            ...(prev[activeSession] || []),
            { role: "assistant", content: response.data.response || "No response" }
          ]
        }));
        setMessage("");
      } else {
        showToast(response.error || "Failed to send message", "error");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      showToast("Failed to send message", "error");
    }
  };

  const endSession = async (sessionId) => {
    try {
      const response = await Archon.endSession(sessionId);
      if (response.success) {
        showToast("Archon session ended successfully", "success");
        if (activeSession === sessionId) {
          setActiveSession(null);
        }
        await fetchSessions();
      } else {
        showToast(response.error || "Failed to end Archon session", "error");
      }
    } catch (error) {
      console.error("Error ending Archon session:", error);
      showToast("Failed to end Archon session", "error");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-xl">
          <Robot className="text-primary-button" size={24} />
          <h2 className="font-semibold">Archon - AI Agent Builder</h2>
        </div>
        <div className="flex items-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={enabled}
              onChange={() => {
                toggleSkill("archon-integration");
                setHasChanges(true);
              }}
            />
            <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary-button peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-button"></div>
            <span className="ml-3 text-sm font-medium">
              {enabled ? "Enabled" : "Disabled"}
            </span>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-button"></div>
        </div>
      ) : !archonStatus.isInstalled ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-800 rounded-lg p-6">
          <Robot size={48} className="text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Archon is not installed</h3>
          <p className="text-gray-400 text-center mb-4">
            Archon AI Agent Builder is not properly installed in the SolnAI-agents directory.
          </p>
          <div className="flex gap-2">
            <button
              onClick={checkArchonStatus}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2"
            >
              <ArrowCounterClockwise size={20} />
              Check Again
            </button>
          </div>
        </div>
      ) : !enabled ? (
        <div className="flex flex-col items-center justify-center h-64 bg-gray-800 rounded-lg p-6">
          <Robot size={48} className="text-gray-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">Archon Integration is Disabled</h3>
          <p className="text-gray-400 text-center mb-4">
            Enable Archon integration to create and use AI agent builder sessions.
          </p>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Sessions</h3>
            <div className="flex gap-2">
              <button
                onClick={fetchSessions}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-1"
                disabled={refreshingSessions}
              >
                <ArrowCounterClockwise size={16} className={refreshingSessions ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                onClick={createSession}
                className="px-3 py-1.5 bg-primary-button hover:bg-primary-button/90 rounded-lg flex items-center gap-1"
              >
                <Rocket size={16} />
                New Session
              </button>
            </div>
          </div>

          {sessions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 mb-4">
              {sessions.map((session) => (
                <div
                  key={session.sessionId}
                  className={`p-4 rounded-lg border border-white/10 ${
                    activeSession === session.sessionId ? "bg-gray-800" : "bg-gray-800/50"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Robot size={18} className="text-primary-button" />
                      <span className="font-medium">Session: {session.sessionId.substring(0, 8)}...</span>
                      <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-full">
                        Uptime: {Math.floor(session.uptime / 60000)} min
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveSession(session.sessionId)}
                        className={`p-1.5 rounded-lg flex items-center gap-1 ${
                          activeSession === session.sessionId
                            ? "bg-green-600/30 text-green-400"
                            : "bg-gray-700 hover:bg-gray-600"
                        }`}
                      >
                        <ChatsCircle size={16} />
                      </button>
                      <button
                        onClick={() => endSession(session.sessionId)}
                        className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg"
                      >
                        End
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 bg-gray-800/50 rounded-lg mb-4">
              <p className="text-gray-400">No active sessions</p>
              <button
                onClick={createSession}
                className="mt-2 px-3 py-1.5 bg-primary-button hover:bg-primary-button/90 rounded-lg flex items-center gap-1"
              >
                <Rocket size={16} />
                Start New Session
              </button>
            </div>
          )}

          {activeSession && (
            <div className="flex-1 flex flex-col bg-gray-800 rounded-lg p-4 overflow-hidden">
              <div className="text-sm font-medium mb-2 flex items-center gap-1">
                <ChatsCircle size={16} className="text-primary-button" />
                Conversation
              </div>
              
              <div className="flex-1 overflow-y-auto mb-4 px-2">
                {(sessionResponses[activeSession] || []).map((message, index) => (
                  <div
                    key={index}
                    className={`mb-4 ${
                      message.role === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    <div
                      className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
                        message.role === "user"
                          ? "bg-primary-button text-white"
                          : "bg-gray-700 text-white"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-gray-700 border-none rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-button"
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  disabled={!message.trim()}
                  className="px-4 py-2 bg-primary-button hover:bg-primary-button/90 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">About Archon</h3>
        <p className="text-gray-400 mb-4">
          Archon is an "Agenteer" - an AI agent designed to autonomously build, refine, and optimize other AI agents. It helps you create custom AI agents using frameworks like Pydantic AI and LangGraph.
        </p>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Features:</h4>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>Autonomous agent creation with RAG capabilities</li>
            <li>Multi-agent workflow with LangGraph</li>
            <li>Produces production-ready agent code</li>
            <li>Comprehensive documentation integration</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ArchonPanel;