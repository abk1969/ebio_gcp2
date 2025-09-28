/**
 * Diagnostic rapide pour identifier le problème OpenAI
 */

import configService from '../services/configService';

export const quickOpenAIDiagnostic = async (): Promise<void> => {
  console.log('🔍 === DIAGNOSTIC RAPIDE OPENAI ===');
  
  try {
    // 1. Vérifier la configuration
    const config = configService.getConfig();
    const openaiConfig = config.openai;
    
    console.log('📋 Configuration OpenAI:');
    console.log('- Clé API configurée:', openaiConfig?.apiKey ? 'Oui' : 'Non');
    console.log('- Format clé API:', openaiConfig?.apiKey ? (openaiConfig.apiKey.startsWith('sk-') ? 'Correct' : 'Incorrect') : 'N/A');
    console.log('- Modèle:', openaiConfig?.model || 'Non défini');
    console.log('- URL de base:', openaiConfig?.baseUrl || 'Non définie');
    
    if (!openaiConfig?.apiKey) {
      console.error('❌ PROBLÈME: Clé API OpenAI manquante');
      console.log('💡 SOLUTION: Configurer la clé API dans Paramètres → OpenAI');
      return;
    }
    
    if (!openaiConfig.apiKey.startsWith('sk-')) {
      console.error('❌ PROBLÈME: Format de clé API incorrect');
      console.log('💡 SOLUTION: La clé doit commencer par "sk-"');
      return;
    }
    
    // 2. Test de connectivité simple
    console.log('\n🌐 Test de connectivité...');
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openaiConfig.apiKey}`
      }
    });
    
    console.log('- Statut HTTP:', response.status);
    
    if (response.status === 401) {
      console.error('❌ PROBLÈME: Clé API invalide (401)');
      console.log('💡 SOLUTION: Vérifier/régénérer la clé API sur platform.openai.com');
      return;
    }
    
    if (response.status === 403) {
      console.error('❌ PROBLÈME: Accès refusé (403)');
      console.log('💡 SOLUTION: Vérifier les permissions de la clé API');
      return;
    }
    
    if (response.status === 429) {
      console.error('❌ PROBLÈME: Quota dépassé (429)');
      console.log('💡 SOLUTION: Attendre ou upgrader le plan OpenAI');
      return;
    }
    
    if (!response.ok) {
      console.error('❌ PROBLÈME: Erreur HTTP', response.status);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Connectivité OK -', data.data?.length || 0, 'modèles disponibles');
    
    // 3. Vérifier l'accès au modèle
    const modelId = openaiConfig.model;
    const availableModels = data.data?.map((m: any) => m.id) || [];
    
    if (availableModels.includes(modelId)) {
      console.log('✅ Modèle accessible:', modelId);
      
      // Avertissement spécial pour GPT-5
      if (modelId.includes('gpt-5')) {
        console.warn('⚠️ ATTENTION: GPT-5 est très instable et peut renvoyer des réponses vides');
        console.log('💡 RECOMMANDATION FORTE: Changer vers gpt-4o pour une expérience stable');
        console.log('🔧 Pour changer: Paramètres → OpenAI → Modèle → gpt-4o');
      }
    } else {
      console.error('❌ PROBLÈME: Modèle non accessible:', modelId);
      console.log('💡 SOLUTION: Utiliser un modèle accessible comme gpt-4o-mini ou gpt-3.5-turbo');
      console.log('📋 Modèles disponibles:', availableModels.slice(0, 5).join(', '), '...');
      return;
    }
    
    // 4. Test de génération simple
    console.log('\n💬 Test de génération...');

    // Préparer les paramètres selon le modèle
    const requestBody: any = {
      model: modelId,
      messages: [{ role: 'user', content: 'Hello' }], // Prompt plus simple pour GPT-5
      temperature: 0.7
    };

    // Ajuster les paramètres selon le modèle
    if (modelId.includes('gpt-5')) {
      // Paramètres officiels GPT-5 - version minimale pour test
      requestBody.temperature = 1; // Obligatoire
      requestBody.max_completion_tokens = 10; // Très petit pour test
      
      console.log('🔧 Configuration GPT-5 appliquée:', {
        model: modelId,
        temperature: requestBody.temperature,
        max_completion_tokens: requestBody.max_completion_tokens,
        message: requestBody.messages[0].content
      });
    } else if (modelId.includes('o1-')) {
      requestBody.temperature = 1;
      requestBody.max_completion_tokens = 50;
    } else {
      requestBody.max_tokens = 50;
    }

    console.log('📋 Paramètres de test:', JSON.stringify(requestBody, null, 2));

    const testResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiConfig.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!testResponse.ok) {
      const errorData = await testResponse.json().catch(() => ({}));
      console.error('❌ PROBLÈME: Erreur de génération:', testResponse.status);
      console.error('Détails complets:', errorData);

      // Analyser les erreurs 400 spécifiques
      if (testResponse.status === 400) {
        const errorMessage = errorData.error?.message || '';
        console.log('📋 Message d\'erreur:', errorMessage);

        if (errorMessage.includes('max_tokens')) {
          console.log('💡 SOLUTION: Problème avec max_tokens - utiliser max_completion_tokens pour ce modèle');
        } else if (errorMessage.includes('temperature')) {
          console.log('💡 SOLUTION: Problème avec temperature - utiliser temperature: 1 pour ce modèle');
        } else if (errorMessage.includes('response_format')) {
          console.log('💡 SOLUTION: Problème avec response_format - ce modèle ne le supporte pas');
        } else if (errorMessage.includes('model')) {
          console.log('💡 SOLUTION: Problème avec le modèle - essayer gpt-4o-mini ou gpt-3.5-turbo');
        } else {
          console.log('💡 SOLUTION: Erreur 400 générique - vérifier les paramètres de la requête');
        }
      }
      return;
    }
    
    const testData = await testResponse.json();
    const content = testData.choices?.[0]?.message?.content;
    
    if (content && content.trim()) {
      console.log('✅ Génération OK:', content.trim());
      console.log('🎉 OpenAI fonctionne correctement !');
    } else {
      console.error('❌ PROBLÈME: Réponse vide de OpenAI');
      console.error('Réponse complète:', testData);

      // Analyser la structure de la réponse
      console.log('🔍 ANALYSE DÉTAILLÉE DE LA RÉPONSE:');
      console.log('📋 Réponse complète:', JSON.stringify(testData, null, 2));

      // Extraire automatiquement les choices
      if (testData.choices && testData.choices.length > 0) {
        testData.choices.forEach((choice: any, index: number) => {
          console.log(`📋 Choice ${index}:`, JSON.stringify(choice, null, 2));
          console.log(`📋 Choice ${index} - finish_reason:`, choice.finish_reason);
          console.log(`📋 Choice ${index} - message:`, JSON.stringify(choice.message, null, 2));

          if (choice.message) {
            console.log(`📋 Choice ${index} - content type:`, typeof choice.message.content);
            console.log(`📋 Choice ${index} - content value:`, choice.message.content);
            console.log(`📋 Choice ${index} - content length:`, choice.message.content?.length || 0);
            console.log(`📋 Choice ${index} - content is null:`, choice.message.content === null);
            console.log(`📋 Choice ${index} - content is undefined:`, choice.message.content === undefined);
            console.log(`📋 Choice ${index} - content is empty string:`, choice.message.content === '');
          }
        });
      } else {
        console.log('❌ Aucun choices dans la réponse');
      }

      // Analyser les raisons d'arrêt
      const firstChoice = testData.choices?.[0];
      if (firstChoice) {
        if (firstChoice.finish_reason === 'length') {
          console.log('💡 SOLUTION: Limite de tokens atteinte - augmenter max_tokens/max_completion_tokens');
        } else if (firstChoice.finish_reason === 'content_filter') {
          console.log('💡 SOLUTION: Contenu filtré - modifier le prompt');
        } else if (firstChoice.message?.content === null) {
          console.log('💡 SOLUTION: Contenu null - problème avec les paramètres du modèle GPT-5');
          console.log('💡 RECOMMANDATION: Essayer avec gpt-4o au lieu de gpt-5');
        } else {
          console.log('💡 SOLUTION: Vérifier les paramètres du modèle');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ PROBLÈME: Erreur de connexion:', error);
    console.log('💡 SOLUTION: Vérifier la connexion internet');
  }
  
  console.log('\n🔍 === FIN DU DIAGNOSTIC ===');
};

/**
 * Affiche les modèles OpenAI disponibles
 */
export const showOpenAIModels = (): void => {
  console.log('📋 Modèles OpenAI disponibles:');
  console.log('  - gpt-4o (Performance élevée)');
  console.log('  - gpt-4o-mini (Plus accessible)');
  console.log('  - gpt-3.5-turbo (Le plus accessible)');
  console.log('  - gpt-4-turbo (Version turbo)');
  console.log('  - gpt-5 (Dernière version)');
  console.log('  - gpt-o3 (Nouvelle génération)');
  console.log('💡 Changez le modèle via l\'interface utilisateur dans les Paramètres');
};

/**
 * Nettoie les modèles obsolètes dans la configuration
 */
export const cleanObsoleteModels = (): void => {
  console.log('🧹 Nettoyage des modèles obsolètes...');

  const config = configService.getConfig();
  let updated = false;

  // Nettoyer les modèles Gemini avec -latest
  if (config.gemini.model.includes('-latest')) {
    console.log(`  - Gemini: ${config.gemini.model} → ${config.gemini.model.replace('-latest', '')}`);
    config.gemini.model = config.gemini.model.replace('-latest', '');
    updated = true;
  }

  // Nettoyer les modèles Mistral avec -latest (optionnel, car ils supportent encore -latest)
  // if (config.mistral.model.includes('-latest')) {
  //   console.log(`  - Mistral: ${config.mistral.model} → ${config.mistral.model.replace('-latest', '')}`);
  //   config.mistral.model = config.mistral.model.replace('-latest', '');
  //   updated = true;
  // }

  if (updated) {
    configService.updateConfig(config);
    console.log('✅ Configuration mise à jour');
  } else {
    console.log('✅ Aucun modèle obsolète trouvé');
  }
};

// Fonctions disponibles dans la console
(window as any).quickOpenAIDiagnostic = quickOpenAIDiagnostic;
(window as any).showOpenAIModels = showOpenAIModels;
(window as any).cleanObsoleteModels = cleanObsoleteModels;
