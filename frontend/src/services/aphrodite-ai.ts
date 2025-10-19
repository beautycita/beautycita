// Minimal stub - AI disabled
export const useAphroditeAI = () => ({
  getRecommendations: () => [],
  trackInteraction: () => {},
  getMonitoringData: () => null,
  submitFeedback: () => {}
});

export interface AIRecommendation {}
export interface UserPreferences {}
export interface AIMonitoringData {}
export interface AIInsight {}

// Debug marker
console.log('AI STUB ACTIVE - NO CRASHES');