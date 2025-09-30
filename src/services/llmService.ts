import { GoogleGenAI, Type } from "@google/genai";
import type { LLMResponse, GeminiConfig, OllamaConfig, LMStudioConfig, MistralConfig, AnthropicConfig, DeepSeekConfig, QwenConfig, XAIConfig, GroqConfig, OpenAIConfig } from '../types';

type ChatMessage = { role: 'system' | 'user'; content: string };

/**
 * Fonction de retry avec backoff exponentiel
 */
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  provider: string = ''
): Promise<T> => {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Ne pas retry si c'est une erreur d'authentification ou de configuration
      if (error.message?.includes('401') || error.message?.includes('403') ||
          error.message?.includes('API key') || error.message?.includes('CORS')) {
        throw error;
      }

      // Retry pour rate limit et erreurs réseau
      if (i < maxRetries - 1 &&
          (error.message?.includes('429') || error.message?.includes('rate') ||
           error.message?.includes('timeout') || error.message?.includes('network'))) {
        const delay = initialDelay * Math.pow(2, i);
        console.log(`[${provider}] Tentative ${i + 1}/${maxRetries} échouée. Nouvelle tentative dans ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        break;
      }
    }
  }

  throw lastError;
};

/**
 * Détecte si on est en développement local
 */
const isLocalDevelopment = (): boolean => {
  return typeof window !== 'undefined' &&
         (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname.includes('192.168.'));
};

/**
 * Providers qui nécessitent un proxy pour contourner CORS
 */
const PROVIDERS_NEEDING_PROXY = ['anthropic', 'openai', 'mistral', 'deepseek', 'qwen', 'xai', 'groq'];

/**
 * Utilise le proxy Vercel ou local pour contourner CORS
 */
const useProxyIfNeeded = async (url: string, options: RequestInit, provider: string): Promise<Response> => {
  // Si le provider ne nécessite pas de proxy, appel direct
  if (!PROVIDERS_NEEDING_PROXY.includes(provider)) {
    return fetch(url, options);
  }

  // En production (Vercel), utiliser le proxy Vercel
  if (!isLocalDevelopment()) {
    const proxyUrl = `/api/llm-proxy?provider=${provider}`;
    console.log(`[${provider}] Utilisation du proxy Vercel pour contourner CORS`);

    // Extraire l'API key des headers
    const headers = options.headers as Record<string, string> || {};
    const apiKey = headers['x-api-key'] || headers['Authorization'] || '';

    // Parser le body si c'est une string, sinon utiliser tel quel
    let bodyToSend = options.body;
    if (typeof bodyToSend === 'string') {
      try {
        // Le body est déjà stringifié, on le parse puis le re-stringify pour être sûr
        const parsed = JSON.parse(bodyToSend);
        bodyToSend = JSON.stringify(parsed);
      } catch (e) {
        console.warn(`[${provider}] Body n'est pas du JSON valide:`, bodyToSend);
      }
    }

    console.log(`[${provider}] Envoi au proxy:`, {
      url: proxyUrl,
      hasApiKey: !!apiKey,
      bodyLength: bodyToSend?.toString().length || 0
    });

    return fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: bodyToSend,
    });
  }

  // En développement local, essayer le proxy local pour Anthropic
  if (provider === 'anthropic') {
    const proxyUrl = 'http://localhost:3001/api/anthropic/messages';
    console.log(`[${provider}] Tentative d'utilisation du proxy local pour contourner CORS...`);

    try {
      // Test rapide de disponibilité du proxy avec timeout court
      const testResponse = await Promise.race([
        fetch('http://localhost:3001/api/anthropic/test', { method: 'GET' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Proxy timeout')), 500))
      ]).catch(() => null);

      if (testResponse) {
        console.log(`[${provider}] ✅ Proxy disponible, utilisation du proxy`);
        const response = await fetch(proxyUrl, {
          ...options,
          headers: {
            ...options.headers,
            'Content-Type': 'application/json'
          }
        });
        return response;
      }
    } catch (error) {
      console.warn(`[${provider}] ⚠️ Proxy local non disponible`);
    }

    // Si proxy non disponible, informer l'utilisateur
    console.error(`[${provider}] ❌ CORS Error - Le proxy n'est pas lancé. Lancez 'npm run dev:proxy' ou 'start-proxy.bat'`);
    throw new Error('CORS Error - Anthropic nécessite un proxy. Lancez "npm run dev:proxy" dans un autre terminal ou double-cliquez sur start-proxy.bat');
  }

  // Pour les autres providers en local, appel direct (ils échoueront avec CORS)
  console.warn(`[${provider}] ⚠️ Appel direct - CORS peut bloquer la requête`);
  return fetch(url, options);
};

/**
 * Ajoute le paramètre de tokens approprié selon le modèle
 */
const addTokensParameter = (requestBody: any, model: string, maxTokens: number = 16000): void => {
  // Utiliser max_completion_tokens pour GPT-5, GPT-o3 et les nouveaux modèles OpenAI
  if (model.includes('gpt-5') || model.includes('gpt-4o') || model.includes('gpt-o3') || model.includes('o1-')) {
    requestBody.max_completion_tokens = maxTokens;
  } else {
    requestBody.max_tokens = maxTokens;
  }
};

/**
 * Configure la température selon le modèle
 */
const configureTemperature = (requestBody: any, model: string): void => {
  // GPT-5 et o1 ont des contraintes spécifiques de température
  if (model.includes('gpt-5') || model.includes('o1-')) {
    requestBody.temperature = 1; // Obligatoire pour GPT-5 et o1 (contrainte OpenAI)
  } else {
    // Pour tous les autres modèles, utiliser une température basse pour la précision
    requestBody.temperature = 0.2; // Température basse pour maximiser la précision et la cohérence
  }
};

/**
 * Configure les paramètres spéciaux pour GPT-5 selon la documentation officielle
 */
const configureGPT5Parameters = (requestBody: any, model: string, responseSchema?: any): void => {
  if (model.includes('gpt-5')) {
    // Paramètres obligatoires pour GPT-5
    requestBody.temperature = 1; // Seule valeur supportée par GPT-5 (contrainte OpenAI)
    requestBody.max_completion_tokens = 16000; // Augmenté pour les réponses JSON complexes

    // Nouveaux paramètres spécifiques à GPT-5
    requestBody.reasoning_effort = "medium"; // low, medium, high
    requestBody.verbosity = "medium"; // low, medium, high

    // Supprimer les paramètres non supportés par GPT-5
    delete requestBody.max_tokens;
    delete requestBody.response_format; // GPT-5 ne supporte pas response_format
    delete requestBody.top_p;
    delete requestBody.frequency_penalty;
    delete requestBody.presence_penalty;

    console.log('[GPT-5] Configuration spéciale appliquée:', {
      temperature: requestBody.temperature,
      max_completion_tokens: requestBody.max_completion_tokens,
      reasoning_effort: requestBody.reasoning_effort,
      verbosity: requestBody.verbosity
    });
  }
};

const stringifySchemaForPrompt = (schema: any): string => {
  if (!schema) {
    return '';
  }
  try {
    return JSON.stringify(
      schema,
      (_key, value) => {
        if (typeof value === 'function') {
          return value.toString();
        }
        if (typeof value === 'symbol') {
          return value.toString();
        }
        return value;
      },
      2,
    );
  } catch (error) {
    console.warn('Impossible de sérialiser le schéma JSON pour les instructions LLM.', error);
    return '';
  }
};

const buildJsonUserPrompt = (prompt: string, schema?: any): string => {
  const strictInstruction = `IMPORTANT: Réponds STRICTEMENT avec un JSON valide sans aucun texte supplémentaire.
- Ne commence pas par du texte explicatif
- Ne termine pas par des commentaires
- Retourne uniquement le JSON brut
- Assure-toi que le JSON est bien formé et valide`;

  if (!schema) {
    return `${prompt}\n\n${strictInstruction}`;
  }

  const schemaText = stringifySchemaForPrompt(schema);
  if (schemaText) {
    return `${prompt}\n\n${strictInstruction}\n\nSchéma JSON attendu:\n${schemaText}\n\nRéponds uniquement avec un JSON qui respecte exactement ce schéma.`;
  }

  return `${prompt}\n\n${strictInstruction}\nRespecte le schéma JSON fourni.`;
};

const buildJsonSystemInstruction = (systemInstruction: string | undefined, schema?: any): string | undefined => {
  const reminder = `Tu dois ABSOLUMENT respecter ces règles de format:
1. Réponds UNIQUEMENT avec du JSON valide
2. Aucun texte avant ou après le JSON
3. Aucune explication ou commentaire
4. Le JSON doit être bien formé et parsable
5. Respecte exactement le schéma fourni si applicable`;

  if (!schema) {
    return systemInstruction;
  }

  if (!systemInstruction) {
    return reminder;
  }

  if (systemInstruction.includes('respecter ces règles de format')) {
    return systemInstruction;
  }

  return `${systemInstruction}\n\n${reminder}`;
};

const parseJsonFromText = (provider: string, rawText: string): any => {
  console.log(`[${provider}] Tentative de parsing JSON. Texte reçu:`, rawText?.substring(0, 200) + (rawText?.length > 200 ? '...' : ''));

  const candidates: string[] = [];
  const trimmed = rawText?.trim();

  if (!trimmed) {
    console.error(`[${provider}] Réponse vide reçue`);
    throw new Error(`Le fournisseur ${provider} a renvoyé une réponse vide.`);
  }

  // Ajouter le texte brut comme premier candidat
  candidates.push(trimmed);

  // Traitement spécial pour Gemini
  if (provider.toLowerCase().includes('gemini')) {
    // Gemini peut retourner du JSON partiel comme: "context": "texte..."
    // Essayer de construire un objet JSON valide
    if (trimmed.startsWith('"') && trimmed.includes('":')) {
      try {
        const wrappedJson = `{${trimmed}}`;
        candidates.push(wrappedJson);
        console.log(`[${provider}] Tentative de correction Gemini: ${wrappedJson.substring(0, 100)}...`);
      } catch {}
    }

    // Si le texte commence par une propriété JSON sans accolades ouvrantes
    if (trimmed.match(/^"[^"]+"\s*:\s*/)) {
      try {
        const wrappedJson = `{${trimmed}}`;
        candidates.push(wrappedJson);
        console.log(`[${provider}] Tentative de correction Gemini (propriété seule): ${wrappedJson.substring(0, 100)}...`);
      } catch {}
    }

    // Détecter si la réponse semble tronquée et essayer de la compléter
    if (trimmed.startsWith('{') && !trimmed.endsWith('}')) {
      console.warn(`[${provider}] Réponse JSON semble tronquée, tentative de completion...`);

      // Compter les accolades ouvrantes et fermantes
      const openBraces = (trimmed.match(/\{/g) || []).length;
      const closeBraces = (trimmed.match(/\}/g) || []).length;
      const missingBraces = openBraces - closeBraces;

      if (missingBraces > 0) {
        // Essayer de fermer les accolades manquantes
        let completed = trimmed;

        // Si la dernière ligne semble incomplète, la nettoyer
        const lines = completed.split('\n');
        const lastLine = lines[lines.length - 1];
        if (lastLine && !lastLine.trim().endsWith('"') && !lastLine.trim().endsWith(',') && !lastLine.trim().endsWith('}')) {
          // Supprimer la dernière ligne incomplète
          lines.pop();
          completed = lines.join('\n');
        }

        // Ajouter les accolades fermantes manquantes
        completed += '}'.repeat(missingBraces);
        candidates.push(completed);
        console.log(`[${provider}] Tentative de completion avec ${missingBraces} accolades fermantes`);
      }
    }

    // Patterns spécifiques à Gemini
    const geminiPatterns = [
      // Gemini peut entourer le JSON avec du texte explicatif
      /(?:voici|here is|result|résultat|response)[^{]*(\{[\s\S]*\})/gi,
      // JSON après ":"
      /:\s*(\{[\s\S]*\})/g,
      // Réponse directe de schéma
      /(\{[\s\S]*"context"[\s\S]*\})/gi
    ];

    for (const pattern of geminiPatterns) {
      const matches = [...trimmed.matchAll(pattern)];
      for (const match of matches) {
        if (match[1]) candidates.push(match[1].trim());
      }
    }
  }

  // Chercher du JSON dans des blocs de code markdown
  const jsonFence = trimmed.match(/```json\s*([\s\S]*?)\s*```/i);
  if (jsonFence?.[1]) {
    candidates.push(jsonFence[1].trim());
  }

  const genericFence = trimmed.match(/```\s*([\s\S]*?)\s*```/);
  if (genericFence?.[1] && !jsonFence) {
    candidates.push(genericFence[1].trim());
  }

  // Extraire les objets JSON (méthode plus robuste)
  let braceCount = 0;
  let startIndex = -1;
  for (let i = 0; i < trimmed.length; i++) {
    if (trimmed[i] === '{') {
      if (braceCount === 0) startIndex = i;
      braceCount++;
    } else if (trimmed[i] === '}') {
      braceCount--;
      if (braceCount === 0 && startIndex !== -1) {
        candidates.push(trimmed.slice(startIndex, i + 1));
        break;
      }
    }
  }

  // Extraire les tableaux JSON
  const arrStart = trimmed.indexOf('[');
  const arrEnd = trimmed.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd !== -1 && arrEnd > arrStart) {
    candidates.push(trimmed.slice(arrStart, arrEnd + 1));
  }

  // Nettoyer les candidats et essayer de parser
  const tested = new Set<string>();
  for (let candidate of candidates) {
    if (!candidate || tested.has(candidate)) {
      continue;
    }

    // Nettoyer le candidat
    candidate = candidate.trim();

    if (!candidate || tested.has(candidate)) {
      continue;
    }

    tested.add(candidate);

    try {
      const parsed = JSON.parse(candidate);
      console.log(`[${provider}] ✅ JSON parsé avec succès`);
      return parsed;
    } catch (error) {
      console.warn(`[${provider}] ⚠️ Échec du parsing pour le candidat:`, candidate.substring(0, 100));
    }
  }

  console.error(`[${provider}] ❌ Tous les candidats de parsing ont échoué. Texte original:`, trimmed);

  // Diagnostic plus détaillé pour aider au débogage
  const isLikelyTruncated = trimmed.startsWith('{') && !trimmed.endsWith('}');
  const hasJsonStart = trimmed.includes('"context"') || trimmed.includes('"securityBaseline"');

  if (isLikelyTruncated && hasJsonStart) {
    throw new Error(`${provider} a renvoyé une réponse JSON tronquée. La réponse semble valide mais incomplète. Essayez de réduire la complexité de votre demande ou augmentez la limite de tokens.`);
  }

  throw new Error(`${provider} a renvoyé une réponse non-JSON valide. Texte reçu: "${trimmed.substring(0, 300)}..."`);
};

/**
 * Interface commune pour tous les services LLM
 */
export interface LLMService {
  generateContent(prompt: string, systemInstruction?: string, responseSchema?: any): Promise<LLMResponse>;
  generateJSON(prompt: string, systemInstruction: string, responseSchema: any): Promise<any>;
}

/**
 * Service pour Gemini AI
 */
export class GeminiService implements LLMService {
  private config: GeminiConfig;

  constructor(config: GeminiConfig) {
    this.config = config;
  }

  async generateContent(prompt: string, systemInstruction?: string, responseSchema?: any): Promise<LLMResponse> {
    try {
      // Nettoyer le nom du modèle en supprimant -latest qui n'est plus supporté
      const cleanModel = this.config.model.replace('-latest', '');
      const url = `${this.config.baseUrl}/v1beta/models/${cleanModel}:generateContent`;

      const parts: any[] = [{ text: prompt }];
      const contents = [{ role: 'user', parts }];

      const requestBody: any = {
        contents,
        generationConfig: {
          temperature: 0.2, // Température basse pour maximiser la précision
          maxOutputTokens: 32000, // Augmenté significativement pour les réponses JSON complexes
          topP: 0.8,
          topK: 40
        }
      };

      // Ajouter l'instruction système si fournie (format correct pour Gemini)
      if (systemInstruction) {
        requestBody.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      // Configurer pour JSON si nécessaire avec une approche plus robuste
      if (responseSchema) {
        requestBody.generationConfig.responseMimeType = "application/json";

        // Simplifier le schéma pour Gemini si nécessaire
        try {
          const simplifiedSchema = this.simplifySchemaForGemini(responseSchema);
          requestBody.generationConfig.responseSchema = simplifiedSchema;
          console.log(`[Gemini] Schéma JSON simplifié:`, JSON.stringify(simplifiedSchema, null, 2));
        } catch (schemaError) {
          console.warn(`[Gemini] Erreur lors de la simplification du schéma, utilisation du schéma original:`, schemaError);
          requestBody.generationConfig.responseSchema = responseSchema;
        }
      }

      console.log(`[Gemini] Appel API vers: ${url}`);
      console.log(`[Gemini] Modèle utilisé: ${cleanModel}${this.config.model !== cleanModel ? ` (nettoyé de ${this.config.model})` : ''}`);
      console.log(`[Gemini] Clé API configurée: ${this.config.apiKey ? 'Oui' : 'Non'}`);
      console.log(`[Gemini] Taille du prompt: ${prompt.length} caractères`);
      console.log(`[Gemini] Taille de l'instruction système: ${systemInstruction?.length || 0} caractères`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.config.apiKey
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur Gemini détaillée:', errorData);
        throw new Error(`Erreur Gemini: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Erreur inconnue'}`);
      }

      const data = await response.json();
      console.log('Réponse Gemini reçue:', data);

      // Diagnostic détaillé de la réponse
      if (!data.candidates || data.candidates.length === 0) {
        console.error('Aucun candidat dans la réponse Gemini:', JSON.stringify(data, null, 2));
        throw new Error('Gemini n\'a renvoyé aucun candidat de réponse. Vérifiez votre requête et votre quota API.');
      }

      const candidate = data.candidates[0];
      console.log('Premier candidat:', candidate);

      // Extraire le contenu en premier
      const content = candidate?.content?.parts?.[0]?.text || '';

      // Vérifier les différentes raisons d'arrêt
      const finishReason = candidate?.finishReason;
      if (finishReason) {
        console.log(`[Gemini] Raison d'arrêt: ${finishReason}`);

        if (finishReason === 'SAFETY') {
          console.error('Réponse Gemini bloquée par les filtres de sécurité:', candidate);
          throw new Error('Gemini a bloqué la réponse pour des raisons de sécurité. Essayez de reformuler votre demande.');
        }

        if (finishReason === 'MAX_TOKENS') {
          console.warn('Réponse Gemini tronquée (limite de tokens atteinte)');
          // Pour les réponses JSON, on peut essayer de parser même si tronquée
          if (responseSchema && content) {
            console.log('Tentative de parsing de la réponse tronquée...');
          }
        }

        if (finishReason === 'RECITATION') {
          throw new Error('Gemini a détecté une récitation potentielle. Reformulez votre demande.');
        }

        if (finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
          throw new Error(`Gemini a terminé avec le statut inattendu: ${finishReason}. Vérifiez les paramètres de votre requête.`);
        }
      }

      if (!content) {
        console.error('Réponse Gemini vide. Données complètes:', JSON.stringify(data, null, 2));
        console.error('Structure du candidat:', candidate);

        // Essayer de récupérer du contenu alternatif
        if (candidate?.content?.parts && candidate.content.parts.length > 0) {
          const allParts = candidate.content.parts.map((part: any) => part.text || '').join('');
          if (allParts.trim()) {
            console.log('Contenu récupéré depuis plusieurs parties:', allParts);
            return {
              text: allParts,
              usage: {
                promptTokens: data.usageMetadata?.promptTokenCount,
                completionTokens: data.usageMetadata?.candidatesTokenCount,
                totalTokens: data.usageMetadata?.totalTokenCount
              }
            };
          }
        }

        throw new Error('Gemini a renvoyé une réponse vide');
      }

      return {
        text: content,
        usage: {
          promptTokens: data.usageMetadata?.promptTokenCount,
          completionTokens: data.usageMetadata?.candidatesTokenCount,
          totalTokens: data.usageMetadata?.totalTokenCount
        }
      };
    } catch (error) {
      console.error('Erreur Gemini:', error);

      // Gestion spécifique des erreurs d'authentification
      if (error instanceof Error) {
        if (error.message.includes('API_KEY_INVALID') || error.message.includes('401')) {
          throw new Error('Votre clé API Gemini est invalide. Veuillez vérifier votre configuration.');
        }
        if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('429')) {
          throw new Error('Quota API dépassé. Veuillez réessayer plus tard.');
        }
        if (error.message.includes('MODEL_NOT_FOUND') || error.message.includes('404')) {
          throw new Error('Le modèle spécifié n\'est pas disponible.');
        }
      }

      throw new Error(`Erreur Gemini: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  async generateJSON(prompt: string, systemInstruction: string, responseSchema: any): Promise<any> {
    try {
      // Première tentative avec le schéma JSON
      const response = await this.generateContent(prompt, systemInstruction, responseSchema);

      if (!response.text || !response.text.trim()) {
        throw new Error('Réponse vide avec schéma JSON');
      }

      // Toujours utiliser le parser générique pour Gemini car il peut retourner du JSON partiel
      return parseJsonFromText('Gemini', response.text);
    } catch (error) {
      console.warn('[Gemini] Échec avec schéma JSON, tentative sans schéma:', error);

      // Fallback: essayer sans schéma JSON mais avec instruction explicite
      const jsonInstruction = `${systemInstruction}\n\nIMPORTANT: Tu DOIS répondre uniquement avec un objet JSON valide qui respecte exactement cette structure:\n${JSON.stringify(responseSchema, null, 2)}\n\nNe pas ajouter de texte avant ou après le JSON.`;

      try {
        const fallbackResponse = await this.generateContent(prompt, jsonInstruction);

        if (!fallbackResponse.text || !fallbackResponse.text.trim()) {
          throw new Error('Réponse vide même sans schéma JSON');
        }

        return parseJsonFromText('Gemini', fallbackResponse.text);
      } catch (fallbackError) {
        console.error('[Gemini] Échec même sans schéma JSON:', fallbackError);
        throw error; // Relancer l'erreur originale
      }
    }
  }

  /**
   * Simplifie un schéma JSON pour Gemini en supprimant les propriétés non supportées
   */
  private simplifySchemaForGemini(schema: any): any {
    if (!schema || typeof schema !== 'object') {
      return schema;
    }

    const simplified = { ...schema };

    // Supprimer les propriétés non supportées par Gemini
    delete simplified.description;
    delete simplified.examples;
    delete simplified.default;

    // Traiter les propriétés récursivement
    if (simplified.properties) {
      const newProperties: any = {};
      for (const [key, value] of Object.entries(simplified.properties)) {
        newProperties[key] = this.simplifySchemaForGemini(value);
      }
      simplified.properties = newProperties;
    }

    // Traiter les items des arrays
    if (simplified.items) {
      simplified.items = this.simplifySchemaForGemini(simplified.items);
    }

    // Traiter les oneOf, anyOf, allOf
    if (simplified.oneOf) {
      simplified.oneOf = simplified.oneOf.map((item: any) => this.simplifySchemaForGemini(item));
    }
    if (simplified.anyOf) {
      simplified.anyOf = simplified.anyOf.map((item: any) => this.simplifySchemaForGemini(item));
    }
    if (simplified.allOf) {
      simplified.allOf = simplified.allOf.map((item: any) => this.simplifySchemaForGemini(item));
    }

    return simplified;
  }

  updateConfig(config: GeminiConfig): void {
    this.config = config;
  }
}

/**
 * Service pour Ollama
 */
export class OllamaService implements LLMService {
  private config: OllamaConfig;

  constructor(config: OllamaConfig) {
    this.config = config;
  }

  async generateContent(prompt: string, systemInstruction?: string, responseSchema?: any): Promise<LLMResponse> {
    try {
      const messages: ChatMessage[] = [];
      const finalSystemInstruction = buildJsonSystemInstruction(systemInstruction, responseSchema);
      if (finalSystemInstruction) {
        messages.push({ role: 'system', content: finalSystemInstruction });
      }
      const userPrompt = responseSchema ? buildJsonUserPrompt(prompt, responseSchema) : prompt;
      messages.push({ role: 'user', content: userPrompt });

      const requestBody: any = {
        model: this.config.model,
        messages,
        stream: false,
        options: {
          temperature: 0.2, // Température basse pour maximiser la précision
          num_predict: 4000  // Ollama utilise num_predict au lieu de max_tokens
        }
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur Ollama détaillée:', errorData);
        throw new Error(`Erreur Ollama: ${response.status} ${response.statusText} - ${errorData.error || 'Erreur inconnue'}`);
      }

      const data = await response.json();
      console.log('Réponse Ollama reçue:', data);

      return {
        text: data.message?.content || '',
        usage: {
          promptTokens: data.prompt_eval_count,
          completionTokens: data.eval_count,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
        }
      };
    } catch (error) {
      console.error('Erreur Ollama:', error);
      // Ajouter des conseils spécifiques pour Ollama
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error(`Erreur Ollama: Impossible de se connecter à ${this.config.baseUrl}. Vérifiez qu'Ollama est démarré et accessible.`);
      }
      throw new Error(`Erreur Ollama: ${error instanceof Error ? error.message : 'Erreur de connexion'}`);
    }
  }

  async generateJSON(prompt: string, systemInstruction: string, responseSchema: any): Promise<any> {
    const response = await this.generateContent(prompt, systemInstruction, responseSchema);
    return parseJsonFromText('Ollama', response.text);
  }

  updateConfig(config: OllamaConfig): void {
    this.config = config;
  }
}

/**
 * Service pour LM Studio
 */
export class LMStudioService implements LLMService {
  private config: LMStudioConfig;

  constructor(config: LMStudioConfig) {
    this.config = config;
  }

  async generateContent(prompt: string, systemInstruction?: string, responseSchema?: any): Promise<LLMResponse> {
    try {
      const messages: ChatMessage[] = [];
      const finalSystemInstruction = buildJsonSystemInstruction(systemInstruction, responseSchema);
      if (finalSystemInstruction) {
        messages.push({ role: 'system', content: finalSystemInstruction });
      }
      const userPrompt = responseSchema ? buildJsonUserPrompt(prompt, responseSchema) : prompt;
      messages.push({ role: 'user', content: userPrompt });

      const requestBody: any = {
        model: this.config.model,
        messages,
        temperature: 0.2, // Température basse pour maximiser la précision
        stream: false
      };

      // Ajouter le paramètre de tokens approprié selon le modèle
      addTokensParameter(requestBody, this.config.model);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur LM Studio détaillée:', errorData);
        throw new Error(`Erreur LM Studio: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Erreur inconnue'}`);
      }

      const data = await response.json();
      console.log('Réponse LM Studio reçue:', data);

      return {
        text: data.choices?.[0]?.message?.content || '',
        usage: {
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens
        }
      };
    } catch (error) {
      console.error('Erreur LM Studio:', error);
      // Ajouter des conseils spécifiques pour LM Studio
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error(`Erreur LM Studio: Impossible de se connecter à ${this.config.baseUrl}. Vérifiez que LM Studio est démarré avec un serveur local.`);
      }
      throw new Error(`Erreur LM Studio: ${error instanceof Error ? error.message : 'Erreur de connexion'}`);
    }
  }

  async generateJSON(prompt: string, systemInstruction: string, responseSchema: any): Promise<any> {
    const response = await this.generateContent(prompt, systemInstruction, responseSchema);
    return parseJsonFromText('LM Studio', response.text);
  }

  updateConfig(config: LMStudioConfig): void {
    this.config = config;
  }
}

