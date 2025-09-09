import type React from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { v4 as uuidv4 } from 'uuid';
import type { EbiosProject } from '../types';

let ai: GoogleGenAI | null = null;

// Initialisation paresseuse du client AI pour éviter les crashs au démarrage
const getAiClient = (): GoogleGenAI => {
  if (!process.env.API_KEY) {
    // Lève une erreur claire si la clé API n'est pas configurée
    throw new Error("La clé API Gemini n'est pas configurée. Veuillez vous assurer que la variable d'environnement API_KEY est définie.");
  }
  if (!ai) {
    // Conformément aux instructions, nous supposons que process.env.API_KEY est fourni par l'environnement d'exécution.
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

const model = "gemini-2.5-flash";

// --- AGENT MCP (Model-Context-Protocol) DEFINITIONS ---

const callAgent = async (systemInstruction: string, userPrompt: string, responseSchema: any) => {
  let rawResponseText = '';
  try {
    const client = getAiClient();
    const response = await client.models.generateContent({
      model,
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema
      }
    });
    rawResponseText = response.text;
    return JSON.parse(rawResponseText);
  } catch (error) {
    if (error instanceof SyntaxError && rawResponseText) {
      console.error("Failed to parse agent JSON response:", rawResponseText);
      throw new Error("L'agent a renvoyé une réponse mal formatée qui n'est pas un JSON valide. Veuillez réessayer.");
    }

    console.error("Error calling Gemini Agent:", error);
    let userFriendlyMessage = error.message || "L'appel à l'agent a échoué. Vérifiez la console pour les détails techniques.";
     if (error.message?.includes('API key')) {
        userFriendlyMessage = "L'appel à l'agent a échoué. Votre clé API semble invalide ou manquante.";
    } else if (error.message?.includes('quota')) {
        userFriendlyMessage = "L'appel à l'agent a échoué car le quota a été dépassé.";
    }
    throw new Error(userFriendlyMessage);
  }
};


// --- WORKSHOP AGENT IMPLEMENTATIONS ---

const atelier1Agent = async (initialPrompt: string) => {
  const systemInstruction = `Tu es un expert en cybersécurité spécialisé dans la méthode EBIOS RM. Ton rôle est de piloter l'Atelier 1. À partir d'une brève description de projet, tu dois générer 1) un contexte détaillé, 2) un socle de sécurité plausible, 3) 3 à 5 valeurs métier cruciales, et 4) 2 événements redoutés par valeur métier.`;
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
            severity: { type: Type.STRING, enum: ['Critique', 'Élevée', 'Moyenne', 'Faible'] }
          }
        }
      }
    },
    required: ["context", "securityBaseline", "businessValues", "dreadedEvents"]
  };
  return callAgent(systemInstruction, initialPrompt, schema);
};

const atelier2Agent = async (project: EbiosProject) => {
  const systemInstruction = `Tu es un agent EBIOS RM spécialisé dans l'Atelier 2. En te basant sur le contexte et le socle de sécurité fournis, identifie 3 à 5 sources de risque pertinentes (humaines, techniques, environnementales).`;
  const prompt = `Contexte: "${project.context}". Socle de sécurité: "${project.securityBaseline}".`;
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        type: { type: Type.STRING, enum: ['Humaine', 'Technique', 'Environnementale'] }
      }
    }
  };
  return callAgent(systemInstruction, prompt, schema);
};

const atelier3Agent = async (project: EbiosProject) => {
    const systemInstruction = `Tu es un agent EBIOS RM spécialisé dans l'Atelier 3. Ton rôle est de créer des scénarios stratégiques en croisant des sources de risque avec des événements redoutés. Utilise IMPÉRATIVEMENT les IDs fournis dans les listes ci-dessous pour les champs 'riskSourceId' et 'dreadedEventId'. Ne crée pas de nouveaux IDs.`;
    const prompt = `
Sources de Risque Disponibles:
${JSON.stringify(project.riskSources.map(rs => ({ id: rs.id, name: rs.name, description: rs.description })))}

Événements Redoutés Disponibles:
${JSON.stringify(project.dreadedEvents.map(de => ({ id: de.id, name: de.name, severity: de.severity })))}

Maintenant, crée les scénarios stratégiques en associant une source de risque à un événement redouté.`;
    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          riskSourceId: { type: Type.STRING },
          dreadedEventId: { type: Type.STRING },
          description: { type: Type.STRING },
          likelihood: { type: Type.STRING, enum: ['Élevée', 'Moyenne', 'Faible'] }
        }
      }
    };
    return callAgent(systemInstruction, prompt, schema);
};

