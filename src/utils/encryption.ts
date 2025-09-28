/**
 * Utilitaires de chiffrement simple pour les données sensibles
 * ATTENTION: Ce n'est qu'un chiffrement basique côté client
 * Pour une sécurité réelle, utilisez un backend sécurisé
 */

/**
 * Génère une clé de chiffrement basée sur l'empreinte du navigateur
 */
const generateBrowserKey = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Browser fingerprint', 2, 2);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');
  
  // Hash simple (non cryptographique)
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
};

/**
 * Chiffrement XOR simple (ATTENTION: Sécurité limitée)
 */
const xorEncrypt = (text: string, key: string): string => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const textChar = text.charCodeAt(i);
    const keyChar = key.charCodeAt(i % key.length);
    result += String.fromCharCode(textChar ^ keyChar);
  }
  return btoa(result); // Base64 encode
};

/**
 * Déchiffrement XOR
 */
const xorDecrypt = (encryptedText: string, key: string): string => {
  try {
    const decoded = atob(encryptedText); // Base64 decode
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const textChar = decoded.charCodeAt(i);
      const keyChar = key.charCodeAt(i % key.length);
      result += String.fromCharCode(textChar ^ keyChar);
    }
    return result;
  } catch {
    return '';
  }
};

/**
 * Chiffre une chaîne sensible
 */
export const encryptSensitiveData = (data: string): string => {
  if (!data) return '';
  
  try {
    const key = generateBrowserKey();
    return xorEncrypt(data, key);
  } catch (error) {
    console.warn('Erreur de chiffrement, stockage en clair:', error);
    return data; // Fallback en clair si le chiffrement échoue
  }
};

/**
 * Déchiffre une chaîne sensible
 */
export const decryptSensitiveData = (encryptedData: string): string => {
  if (!encryptedData) return '';
  
  try {
    const key = generateBrowserKey();
    const decrypted = xorDecrypt(encryptedData, key);
    
    // Vérification basique que le déchiffrement a fonctionné
    if (decrypted.length === 0 && encryptedData.length > 0) {
      console.warn('Échec du déchiffrement, retour des données brutes');
      return encryptedData; // Fallback si le déchiffrement échoue
    }
    
    return decrypted;
  } catch (error) {
    console.warn('Erreur de déchiffrement:', error);
    return encryptedData; // Fallback
  }
};

/**
 * Vérifie si une chaîne semble être chiffrée
 */
export const isEncrypted = (data: string): boolean => {
  if (!data) return false;
  
  try {
    // Vérifie si c'est du Base64 valide
    const decoded = atob(data);
    return decoded.length > 0 && data !== decoded;
  } catch {
    return false;
  }
};

/**
 * Stockage sécurisé dans localStorage
 */
export const secureStorage = {
  setItem: (key: string, value: string, encrypt: boolean = true): void => {
    try {
      const dataToStore = encrypt ? encryptSensitiveData(value) : value;
      localStorage.setItem(key, JSON.stringify({
        data: dataToStore,
        encrypted: encrypt,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Erreur de stockage sécurisé:', error);
    }
  },
  
  getItem: (key: string): string | null => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      if (parsed.encrypted) {
        return decryptSensitiveData(parsed.data);
      }
      return parsed.data;
    } catch (error) {
      console.error('Erreur de lecture sécurisée:', error);
      return null;
    }
  },
  
  removeItem: (key: string): void => {
    localStorage.removeItem(key);
  }
};
