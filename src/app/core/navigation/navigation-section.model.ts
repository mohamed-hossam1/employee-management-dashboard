export interface NavigationSection {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly route: string;
  readonly parentId?: string;
}
