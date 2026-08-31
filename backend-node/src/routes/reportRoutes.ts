import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { powerBiService } from '../services/powerBiService';

const router = Router();

/**
 * GET /api/reports/:reportId/embed-token
 * Generates short-lived embed token and embedUrl for Power BI App-owns-data embedding
 */
router.get('/:reportId/embed-token', requireAuth, async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const config = await powerBiService.getReportEmbedConfig(reportId);
    return res.json(config);
  } catch (error: any) {
    console.error('Error generating Power BI embed token:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate Power BI embed token' });
  }
});

/**
 * GET /api/reports/available
 * Lists available executive Power BI report dashboards
 */
router.get('/available', requireAuth, (req: Request, res: Response) => {
  return res.json([
    {
      id: 'rep_searchsea_exec_01',
      title: 'Executive Cross-Tabulation & Statistical Distributions',
      description: 'Interactive Power BI report exploring hypothesis tests, group means, and demographic slices.',
      pagesCount: 3,
      isDefault: true
    },
    {
      id: 'rep_searchsea_clusters_02',
      title: 'Multivariate Persona & Cluster Attribution Model',
      description: 'Decomposition tree and scatter projection of respondent segments across behavioral features.',
      pagesCount: 2,
      isDefault: false
    }
  ]);
});

export default router;
