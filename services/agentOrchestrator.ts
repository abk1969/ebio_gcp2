import type React from 'react';
import { Type } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';
import type { EbiosProject, Severity, RiskSource, RiskSourceProfile, StrategicScenario, Likelihood } from '../types';
import configService from './configService';
import { LLMServiceFactory, type LLMService } from './llmService';

// --- AGENT MCP (Model-Context-Protocol) DEFINITIONS ---

let cachedService: LLMService | null = null;
let cachedProviderKey = '';

const buildProviderKey = (provider: string, model: string): string => `${provider}:${model}`;

const getLLMService = (): LLMService => {
  const config = configService.getConfig();
  const { provider } = config;
  const providerConfig = config[provider];

  console.log(`[LLM] Initialisation du service pour le fournisseur: ${provider}`);

  if (!providerConfig) {
    console.error(`[LLM] Configuration introuvable pour le fournisseur ${provider}`);
    throw new Error(`Configuration introuvable pour le fournisseur ${provider}`);
  }

  // Vérifier les paramètres requis selon le fournisseur
  if (['gemini', 'mistral', 'anthropic', 'deepseek', 'qwen', 'xai', 'groq', 'openai'].includes(provider)) {
    if (!providerConfig.apiKey) {
      console.error(`[LLM] Clé API manquante pour ${provider}`);
      throw new Error(`Clé API manquante pour ${provider}. Veuillez configurer votre clé API dans les paramètres.`);
    }
  }

  if (['ollama', 'lmstudio'].includes(provider)) {
    if (!providerConfig.baseUrl) {
      console.error(`[LLM] URL de base manquante pour ${provider}`);
      throw new Error(`URL de base manquante pour ${provider}. Veuillez configurer l'URL dans les paramètres.`);
    }
  }

  const cacheKey = buildProviderKey(provider, providerConfig.model ?? 'default');
  if (cachedService && cachedProviderKey === cacheKey) {
    console.log(`[LLM] Utilisation du service en cache pour ${provider}`);
    return cachedService;
  }

  try {
    console.log(`[LLM] Création d'un nouveau service pour ${provider} avec le modèle ${providerConfig.model}`);
    cachedService = LLMServiceFactory.createService(provider, providerConfig);
    cachedProviderKey = cacheKey;
    return cachedService;
  } catch (error) {
    console.error(`[LLM] Erreur lors de la création du service ${provider}:`, error);
    throw new Error(`Impossible d'initialiser le service ${provider}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

configService.addListener((config) => {
  const provider = config.provider;
  const providerConfig = config[provider];
  if (cachedService && providerConfig) {
    try {
      (cachedService as any).updateConfig?.(providerConfig);
      cachedProviderKey = buildProviderKey(provider, providerConfig.model ?? 'default');
    } catch (error) {
      console.warn('Impossible de mettre à jour le service LLM existant, recréation nécessaire.', error);
      cachedService = null;
      cachedProviderKey = '';
    }
  } else {
    cachedService = null;
    cachedProviderKey = '';
  }
});

const callAgent = async (systemInstruction: string, userPrompt: string, responseSchema: any) => {
  const config = configService.getConfig();
  const provider = config.provider;

  console.log(`[Agent] Appel de l'agent avec le fournisseur: ${provider}`);
  console.log(`[Agent] Prompt utilisateur (${userPrompt.length} caractères):`, userPrompt.substring(0, 200) + '...');

  try {
    const service = getLLMService();
    const startTime = Date.now();

    const result = await service.generateJSON(userPrompt, systemInstruction, responseSchema);

    const duration = Date.now() - startTime;
    console.log(`[Agent] Réponse reçue en ${duration}ms du fournisseur ${provider}`);

    return result;
  } catch (error: any) {
    console.error(`[Agent] Erreur lors de l'appel du service ${provider}:`, error);

    // Fournir des messages d'erreur plus spécifiques selon le type d'erreur
    let userMessage = error?.message || "Une erreur inattendue est survenue lors de la communication avec le LLM.";

    if (error?.message?.includes('API key') || error?.message?.includes('401')) {
      userMessage = `Erreur d'authentification avec ${provider}. Vérifiez votre clé API dans les paramètres.`;
    } else if (error?.message?.includes('quota') || error?.message?.includes('429')) {
      userMessage = `Quota dépassé pour ${provider}. Veuillez réessayer plus tard ou vérifier votre abonnement.`;
    } else if (error?.message?.includes('fetch') || error?.message?.includes('connexion')) {
      userMessage = `Impossible de se connecter à ${provider}. Vérifiez votre connexion internet et la configuration.`;
    } else if (error?.message?.includes('JSON')) {
      userMessage = `${provider} a renvoyé une réponse mal formatée. Veuillez réessayer.`;
    }

    throw new Error(userMessage);
  }
};


// --- WORKSHOP AGENT IMPLEMENTATIONS ---

const atelier1Agent = async (initialPrompt: string) => {
  const systemInstruction = `Tu es un expert senior en sécurité des systèmes d'information, spécialiste EBIOS Risk Manager, Security by Design, GRC, Purple Teaming et normes ISO 27001/27002/27005, NIST CSF/800-53, CIS Controls.
Ta mission : piloter l'Atelier 1 (Cadrage & Socle de Sécurité) avec un niveau d'analyse stratégique et technique très élevé.

INSTRUCTIONS GÉNÉRALES :
- Exploite exhaustivement la description du contexte fournie. Tout choix doit être justifié par des éléments du contexte : périmètre, parties prenantes, technologies, contraintes réglementaires, fournisseurs, dépendances critiques.
- Applique les principes de sécurité by design (défense en profondeur, zero trust, privacy by design, résilience).
- Assure une cohérence totale avec la structure attendue de l'interface (Contexte structuré, Socle de sécurité, Valeurs métier, Événements redoutés).
- Approche orientée EBIOS RM : rattache systématiquement les exigences de sécurité aux enjeux métier identifiés.

1) CONTEXTE (champ 'context')
Format Markdown imposé :
## Contexte de l'étude
### 1. Missions et Objet de l'étude
- Décris les objectifs métier, les services rendus, l'architecture globale et les principales évolutions.
### 2. Objectifs de l'analyse de risque
- Relie les objectifs aux cadres (homologation, conformité réglementaire type RGPD/HDS, résilience). Mentionne les exigences de GRC et de sécurité by design attendues.
### 3. Acteurs et Parties Prenantes
- Catégorise les rôles (Direction, RSSI, DPO, équipes techniques, partenaires externes, clients). Pour chaque catégorie, indique le rôle vis-à-vis de la sécurité et leur motivation.
### 4. Contraintes et Hypothèses
- Liste les contraintes techniques (technos clés, cloud/on-prem, dépendances), réglementaires (HDS, ISO, RGPD), budgétaires, temporelles. Mentionne les hypothèses critiques.
### 5. Environnement technique et données
- Précise les composants critiques, interconnexions, données sensibles (catégories, localisation, volumétrie), exigences de disponibilité.

2) SOCLE DE SÉCURITÉ (champ 'securityBaseline')
Objectif : produire un socle stratégique, tactique et opérationnel, contextualisé sur trois axes : Gouvernance & GRC, Protection & by design, Surveillance & résilience.
Structure imposée :
## Socle de Sécurité de Référence
### a. Gouvernance & Conformité
- Sélectionne les référentiels pertinents (ISO 27001/27002/27005, ISO 27701, HDS, RGPD, politiques internes). Pour chacun, justifie l'apport concret pour le projet (ex : ISO 27005 → méthode de gestion de risque ; HDS → exigences d'hébergement santé).
- Ajoute des exigences de gouvernance : comité de pilotage sécurité, gestion documentaire, cartographie des actifs, tenue d'un registre de traitement.
### b. Protection & Security by Design
- Décompose par domaines : identité & accès (IAM/PAM/Zero Trust), protection des données (chiffrement, anonymisation), sécurité applicative (SSDLC, tests sécurité, DevSecOps), sécurité du socle technique (hardening, segmentation réseau, bastion, gestion des vulnérabilités), gestion des tiers (reversibility, due diligence).
- Pour chaque domaine, relie explicitement aux technologies et contraintes du contexte (ex : accès distants Palo Alto → activer ZTNA, MFA, micro-segmentation ; manipulations de données santé → chiffrement AES-256, pseudonymisation).
### c. Détection, Riposte & Résilience
- Décris les capacités SOC/CSIRT, supervision, corrélation, plan de réponse à incident (PRI), PRA/PCA, tests de crise. Cite les normes/pratiques de référence (NIST 800-61, ISO 22301, exercices purple team).
- Ajoute un paragraphe sur la maturité actuelle supposée et les priorités d'élévation.

3) VALEURS MÉTIER (champ 'businessValues')
- Produis 4 à 6 valeurs métier critiques, alignées sur le contexte. Chaque description >= 220 caractères, riche en détails, mentionnant les dépendances SI, les impacts GRC, et les exigences de sécurité (disponibilité, intégrité, confidentialité, traçabilité).
- Utilise des formulations professionnelles (ex : "Intégrité de la plateforme de télésanté" plutôt que "site web").

4) ÉVÉNEMENTS REDOUTÉS (champ 'dreadedEvents')
- Pour chaque valeur métier, génère 2 événements redoutés distincts (minimum 8 au total). Formulation : "[Impact] sur [actif/processus] via [vecteur]".
- Gravité selon l'échelle 'Critique', 'Grave', 'Significative', 'Mineure'. Justifie mentalement la gravité (utilisé pour la cohérence globale).
- Le champ 'businessValueName' doit correspondre exactement à la valeur métier associée.

AUTOCONTRÔLE & ITÉRATIONS :
- Avant de répondre, relis ta proposition pour détecter incohérences, oublis, manque de contextualisation.
- Si la sortie ne satisfait pas pleinement les exigences (contextualisation insuffisante, sécurité by design incomplète, références normes manquantes, descriptions trop courtes), réitère jusqu'à 3 tentatives maximum.
- Mentionne un champ interne "qualityNotes" lors des itérations (non retourné dans la réponse finale) pour t'assurer que les corrections sont prises en compte.

Ta réponse finale doit être strictement au format JSON du schéma fourni et refléter la meilleure itération.`;
  const schema = {
    type: Type.OBJECT,
    properties: {
      context: { type: Type.STRING },
      securityBaseline: { type: Type.STRING },
      businessValues: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING }
          }
        }
      },
      dreadedEvents: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            businessValueName: { type: Type.STRING },
            name: { type: Type.STRING },
            severity: { type: Type.STRING, enum: ['Critique', 'Grave', 'Significative', 'Mineure'] }
          }
        }
      }
    },
    required: ["context", "securityBaseline", "businessValues", "dreadedEvents"]
  };
  const maxAttempts = 3;
  let attempt = 0;
  let lastError = '';

  while (attempt < maxAttempts) {
    attempt++;
    const prompt = attempt === 1
      ? initialPrompt
      : `${initialPrompt}

Feedback à intégrer obligatoirement :
- ${lastError}
Corrige, enrichis et délivre une version conforme aux exigences.`;

    const result = await callAgent(systemInstruction, prompt, schema);

    const issues: string[] = [];

    if (!result.context || typeof result.context !== 'string' || !result.context.includes('## Contexte de l')) {
      issues.push('Le contexte doit respecter le format Markdown demandé avec toutes les sections.');
    }

    if (!result.securityBaseline || typeof result.securityBaseline !== 'string' || !result.securityBaseline.includes('## Socle de Sécurité de Référence')) {
      issues.push('Le socle de sécurité doit être structuré avec les sections Gouvernance, Protection, Détection.');
    }

    if (!Array.isArray(result.businessValues) || result.businessValues.length < 4) {
      issues.push('Il faut au moins 4 valeurs métier détaillées.');
    } else {
      result.businessValues.forEach((bv: any) => {
        if (!bv.description || bv.description.length < 220) {
          issues.push(`Description trop courte pour la valeur métier "${bv.name}" (>= 220 caractères requis).`);
        }
      });
    }

    if (!Array.isArray(result.dreadedEvents) || result.dreadedEvents.length < 8) {
      issues.push('Génère au moins 8 événements redoutés (2 par valeur métier).');
    } else {
      const bvNames = new Set(result.businessValues.map((bv: any) => bv.name));
      result.dreadedEvents.forEach((de: any) => {
        if (!bvNames.has(de.businessValueName)) {
          issues.push(`L'événement redouté "${de.name}" n'est pas relié à une valeur métier valide.`);
        }
        if (!['Critique', 'Grave', 'Significative', 'Mineure'].includes(de.severity)) {
          issues.push(`Gravité invalide pour "${de.name}".`);
        }
      });
    }

    if (issues.length === 0) {
      return result;
    }

    lastError = issues.join('\n- ');
  }

  throw new Error(`Impossible de générer une réponse conforme après ${maxAttempts} tentatives.`);
};

