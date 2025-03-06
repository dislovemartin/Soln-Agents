const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class AgentInterface {
  static async getAll() {
    return await prisma.agents.findMany({
      orderBy: { createdAt: "desc" }
    });
  }

  static async get(agentId) {
    return await prisma.agents.findUnique({
      where: { id: parseInt(agentId) }
    });
  }

  static async create(data) {
    const configStr = typeof data.configuration === 'object' 
      ? JSON.stringify(data.configuration) 
      : data.configuration;
      
    return await prisma.agents.create({
      data: {
        name: data.name,
        description: data.description || "",
        configuration: configStr || "{}",
        user_id: parseInt(data.createdBy)
      }
    });
  }

  static async update(agentId, data) {
    const updateData = {};
    
    if (data.name) updateData.name = data.name;
    if (data.description) updateData.description = data.description;
    if (data.configuration) {
      updateData.configuration = typeof data.configuration === 'object' 
        ? JSON.stringify(data.configuration) 
        : data.configuration;
    }
    
    updateData.lastUpdatedAt = new Date();
    
    return await prisma.agents.update({
      where: { id: parseInt(agentId) },
      data: updateData
    });
  }

  static async delete(agentId) {
    return await prisma.agents.delete({
      where: { id: parseInt(agentId) }
    });
  }

  static async getByUser(userId) {
    return await prisma.agents.findMany({
      where: { user_id: parseInt(userId) },
      orderBy: { createdAt: "desc" }
    });
  }
}

module.exports = { AgentInterface };