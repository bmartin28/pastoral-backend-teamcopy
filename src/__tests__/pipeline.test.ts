import { runTriageCycle, setTriageModel, setAllowedSendersList } from '../triage/pipeline.js';
import { TriageModel, TriageResult } from '../triage/ai.js';
import { Message } from '../triage/scraper.js';
import { getTriageCollection } from '../triage/db.js';

// Mock dependencies
jest.mock('../triage/scraper.js', () => ({
  fetchRecentMail: jest.fn(),
  isFromInterestingPerson: jest.fn(),
  setAllowedSenders: jest.fn(),
}));

jest.mock('../triage/db.js', () => ({
  getTriageCollection: jest.fn(),
}));

jest.mock('../triage/heuristics.js', () => ({
  heuristicFallback: jest.fn(),
}));

describe('pipeline', () => {
  let mockTriageModel: jest.Mocked<TriageModel>;
  let mockCollection: any;

  beforeEach(() => {
    // Reset environment
    process.env.MONITORED_MAILBOX = 'test@example.com';
    process.env.TENANT_ID = 'test-tenant';
    process.env.CLIENT_ID = 'test-client';
    process.env.CLIENT_SECRET = 'test-secret';
    process.env.USE_DELEGATED_PERMISSIONS = 'false';

    // Setup mocks
    mockTriageModel = {
      classify: jest.fn(),
    };

    mockCollection = {
      findOne: jest.fn(),
      insertOne: jest.fn(),
    };

    (getTriageCollection as jest.Mock).mockResolvedValue(mockCollection);
    setTriageModel(mockTriageModel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('runTriageCycle', () => {
    it('should process emails and create triage items', async () => {
      const { fetchRecentMail, isFromInterestingPerson } = await import('../triage/scraper.js');
      const { heuristicFallback } = await import('../triage/heuristics.js');

      const mockMessages: Message[] = [
        {
          id: 'msg-1',
          receivedDateTime: new Date().toISOString(),
          subject: 'Need Help',
          from: { emailAddress: { address: 'student@university.ac.uk' } },
          bodyPreview: 'I need support with accommodation',
          toRecipients: [{ emailAddress: { address: 'test@example.com' } }],
          ccRecipients: [],
        },
      ];

      const mockTriageResult: TriageResult = {
        isSupportCase: true,
        confidence: 0.8,
        studentEmail: 'student@university.ac.uk',
        names: ['John Doe'],
        tags: ['accommodation'],
        suggestedCaseAction: 'Open',
        rationale: 'Student needs accommodation support',
      };

      (fetchRecentMail as jest.Mock).mockResolvedValue(mockMessages);
      (isFromInterestingPerson as jest.Mock).mockReturnValue(true);
      mockCollection.findOne.mockResolvedValue(null); // No existing item
      mockTriageModel.classify.mockResolvedValue(mockTriageResult);
      (heuristicFallback as jest.Mock).mockReturnValue({
        isSupportCase: false,
        confidence: 0.3,
      });

      const result = await runTriageCycle();

      expect(result.processed).toBe(1);
      expect(result.skipped).toBe(0);
      expect(mockCollection.insertOne).toHaveBeenCalledTimes(1);
      expect(mockTriageModel.classify).toHaveBeenCalledWith({
        subject: 'Need Help',
        bodyText: 'I need support with accommodation',
        from: 'student@university.ac.uk',
      });
    });

    it('should skip emails from non-interesting senders', async () => {
      const { fetchRecentMail, isFromInterestingPerson } = await import('../triage/scraper.js');

      const mockMessages: Message[] = [
        {
          id: 'msg-1',
          receivedDateTime: new Date().toISOString(),
          subject: 'Spam',
          from: { emailAddress: { address: 'spam@example.com' } },
          bodyPreview: 'Buy now!',
          toRecipients: [],
          ccRecipients: [],
        },
      ];

      (fetchRecentMail as jest.Mock).mockResolvedValue(mockMessages);
      (isFromInterestingPerson as jest.Mock).mockReturnValue(false);

      const result = await runTriageCycle();

      expect(result.processed).toBe(0);
      expect(result.skipped).toBe(1);
      expect(mockTriageModel.classify).not.toHaveBeenCalled();
    });

    it('should skip duplicate emails', async () => {
      const { fetchRecentMail, isFromInterestingPerson } = await import('../triage/scraper.js');

      const mockMessages: Message[] = [
        {
          id: 'msg-1',
          receivedDateTime: new Date().toISOString(),
          subject: 'Test',
          from: { emailAddress: { address: 'student@university.ac.uk' } },
          bodyPreview: 'Test',
          toRecipients: [],
          ccRecipients: [],
        },
      ];

      (fetchRecentMail as jest.Mock).mockResolvedValue(mockMessages);
      (isFromInterestingPerson as jest.Mock).mockReturnValue(true);
      mockCollection.findOne.mockResolvedValue({ _id: 'existing-id' }); // Existing item

      const result = await runTriageCycle();

      expect(result.processed).toBe(0);
      expect(result.skipped).toBe(1);
      expect(mockTriageModel.classify).not.toHaveBeenCalled();
    });

    it('should use heuristic fallback for low confidence', async () => {
      const { fetchRecentMail, isFromInterestingPerson } = await import('../triage/scraper.js');
      const { heuristicFallback } = await import('../triage/heuristics.js');

      const mockMessages: Message[] = [
        {
          id: 'msg-1',
          receivedDateTime: new Date().toISOString(),
          subject: 'Unclear',
          from: { emailAddress: { address: 'student@university.ac.uk' } },
          bodyPreview: 'Maybe I need help?',
          toRecipients: [],
          ccRecipients: [],
        },
      ];

      const lowConfidenceResult: TriageResult = {
        isSupportCase: true,
        confidence: 0.3, // Low confidence
        suggestedCaseAction: 'Note',
      };

      const heuristicResult: TriageResult = {
        isSupportCase: true,
        confidence: 0.6, // Higher confidence
        tags: ['keyword'],
        suggestedCaseAction: 'Note',
      };

      (fetchRecentMail as jest.Mock).mockResolvedValue(mockMessages);
      (isFromInterestingPerson as jest.Mock).mockReturnValue(true);
      mockCollection.findOne.mockResolvedValue(null);
      mockTriageModel.classify.mockResolvedValue(lowConfidenceResult);
      (heuristicFallback as jest.Mock).mockReturnValue(heuristicResult);

      await runTriageCycle();

      expect(heuristicFallback).toHaveBeenCalled();
      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          confidence: 0.6, // Should use heuristic confidence
        })
      );
    });

    it('should handle HTML email bodies', async () => {
      const { fetchRecentMail, isFromInterestingPerson } = await import('../triage/scraper.js');

      const mockMessages: Message[] = [
        {
          id: 'msg-1',
          receivedDateTime: new Date().toISOString(),
          subject: 'HTML Email',
          from: { emailAddress: { address: 'student@university.ac.uk' } },
          bodyPreview: 'Preview',
          body: {
            contentType: 'html',
            content: '<p>This is <b>HTML</b> content</p>',
          },
          toRecipients: [],
          ccRecipients: [],
        },
      ];

      const mockTriageResult: TriageResult = {
        isSupportCase: true,
        confidence: 0.8,
        suggestedCaseAction: 'Note',
      };

      (fetchRecentMail as jest.Mock).mockResolvedValue(mockMessages);
      (isFromInterestingPerson as jest.Mock).mockReturnValue(true);
      mockCollection.findOne.mockResolvedValue(null);
      mockTriageModel.classify.mockResolvedValue(mockTriageResult);

      await runTriageCycle();

      expect(mockTriageModel.classify).toHaveBeenCalledWith({
        subject: 'HTML Email',
        bodyText: expect.stringMatching(/This is.*HTML.*content/),
        from: 'student@university.ac.uk',
      });
    });

    it('should throw error if triage model not initialized', async () => {
      setTriageModel(null as any);

      await expect(runTriageCycle()).rejects.toThrow('Triage model not initialized');
    });

    it('should throw error if required env vars missing', async () => {
      delete process.env.MONITORED_MAILBOX;

      await expect(runTriageCycle()).rejects.toThrow('Missing required environment variables');
    });
  });
});