const atelier2Agent = async (project: EbiosProject) => {
  const systemInstruction = `Tu es un expert en Threat Intelligence, spécialisé dans la méthode EBIOS RM de l'ANSSI. Ta mission est de réaliser l'Atelier 2 en identifiant les sources de risque les plus plausibles pour le projet décrit.

Ta tâche n'est pas de lister toutes les menaces possibles, mais de **sélectionner les 3 à 5 profils d'attaquants les plus pertinents** qui seraient les plus susceptibles de vouloir causer les **événements redoutés** déjà identifiés.

Pour chaque source de risque que tu identifies, tu dois :
1.  **Choisir un profil clair** parmi la typologie EBIOS RM (ex: 'Concurrent', 'Crime organisé', 'Activiste idéologique', etc.).
2.  **Rédiger une description (motivation)** qui est **extrêmement contextualisée**. Tu dois **explicitement lier** la motivation de la source de risque à une ou plusieurs **valeurs métier** et à un ou plusieurs **événements redoutés** fournis dans le prompt pour justifier ton choix.
3.  **Justifier ta sélection** en expliquant pourquoi ce profil est une menace crédible pour *ce projet spécifique*.

Exemple de raisonnement attendu : Si une valeur métier est "l'intégrité de la formule du vaccin" et un événement redouté est "l'altération de la formule du vaccin", une source de risque pertinente pourrait être un 'Groupe terroriste' avec pour description : "Leur motivation serait idéologique, visant à causer une crise sanitaire majeure en sabotant la production, ce qui est directement lié à l'événement redouté d'altération de la formule."

L'objectif est de créer une base solide et cohérente pour l'Atelier 3, où ces sources de risque seront croisées avec les événements redoutés pour créer des scénarios.`;
  const prompt = `Contexte du projet: "${project.context}".
Valeurs métier identifiées:
${project.businessValues.map(bv => `- ${bv.name}: ${bv.description}`).join('\n')}
Événements redoutés:
${project.dreadedEvents.map(de => `- ${de.name} (Gravité: ${de.severity})`).join('\n')}

En te basant sur le raisonnement ci-dessus, identifie les sources de risque les plus pertinentes.`;
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING, description: "Motivation contextualisée et pertinence de la menace, en liant aux valeurs métier et événements redoutés." },
        profile: { 
          type: Type.STRING, 
          enum: ['Activiste idéologique', 'Amateur', 'Concurrent', 'Crime organisé', 'Malveillant pathologique', 'Officine spécialisée', 'Terroriste', 'Vengeur', 'Étatique'],
          description: "Profil de la source de risque selon la typologie EBIOS RM."
        }
      },
      required: ["name", "description", "profile"]
    }
  };
  return callAgent(systemInstruction, prompt, schema);
};


