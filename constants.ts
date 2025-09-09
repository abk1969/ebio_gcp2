
import { Severity } from './types';

export const STEPS = [
  { id: 1, title: 'Atelier 1 : Cadrage et Socle de Sécurité', description: 'Définir le périmètre, les enjeux, les événements redoutés et le niveau de sécurité existant.' },
  { id: 2, title: 'Atelier 2 : Sources de Risque', description: 'Identifier les types de menaces (humaines, techniques, environnementales) pertinentes pour le contexte.' },
  { id: 3, title: 'Atelier 3 : Scénarios Stratégiques', description: 'Croiser les sources de risque avec les événements redoutés pour construire des scénarios d\'impact globaux.' },
  { id: 4, title: 'Atelier 4 : Scénarios Opérationnels', description: 'Détailler les chemins d\'attaque plausibles pour les scénarios stratégiques prioritaires.' },
  { id: 5, title: 'Atelier 5 : Traitement et Synthèse', description: 'Proposer des mesures de sécurité et fournir une vue d\'ensemble de l\'analyse de risque.' },
];

export const SEVERITY_LEVELS: { [key in Severity]: { label: string; color: string; bgColor: string } } = {
  [Severity.CRITICAL]: { label: 'Critique', color: 'text-red-800', bgColor: 'bg-red-100' },
  [Severity.HIGH]: { label: 'Élevée', color: 'text-orange-800', bgColor: 'bg-orange-100' },
  [Severity.MEDIUM]: { label: 'Moyenne', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
  [Severity.LOW]: { label: 'Faible', color: 'text-green-800', bgColor: 'bg-green-100' },
};
