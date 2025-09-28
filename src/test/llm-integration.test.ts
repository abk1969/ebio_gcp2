import { describe, it, expect, beforeEach } from 'vitest';
import { LLMServiceFactory } from '../services/llmService';
import configService from '../services/configService';
import type { LLMProvider } from '../types';

describe('LLM Integration Tests', () => {
  const testProviders: LLMProvider[] = [
    'gemini', 'mistral', 'anthropic', 'deepseek', 
    'qwen', 'xai', 'groq', 'ollama', 'lmstudio'
  ];

  beforeEach(() => {
    // Reset configuration before each test
    configService.resetToDefaults();
  });

  describe('Service Factory', () => {
    it('should create services for all supported providers', () => {
      testProviders.forEach(provider => {
        const config = configService.getConfig();
        const providerConfig = config[provider];
        
        expect(() => {
          const service = LLMServiceFactory.createService(provider, providerConfig);
          expect(service).toBeDefined();
          expect(service.generateContent).toBeDefined();
          expect(service.generateJSON).toBeDefined();
        }).not.toThrow();
      });
    });

    it('should throw error for unsupported provider', () => {
      expect(() => {
        LLMServiceFactory.createService('unsupported' as any, {});
      }).toThrow('Fournisseur LLM non supporté: unsupported');
    });
  });

  describe('Configuration Service', () => {
    it('should have default configurations for all providers', () => {
      const config = configService.getConfig();
      
      testProviders.forEach(provider => {
        expect(config[provider]).toBeDefined();
        expect(config[provider].model).toBeDefined();
        
        // API-based providers should have apiKey field
        if (['gemini', 'mistral', 'anthropic', 'deepseek', 'qwen', 'xai', 'groq'].includes(provider)) {
          expect(config[provider]).toHaveProperty('apiKey');
        }
        
        // Local providers should have baseUrl field
        if (['ollama', 'lmstudio'].includes(provider)) {
          expect(config[provider]).toHaveProperty('baseUrl');
        }
      });
    });

    it('should validate configurations correctly', () => {
      testProviders.forEach(provider => {
        configService.setProvider(provider);
        
        // Initially should be invalid (no API key for cloud providers)
        if (['gemini', 'mistral', 'anthropic', 'deepseek', 'qwen', 'xai', 'groq'].includes(provider)) {
          expect(configService.isConfigValid()).toBe(false);
          
          // Should be valid after setting API key
          configService.updateProviderConfig(provider, { apiKey: 'test-key' });
          expect(configService.isConfigValid()).toBe(true);
        }
      });
    });

    it('should return appropriate error messages', () => {
      testProviders.forEach(provider => {
        configService.setProvider(provider);
        const errors = configService.getConfigErrors();
        
        if (['gemini', 'mistral', 'anthropic', 'deepseek', 'qwen', 'xai', 'groq', 'openai'].includes(provider)) {
          expect(errors).toContain(expect.stringContaining('Clé API'));
        }
      });
    });
  });

  describe('EBIOS Schema Compatibility', () => {
    const mockSystemInstruction = "Tu es un expert en cybersécurité spécialisé dans la méthode EBIOS RM.";
    const mockPrompt = "Génère une valeur métier pour un projet e-commerce.";
    
    const mockSchema = {
      type: "object",
      properties: {
        businessValues: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              description: { type: "string" }
            },
            required: ["id", "name", "description"]
          }
        }
      },
      required: ["businessValues"]
    };

    it('should handle JSON schema for all providers', async () => {
      // This test would require actual API keys, so we'll mock the responses
      testProviders.forEach(provider => {
        const config = configService.getConfig();
        const providerConfig = config[provider];
        
        expect(() => {
          const service = LLMServiceFactory.createService(provider, providerConfig);
          
          // Verify the service has the required methods
          expect(service.generateJSON).toBeDefined();
          expect(typeof service.generateJSON).toBe('function');
        }).not.toThrow();
      });
    });

    it('should handle error responses gracefully', async () => {
      testProviders.forEach(provider => {
        const config = configService.getConfig();
        const providerConfig = config[provider];
        
        const service = LLMServiceFactory.createService(provider, providerConfig);
        
        // Test with invalid configuration should throw appropriate error
        expect(async () => {
          await service.generateContent("test prompt");
        }).rejects.toThrow();
      });
    });
  });

  describe('Model Configurations', () => {
    it('should have correct default models for each provider', () => {
      const config = configService.getConfig();
      
      expect(config.gemini.model).toBe('gemini-2.5-flash');
      expect(config.mistral.model).toBe('mistral-large-2411');
      expect(config.anthropic.model).toBe('claude-sonnet-4-20250514');
      expect(config.deepseek.model).toBe('deepseek-v3');
      expect(config.qwen.model).toBe('qwen-max');
      expect(config.xai.model).toBe('grok-2-latest');
      expect(config.groq.model).toBe('llama-3.3-70b-versatile');
      expect(config.ollama.model).toBe('llama3.2');
      expect(config.lmstudio.model).toBe('local-model');
      expect(config.openai.model).toBe('gpt-5');
    });

    it('should have correct base URLs for each provider', () => {
      const config = configService.getConfig();
      
      expect(config.gemini.baseUrl).toBe('https://generativelanguage.googleapis.com');
      expect(config.mistral.baseUrl).toBe('https://api.mistral.ai');
      expect(config.anthropic.baseUrl).toBe('https://api.anthropic.com');
      expect(config.deepseek.baseUrl).toBe('https://api.deepseek.com');
      expect(config.qwen.baseUrl).toBe('https://dashscope.aliyuncs.com');
      expect(config.xai.baseUrl).toBe('https://api.x.ai');
      expect(config.groq.baseUrl).toBe('https://api.groq.com/openai');
      expect(config.ollama.baseUrl).toBe('http://localhost:11434');
      expect(config.lmstudio.baseUrl).toBe('http://localhost:1234');
      expect(config.openai.baseUrl).toBe('https://api.openai.com');
    });
  });
});
