/**
 * Validation des réponses LLM pour s'assurer de leur intégrité et sécurité
 */

import { sanitizeText } from './validation';

/**
 * Valide qu'une réponse JSON est bien formée et sécurisée
 */
export const validateLLMJsonResponse = (response: string): { isValid: boolean; data?: any; error?: string } => {
  if (!response || response.trim().length === 0) {
    return { isValid: false, error: 'Réponse vide du modèle LLM' };
  }

  // Vérifier la taille de la réponse
  if (response.length > 100000) { // 100KB max
    return { isValid: false, error: 'Réponse du modèle trop volumineuse' };
  }

  try {
    const parsed = JSON.parse(response);
    
    // Vérifier que ce n'est pas null ou undefined
    if (parsed === null || parsed === undefined) {
      return { isValid: false, error: 'Réponse JSON nulle' };
    }

    // Validation récursive des chaînes dans l'objet
    const sanitized = sanitizeJsonObject(parsed);
    
    return { isValid: true, data: sanitized };
  } catch (error) {
    return { 
      isValid: false, 
      error: `JSON invalide: ${error instanceof Error ? error.message : 'Erreur de parsing'}` 
    };
  }
};

/**
 * Sanitise récursivement un objet JSON
 */
const sanitizeJsonObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return sanitizeText(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeJsonObject(item));
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Sanitiser aussi les clés
      const sanitizedKey = sanitizeText(key);
      sanitized[sanitizedKey] = sanitizeJsonObject(value);
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Valide la structure d'une réponse d'atelier EBIOS
 */
export const validateEbiosWorkshopResponse = (stepId: number, data: any): { isValid: boolean; error?: string } => {
  switch (stepId) {
    case 1:
      return validateAtelier1Response(data);
    case 2:
      return validateAtelier2Response(data);
    case 3:
      return validateAtelier3Response(data);
    case 4:
      return validateAtelier4Response(data);
    case 5:
      return validateAtelier5Response(data);
    default:
      return { isValid: false, error: `Atelier ${stepId} non reconnu` };
  }
};

/**
 * Validation spécifique pour l'Atelier 1
 */
const validateAtelier1Response = (data: any): { isValid: boolean; error?: string } => {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Réponse Atelier 1: Structure invalide' };
  }

  const required = ['context', 'securityBaseline', 'businessValues', 'dreadedEvents'];
  for (const field of required) {
    if (!(field in data)) {
      return { isValid: false, error: `Atelier 1: Champ '${field}' manquant` };
    }
  }

  if (!Array.isArray(data.businessValues) || data.businessValues.length === 0) {
    return { isValid: false, error: 'Atelier 1: businessValues doit être un tableau non vide' };
  }

  if (!Array.isArray(data.dreadedEvents) || data.dreadedEvents.length === 0) {
    return { isValid: false, error: 'Atelier 1: dreadedEvents doit être un tableau non vide' };
  }

  // Valider la structure des valeurs métier
  for (let i = 0; i < data.businessValues.length; i++) {
    const bv = data.businessValues[i];
    if (!bv.name || typeof bv.name !== 'string' || bv.name.trim() === '') {
      return { isValid: false, error: `Atelier 1: Valeur métier ${i + 1} - nom manquant ou vide` };
    }
    if (!bv.description || typeof bv.description !== 'string' || bv.description.trim() === '') {
      return { isValid: false, error: `Atelier 1: Valeur métier ${i + 1} ("${bv.name}") - description manquante ou vide` };
    }
  }

  // Valider la structure des événements redoutés
  for (const de of data.dreadedEvents) {
    if (!de.name || !de.severity || !de.businessValueName) {
      return { isValid: false, error: 'Atelier 1: Événement redouté incomplet' };
    }
    
    const validSeverities = ['Critique', 'Élevée', 'Moyenne', 'Faible'];
    if (!validSeverities.includes(de.severity)) {
      return { isValid: false, error: `Atelier 1: Gravité invalide '${de.severity}'` };
    }
  }

  return { isValid: true };
};

/**
 * Validation spécifique pour l'Atelier 2
 */
const validateAtelier2Response = (data: any): { isValid: boolean; error?: string } => {
  if (!Array.isArray(data)) {
    return { isValid: false, error: 'Atelier 2: Réponse doit être un tableau' };
  }

  if (data.length === 0) {
    return { isValid: false, error: 'Atelier 2: Aucune source de risque générée' };
  }

  const validTypes = ['Humaine', 'Technique', 'Environnementale'];
  for (let i = 0; i < data.length; i++) {
    const source = data[i];
    if (!source.name || typeof source.name !== 'string' || source.name.trim() === '') {
      return { isValid: false, error: `Atelier 2: Source de risque ${i + 1} - nom manquant ou vide` };
    }
    if (!source.description || typeof source.description !== 'string' || source.description.trim() === '') {
      return { isValid: false, error: `Atelier 2: Source de risque ${i + 1} ("${source.name}") - description manquante ou vide` };
    }
    if (!source.type || typeof source.type !== 'string' || source.type.trim() === '') {
      return { isValid: false, error: `Atelier 2: Source de risque ${i + 1} ("${source.name}") - type manquant ou vide` };
    }

    if (!validTypes.includes(source.type)) {
      return { isValid: false, error: `Atelier 2: Source de risque ${i + 1} ("${source.name}") - type invalide '${source.type}'. Types valides: ${validTypes.join(', ')}` };
    }
  }

  return { isValid: true };
};