/**
 * Service pour Mistral AI
 */
export class MistralService implements LLMService {
  private config: MistralConfig;

  constructor(config: MistralConfig) {
    this.config = config;
  }

  async generateContent(prompt: string, systemInstruction?: string, responseSchema?: any): Promise<LLMResponse> {
    try {
      const messages: ChatMessage[] = [];
      const finalSystemInstruction = buildJsonSystemInstruction(systemInstruction, responseSchema);
      if (finalSystemInstruction) {
        messages.push({ role: 'system', content: finalSystemInstruction });
      }
      const userPrompt = responseSchema ? buildJsonUserPrompt(prompt, responseSchema) : prompt;
      messages.push({ role: 'user', content: userPrompt });

      const requestBody: any = {
        model: this.config.model,
        messages,
        temperature: 0.2, // Température basse pour maximiser la précision
        stream: false
      };

      // Ajouter le paramètre de tokens approprié selon le modèle
      addTokensParameter(requestBody, this.config.model);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      };

      const baseUrl = this.config.baseUrl || 'https://api.mistral.ai';
      const response = await useProxyIfNeeded(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      }, 'mistral');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur Mistral détaillée:', errorData);
        throw new Error(`Erreur Mistral: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Erreur inconnue'}`);
      }

      const data = await response.json();
      console.log('Réponse Mistral reçue:', data);

      return {
        text: data.choices?.[0]?.message?.content || '',
        usage: {
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens
        }
      };
    } catch (error) {
      console.error('Erreur Mistral:', error);
      throw new Error(`Erreur Mistral: ${error instanceof Error ? error.message : 'Erreur de connexion'}`);
    }
  }

  async generateJSON(prompt: string, systemInstruction: string, responseSchema: any): Promise<any> {
    const response = await this.generateContent(prompt, systemInstruction, responseSchema);
    return parseJsonFromText('Mistral', response.text);
  }

  updateConfig(config: MistralConfig): void {
    this.config = config;
  }
}

