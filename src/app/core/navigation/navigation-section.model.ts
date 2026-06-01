export interface NavigationSection {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly route: string;
  readonly parentId?: string;
  /** When true, the item is shown but not navigable (e.g. no workspace selected). */
  readonly disabled?: boolean;
}
