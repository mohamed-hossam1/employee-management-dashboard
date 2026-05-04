import { Injectable } from '@angular/core';
import { InMemoryDbService } from 'angular-in-memory-web-api';

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
      },
      {
        id: 'p2',
        userId: 'u1',
        name: 'Northwind',
        description: 'Secondary demo workspace',
        color: '#0ea5e9',
        icon: 'briefcase',
        createdAt: now,
        updatedAt: now
      }
    ];

    const departments: Department[] = [
      {
        id: 'd1',
        projectId: 'p1',
        name: 'Engineering',
        description: 'Product engineering',
        managerId: null,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'd2',
        projectId: 'p1',
        name: 'Design',
        description: 'Product design',
        managerId: null,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'd3',
        projectId: 'p1',
        name: 'Human Resources',
        description: 'People operations',
        managerId: null,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'd4',
        projectId: 'p1',
        name: 'Sales',
        description: 'Revenue team',
        managerId: null,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'd5',
        projectId: 'p1',
        name: 'Finance',
        description: 'Accounting and finance',
        managerId: null,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'd6',
        projectId: 'p2',
        name: 'Operations',
        description: 'Northwind operations',
        managerId: null,
        createdAt: now,
        updatedAt: now
      }
    ];

    const firstNames = [
      'Emma',
      'Liam',
      'Sophia',
      'Michael',
      'Olivia',
      'Noah',
      'Ava',
      'Ethan',
      'Isabella',
      'Lucas',
      'Mia',
      'Mason',
      'Amelia',
      'Logan',
      'Harper',
      'James',
      'Evelyn',
      'Benjamin',
      'Abigail',
      'Henry',
      'Charlotte',
      'Alexander',
      'Emily',
      'Daniel'
    ];
    const lastNames = [
      'Stone',
      'Johnson',
      'Turner',
      'Brown',
      'Davis',
      'Wilson',
      'Martinez',
      'Anderson',
      'Thomas',
      'Taylor',
      'Moore',
      'Jackson',
      'Lee',
      'Walker',
      'Hall',
      'Allen',
      'Young',
      'King',
      'Wright',
      'Scott',
      'Green',
      'Baker',
      'Adams',
      'Nelson'
    ];
    const statuses: Employee['status'][] = ['active', 'active', 'active', 'on-leave', 'inactive'];
    const positions = [
      'Software Engineer',
      'Product Designer',
      'Engineering Manager',
      'Business Analyst',
      'Recruiter',
      'Account Executive',
      'Financial Analyst',
      'HR Specialist'
    ];
    const departmentIds = ['d1', 'd2', 'd3', 'd4', 'd5'];
    const hireYears = [2020, 2021, 2022, 2023, 2024, 2025];

    const employees: Employee[] = firstNames.map((firstName, i) => ({
      id: `e${i + 1}`,
      projectId: 'p1',
      firstName,
      lastName: lastNames[i],
      email: `${firstName.toLowerCase()}.${lastNames[i].toLowerCase()}@acme.com`,
      phone: `+1 555 01${String(i).padStart(2, '0')} ${String(1000 + i)}`,
      departmentId: departmentIds[i % departmentIds.length],
      position: positions[i % positions.length],
      salary: 52000 + i * 1500,
      hireDate: `${hireYears[i % hireYears.length]}-${String((i % 12) + 1).padStart(2, '0')}-15`,
      status: statuses[i % statuses.length],
      avatar: null,
      createdAt: now,
      updatedAt: now
    }));

    // A few employees on the secondary project for project-switch validation
    employees.push(
      {
        id: 'e100',
        projectId: 'p2',
        firstName: 'Nina',
        lastName: 'Patel',
        email: 'nina.patel@northwind.com',
        phone: '+1 555 0200 1001',
        departmentId: 'd6',
        position: 'Operations Lead',
        salary: 78000,
        hireDate: '2023-06-01',
        status: 'active',
        avatar: null,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'e101',
        projectId: 'p2',
        firstName: 'Owen',
        lastName: 'Brooks',
        email: 'owen.brooks@northwind.com',
        phone: '+1 555 0200 1002',
        departmentId: 'd6',
        position: 'Coordinator',
        salary: 54000,
        hireDate: '2024-03-12',
        status: 'on-leave',
        avatar: null,
        createdAt: now,
        updatedAt: now
      }
    );

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