/**
 * Service pour Anthropic Claude
 */
export class AnthropicService implements LLMService {
  private config: AnthropicConfig;

  constructor(config: AnthropicConfig) {
    this.config = config;
  }

  async generateContent(prompt: string, systemInstruction?: string, responseSchema?: any): Promise<LLMResponse> {
    try {
      // Anthropic utilise un format différent : system séparé des messages
      const finalSystemInstruction = buildJsonSystemInstruction(systemInstruction, responseSchema);
      const userPrompt = responseSchema ? buildJsonUserPrompt(prompt, responseSchema) : prompt;

      const requestBody: any = {
        model: this.config.model,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 4000,
        temperature: 0.2 // Température basse pour maximiser la précision
      };

      // Ajouter l'instruction système si elle existe
      if (finalSystemInstruction) {
        requestBody.system = finalSystemInstruction;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      };

      const baseUrl = this.config.baseUrl || 'https://api.anthropic.com';
      const response = await useProxyIfNeeded(`${baseUrl}/v1/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      }, 'anthropic');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur Anthropic détaillée:', errorData);
        throw new Error(`Erreur Anthropic: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Erreur inconnue'}`);
      }

      const data = await response.json();
      console.log('Réponse Anthropic reçue:', data);

      return {
        text: data.content?.[0]?.text || '',
        usage: {
          promptTokens: data.usage?.input_tokens,
          completionTokens: data.usage?.output_tokens,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
        }
      };
    } catch (error) {
      console.error('Erreur Anthropic:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Erreur CORS - Normal en développement local. Anthropic fonctionne en production.');
      }
      throw new Error(`Erreur Anthropic: ${error instanceof Error ? error.message : 'Erreur de connexion'}`);
    }
  }

  async generateJSON(prompt: string, systemInstruction: string, responseSchema: any): Promise<any> {
    const response = await this.generateContent(prompt, systemInstruction, responseSchema);
    return parseJsonFromText('Anthropic', response.text);
  }

  updateConfig(config: AnthropicConfig): void {
    this.config = config;
  }
}

