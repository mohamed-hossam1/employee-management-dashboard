import { NavigationSection } from './navigation-section.model';

export const NAVIGATION_SECTIONS: NavigationSection[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', route: '/p/:projectId/dashboard' },
  { id: 'employees', label: 'Employees', icon: 'users', route: '/p/:projectId/employees' },
  { id: 'departments', label: 'Departments', icon: 'building-2', route: '/p/:projectId/departments' },
  { id: 'attendance', label: 'Attendance', icon: 'clock', route: '/p/:projectId/attendance' },
  { id: 'profile', label: 'Profile', icon: 'user', route: '/profile' },
  { id: 'settings', label: 'Settings', icon: 'settings', route: '/settings' }
];
