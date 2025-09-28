/**
 * Utilitaires de validation pour l'application EBIOS RM
 */

/**
 * Valide qu'une chaîne n'est pas vide et ne contient que des caractères autorisés
 */
export const validateText = (text: string, maxLength: number = 1000): { isValid: boolean; error?: string } => {
  if (!text || text.trim().length === 0) {
    return { isValid: false, error: 'Le texte ne peut pas être vide' };
  }
  
  if (text.length > maxLength) {
    return { isValid: false, error: `Le texte ne peut pas dépasser ${maxLength} caractères` };
  }
  
  // Vérifier les caractères potentiellement dangereux
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(text)) {
      return { isValid: false, error: 'Le texte contient des caractères non autorisés' };
    }
  }
  
  return { isValid: true };
};

/**
 * Valide une clé API
 */
export const validateApiKey = (apiKey: string): { isValid: boolean; error?: string } => {
  if (!apiKey || apiKey.trim().length === 0) {
    return { isValid: false, error: 'La clé API est requise' };
  }
  
  if (apiKey.length < 10) {
    return { isValid: false, error: 'La clé API semble trop courte' };
  }
  
  // Vérifier le format basique pour Gemini
  if (apiKey.startsWith('AIza') && apiKey.length < 39) {
    return { isValid: false, error: 'Format de clé API Gemini invalide' };
  }
  
  return { isValid: true };
};

/**
 * Valide une URL
 */
export const validateUrl = (url: string): { isValid: boolean; error?: string } => {
  if (!url || url.trim().length === 0) {
    return { isValid: false, error: 'L\'URL est requise' };
  }
  
  try {
    const urlObj = new URL(url);
    
    // Vérifier que c'est HTTP ou HTTPS
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'Seuls les protocoles HTTP et HTTPS sont autorisés' };
    }
    
    // Vérifier que ce n'est pas localhost en production
    if (process.env.NODE_ENV === 'production' && 
        (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1')) {
      return { isValid: false, error: 'Les URLs localhost ne sont pas autorisées en production' };
    }
    
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Format d\'URL invalide' };
  }
};

/**
 * Sanitise une chaîne pour l'affichage
 */
export const sanitizeText = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Valide les données d'un projet EBIOS
 */
export const validateProjectData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (data.context) {
    const contextValidation = validateText(data.context, 5000);
    if (!contextValidation.isValid) {
      errors.push(`Contexte: ${contextValidation.error}`);
    }
  }
  
  if (data.securityBaseline) {
    const baselineValidation = validateText(data.securityBaseline, 5000);
    if (!baselineValidation.isValid) {
      errors.push(`Socle de sécurité: ${baselineValidation.error}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
