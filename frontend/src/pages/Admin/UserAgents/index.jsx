import React from "react";
import AdminLayout from "@/components/Admin/AdminLayout";
import { AgentsList } from "@/components/Agents/AgentsList";

export default function UserAgents() {
  return (
    <AdminLayout>
      <AgentsList />
    </AdminLayout>
  );
}