/**
 * Service pour DeepSeek
 */
export class DeepSeekService implements LLMService {
  private config: DeepSeekConfig;

  constructor(config: DeepSeekConfig) {
    this.config = config;
  }

  async generateContent(prompt: string, systemInstruction?: string, responseSchema?: any): Promise<LLMResponse> {
    try {
      const messages: ChatMessage[] = [];
      const finalSystemInstruction = buildJsonSystemInstruction(systemInstruction, responseSchema);
      if (finalSystemInstruction) {
        messages.push({ role: 'system', content: finalSystemInstruction });
      }
      const userPrompt = responseSchema ? buildJsonUserPrompt(prompt, responseSchema) : prompt;
      messages.push({ role: 'user', content: userPrompt });

      const requestBody: any = {
        model: this.config.model,
        messages,
        temperature: 0.2, // Température basse pour maximiser la précision
        stream: false
      };

      // Ajouter le paramètre de tokens approprié selon le modèle
      addTokensParameter(requestBody, this.config.model);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      };

      const baseUrl = this.config.baseUrl || 'https://api.deepseek.com';
      const response = await useProxyIfNeeded(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      }, 'deepseek');

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('DeepSeek API response body:', errorText);
        let message = `Erreur DeepSeek: ${response.status} ${response.statusText}`;
        if (errorText) {
          message += ` - ${errorText}`;
        }
        throw new Error(message);
      }

      const data = await response.json();
      console.log('Réponse DeepSeek reçue:', data);

      return {
        text: data.choices?.[0]?.message?.content || '',
        usage: {
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens
        }
      };
    } catch (error) {
      console.error('Erreur DeepSeek:', error);
      throw new Error(`Erreur DeepSeek: ${error instanceof Error ? error.message : 'Erreur de connexion'}`);
    }
  }

  async generateJSON(prompt: string, systemInstruction: string, responseSchema: any): Promise<any> {
    const response = await this.generateContent(prompt, systemInstruction, responseSchema);
    return parseJsonFromText('DeepSeek', response.text);
  }

  updateConfig(config: DeepSeekConfig): void {
    this.config = config;
  }
}

