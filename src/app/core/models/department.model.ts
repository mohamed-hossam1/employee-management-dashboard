export interface Department {
  id: string;
  projectId: string;
  name: string;
  description: string;
  managerId: string | null;
  createdAt: string;
  updatedAt: string;
}