/**
 * Validation spécifique pour l'Atelier 3
 */
const validateAtelier3Response = (data: any): { isValid: boolean; error?: string } => {
  if (!Array.isArray(data)) {
    return { isValid: false, error: 'Atelier 3: Réponse doit être un tableau' };
  }

  const validLikelihoods = ['Élevée', 'Moyenne', 'Faible'];
  for (let i = 0; i < data.length; i++) {
    const scenario = data[i];
    if (!scenario.riskSourceId || typeof scenario.riskSourceId !== 'string' || scenario.riskSourceId.trim() === '') {
      return { isValid: false, error: `Atelier 3: Scénario stratégique ${i + 1} - riskSourceId manquant ou vide` };
    }
    if (!scenario.dreadedEventId || typeof scenario.dreadedEventId !== 'string' || scenario.dreadedEventId.trim() === '') {
      return { isValid: false, error: `Atelier 3: Scénario stratégique ${i + 1} - dreadedEventId manquant ou vide` };
    }
    if (!scenario.description || typeof scenario.description !== 'string' || scenario.description.trim() === '') {
      return { isValid: false, error: `Atelier 3: Scénario stratégique ${i + 1} - description manquante ou vide` };
    }
    if (!scenario.likelihood || typeof scenario.likelihood !== 'string' || scenario.likelihood.trim() === '') {
      return { isValid: false, error: `Atelier 3: Scénario stratégique ${i + 1} - vraisemblance manquante ou vide` };
    }

    if (!validLikelihoods.includes(scenario.likelihood)) {
      return { isValid: false, error: `Atelier 3: Scénario stratégique ${i + 1} - vraisemblance invalide '${scenario.likelihood}'. Valeurs valides: ${validLikelihoods.join(', ')}` };
    }
  }

  return { isValid: true };
};

/**
 * Validation spécifique pour l'Atelier 4
 */
const validateAtelier4Response = (data: any): { isValid: boolean; error?: string } => {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Atelier 4: Structure invalide' };
  }

  if (!data.description || typeof data.description !== 'string') {
    return { isValid: false, error: 'Atelier 4: Description manquante ou invalide' };
  }

  if (data.description.length < 50) {
    return { isValid: false, error: 'Atelier 4: Description trop courte (minimum 50 caractères)' };
  }

  return { isValid: true };
};

/**
 * Validation spécifique pour l'Atelier 5
 */
const validateAtelier5Response = (data: any): { isValid: boolean; error?: string } => {
  if (!Array.isArray(data)) {
    return { isValid: false, error: 'Atelier 5: Réponse doit être un tableau' };
  }

  if (data.length === 0) {
    return { isValid: false, error: 'Atelier 5: Aucune mesure de sécurité générée' };
  }

  const validTypes = ['Préventive', 'Détective', 'Corrective'];
  for (let i = 0; i < data.length; i++) {
    const measure = data[i];
    if (!measure.type || typeof measure.type !== 'string' || measure.type.trim() === '') {
      return { isValid: false, error: `Atelier 5: Mesure ${i + 1} - type manquant ou vide` };
    }
    if (!measure.description || typeof measure.description !== 'string' || measure.description.trim() === '') {
      return { isValid: false, error: `Atelier 5: Mesure ${i + 1} (${measure.type}) - description manquante ou vide` };
    }

    if (!validTypes.includes(measure.type)) {
      return { isValid: false, error: `Atelier 5: Mesure ${i + 1} - type invalide '${measure.type}'. Types valides: ${validTypes.join(', ')}` };
    }
  }

  return { isValid: true };
};

/**
 * Détecte les tentatives d'injection dans les réponses LLM
 */
export const detectLLMInjection = (response: string): { isSafe: boolean; threats: string[] } => {
  const threats: string[] = [];
  
  // Patterns suspects
  const suspiciousPatterns = [
    { pattern: /<script[\s\S]*?>[\s\S]*?<\/script>/gi, threat: 'Script injection' },
    { pattern: /javascript:/gi, threat: 'JavaScript URL' },
    { pattern: /on\w+\s*=/gi, threat: 'Event handler injection' },
    { pattern: /eval\s*\(/gi, threat: 'Code evaluation' },
    { pattern: /document\.(write|writeln|cookie)/gi, threat: 'Document manipulation' },
    { pattern: /window\.(location|open)/gi, threat: 'Window manipulation' },
    { pattern: /<iframe[\s\S]*?>/gi, threat: 'Iframe injection' },
    { pattern: /<object[\s\S]*?>/gi, threat: 'Object injection' },
    { pattern: /<embed[\s\S]*?>/gi, threat: 'Embed injection' }
  ];

  for (const { pattern, threat } of suspiciousPatterns) {
    if (pattern.test(response)) {
      threats.push(threat);
    }
  }

  return {
    isSafe: threats.length === 0,
    threats
  };
};