/**
 * Service pour Qwen (Alibaba)
 */
export class QwenService implements LLMService {
  private config: QwenConfig;

  constructor(config: QwenConfig) {
    this.config = config;
  }

  async generateContent(prompt: string, systemInstruction?: string, responseSchema?: any): Promise<LLMResponse> {
    try {
      const messages: ChatMessage[] = [];
      const finalSystemInstruction = buildJsonSystemInstruction(systemInstruction, responseSchema);
      if (finalSystemInstruction) {
        messages.push({ role: 'system', content: finalSystemInstruction });
      }
      const userPrompt = responseSchema ? buildJsonUserPrompt(prompt, responseSchema) : prompt;
      messages.push({ role: 'user', content: userPrompt });

      const requestBody: any = {
        model: this.config.model,
        messages,
        temperature: 0.2, // Température basse pour maximiser la précision
        stream: false
      };

      // Ajouter le paramètre de tokens approprié selon le modèle
      addTokensParameter(requestBody, this.config.model);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      };

      const baseUrl = this.config.baseUrl || 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1';
      const url = baseUrl.includes('/compatible-mode/v1')
        ? `${baseUrl}/chat/completions`
        : `${baseUrl}/compatible-mode/v1/chat/completions`;

      console.log(`[Qwen] Appel API vers: ${url}`);
      console.log(`[Qwen] Modèle utilisé: ${this.config.model}`);
      console.log(`[Qwen] Clé API configurée: ${this.config.apiKey ? 'Oui' : 'Non'}`);

      const response = await useProxyIfNeeded(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      }, 'qwen');

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Impossible de lire la réponse d\'erreur');
        console.error(`[Qwen] Erreur ${response.status}:`, errorText);

        if (response.status === 403) {
          // Parser l'erreur pour plus de détails
          let errorJson: any = {};
          try {
            errorJson = JSON.parse(errorText);
          } catch {}

          if (errorJson.error?.code === 'Model.AccessDenied' || errorJson.error?.type === 'Model.AccessDenied') {
            throw new Error(`Erreur Qwen: Le modèle ${this.config.model} n'est pas accessible avec votre clé API. Essayez 'qwen-turbo' ou 'qwen-plus' qui sont généralement disponibles.`);
          } else if (errorJson.error?.code === 'AccessDenied.Unpurchased') {
            throw new Error(`Erreur Qwen: Votre compte n'a pas accès au modèle ${this.config.model}. Veuillez activer ce modèle dans DashScope ou utiliser 'qwen-turbo'.`);
          } else {
            throw new Error(`Erreur Qwen: Accès refusé (403). ${errorJson.error?.message || 'Vérifiez votre clé API et les permissions du modèle.'}`);
          }
        } else if (response.status === 401) {
          throw new Error(`Erreur Qwen: Clé API invalide ou expirée. Veuillez vérifier votre clé dans DashScope Console.`);
        } else if (response.status === 429) {
          throw new Error(`Erreur Qwen: Limite de taux dépassée. Veuillez attendre avant de réessayer.`);
        } else {
          throw new Error(`Erreur Qwen: ${response.status} ${response.statusText} - ${errorText}`);
        }
      }

      const data = await response.json();

      return {
        text: data.choices?.[0]?.message?.content || '',
        usage: {
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens
        }
      };
    } catch (error) {
      console.error('Erreur Qwen:', error);
      throw new Error(`Erreur Qwen: ${error instanceof Error ? error.message : 'Erreur de connexion'}`);
    }
  }

  async generateJSON(prompt: string, systemInstruction: string, responseSchema: any): Promise<any> {
    const response = await this.generateContent(prompt, systemInstruction, responseSchema);
    return parseJsonFromText('Qwen', response.text);
  }

  updateConfig(config: QwenConfig): void {
    this.config = config;
  }
}