const atelier3Agent = async (project: EbiosProject) => {
    const systemInstruction = `Tu es un analyste de risque senior, expert de la méthode EBIOS RM, spécialisé dans la conception de scénarios stratégiques (Atelier 3). Ta mission n'est pas de simplement associer des sources de risque à des événements redoutés, mais de **construire les narratifs d'attaque les plus plausibles et contextualisés**.

Pour chaque scénario que tu crées, tu dois IMPÉRATIVEMENT te baser sur :
1.  Le **contexte global** du projet.
2.  Le **profil et la motivation** de la source de risque (ex: un 'Concurrent' cherche le gain financier, un 'Activiste' la visibilité).
3.  La **nature de l'événement redouté** (ex: est-ce une fuite de données, une interruption de service, une altération ?).

La **description** du scénario doit être un résumé clair et logique du chemin d'attaque général. Elle doit répondre à la question : "Comment cette source de risque, avec ses motivations propres, parviendrait-elle à causer cet événement redouté dans le contexte de ce projet ?". Sois spécifique. Par exemple, au lieu de "Le concurrent vole les données", écris "Le concurrent infiltre le réseau via un partenaire moins sécurisé pour exfiltrer les plans de R&D avant le lancement du produit".

L'estimation de la **vraisemblance** ne doit pas être aléatoire. Elle doit être le reflet de ton analyse experte, en considérant :
- La **motivation** de l'attaquant est-elle forte pour cet objectif ?
- Le **profil** de l'attaquant correspond-il aux capacités nécessaires pour une telle attaque ?
- Le **contexte** du projet présente-t-il des faiblesses évidentes (ex: forte dépendance à des tiers, données très centralisées) qui rendraient ce scénario plus facile ?

La qualité de tes scénarios est cruciale, car ils serviront de base à l'Atelier 4 (Scénarios Opérationnels). Une description claire et une vraisemblance bien évaluée sont essentielles pour une orchestration parfaite de l'analyse. Utilise IMPÉRATIVEMENT les IDs fournis pour lier les scénarios.`;
    const prompt = `
Contexte Général du Projet:
"${project.context}"

Sources de Risque Disponibles:
${JSON.stringify(project.riskSources.map(rs => ({ id: rs.id, name: rs.name, description: rs.description, profile: rs.profile })))}

Événements Redoutés Disponibles:
${JSON.stringify(project.dreadedEvents.map(de => ({ id: de.id, name: de.name, severity: de.severity })))}

Crée maintenant les scénarios stratégiques les plus pertinents en associant une source de risque à un événement redouté. La description doit être un résumé crédible du chemin d'attaque.`;
    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          riskSourceId: { type: Type.STRING },
          dreadedEventId: { type: Type.STRING },
          description: { type: Type.STRING, description: "Résumé du chemin d'attaque stratégique." },
          likelihood: { type: Type.STRING, enum: ['Quasi-certain', 'Très vraisemblable', 'Vraisemblable', 'Peu vraisemblable'] }
        },
        required: ["riskSourceId", "dreadedEventId", "description", "likelihood"]
      }
    };
    return callAgent(systemInstruction, prompt, schema);
};


