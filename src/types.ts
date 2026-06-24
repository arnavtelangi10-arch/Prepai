export interface Project {
  title: string;
  technologies: string[];
  description: string;
}

export interface ResumeProfile {
  name: string;
  skills: string[];
  experienceSummary: string;
  projects: Project[];
  strengths: string[];
  suggestedFocusAreas: string[];
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  resumeCvUrl?: string;
  featuredProjectUrl?: string;
  twitterUrl?: string;
  otherWebsiteUrl?: string;
  projectSummaries?: string;
}

export type QuestionType = "technical" | "behavioral" | "coding" | "system-design";

export interface InterviewQuestion {
  id: string;
  question: string;
  type: QuestionType;
  codeStub?: string;
  sampleSolution?: string;
  hints: string[];
}

export interface FillerMatches {
  word: string;
  count: number;
}

export interface StarRating {
  details: string;
  situationRating: string;
  taskRating: string;
  actionRating: string;
  resultRating: string;
  situationFeedback?: string; // Critique focusing on clarity of the Situation
  taskFeedback?: string;      // Critique focusing on specificity of the Task
  actionFeedback?: string;    // Critique focusing on effectiveness of the Action taken
  resultFeedback?: string;    // Critique focusing on measurable impact of the Result
  leadershipSuggestions?: string; // Suggestions on how to better highlight leadership qualities
  teamworkSuggestions?: string;   // Suggestions on how to better highlight teamwork qualities
}

export interface AnswerEvaluation {
  score: number;
  overallFeedback: string;
  technicalAccuracyScore: number;
  communicationClarityScore: number;
  starBehavioralAnalysis?: StarRating;
  detectedFillerWords?: FillerMatches[];
  fillerWordsCritique?: string;
  pacingAnalysis?: string;
  improvedAnswerAlternative: string;
}

export interface CodingEvaluation {
  correctnessScore: number;
  efficiencyScore: number;
  timeComplexity: string;
  spaceComplexity: string;
  criticalEdgeCases: string[];
  refactoringSuggestions: string[];
  optimizedSolutionCode: string;
  score: number;
}

export interface DesignEvaluation {
  feasibilityScore: number;
  scalabilityScore: number;
  availabilityCritique: string;
  bottlenecks: string[];
  databaseRecommendation: string;
  cachingStrategy: string;
  faultToleranceFeedback: string;
  score: number;
}

export interface CoachResource {
  title: string;
  url: string;
  description: string;
}

export interface CoachMessage {
  id: string;
  sender: "user" | "coach";
  text: string;
  timestamp: string;
  suggestedRoadmap?: string[];
  resources?: CoachResource[];
}

export interface HistoricalSession {
  id: string;
  timestamp: string;
  domain: string;
  company: string;
  difficulty: string;
  type: QuestionType;
  score: number;
  durationSeconds: number;
  questionsCount: number;
}