/**
 * Service pour xAI Grok
 */
export class XAIService implements LLMService {
  private config: XAIConfig;

  constructor(config: XAIConfig) {
    this.config = config;
  }

  async generateContent(prompt: string, systemInstruction?: string, responseSchema?: any): Promise<LLMResponse> {
    return retryWithBackoff(async () => {
      try {
        const messages: ChatMessage[] = [];
        const finalSystemInstruction = buildJsonSystemInstruction(systemInstruction, responseSchema);
        if (finalSystemInstruction) {
          messages.push({ role: 'system', content: finalSystemInstruction });
        }
        const userPrompt = responseSchema ? buildJsonUserPrompt(prompt, responseSchema) : prompt;
        messages.push({ role: 'user', content: userPrompt });

        const requestBody: any = {
          model: this.config.model,
          messages,
          temperature: 0.2, // Température basse pour maximiser la précision
          stream: false
        };

        // Ajouter le paramètre de tokens approprié selon le modèle
        addTokensParameter(requestBody, this.config.model);

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        };

        const baseUrl = this.config.baseUrl || 'https://api.x.ai';
        const response = await useProxyIfNeeded(`${baseUrl}/v1/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody)
        }, 'xai');

        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 429) {
            throw new Error('Limite de taux xAI dépassée. Veuillez attendre quelques secondes avant de réessayer.');
          }
          if (response.status === 401) {
            throw new Error('Clé API xAI invalide. Veuillez vérifier votre configuration.');
          }
          throw new Error(`Erreur xAI: ${response.status} ${errorText || response.statusText}`);
        }

        const data = await response.json();

        return {
          text: data.choices?.[0]?.message?.content || '',
          usage: {
            promptTokens: data.usage?.prompt_tokens,
            completionTokens: data.usage?.completion_tokens,
            totalTokens: data.usage?.total_tokens
          }
        };
      } catch (error) {
        console.error('Erreur xAI:', error);
        throw error; // Re-throw pour le retry logic
      }
    }, 3, 2000, 'xAI'); // 3 tentatives, délai initial de 2 secondes
  }

  async generateJSON(prompt: string, systemInstruction: string, responseSchema: any): Promise<any> {
    const response = await this.generateContent(prompt, systemInstruction, responseSchema);
    return parseJsonFromText('xAI', response.text);
  }

  updateConfig(config: XAIConfig): void {
    this.config = config;
  }
}

/**
 * Service pour Groq
 */
export class GroqService implements LLMService {
  private config: GroqConfig;

  constructor(config: GroqConfig) {
    this.config = config;
  }

  async generateContent(prompt: string, systemInstruction?: string, responseSchema?: any): Promise<LLMResponse> {
    try {
      const messages: ChatMessage[] = [];
      const finalSystemInstruction = buildJsonSystemInstruction(systemInstruction, responseSchema);
      if (finalSystemInstruction) {
        messages.push({ role: 'system', content: finalSystemInstruction });
      }
      const userPrompt = responseSchema ? buildJsonUserPrompt(prompt, responseSchema) : prompt;
      messages.push({ role: 'user', content: userPrompt });

      const requestBody: any = {
        model: this.config.model,
        messages,
        temperature: 0.2, // Température basse pour maximiser la précision
        stream: false
      };

      // Ajouter le paramètre de tokens approprié selon le modèle
      addTokensParameter(requestBody, this.config.model);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      };

      const baseUrl = this.config.baseUrl || 'https://api.groq.com/openai';
      const response = await useProxyIfNeeded(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      }, 'groq');

      if (!response.ok) {
        throw new Error(`Erreur Groq: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        text: data.choices?.[0]?.message?.content || '',
        usage: {
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens
        }
      };
    } catch (error) {
      console.error('Erreur Groq:', error);
      throw new Error(`Erreur Groq: ${error instanceof Error ? error.message : 'Erreur de connexion'}`);
    }
  }

  async generateJSON(prompt: string, systemInstruction: string, responseSchema: any): Promise<any> {
    const response = await this.generateContent(prompt, systemInstruction, responseSchema);
    return parseJsonFromText('Groq', response.text);
  }

  updateConfig(config: GroqConfig): void {
    this.config = config;
  }
}

/**
 * Service pour OpenAI GPT
 */
export class OpenAIService implements LLMService {
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = config;
  }