const atelier4Agent = async (strategicScenarioId: string, project: EbiosProject) => {
    const ss = project.strategicScenarios.find(s => s.id === strategicScenarioId);
    if (!ss) throw new Error("Scénario stratégique non trouvé");
    const rs = project.riskSources.find(r => r.id === ss.riskSourceId);
    const de = project.dreadedEvents.find(d => d.id === ss.dreadedEventId);
    
    const systemInstruction = `Tu es un expert en Cyber Threat Intelligence (CTI) et en opérations offensives (Red Team), maîtrisant parfaitement la méthode EBIOS RM et le référentiel MITRE ATT&CK. Ta mission est de réaliser l'Atelier 4 en transformant un scénario stratégique en un scénario opérationnel technique, crédible et hautement contextualisé.

Ton analyse doit être un véritable récit d'attaque, décrivant la chaîne d'actions la plus probable. Pour cela, tu dois suivre ces instructions impératives :

1.  **Raisonnement Basé sur le Profil de l'Attaquant** : Ta première étape est d'analyser en profondeur le profil de la source de risque. Les techniques que tu choisiras doivent être en parfaite adéquation avec ses motivations et ses capacités typiques :
    *   **Crime organisé** : Vise le gain financier. Privilégie les rançongiciels (Impact: T1486), l'exfiltration de données pour extorsion (Exfiltration: T1537), et les attaques sur les systèmes de paiement.
    *   **Concurrent** : Cherche l'avantage compétitif. Concentre-toi sur l'espionnage, l'exfiltration de propriété intellectuelle (Collection, Exfiltration: T1041), et le sabotage discret.
    *   **Activiste idéologique (Hacktiviste)** : Vise la visibilité et le dommage à la réputation. Opte pour le défacement de sites web (Impact: T1491.001), les attaques par déni de service (Impact: T1498), et la divulgation publique de données.
    *   **Étatique (APT)** : Opère de manière furtive et persistante. Utilise des techniques sophistiquées, des exploits zero-day (Exploitation: T1212), et des mouvements latéraux complexes pour atteindre un objectif stratégique à long terme.

2.  **Contextualisation Technique** : Analyse le contexte technique du projet (Cloud, on-premise, application web, etc.) pour sélectionner les techniques MITRE ATT&CK les plus pertinentes. Par exemple, si le contexte mentionne un "cloud public", des techniques comme "Exploit Public-Facing Application" (T1190) ou "Valid Accounts: Cloud Accounts" (T1078.004) sont plus plausibles.

3.  **Structuration Rigoureuse du Scénario** : Le scénario opérationnel doit être une liste numérotée de 3 à 5 étapes clés. Chaque étape doit suivre le format :
    \`[Numéro]. [Description de l'action de l'attaquant, justifiée par le contexte/profil]. ([Référence MITRE ATT&CK : Txxxx.xxx])\`

4.  **Cohérence de la Chaîne d'Attaque** : Les étapes doivent s'enchaîner logiquement, depuis l'accès initial jusqu'à l'action sur l'objectif final qui mène à l'événement redouté.

Exemple de format pour une étape :
"1. Le groupe cybercriminel, cherchant à déployer un rançongiciel, obtient un accès initial en exploitant une vulnérabilité connue sur l'application web publique du projet, qui n'a pas été mise à jour. (MITRE ATT&CK : T1190)"

Ta production doit être directement utilisable par une équipe de sécurité (Blue Team) pour définir des mesures de protection, ce qui est l'objectif de l'Atelier 5. La qualité de ton orchestration est la clé du succès.`;

    const prompt = `Contexte: "${project.context}"
Scénario stratégique à détailler:
- Source de Risque: "${rs?.name}" (Profil: ${rs?.profile})
- Événement Redouté Cible: "${de?.name}"
- Description Stratégique: "${ss.description}"

Élabore maintenant le scénario opérationnel détaillé en suivant les instructions.`;
    const schema = {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING, description: "Le scénario opérationnel détaillé, structuré en liste numérotée, avec les références MITRE ATT&CK pour chaque étape." }
      },
      required: ["description"]
    };
    return callAgent(systemInstruction, prompt, schema);
};

