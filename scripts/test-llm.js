#!/usr/bin/env node

/**
 * Script de test pour valider le fonctionnement des LLM
 * Usage: node scripts/test-llm.js [provider]
 * 
 * Exemples:
 * - node scripts/test-llm.js gemini
 * - node scripts/test-llm.js (teste tous les fournisseurs configurés)
 */

const { LLMTester } = require('../utils/llmTester');

async function main() {
  const args = process.argv.slice(2);
  const targetProvider = args[0];

  console.log('🧪 EBIOS RM - Test des fournisseurs LLM\n');

  try {
    let results;

    if (targetProvider) {
      console.log(`Test du fournisseur spécifique: ${targetProvider}`);
      const result = await LLMTester.testProvider(targetProvider);
      results = { [targetProvider]: result };
    } else {
      console.log('Test de tous les fournisseurs configurés...');
      results = await LLMTester.testConfiguredProviders();
    }

    // Afficher le rapport
    const report = LLMTester.formatTestResults(results);
    console.log('\n' + report);

    // Déterminer le code de sortie
    const hasFailures = Object.values(results).some(result => !result.success);
    process.exit(hasFailures ? 1 : 0);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    process.exit(1);
  }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Erreur non gérée:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Exception non capturée:', error);
  process.exit(1);
});

main();
