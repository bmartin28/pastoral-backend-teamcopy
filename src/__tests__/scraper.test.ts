import { setAllowedSenders, isFromInterestingPerson, Message } from '../triage/scraper.js';

describe('scraper functions', () => {
  const createMockMessage = (from: string): Message => ({
    id: 'test-id',
    receivedDateTime: new Date().toISOString(),
    subject: 'Test Subject',
    from: { emailAddress: { address: from } },
    bodyPreview: 'Test body',
  });

  describe('setAllowedSenders', () => {
    beforeEach(() => {
      setAllowedSenders([]);
    });

    it('should set allowed senders', () => {
      setAllowedSenders(['student@university.ac.uk', 'staff@university.ac.uk']);

      const msg1 = createMockMessage('student@university.ac.uk');
      const msg2 = createMockMessage('staff@university.ac.uk');
      const msg3 = createMockMessage('other@university.ac.uk');

      expect(isFromInterestingPerson(msg1)).toBe(true);
      expect(isFromInterestingPerson(msg2)).toBe(true);
      expect(isFromInterestingPerson(msg3)).toBe(false);
    });

    it('should be case insensitive', () => {
      setAllowedSenders(['Student@University.ac.uk']);

      const msg1 = createMockMessage('student@university.ac.uk');
      const msg2 = createMockMessage('STUDENT@UNIVERSITY.AC.UK');

      expect(isFromInterestingPerson(msg1)).toBe(true);
      expect(isFromInterestingPerson(msg2)).toBe(true);
    });

    it('should allow all senders when empty', () => {
      setAllowedSenders([]);

      const msg1 = createMockMessage('anyone@example.com');
      const msg2 = createMockMessage('someone@else.com');

      expect(isFromInterestingPerson(msg1)).toBe(true);
      expect(isFromInterestingPerson(msg2)).toBe(true);
    });

    it('should replace previous allowed senders', () => {
      setAllowedSenders(['first@example.com']);
      setAllowedSenders(['second@example.com']);

      const msg1 = createMockMessage('first@example.com');
      const msg2 = createMockMessage('second@example.com');

      expect(isFromInterestingPerson(msg1)).toBe(false);
      expect(isFromInterestingPerson(msg2)).toBe(true);
    });
  });

  describe('isFromInterestingPerson', () => {
    beforeEach(() => {
      setAllowedSenders([]);
    });

    it('should return true when no allowed senders are set', () => {
      const msg = createMockMessage('anyone@example.com');
      expect(isFromInterestingPerson(msg)).toBe(true);
    });

    it('should return true for allowed sender', () => {
      setAllowedSenders(['student@university.ac.uk']);
      const msg = createMockMessage('student@university.ac.uk');
      expect(isFromInterestingPerson(msg)).toBe(true);
    });

    it('should return false for non-allowed sender', () => {
      setAllowedSenders(['student@university.ac.uk']);
      const msg = createMockMessage('other@example.com');
      expect(isFromInterestingPerson(msg)).toBe(false);
    });

    it('should return false when from is null', () => {
      const msg: Message = {
        id: 'test-id',
        receivedDateTime: new Date().toISOString(),
        subject: 'Test',
        from: null,
        bodyPreview: 'Test',
      };
      expect(isFromInterestingPerson(msg)).toBe(false);
    });

    it('should return false when email address is missing', () => {
      const msg: Message = {
        id: 'test-id',
        receivedDateTime: new Date().toISOString(),
        subject: 'Test',
        from: { emailAddress: { address: '' } },
        bodyPreview: 'Test',
      };
      expect(isFromInterestingPerson(msg)).toBe(false);
    });
  });
});