const atelier5Agent = async (operationalScenarioId: string, project: EbiosProject) => {
    const os = project.operationalScenarios.find(o => o.id === operationalScenarioId);
    if (!os) throw new Error("Scénario opérationnel non trouvé");
    const ss = project.strategicScenarios.find(s => s.id === os.strategicScenarioId);
    if (!ss) throw new Error("Scénario stratégique parent non trouvé");
    
    const systemInstruction = `Tu es un consultant senior en Gouvernance, Risque et Conformité (GRC), expert de la méthode EBIOS RM et de la norme ISO 27005. Ta mission est de piloter l'Atelier 5 : Traitement du Risque. Tu agis en tant que stratège de la "Blue Team", dont le but n'est pas de lister des contrôles génériques, mais de construire un plan de traitement du risque pragmatique, justifié et directement exploitable.

Pour le scénario opérationnel fourni, qui détaille une chaîne d'attaque technique, tu dois suivre une méthodologie d'expert rigoureuse :

1.  **Analyse de la Chaîne d'Attaque** : Ta première action est d'analyser en détail chaque étape et chaque technique MITRE ATT&CK du scénario opérationnel. Tu dois comprendre le chemin de l'attaquant pour le démanteler.

2.  **Élaboration de Contre-Mesures Ciblées** : Propose un ensemble de 3 à 5 mesures de sécurité qui répondent DIRECTEMENT aux techniques identifiées. Chaque mesure doit être :
    *   **Concrète et Actionnable** : Évite les généralités. Au lieu de "Sensibiliser les utilisateurs", propose "Mettre en place une campagne de simulation de phishing trimestrielle ciblée sur les techniques d'ingénierie sociale (T1566)".
    *   **Catégorisée** : Spécifie clairement son type ('Préventive', 'Détective', 'Corrective') pour assurer une défense en profondeur. Tu dois proposer un mix équilibré de ces trois types.

3.  **Évaluation Rigoureuse du Risque Résiduel** : Après avoir défini tes mesures, évalue leur efficacité combinée.
    *   **Estime la "vraisemblance résiduelle"** : Choisis le nouveau niveau de vraisemblance ('Quasi-certain', 'Très vraisemblable', 'Vraisemblable', 'Peu vraisemblable') qui résulte de la mise en place de tes mesures.
    *   **Rédige une Justification Stratégique** : C'est l'étape la plus critique. Ta justification ne doit pas être une simple liste des mesures. Elle doit expliquer de manière convaincante **comment** le portefeuille de mesures (préventives, détectives, et correctives) interagit pour briser ou affaiblir significativement la chaîne d'attaque décrite. Explique comment tu augmentes le coût et la complexité pour l'attaquant, réduisant ainsi ses chances de succès.

L'orchestration de l'analyse repose sur la qualité de ton travail. Ton livrable doit permettre à un RSSI ou un DSI de prendre une décision éclairée sur la stratégie de traitement à adopter.`;
    const prompt = `Scénario opérationnel à traiter: \n"${os.description}".\n\nLa vraisemblance initiale de réussite de ce scénario a été estimée à : "${ss.likelihood}".\n\nEn te basant sur ces informations, propose un plan de traitement complet.`;
    const schema = {
      type: Type.OBJECT,
      properties: {
        measures: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ['Préventive', 'Détective', 'Corrective'] },
              description: { type: Type.STRING }
            },
            required: ["type", "description"]
          }
        },
        residualLikelihood: { 
          type: Type.STRING, 
          enum: ['Quasi-certain', 'Très vraisemblable', 'Vraisemblable', 'Peu vraisemblable'],
          description: "La nouvelle vraisemblance estimée après application des mesures."
        },
        justification: { 
          type: Type.STRING, 
          description: "Justification expliquant comment les mesures réduisent la vraisemblance."
        }
      },
      required: ["measures", "residualLikelihood", "justification"]
    };
    return callAgent(systemInstruction, prompt, schema);
};


