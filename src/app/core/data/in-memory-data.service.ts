import { Injectable } from '@angular/core';
import { InMemoryDbService, RequestInfo } from 'angular-in-memory-web-api';

import { User } from '../models/user.model';
import { Project } from '../models/project.model';
import { Employee } from '../models/employee.model';
import { Department } from '../models/department.model';
import { AttendanceRecord } from '../models/attendance.model';
import { ActivityItem } from '../models/activity.model';

@Injectable()
export class InMemoryDataService implements InMemoryDbService {
  createDb(): {
    users: User[];
    projects: Project[];
    employees: Employee[];
    departments: Department[];
    attendance: AttendanceRecord[];
    activity: ActivityItem[];
  } {
    const now = new Date().toISOString();

    const users: User[] = [
      {
        id: 'u1',
        name: 'Mohamed Admin',
        email: 'admin@demo.com',
        password: 'password123',
        avatar: null,
        phone: '+1 555 000 1000',
        bio: 'System administrator',
        role: 'admin',
        createdAt: now,
        lastLogin: now,
        settings: {
          theme: 'light',
          notifications: { email: true, inApp: true, attendanceAlerts: true }
        }
      }
    ];

    const projects: Project[] = [
      {
        id: 'p1',
        userId: 'u1',
        name: 'Acme Corp',
        description: 'Main project workspace',
        color: '#6366f1',
        icon: 'building',
        createdAt: now,
        updatedAt: now
      }
    ];

    const firstNames = [
      'Emma', 'Liam', 'Sophia', 'Michael', 'Olivia', 'Noah', 'Ava', 'Ethan',
      'Isabella', 'Lucas', 'Mia', 'Mason', 'Amelia', 'Logan', 'Harper',
      'James', 'Evelyn', 'Benjamin', 'Abigail', 'Henry'
    ];
    const lastNames = [
      'Stone', 'Johnson', 'Turner', 'Brown', 'Davis', 'Wilson', 'Martinez',
      'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Lee', 'Walker',
      'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott'
    ];
    const statuses: Employee['status'][] = ['active', 'active', 'active', 'on-leave', 'inactive'];
    const positions = ['Engineer', 'Designer', 'Manager', 'Analyst', 'Recruiter'];

    const employees: Employee[] = firstNames.map((firstName, i) => ({
      id: `e${i + 1}`,
      projectId: 'p1',
      firstName,
      lastName: lastNames[i],
      email: `${firstName.toLowerCase()}.${lastNames[i].toLowerCase()}@acme.com`,
      phone: `+1 555 01${String(i).padStart(2, '0')}`,
      departmentId: '',
      position: positions[i % positions.length],
      salary: 50000 + i * 1000,
      hireDate: '2024-01-15',
      status: statuses[i % statuses.length],
      avatar: null,
      createdAt: now,
      updatedAt: now
    }));

    const departments: Department[] = [];
    const attendance: AttendanceRecord[] = [];
    const activity: ActivityItem[] = [];

    return { users, projects, employees, departments, attendance, activity };
  }

  genId<T extends { id: string }>(collection: T[], collectionName: string): string {
    const prefix = collectionName.charAt(0).toLowerCase();
    const maxId = collection.reduce((max, item) => {
      const num = Number(item.id.replace(/\D/g, ''));
      return Number.isNaN(num) ? max : Math.max(max, num);
    }, 0);
    return `${prefix}${maxId + 1}`;
  }
}
