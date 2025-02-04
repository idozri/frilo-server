/** @format */

export enum AchievementType {
  MARKERS_CREATED = 'markers_created',
  MARKERS_COMPLETED = 'markers_completed',
  MESSAGES_SENT = 'messages_sent',
  REACTIONS_RECEIVED = 'reactions_received',
  HELP_PROVIDED = 'help_provided',
}

export interface AchievementSummaryItem {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  latestBadges?: Array<{ icon: string; color: string; name: string }>;
  progress?: number;
  description?: string;
}