// --- CHATBOT AGENT ---

export const runChatbotAgent = async (userQuery: string, project: EbiosProject): Promise<string> => {
  const systemInstruction = `Tu es un assistant IA expert de la méthode EBIOS RM. Ta double mission est de :
1. Répondre aux questions générales sur la méthodologie EBIOS RM, son processus, ses ateliers, et ses concepts clés.
2. Répondre aux questions spécifiques concernant l'analyse de risque en cours, en te basant EXCLUSIVEMENT sur le contexte du projet fourni ci-dessous.

Quand une question est posée, détermine d'abord si elle est générale ou spécifique au projet.
- Si elle est générale (ex: "Qu'est-ce que l'Atelier 2 ?"), utilise tes connaissances d'expert pour y répondre de manière claire et concise.
- Si elle est spécifique au projet (ex: "Quels sont les événements redoutés identifiés ?"), extrais la réponse uniquement à partir des données JSON du projet.
- Si la réponse à une question spécifique n'est pas dans le contexte du projet, réponds "Je ne trouve pas cette information dans le projet actuel."
- Sois toujours aimable et professionnel.`;
  const projectContext = `CONTEXTE DU PROJET ACTUEL:\n${JSON.stringify(project, null, 2)}`;
  const fullPrompt = `${projectContext}\n\nQUESTION DE L'UTILISATEUR:\n${userQuery}`;

  try {
    const service = getLLMService();
    const response = await service.generateContent(fullPrompt, systemInstruction);
    const text = response.text ?? '';
    if (!text.trim()) {
      throw new Error("Réponse vide reçue du chatbot IA.");
    }
    return text;
  } catch (error: unknown) {
    console.error("Error in chatbot agent:", error);
    const message = error instanceof Error ? error.message : "Désolé, une erreur technique est survenue lors de la communication avec l'assistant.";
    throw new Error(message);
  }
};