const atelier4Agent = async (strategicScenarioId: string, project: EbiosProject) => {
    const ss = project.strategicScenarios.find(s => s.id === strategicScenarioId);
    if (!ss) throw new Error("Scénario stratégique non trouvé");
    const rs = project.riskSources.find(r => r.id === ss.riskSourceId);
    const de = project.dreadedEvents.find(d => d.id === ss.dreadedEventId);
    
    const systemInstruction = `Tu es un agent EBIOS RM spécialisé dans l'Atelier 4. Pour un scénario stratégique donné, décris un scénario opérationnel plausible en 3 à 5 étapes clés.`;
    const prompt = `Scénario stratégique: Une source de risque de type "${rs?.name}" vise à causer l'événement "${de?.name}". Détaille le chemin d'attaque.`;
    const schema = {
      type: Type.OBJECT,
      properties: {
        description: { type: Type.STRING }
      }
    };
    return callAgent(systemInstruction, prompt, schema);
};

const atelier5Agent = async (operationalScenarioId: string, project: EbiosProject) => {
    const os = project.operationalScenarios.find(o => o.id === operationalScenarioId);
    if (!os) throw new Error("Scénario opérationnel non trouvé");
    
    const systemInstruction = `Tu es un agent EBIOS RM spécialisé dans l'Atelier 5. Pour un scénario opérationnel donné, propose 3 mesures de sécurité (préventive, détective, corrective) pour réduire le risque.`;
    const prompt = `Scénario opérationnel: "${os.description}". Propose les mesures.`;
    const schema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ['Préventive', 'Détective', 'Corrective'] },
          description: { type: Type.STRING }
        }
      }
    };
    return callAgent(systemInstruction, prompt, schema);
};


// --- CHATBOT AGENT ---

export const runChatbotAgent = async (userQuery: string, project: EbiosProject): Promise<string> => {
  const systemInstruction = `Tu es un assistant IA pour la méthode EBIOS RM. Réponds aux questions de l'utilisateur en te basant EXCLUSIVEMENT sur le contexte du projet fourni. Ne fournis aucune information non présente dans le contexte. Si la réponse n'est pas dans le contexte, dis "Je ne trouve pas cette information dans le projet actuel."`;
  const projectContext = `CONTEXTE DU PROJET ACTUEL:\n${JSON.stringify(project, null, 2)}`;
  const fullPrompt = `${projectContext}\n\nQUESTION DE L'UTILISATEUR:\n${userQuery}`;
  
  try {
    const client = getAiClient();
    const response = await client.models.generateContent({
        model,
        contents: fullPrompt,
        config: { systemInstruction }
    });
    return response.text;
  } catch (error) {
    console.error("Error in chatbot agent:", error);
    throw new Error(error.message || "Désolé, une erreur technique est survenue lors de la communication avec l'assistant.");
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
    setProject(p => ({ ...p, ...result, businessValues, dreadedEvents }));
  },
  2: async (project, setProject) => {
    const riskSources = await atelier2Agent(project);
    setProject(p => ({ ...p, riskSources: riskSources.map((s: any) => ({ ...s, id: uuidv4() })) }));
  },
  3: async (project, setProject) => {
    const strategicScenarios = await atelier3Agent(project);
    setProject(p => ({ ...p, strategicScenarios: strategicScenarios.map((s: any) => ({...s, id: uuidv4()})) }));
  },
  4: async (project, setProject, payload) => {
    if (!payload) throw new Error("L'ID du scénario stratégique est requis.");
    const opScenario = await atelier4Agent(payload, project);
    const newOpScenario = { ...opScenario, id: uuidv4(), strategicScenarioId: payload };
    setProject(p => ({ ...p, operationalScenarios: [...p.operationalScenarios, newOpScenario] }));
  },
  5: async (project, setProject, payload) => {
    if (!payload) throw new Error("L'ID du scénario opérationnel est requis.");
    const measures = await atelier5Agent(payload, project);
    const newMeasures = measures.map((m: any) => ({ ...m, id: uuidv4(), operationalScenarioId: payload }));
    setProject(p => ({ ...p, securityMeasures: [...p.securityMeasures, ...newMeasures] }));
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