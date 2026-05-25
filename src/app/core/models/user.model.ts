export interface UserSettings {
  theme: 'light' | 'dark';
  notifications: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  inApp: boolean;
  attendanceAlerts: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  phone: string;
  bio: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLogin: string;
  settings: UserSettings;
}
