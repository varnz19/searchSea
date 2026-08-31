import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/authMiddleware';
import { authService } from '../services/authService';
import { activityService } from '../services/activityService';

const router = Router();
const prisma = new PrismaClient();

const DEFAULT_SETTINGS = {
  defaultAlpha: 0.05,
  defaultCorrectionMethod: 'bonferroni', // 'bonferroni' | 'benjamini_hochberg' | 'none'
  speederDurationCutoffSeconds: 15,
  straightlineStdThreshold: 0.35,
  entropyCutoffThreshold: 2.5,
  reportingNotationStyle: 'apa_7th', // 'apa_7th' | 'clinical' | 'compact_latex'
  autoRunPipelineOnIngest: true,
};

/**
 * GET /api/user/profile
 * Retrieves investigator identity, settings, lifetime stats, and activity history
 */
router.get('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const [user, analytics, recentActivity] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          institution: true,
          discipline: true,
          orcidId: true,
          bio: true,
          settingsJson: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      activityService.getLifetimeAnalytics(userId),
      activityService.getRecentActivity(userId, 15),
    ]);

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    let parsedSettings = DEFAULT_SETTINGS;
    if (user.settingsJson) {
      try {
        parsedSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(user.settingsJson) };
      } catch {
        parsedSettings = DEFAULT_SETTINGS;
      }
    }

    return res.json({
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        institution: user.institution,
        discipline: user.discipline,
        orcidId: user.orcidId,
        bio: user.bio,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      settings: parsedSettings,
      analytics,
      recentActivity,
    });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ error: error.message || 'Failed to retrieve investigator profile.' });
  }
});

/**
 * PUT /api/user/profile
 * Updates investigator identity details
 */
router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, username, institution, discipline, orcidId, bio } = req.body;

    // Validate username uniqueness if modified
    if (username && username.trim()) {
      const cleanUsername = username.trim().toLowerCase();
      const existing = await prisma.user.findFirst({
        where: {
          username: cleanUsername,
          NOT: { id: userId },
        },
      });

      if (existing) {
        return res.status(409).json({ error: `Username "${cleanUsername}" is already taken by another researcher.` });
      }
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name: name ? name.trim() : null }),
        ...(username !== undefined && { username: username ? username.trim().toLowerCase() : null }),
        ...(institution !== undefined && { institution: institution ? institution.trim() : null }),
        ...(discipline !== undefined && { discipline: discipline ? discipline.trim() : null }),
        ...(orcidId !== undefined && { orcidId: orcidId ? orcidId.trim() : null }),
        ...(bio !== undefined && { bio: bio ? bio.trim() : null }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        institution: true,
        discipline: true,
        orcidId: true,
        bio: true,
        updatedAt: true,
      },
    });

    await activityService.log({
      userId,
      action: 'PROFILE_UPDATED',
      details: 'Updated investigator identity and institutional affiliations.',
      entityId: userId,
      entityType: 'User',
    });

    return res.json({
      message: 'Investigator profile updated successfully.',
      profile: updated,
    });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({ error: error.message || 'Failed to update investigator profile.' });
  }
});

/**
 * PUT /api/user/settings
 * Updates default methodological preferences and data cleaning thresholds
 */
router.put('/settings', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const incomingSettings = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    let currentSettings = DEFAULT_SETTINGS;
    if (user?.settingsJson) {
      try {
        currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(user.settingsJson) };
      } catch {
        currentSettings = DEFAULT_SETTINGS;
      }
    }

    const mergedSettings = { ...currentSettings, ...incomingSettings };

    await prisma.user.update({
      where: { id: userId },
      data: {
        settingsJson: JSON.stringify(mergedSettings),
      },
    });

    await activityService.log({
      userId,
      action: 'SETTINGS_UPDATED',
      details: `Updated methodological options (default alpha = ${mergedSettings.defaultAlpha}, correction = ${mergedSettings.defaultCorrectionMethod}).`,
      entityId: userId,
      entityType: 'Settings',
    });

    return res.json({
      message: 'Methodological options saved successfully.',
      settings: mergedSettings,
    });
  } catch (error: any) {
    console.error('Error updating user settings:', error);
    return res.status(500).json({ error: error.message || 'Failed to save methodological settings.' });
  }
});