// --- ORCHESTRATOR HANDLERS ---

type AgentHandler = (project: EbiosProject, setProject: React.Dispatch<React.SetStateAction<EbiosProject>>, payload?: string) => Promise<void>;

const agentHandlers: Record<number, AgentHandler> = {
  1: async (project, setProject, payload) => {
    if (!payload) throw new Error("Le prompt initial est requis pour l'Atelier 1.");
    const result = await atelier1Agent(payload);
    const businessValues = result.businessValues.map((v: any) => ({ ...v, id: uuidv4() }));
    const dreadedEvents = result.dreadedEvents.map((e: any) => {
        const relatedBv = businessValues.find((bv: any) => bv.name === e.businessValueName);
        return { ...e, id: uuidv4(), businessValueId: relatedBv?.id || 'unknown' };
    });
    setProject(p => ({ ...p, context: result.context, securityBaseline: result.securityBaseline, businessValues, dreadedEvents }));
  },
  2: async (project, setProject) => {
    const result = await atelier2Agent(project);
    const riskSources: RiskSource[] = result.map((s: { name: string, description: string, profile: RiskSourceProfile }) => ({
        ...s,
        id: uuidv4(),
        type: 'Humaine',
    }));
    setProject(p => ({ ...p, riskSources }));
  },
  3: async (project, setProject) => {
    const strategicScenarios = await atelier3Agent(project);
    setProject(p => ({ ...p, strategicScenarios: strategicScenarios.map((s: any) => ({...s, id: uuidv4()})) }));
  },
  4: async (project, setProject, payload) => {
    if (!payload) throw new Error("L'ID du scénario stratégique est requis.");
    const opScenario = await atelier4Agent(payload, project);
    const newOpScenario = { ...opScenario, id: uuidv4(), strategicScenarioId: payload };
    // Prevent duplicates
    setProject(p => ({ ...p, operationalScenarios: p.operationalScenarios.filter(o => o.strategicScenarioId !== payload).concat(newOpScenario) }));
  },
  5: async (project, setProject, payload) => {
    if (!payload) throw new Error("L'ID du scénario opérationnel est requis.");
    const result = await atelier5Agent(payload, project);
    const newMeasures = result.measures.map((m: any) => ({ ...m, id: uuidv4(), operationalScenarioId: payload }));
    
    const operationalScenario = project.operationalScenarios.find(os => os.id === payload);
    if (!operationalScenario) return;

    const updatedStrategicScenarios = project.strategicScenarios.map(ss => {
        if (ss.id === operationalScenario.strategicScenarioId) {
            return {
                ...ss,
                residualLikelihood: result.residualLikelihood,
                residualLikelihoodJustification: result.justification
            };
        }
        return ss;
    });

    setProject(p => ({
      ...p,
      securityMeasures: p.securityMeasures.filter(m => m.operationalScenarioId !== payload).concat(newMeasures),
      strategicScenarios: updatedStrategicScenarios
    }));
  }
};

// --- MAIN ORCHESTRATOR ---

export const runWorkshopAgent = async (
    stepId: number,
    project: EbiosProject,
    setProject: React.Dispatch<React.SetStateAction<EbiosProject>>,
    payload?: string
) => {
    const handler = agentHandlers[stepId];
    if (handler) {
        await handler(project, setProject, payload);
    } else {
        throw new Error(`Agent pour l'atelier ${stepId} non implémenté.`);
    }
};
