import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface LogActivityParams {
  userId: string;
  action: 'STUDY_CREATED' | 'STUDY_UPDATED' | 'STUDY_DELETED' | 'DATA_INGESTED' | 'PIPELINE_EXECUTED' | 'SETTINGS_UPDATED' | 'PROFILE_UPDATED' | 'PASSWORD_CHANGED' | 'PORTFOLIO_EXPORTED';
  details: string;
  entityId?: string;
  entityType?: 'Survey' | 'AnalysisRun' | 'User' | 'Settings';
}

export const activityService = {
  /**
   * Records an immutable event in the user's historical audit timeline
   */
  async log(params: LogActivityParams): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          details: params.details,
          entityId: params.entityId,
          entityType: params.entityType
        }
      });
    } catch (err: any) {
      console.warn('Failed to record activity log:', err.message);
    }
  },

  /**
   * Retrieves recent activity logs for a user
   */
  async getRecentActivity(userId: string, limit: number = 20) {
    return prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  },

  /**
   * Computes lifetime research analytics for a user
   */
  async getLifetimeAnalytics(userId: string) {
    const [studiesCount, surveys] = await Promise.all([
      prisma.survey.count({
        where: {
          OR: [{ userId }, { userId: null }]
        }
      }),
      prisma.survey.findMany({
        where: {
          OR: [{ userId }, { userId: null }]
        },
        include: {
          _count: { select: { responses: true, analysisRuns: true } },
          analysisRuns: {
            select: {
              cleanResponses: true,
              totalResponses: true,
              resultsJson: true
            }
          }
        }
      })
    ]);

    let totalRawResponses = 0;
    let totalCleanResponses = 0;
    let totalPipelinesRun = 0;
    let totalHypothesesEvaluated = 0;
    let totalSignificantFindings = 0;

    surveys.forEach((s) => {
      totalRawResponses += s._count.responses;
      totalPipelinesRun += s._count.analysisRuns;

      s.analysisRuns.forEach((run) => {
        totalCleanResponses += run.cleanResponses;
        if (run.resultsJson) {
          try {
            const parsed = JSON.parse(run.resultsJson);
            const tests = parsed.hypothesisTesting?.tests || [];
            totalHypothesesEvaluated += tests.length;
            totalSignificantFindings += tests.filter((t: any) => t.is_significant_bonferroni || t.is_significant_raw).length;
          } catch {
            // Ignore malformed snapshot
          }
        }
      });
    });

    return {
      studiesCount,
      totalRawResponses,
      totalCleanResponses,
      totalPipelinesRun,
      totalHypothesesEvaluated,
      totalSignificantFindings
    };
  }
};