/**
 * PUT /api/user/password
 * Changes account password with current credential validation
 */
router.put('/password', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const isMatch = await authService.comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'The current password provided is incorrect.' });
    }

    const passwordValidation = authService.validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    const newHash = await authService.hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    await activityService.log({
      userId,
      action: 'PASSWORD_CHANGED',
      details: 'Account password was successfully changed.',
      entityId: userId,
      entityType: 'User',
    });

    return res.json({ message: 'Password updated successfully.' });
  } catch (error: any) {
    console.error('Error updating password:', error);
    return res.status(500).json({ error: error.message || 'Failed to update account password.' });
  }
});

/**
 * GET /api/user/activity
 * Retrieves paginated historical activity logs
 */
router.get('/activity', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = Number(req.query.limit) || 30;
    const activity = await activityService.getRecentActivity(userId, limit);
    return res.json(activity);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to retrieve activity history.' });
  }
});

/**
 * GET /api/user/export
 * Downloads full JSON portfolio backup of all studies, questions, responses, and analysis runs
 */
router.get('/export', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const [user, surveys, activityLogs] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          institution: true,
          discipline: true,
          orcidId: true,
          bio: true,
          settingsJson: true,
          createdAt: true,
        },
      }),
      prisma.survey.findMany({
        where: {
          OR: [{ userId }, { userId: null }],
        },
        include: {
          questions: { orderBy: { orderIndex: 'asc' } },
          responses: { orderBy: { createdAt: 'desc' } },
          analysisRuns: {
            include: {
              hypothesisTests: true,
              clusterResults: true,
              themeResults: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.activityLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    await activityService.log({
      userId,
      action: 'PORTFOLIO_EXPORTED',
      details: `Exported complete research portfolio (${surveys.length} studies).`,
      entityId: userId,
      entityType: 'User',
    });

    const exportPayload = {
      exportMetadata: {
        platform: 'SearchSea Quantitative Empirical Research Engine',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        investigator: user,
      },
      portfolio: {
        totalStudies: surveys.length,
        surveys: surveys.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          objective: s.objective,
          archetype: s.archetype,
          status: s.status,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          questions: s.questions.map((q) => ({
            code: q.code,
            title: q.title,
            type: q.type,
            options: q.optionsJson ? JSON.parse(q.optionsJson) : null,
            required: q.required,
          })),
          responsesCount: s.responses.length,
          responsesSample: s.responses.slice(0, 50).map((r) => ({
            id: r.id,
            source: r.source,
            durationSeconds: r.durationSeconds,
            data: JSON.parse(r.dataJson),
            createdAt: r.createdAt,
          })),
          analysisRuns: s.analysisRuns.map((run) => ({
            id: run.id,
            runName: run.runName,
            totalResponses: run.totalResponses,
            cleanResponses: run.cleanResponses,
            cleanRate: run.cleanRate,
            flaggedSpeeders: run.flaggedSpeeders,
            flaggedStraightliners: run.flaggedStraightliners,
            auditLog: run.auditLogJson ? JSON.parse(run.auditLogJson) : [],
            results: run.resultsJson ? JSON.parse(run.resultsJson) : {},
            createdAt: run.createdAt,
          })),
        })),
      },
      activityAuditTimeline: activityLogs,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="searchsea_portfolio_${user?.username || 'investigator'}_${Date.now()}.json"`);
    return res.json(exportPayload);
  } catch (error: any) {
    console.error('Error generating portfolio export:', error);
    return res.status(500).json({ error: error.message || 'Failed to export research portfolio.' });
  }
});

export default router;
