export type ChangeType = 'added' | 'removed' | 'modified' | 'unchanged';

export interface DiffResult {
  path: string;
  oldValue: any;
  newValue: any;
  type: ChangeType;
  children?: DiffResult[];
}