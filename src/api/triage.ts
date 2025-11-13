import { Router } from 'express';
import type { Request, Response } from 'express';
import { getTriageModel } from '../triage/db.js';
import type { TriageItem } from '../triage/db.js';
import mongoose from 'mongoose';
import { runTriageCycle } from '../triage/pipeline.js';

// Helper function no longer needed - Mongoose handles ObjectId conversion

export const triageRouter = Router();

// Get all triage items with optional filters
triageRouter.get('/items', async (req: Request, res: Response) => {
  try {
    const TriageItemModel = getTriageModel();
    const { status, minConfidence, limit } = req.query;

    let query: any = {};
    if (status) {
      query.status = status;
    }
    if (minConfidence) {
      query.confidence = { $gte: parseFloat(minConfidence as string) };
    }

    const items = await TriageItemModel
      .find(query)
      .sort({ receivedAt: -1 })
      .limit(limit ? parseInt(limit as string) : 100)
      .lean();

    res.json(items);
  } catch (error) {
    console.error('Error fetching triage items:', error);
    res.status(500).json({ error: 'Failed to fetch triage items' });
  }
});

// Get a specific triage item
triageRouter.get('/items/:id', async (req: Request, res: Response) => {
  try {
    const TriageItemModel = getTriageModel();
    const item = await TriageItemModel.findById(req.params.id).lean();

    if (!item) {
      return res.status(404).json({ error: 'Triage item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error fetching triage item:', error);
    res.status(500).json({ error: 'Failed to fetch triage item' });
  }
});

// Promote a triage item
triageRouter.post('/items/:id/promote', async (req: Request, res: Response) => {
  try {
    const TriageItemModel = getTriageModel();
    const { createNewCase, caseId, assignee, tags } = req.body;

    const item = await TriageItemModel.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'Promoted',
        $set: { updatedAt: new Date() }
      },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ error: 'Triage item not found' });
    }

    // TODO: Create SupportCase or append Note to existing case
    // This would integrate with your case management system

    res.json({ 
      success: true, 
      message: 'Triage item promoted',
      createNewCase,
      caseId 
    });
  } catch (error) {
    console.error('Error promoting triage item:', error);
    res.status(500).json({ error: 'Failed to promote triage item' });
  }
});

// Reject a triage item
triageRouter.post('/items/:id/reject', async (req: Request, res: Response) => {
  try {
    const TriageItemModel = getTriageModel();
    
    const item = await TriageItemModel.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'Rejected',
        $set: { updatedAt: new Date() }
      },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ error: 'Triage item not found' });
    }

    res.json({ success: true, message: 'Triage item rejected' });
  } catch (error) {
    console.error('Error rejecting triage item:', error);
    res.status(500).json({ error: 'Failed to reject triage item' });
  }
});

// Snooze a triage item
triageRouter.post('/items/:id/snooze', async (req: Request, res: Response) => {
  try {
    const TriageItemModel = getTriageModel();
    const { snoozeUntil } = req.body;

    const item = await TriageItemModel.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'Snoozed',
        snoozeUntil: snoozeUntil ? new Date(snoozeUntil) : undefined,
        $set: { updatedAt: new Date() }
      },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ error: 'Triage item not found' });
    }

    res.json({ success: true, message: 'Triage item snoozed' });
  } catch (error) {
    console.error('Error snoozing triage item:', error);
    res.status(500).json({ error: 'Failed to snooze triage item' });
  }
});

// Mark as reviewed
triageRouter.post('/items/:id/review', async (req: Request, res: Response) => {
  try {
    const TriageItemModel = getTriageModel();
    
    const item = await TriageItemModel.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'Reviewed',
        $set: { updatedAt: new Date() }
      },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ error: 'Triage item not found' });
    }

    res.json({ success: true, message: 'Triage item marked as reviewed' });
  } catch (error) {
    console.error('Error reviewing triage item:', error);
    res.status(500).json({ error: 'Failed to review triage item' });
  }
});

// Update triage item
triageRouter.put('/items/:id', async (req: Request, res: Response) => {
  try {
    const TriageItemModel = getTriageModel();
    const updates = req.body;

    const item = await TriageItemModel.findByIdAndUpdate(
      req.params.id,
      { 
        ...updates,
        $set: { updatedAt: new Date() }
      },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ error: 'Triage item not found' });
    }

    res.json({ success: true, message: 'Triage item updated' });
  } catch (error) {
    console.error('Error updating triage item:', error);
    res.status(500).json({ error: 'Failed to update triage item' });
  }
});

// Manually trigger a triage cycle
triageRouter.post('/run', async (req: Request, res: Response) => {
  try {
    console.log('Manual triage cycle triggered');
    const result = await runTriageCycle();
    res.json({ 
      success: true, 
      message: 'Triage cycle completed',
      processed: result.processed,
      skipped: result.skipped
    });
  } catch (error: any) {
    console.error('Error running triage cycle:', error);
    res.status(500).json({ 
      error: 'Failed to run triage cycle',
      message: error.message || 'Unknown error'
    });
  }
});

