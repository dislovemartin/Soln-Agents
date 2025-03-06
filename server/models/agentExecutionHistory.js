const prisma = require("../utils/prisma");

const AgentExecutionHistory = {
  async create(data) {
    return prisma.agent_execution_history.create({
      data: {
        agent_id: data.agentId,
        agent_type: data.agentType, // 'solnai' or 'autogen'
        agent_name: data.agentName,
        workspace_id: data.workspaceId,
        user_id: data.userId,
        execution_time: data.executionTime,
        prompt: data.prompt,
        result: data.result,
        status: data.status, // 'success', 'error', 'timeout'
        error: data.error,
        metadata: data.metadata || {},
        created_at: new Date(),
      },
    });
  },

  async findById(id) {
    return prisma.agent_execution_history.findUnique({
      where: { id },
    });
  },

  async findByAgentId(agentId, limit = 100) {
    return prisma.agent_execution_history.findMany({
      where: { agent_id: agentId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  },
  
  async findByWorkspaceId(workspaceId, limit = 100) {
    return prisma.agent_execution_history.findMany({
      where: { workspace_id: workspaceId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  },
  
  async findByUserId(userId, limit = 100) {
    return prisma.agent_execution_history.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  },
  
  async getAgentStats(filters = {}) {
    // Get statistics about agent executions
    const where = {};
    
    if (filters.agentId) where.agent_id = filters.agentId;
    if (filters.agentType) where.agent_type = filters.agentType;
    if (filters.workspaceId) where.workspace_id = filters.workspaceId;
    if (filters.userId) where.user_id = filters.userId;
    if (filters.status) where.status = filters.status;
    
    if (filters.startDate && filters.endDate) {
      where.created_at = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    } else if (filters.startDate) {
      where.created_at = {
        gte: new Date(filters.startDate),
      };
    } else if (filters.endDate) {
      where.created_at = {
        lte: new Date(filters.endDate),
      };
    }
    
    const totalExecutions = await prisma.agent_execution_history.count({
      where,
    });
    
    const successfulExecutions = await prisma.agent_execution_history.count({
      where: {
        ...where,
        status: 'success',
      },
    });
    
    const failedExecutions = await prisma.agent_execution_history.count({
      where: {
        ...where,
        status: 'error',
      },
    });
    
    const timeoutExecutions = await prisma.agent_execution_history.count({
      where: {
        ...where,
        status: 'timeout',
      },
    });
    
    // Get average execution time
    const executionTimeResult = await prisma.$queryRaw`
      SELECT AVG(execution_time) as avg_time 
      FROM agent_execution_history 
      WHERE ${where}
    `;
    
    const avgExecutionTime = executionTimeResult[0]?.avg_time || 0;
    
    // Get most used agents
    const topAgents = await prisma.agent_execution_history.groupBy({
      by: ['agent_id', 'agent_name'],
      _count: {
        agent_id: true,
      },
      orderBy: {
        _count: {
          agent_id: 'desc',
        },
      },
      take: 5,
      where,
    });
    
    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      timeoutExecutions,
      successRate: totalExecutions ? (successfulExecutions / totalExecutions) * 100 : 0,
      avgExecutionTime,
      topAgents: topAgents.map(agent => ({
        agentId: agent.agent_id,
        agentName: agent.agent_name,
        count: agent._count.agent_id,
      })),
    };
  },
  
  async getTimeSeriesData(filters = {}, interval = 'day') {
    // Get time series data for agent executions
    const where = {};
    
    if (filters.agentId) where.agent_id = filters.agentId;
    if (filters.agentType) where.agent_type = filters.agentType;
    if (filters.workspaceId) where.workspace_id = filters.workspaceId;
    if (filters.userId) where.user_id = filters.userId;
    
    if (filters.startDate && filters.endDate) {
      where.created_at = {
        gte: new Date(filters.startDate),
        lte: new Date(filters.endDate),
      };
    } else if (filters.startDate) {
      where.created_at = {
        gte: new Date(filters.startDate),
      };
    } else if (filters.endDate) {
      where.created_at = {
        lte: new Date(filters.endDate),
      };
    } else {
      // Default to last 30 days if no date range specified
      where.created_at = {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      };
    }
    
    // Determine formatting based on database type
    const dbProvider = process.env.DATABASE_PROVIDER || 'sqlite';
    const isPostgres = dbProvider.toLowerCase().includes('postgres');
    const isMySql = dbProvider.toLowerCase().includes('mysql');
    const isSqlite = dbProvider.toLowerCase().includes('sqlite');
    
    try {
      if (isPostgres) {
        // PostgreSQL formatting
        let dateFormat;
        switch (interval) {
          case 'hour':
            dateFormat = "YYYY-MM-DD HH24:00:00";
            break;
          case 'day':
            dateFormat = "YYYY-MM-DD";
            break;
          case 'week':
            dateFormat = "YYYY-WW";
            break;
          case 'month':
            dateFormat = "YYYY-MM";
            break;
          default:
            dateFormat = "YYYY-MM-DD";
        }
        
        return await prisma.$queryRaw`
          SELECT 
            TO_CHAR(created_at, ${dateFormat}) as time_period,
            COUNT(*) as total,
            SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
            SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error,
            SUM(CASE WHEN status = 'timeout' THEN 1 ELSE 0 END) as timeout,
            AVG(execution_time) as avg_time
          FROM agent_execution_history
          WHERE created_at >= ${where.created_at?.gte || new Date(0)}
            AND created_at <= ${where.created_at?.lte || new Date()}
            ${where.agent_id ? `AND agent_id = ${where.agent_id}` : ''}
            ${where.agent_type ? `AND agent_type = ${where.agent_type}` : ''}
            ${where.workspace_id ? `AND workspace_id = ${where.workspace_id}` : ''}
            ${where.user_id ? `AND user_id = ${where.user_id}` : ''}
          GROUP BY time_period
          ORDER BY MIN(created_at)
        `;
      } else if (isMySql) {
        // MySQL formatting
        let dateFormat;
        switch (interval) {
          case 'hour':
            dateFormat = '%Y-%m-%d %H:00:00';
            break;
          case 'day':
            dateFormat = '%Y-%m-%d';
            break;
          case 'week':
            dateFormat = '%Y-%U';
            break;
          case 'month':
            dateFormat = '%Y-%m';
            break;
          default:
            dateFormat = '%Y-%m-%d';
        }
        
        return await prisma.$queryRaw`
          SELECT 
            DATE_FORMAT(created_at, ${dateFormat}) as time_period,
            COUNT(*) as total,
            SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
            SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error,
            SUM(CASE WHEN status = 'timeout' THEN 1 ELSE 0 END) as timeout,
            AVG(execution_time) as avg_time
          FROM agent_execution_history
          WHERE created_at >= ${where.created_at?.gte || new Date(0)}
            AND created_at <= ${where.created_at?.lte || new Date()}
            ${where.agent_id ? `AND agent_id = ${where.agent_id}` : ''}
            ${where.agent_type ? `AND agent_type = ${where.agent_type}` : ''}
            ${where.workspace_id ? `AND workspace_id = ${where.workspace_id}` : ''}
            ${where.user_id ? `AND user_id = ${where.user_id}` : ''}
          GROUP BY time_period
          ORDER BY MIN(created_at)
        `;
      } else {
        // SQLite (default) - has limited date functions, simplify the query
        const groupBy = interval === 'hour' ? 
          "strftime('%Y-%m-%d %H:00:00', created_at)" : 
          interval === 'day' ? 
            "strftime('%Y-%m-%d', created_at)" : 
            interval === 'week' ? 
              "strftime('%Y-%W', created_at)" : 
              "strftime('%Y-%m', created_at)";
        
        // For SQLite we'll use Prisma's standard query builder
        const records = await prisma.agent_execution_history.groupBy({
          by: ['status'],
          where,
          _count: {
            id: true
          },
          _avg: {
            execution_time: true
          }
        });
        
        // Process the results to match expected format
        const processedResults = [];
        let totalSuccess = 0;
        let totalError = 0;
        let totalTimeout = 0;
        let avgTime = 0;
        let count = 0;
        
        records.forEach(record => {
          if (record.status === 'success') totalSuccess = record._count.id;
          if (record.status === 'error') totalError = record._count.id;
          if (record.status === 'timeout') totalTimeout = record._count.id;
          avgTime += record._avg.execution_time || 0;
          count++;
        });
        
        // Return simplified data for SQLite
        return [{
          time_period: new Date().toISOString().split('T')[0], // today's date
          total: totalSuccess + totalError + totalTimeout,
          success: totalSuccess,
          error: totalError,
          timeout: totalTimeout,
          avg_time: count > 0 ? avgTime / count : 0
        }];
      }
    } catch (error) {
      console.error('Error in getTimeSeriesData:', error);
      // Fallback to returning empty array
      return [];
    }
  },
  
  async deleteById(id) {
    return prisma.agent_execution_history.delete({
      where: { id },
    });
  },
  
  async deleteOlderThan(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    return prisma.agent_execution_history.deleteMany({
      where: {
        created_at: {
          lt: date,
        },
      },
    });
  },
};

module.exports = { AgentExecutionHistory };