  async generateContent(prompt: string, systemInstruction?: string, responseSchema?: any): Promise<LLMResponse> {
    if (!this.config.apiKey) {
      throw new Error('Clé API OpenAI non configurée');
    }

    try {
      const messages: ChatMessage[] = [];
      const finalSystemInstruction = buildJsonSystemInstruction(systemInstruction, responseSchema);
      if (finalSystemInstruction) {
        messages.push({ role: 'system', content: finalSystemInstruction });
      }
      const userPrompt = responseSchema ? buildJsonUserPrompt(prompt, responseSchema) : prompt;
      messages.push({ role: 'user', content: userPrompt });

      const requestBody: any = {
        model: this.config.model,
        messages
      };

      // Configuration spéciale pour GPT-5
      if (this.config.model.includes('gpt-5')) {
        configureGPT5Parameters(requestBody, this.config.model, responseSchema);
      } else {
        // Configuration standard pour les autres modèles
        configureTemperature(requestBody, this.config.model);
        addTokensParameter(requestBody, this.config.model);

        // Ajouter response_format seulement pour les modèles qui le supportent
        if (responseSchema && !this.config.model.includes('o1-')) {
          requestBody.response_format = { type: "json_object" };
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      };

      const baseUrl = this.config.baseUrl || 'https://api.openai.com';
      const url = `${baseUrl}/v1/chat/completions`;

      console.log(`[OpenAI] Appel API vers: ${url}`);
      console.log(`[OpenAI] Modèle utilisé: ${this.config.model}`);
      console.log(`[OpenAI] Clé API configurée: ${this.config.apiKey ? 'Oui' : 'Non'}`);
      console.log(`[OpenAI] Payload envoyé:`, JSON.stringify(requestBody, null, 2));

      const response = await useProxyIfNeeded(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      }, 'openai');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur OpenAI détaillée:', errorData);
        throw new Error(`Erreur OpenAI: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Erreur inconnue'}`);
      }

      const data = await response.json();
      console.log('Réponse OpenAI reçue:', data);

      // Vérifier la structure de la réponse
      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        console.error('Réponse OpenAI malformée - pas de choices:', data);
        throw new Error(`Réponse OpenAI malformée: ${JSON.stringify(data)}`);
      }

