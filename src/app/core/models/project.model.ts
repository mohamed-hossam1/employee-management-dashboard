export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export const PROJECT_COLOR_PALETTE = [
  '#6366f1',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#ef4444',
  '#8b5cf6',
  '#14b8a6'
] as const;

export const PROJECT_ICON_SET = [
  'building',
  'briefcase',
  'rocket',
  'globe',
  'store',
  'factory',
  'warehouse',
  'chart'
] as const;

export const PROJECT_NAME_MIN = 2;
export const PROJECT_NAME_MAX = 50;
export const PROJECT_DESCRIPTION_MAX = 200;
