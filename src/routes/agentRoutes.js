import express from 'express';
import { handleComplianceQuestion } from '../agents/complianceAgent.js';

const router = express.Router();

router.post('/compliance', async (req, res) => {
  try {
    const { message, auditLog, securityContext } = req.body;

    const response = await handleComplianceQuestion({
      userMessage: message,
      auditLog,
      securityContext,
    });

    res.json({ success: true, response });
  } catch (err) {
    console.error('Compliance Agent Error:', err);
    res.status(500).json({
      success: false,
      error: 'Compliance agent failed to process request',
    });
  }
});

export default router;