      const choice = data.choices[0];
      if (!choice.message) {
        console.error('Réponse OpenAI malformée - pas de message:', choice);
        throw new Error(`Réponse OpenAI sans message: ${JSON.stringify(choice)}`);
      }

      const content = choice.message.content;
      if (!content || content.trim() === '') {
        console.error('Réponse OpenAI vide - contenu:', choice.message);
        console.error('Réponse OpenAI complète:', JSON.stringify(data, null, 2));
        console.error('Finish reason:', choice.finish_reason);
        console.error('Usage info:', data.usage);

        // Diagnostic détaillé selon la raison d'arrêt
        if (choice.finish_reason === 'content_filter') {
          throw new Error('OpenAI a refusé de générer du contenu (filtre de contenu activé). Reformulez votre demande.');
        } else if (choice.finish_reason === 'length') {
          const usedTokens = data.usage?.total_tokens || 'inconnu';
          throw new Error(`OpenAI a atteint la limite de tokens (${usedTokens} tokens utilisés). Essayez avec un prompt plus court ou augmentez max_tokens.`);
        } else if (choice.finish_reason === 'stop') {
          throw new Error('OpenAI a terminé normalement mais a renvoyé un contenu vide. Cela peut indiquer un problème avec le prompt ou le schéma JSON.');
        } else if (choice.finish_reason === 'tool_calls') {
          throw new Error('OpenAI a essayé d\'appeler des outils au lieu de générer du texte.');
        } else {
          throw new Error(`OpenAI a renvoyé une réponse vide. Raison: ${choice.finish_reason || 'inconnue'}. Vérifiez votre prompt et les paramètres du modèle.`);
        }
      }

      return {
        text: content,
        usage: {
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens
        }
      };
    } catch (error) {
      console.error('Erreur OpenAI:', error);
      throw new Error(`Erreur OpenAI: ${error instanceof Error ? error.message : 'Erreur de connexion'}`);
    }
  }

  async generateJSON(prompt: string, systemInstruction: string, responseSchema: any): Promise<any> {
    const response = await this.generateContent(prompt, systemInstruction, responseSchema);
    return parseJsonFromText('OpenAI', response.text);
  }

  updateConfig(config: OpenAIConfig): void {
    this.config = config;
  }
}

/**
 * Factory pour créer le service LLM approprié
 */
export class LLMServiceFactory {
  static createService(provider: string, config: any): LLMService {
    switch (provider) {
      case 'gemini':
        return new GeminiService(config);
      case 'ollama':
        return new OllamaService(config);
      case 'lmstudio':
        return new LMStudioService(config);
      case 'mistral':
        return new MistralService(config);
      case 'anthropic':
        return new AnthropicService(config);
      case 'deepseek':
        return new DeepSeekService(config);
      case 'qwen':
        return new QwenService(config);
      case 'xai':
        return new XAIService(config);
      case 'groq':
        return new GroqService(config);
      case 'openai':
        return new OpenAIService(config);
      default:
        throw new Error(`Fournisseur LLM non supporté: ${provider}`);
    }
  }
}
