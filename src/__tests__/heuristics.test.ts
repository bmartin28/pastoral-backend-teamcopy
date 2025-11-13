import { heuristicFallback } from '../triage/heuristics.js';
import { Message } from '../triage/scraper.js';

describe('heuristicFallback', () => {
  const createMockMessage = (overrides: Partial<Message> = {}): Message => ({
    id: 'test-id',
    receivedDateTime: new Date().toISOString(),
    subject: null,
    from: null,
    bodyPreview: '',
    ...overrides,
  });

  describe('System email detection', () => {
    it('should identify and reject system emails from account-security-noreply', () => {
      const msg = createMockMessage({
        from: { emailAddress: { address: 'account-security-noreply@accountprotection.microsoft.com' } },
        subject: 'Security Alert',
        bodyPreview: 'New sign-in detected',
      });

      const result = heuristicFallback(msg);

      expect(result.isSupportCase).toBe(false);
      expect(result.confidence).toBe(0.1);
      expect(result.tags).toContain('system-email');
      expect(result.suggestedCaseAction).toBe('Ignore');
      expect(result.rationale).toBe('Automated system email');
    });

    it('should identify and reject azure-noreply emails', () => {
      const msg = createMockMessage({
        from: { emailAddress: { address: 'azure-noreply@microsoft.com' } },
        subject: 'Welcome to Azure',
      });

      const result = heuristicFallback(msg);

      expect(result.isSupportCase).toBe(false);
      expect(result.confidence).toBe(0.1);
      expect(result.suggestedCaseAction).toBe('Ignore');
    });

    it('should identify no-reply emails', () => {
      const msg = createMockMessage({
        from: { emailAddress: { address: 'no-reply@example.com' } },
      });

      const result = heuristicFallback(msg);

      expect(result.isSupportCase).toBe(false);
      expect(result.confidence).toBe(0.1);
    });
  });

  describe('Support case detection', () => {
    it('should identify accommodation requests', () => {
      const msg = createMockMessage({
        subject: 'Housing Issue',
        bodyPreview: 'I am having problems with my accommodation and need help',
      });

      const result = heuristicFallback(msg);

      expect(result.isSupportCase).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.tags).toContain('accommodation');
      expect(result.suggestedCaseAction).toBe('Note');
    });

    it('should identify mental health concerns', () => {
      const msg = createMockMessage({
        subject: 'Need Support',
        bodyPreview: 'I am struggling with anxiety and depression and would like counselling',
      });

      const result = heuristicFallback(msg);

      expect(result.isSupportCase).toBe(true);
      expect(result.tags).toContain('mental-health');
      expect(result.suggestedCaseAction).toBe('Note');
    });

    it('should identify financial hardship', () => {
      const msg = createMockMessage({
        subject: 'Financial Support',
        bodyPreview: 'I am experiencing financial hardship and need emergency funding',
      });

      const result = heuristicFallback(msg);

      expect(result.isSupportCase).toBe(true);
      expect(result.tags).toContain('financial');
    });

    it('should identify emergency cases', () => {
      const msg = createMockMessage({
        subject: 'URGENT HELP NEEDED',
        bodyPreview: 'This is an emergency situation and I need urgent help immediately',
      });

      const result = heuristicFallback(msg);

      expect(result.isSupportCase).toBe(true);
      expect(result.tags).toContain('emergency');
      expect(result.suggestedCaseAction).toBe('Open');
    });

    it('should identify mitigating circumstances', () => {
      const msg = createMockMessage({
        subject: 'Extenuating Circumstances',
        bodyPreview: 'I need to submit mitigating circumstances for my exams',
      });

      const result = heuristicFallback(msg);

      expect(result.isSupportCase).toBe(true);
      expect(result.tags).toContain('academic');
    });
  });

  describe('Student email extraction', () => {
    it('should extract student email from body', () => {
      const msg = createMockMessage({
        bodyPreview: 'Please contact me at student@university.ac.uk',
      });

      const result = heuristicFallback(msg);

      expect(result.studentEmail).toBe('student@university.ac.uk');
    });

    it('should extract student email from subject', () => {
      const msg = createMockMessage({
        subject: 'Help needed - contact: student@university.ac.uk',
      });

      const result = heuristicFallback(msg);

      expect(result.studentEmail).toBe('student@university.ac.uk');
    });
  });

  describe('Non-support emails', () => {
    it('should reject emails without support keywords', () => {
      const msg = createMockMessage({
        subject: 'Meeting Reminder',
        bodyPreview: 'Don\'t forget about our meeting tomorrow at 2pm',
      });

      const result = heuristicFallback(msg);

      expect(result.isSupportCase).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.suggestedCaseAction).toBe('Ignore');
    });

    it('should handle empty messages', () => {
      const msg = createMockMessage({
        subject: null,
        bodyPreview: '',
      });

      const result = heuristicFallback(msg);

      expect(result.isSupportCase).toBe(false);
      expect(result.confidence).toBe(0.25);
    });
  });

  describe('Tag extraction', () => {
    it('should extract multiple tags', () => {
      const msg = createMockMessage({
        subject: 'Urgent Financial and Mental Health Support',
        bodyPreview: 'I am experiencing financial hardship and anxiety. This is an emergency.',
      });

      const result = heuristicFallback(msg);

      expect(result.tags).toContain('financial');
      expect(result.tags).toContain('mental-health');
      expect(result.tags).toContain('emergency');
      expect(result.suggestedCaseAction).toBe('Open');
    });
  });
});

