import { LLMServiceFactory, type LLMService } from '../services/llmService';
import configService from '../services/configService';
import type { LLMProvider } from '../types';

/**
 * Utilitaire pour tester tous les fournisseurs LLM
 */
export class LLMTester {
  private static readonly TEST_PROMPT = "Réponds avec un JSON simple contenant uniquement: {\"status\": \"ok\", \"message\": \"Test réussi\"}";
  private static readonly TEST_SYSTEM = "Tu es un assistant qui répond uniquement en JSON valide.";
  private static readonly TEST_SCHEMA = {
    type: "object",
    properties: {
      status: { type: "string" },
      message: { type: "string" }
    },
    required: ["status", "message"]
  };

  /**
   * Teste un fournisseur LLM spécifique
   */
  static async testProvider(provider: LLMProvider): Promise<{ success: boolean; error?: string; duration?: number }> {
    console.log(`[Test] Début du test pour ${provider}`);
    
    try {
      const config = configService.getConfig();
      const providerConfig = config[provider];
      
      if (!providerConfig) {
        return { success: false, error: `Configuration manquante pour ${provider}` };
      }

      // Vérifications préliminaires
      if (['gemini', 'mistral', 'anthropic', 'deepseek', 'qwen', 'xai', 'groq', 'openai'].includes(provider)) {
        if (!providerConfig.apiKey) {
          return { success: false, error: `Clé API manquante pour ${provider}` };
        }
      }

      if (['ollama', 'lmstudio'].includes(provider)) {
        if (!providerConfig.baseUrl) {
          return { success: false, error: `URL de base manquante pour ${provider}` };
        }
      }

      const startTime = Date.now();
      const service = LLMServiceFactory.createService(provider, providerConfig);
      
      // Test de génération JSON
      const result = await service.generateJSON(
        this.TEST_PROMPT,
        this.TEST_SYSTEM,
        this.TEST_SCHEMA
      );

      const duration = Date.now() - startTime;

      // Vérifier que la réponse est valide
      if (!result || typeof result !== 'object') {
        return { success: false, error: `Réponse invalide de ${provider}: ${JSON.stringify(result)}` };
      }

      if (result.status !== 'ok') {
        return { success: false, error: `Réponse inattendue de ${provider}: ${JSON.stringify(result)}` };
      }

      console.log(`[Test] ${provider} - Succès en ${duration}ms`);
      return { success: true, duration };

    } catch (error) {
      console.error(`[Test] ${provider} - Échec:`, error);

      let errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

      // Messages d'erreur spécifiques pour les problèmes courants
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('CORS')) {
        if (provider === 'anthropic') {
          errorMessage = 'Erreur CORS - Normal en développement local. Anthropic fonctionne en production.';
        } else if (provider === 'ollama' || provider === 'lmstudio') {
          errorMessage = `Service local non démarré. Démarrez ${provider === 'ollama' ? 'Ollama' : 'LM Studio'} pour tester.`;
        } else {
          errorMessage = 'Problème de connectivité. Vérifiez votre connexion internet et les clés API.';
        }
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Teste tous les fournisseurs LLM configurés
   */
  static async testAllProviders(): Promise<Record<LLMProvider, { success: boolean; error?: string; duration?: number }>> {
    const providers: LLMProvider[] = [
      'gemini', 'openai', 'mistral', 'anthropic', 
      'deepseek', 'qwen', 'xai', 'groq', 
      'ollama', 'lmstudio'
    ];

    const results: Record<string, any> = {};

    console.log('[Test] Début des tests pour tous les fournisseurs');

    for (const provider of providers) {
      results[provider] = await this.testProvider(provider);
      
      // Petite pause entre les tests pour éviter les rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('[Test] Tests terminés pour tous les fournisseurs');
    return results;
  }

  /**
   * Teste uniquement les fournisseurs avec des clés API configurées
   */
  static async testConfiguredProviders(): Promise<Record<string, { success: boolean; error?: string; duration?: number }>> {
    const config = configService.getConfig();
    const providers: LLMProvider[] = [
      'gemini', 'openai', 'mistral', 'anthropic', 
      'deepseek', 'qwen', 'xai', 'groq', 
      'ollama', 'lmstudio'
    ];

    const configuredProviders = providers.filter(provider => {
      const providerConfig = config[provider];
      if (['ollama', 'lmstudio'].includes(provider)) {
        return providerConfig.baseUrl;
      }
      return providerConfig.apiKey;
    });

    console.log(`[Test] Fournisseurs configurés détectés: ${configuredProviders.join(', ')}`);

    const results: Record<string, any> = {};

    for (const provider of configuredProviders) {
      results[provider] = await this.testProvider(provider);
      
      // Petite pause entre les tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
  }

  /**
   * Génère un rapport de test formaté
   */
  static formatTestResults(results: Record<string, { success: boolean; error?: string; duration?: number }>): string {
    let report = '=== RAPPORT DE TEST DES FOURNISSEURS LLM ===\n\n';
    
    const successful = Object.entries(results).filter(([_, result]) => result.success);
    const failed = Object.entries(results).filter(([_, result]) => !result.success);

    report += `✅ Fournisseurs fonctionnels: ${successful.length}\n`;
    report += `❌ Fournisseurs en échec: ${failed.length}\n\n`;

    if (successful.length > 0) {
      report += '--- FOURNISSEURS FONCTIONNELS ---\n';
      successful.forEach(([provider, result]) => {
        report += `✅ ${provider.toUpperCase()}: OK (${result.duration}ms)\n`;
      });
      report += '\n';
    }

    if (failed.length > 0) {
      report += '--- FOURNISSEURS EN ÉCHEC ---\n';
      failed.forEach(([provider, result]) => {
        report += `❌ ${provider.toUpperCase()}: ${result.error}\n`;
      });
      report += '\n';
    }

    report += '=== FIN DU RAPPORT ===';
    return report;
  }
}

export default LLMTester;
