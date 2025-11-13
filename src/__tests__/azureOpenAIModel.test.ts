import { AzureOpenAITriage } from '../triage/azureOpenAIModel.js';
import { OpenAIClient } from '@azure/openai';

// Mock the Azure OpenAI client
jest.mock('@azure/openai', () => ({
  OpenAIClient: jest.fn(),
}));

jest.mock('@azure/core-auth', () => ({
  AzureKeyCredential: jest.fn(),
}));

describe('AzureOpenAITriage', () => {
  let mockClient: jest.Mocked<OpenAIClient>;
  let classifier: AzureOpenAITriage;

  beforeEach(() => {
    mockClient = {
      getChatCompletions: jest.fn(),
    } as any;

    (OpenAIClient as jest.Mock).mockImplementation(() => mockClient);
    classifier = new AzureOpenAITriage('https://test.openai.azure.com/', 'test-key', 'gpt-4o-mini');
  });

  describe('classify', () => {
    it('should classify a support case correctly', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              isSupportCase: true,
              confidence: 0.9,
              studentEmail: 'student@university.ac.uk',
              names: ['John Doe'],
              programme: 'Computer Science',
              tags: ['mental-health'],
              suggestedCaseAction: 'Open',
              rationale: 'Student requesting mental health support',
            }),
          },
        }],
      };

      mockClient.getChatCompletions = jest.fn().mockResolvedValue(mockResponse);

      const result = await classifier.classify({
        subject: 'Need Help',
        bodyText: 'I am struggling with anxiety and need support',
        from: 'student@university.ac.uk',
      });

      expect(result.isSupportCase).toBe(true);
      expect(result.confidence).toBe(0.9);
      expect(result.studentEmail).toBe('student@university.ac.uk');
      expect(result.names).toEqual(['John Doe']);
      expect(result.programme).toBe('Computer Science');
      expect(result.tags).toEqual(['mental-health']);
      expect(result.suggestedCaseAction).toBe('Open');
      expect(mockClient.getChatCompletions).toHaveBeenCalled();
    });

    it('should classify a non-support case correctly', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              isSupportCase: false,
              confidence: 0.2,
              studentEmail: null,
              names: [],
              programme: null,
              tags: [],
              suggestedCaseAction: 'Ignore',
              rationale: 'System notification email',
            }),
          },
        }],
      };

      mockClient.getChatCompletions = jest.fn().mockResolvedValue(mockResponse);

      const result = await classifier.classify({
        subject: 'Security Alert',
        bodyText: 'New sign-in detected for your account',
        from: 'noreply@microsoft.com',
      });

      expect(result.isSupportCase).toBe(false);
      expect(result.confidence).toBe(0.2);
      expect(result.suggestedCaseAction).toBe('Ignore');
    });

    it('should handle API errors gracefully', async () => {
      mockClient.getChatCompletions = jest.fn().mockRejectedValue(new Error('API Error'));

      const result = await classifier.classify({
        subject: 'Test',
        bodyText: 'Test body',
      });

      expect(result.isSupportCase).toBe(false);
      expect(result.confidence).toBe(0.1);
      expect(result.suggestedCaseAction).toBe('Ignore');
      expect(result.tags).toContain('error');
    });

    it('should handle empty response gracefully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: null,
          },
        }],
      };

      mockClient.getChatCompletions = jest.fn().mockResolvedValue(mockResponse);

      const result = await classifier.classify({
        subject: 'Test',
        bodyText: 'Test',
      });

      // Should return fallback result instead of throwing
      expect(result.isSupportCase).toBe(false);
      expect(result.confidence).toBe(0.1);
      expect(result.tags).toContain('error');
    });

    it('should truncate long body text', async () => {
      const longBody = 'a'.repeat(5000);
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              isSupportCase: true,
              confidence: 0.8,
              suggestedCaseAction: 'Note',
            }),
          },
        }],
      };

      mockClient.getChatCompletions = jest.fn().mockResolvedValue(mockResponse);

      await classifier.classify({
        subject: 'Test',
        bodyText: longBody,
      });

      const callArgs = mockClient.getChatCompletions.mock.calls[0];
      const message = callArgs[1][0] as any;
      const prompt = message.content;
      // The body text should be truncated to 4000 chars, but the full prompt includes template text
      // So we check that the body portion is truncated (look for the truncated 'a' sequence)
      const bodyMatch = prompt.match(/Body:\s*(.*?)$/s);
      if (bodyMatch) {
        expect(bodyMatch[1].length).toBeLessThanOrEqual(4000);
      }
    });

    it('should use correct deployment name', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              isSupportCase: true,
              confidence: 0.8,
              suggestedCaseAction: 'Note',
            }),
          },
        }],
      };

      mockClient.getChatCompletions = jest.fn().mockResolvedValue(mockResponse);

      await classifier.classify({
        subject: 'Test',
        bodyText: 'Test',
      });

      expect(mockClient.getChatCompletions).toHaveBeenCalledWith(
        'gpt-4o-mini',
        expect.any(Array),
        expect.objectContaining({
          temperature: 0.2,
          responseFormat: { type: 'json_object' },
        })
      );
    });
  });
});

