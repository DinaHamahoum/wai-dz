/**
 * Reward Points Configuration
 * Centralized constants for all reward-related point values
 */

// Action-based reward points
export const REWARDS = {
  // Points awarded for submitting actions
  REPORT_POINTS: 1,                         // Points for submitting a report
  COLLECTION_REQUEST_POINTS: 2,             // Points for submitting a collection request
  COLLECTION_CONFIRMED_POINTS: 3,           // Points when collection is confirmed by a company
  COLLECTION_COMPLETED_POINTS: 4,           // Points when collection is actually completed

  // Palier unique de récompense
  THRESHOLD: 100,
};

// Reward display configurations (for UI)
export const REWARD_MILESTONES = [
  { points: REWARDS.THRESHOLD, label_fr: 'Objectif', label_ar: 'الهدف' },
];

// Reward action descriptions for i18n
export const REWARD_DESCRIPTIONS = {
  REPORT: { pts_display: '1', label_fr: "Signalement d'un conteneur plein", label_ar: 'الإبلاغ عن حاوية ممتلئة' },
  COLLECTION_REQUEST: { pts_display: '2', label_fr: 'Demande de collecte postée', label_ar: 'إرسال طلب جمع' },
  COLLECTION_CONFIRMED: { pts_display: '3', label_fr: 'Collecte prise en charge', label_ar: 'تأكيد الجمع' },
  COLLECTION_COMPLETED: { pts_display: '4', label_fr: 'Collecte effectivement réalisée', label_ar: 'إتمام عملية الجمع' },
};

export default REWARDS;