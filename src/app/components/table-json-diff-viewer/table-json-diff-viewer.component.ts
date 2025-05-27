import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as jsondiffpatch from 'jsondiffpatch';

interface DiffResult {
  path: string;
  oldValue: any;
  newValue: any;
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  children?: DiffResult[]; // Add children for nested diffs
}

@Component({
  selector: 'app-table-json-diff-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table-json-diff-viewer.component.html',
  styleUrls: ['./table-json-diff-viewer.component.scss']
})
export class TableJsonDiffViewerComponent {
  @Input() oldJson: string | null = '';
  @Input() newJson: string | null = '';
  /**
   * Controls which rows to auto-expand:
   *   'all'     - expand all expandable rows
   *   'modified'- expand only modified expandable rows
   *   'none'    - expand none (default)
   */
  @Input() autoExpand: 'all' | 'modified' | 'none' = 'none';

  diffResults: DiffResult[] = [];
  showOriginalColumn = true;
  showModifiedColumn = true;
  expandedRows: Set<number> = new Set();

  private generateDiffResults(oldObj: any, newObj: any) {
    // Handle complete object creation
    if (!oldObj && newObj) {
      this.showOriginalColumn = false;
      this.showModifiedColumn = true;
      this.diffResults = Object.entries(newObj).map(([key, value]) => ({
        path: key,
        oldValue: undefined,
        newValue: value,
        type: 'added' as const
      })).sort((a, b) => a.path.localeCompare(b.path));
      return;
    }

    // Handle complete object deletion
    if (oldObj && !newObj) {
      this.showOriginalColumn = true;
      this.showModifiedColumn = false;
      this.diffResults = Object.entries(oldObj).map(([key, value]) => ({
        path: key,
        oldValue: value,
        newValue: undefined,
        type: 'removed' as const
      })).sort((a, b) => a.path.localeCompare(b.path));
      return;
    }

    // Both objects exist - show both columns
    this.showOriginalColumn = true;
    this.showModifiedColumn = true;

    const diffpatcher = jsondiffpatch.create({
      arrays: {
        detectMove: false // treat order changes as modifications
      }
    });
    const delta = diffpatcher.diff(oldObj, newObj);
   

    const cleanedDelta = this.replaceUnderscoreKeys(delta);

    this.diffResults = this.buildDiffTree(cleanedDelta, oldObj, newObj);
  }

   replaceUnderscoreKeys = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(this.replaceUnderscoreKeys);
      } else if (obj && typeof obj === 'object') {
        return Object.entries(obj).reduce((acc, [key, value]) => {
          const newKey = key.replace(/_/g, '');
          acc[newKey] = this.replaceUnderscoreKeys(value);
          return acc;
        }, {} as any);
      }
      return obj;
    };

  // Recursively build a nested diff tree, including unchanged, added, and removed fields
  private buildDiffTree(delta: any, oldObj: any, newObj: any, path: string = ''): DiffResult[] {
    // If both are objects, collect all keys
    const allKeys = new Set<string>();
    if (oldObj && typeof oldObj === 'object') {
      Object.keys(oldObj).forEach(k => allKeys.add(k));
    }
    if (newObj && typeof newObj === 'object') {
      Object.keys(newObj).forEach(k => allKeys.add(k));
    }
    // If delta is null, everything is unchanged
    if (!delta) {
      return Array.from(allKeys).map(key => {
        const currentPath = path ? `${path}.${key}` : key;
        return {
          path: currentPath,
          oldValue: oldObj ? oldObj[key] : undefined,
          newValue: newObj ? newObj[key] : undefined,
          type: 'unchanged'
        };
      });
    }
    const results: DiffResult[] = [];
    allKeys.forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      const change = delta[key];
      const oldValue = oldObj ? oldObj[key] : undefined;
      const newValue = newObj ? newObj[key] : undefined;
      if (change === undefined) {
        // Unchanged
        results.push({
          path: currentPath,
          oldValue,
          newValue,
          type: 'unchanged'
        });
      } else if (Array.isArray(change)) {
        if (change.length === 1) {
          results.push({
            path: currentPath,
            oldValue: undefined,
            newValue: change[0],
            type: 'added'
          });
        } else if (change.length === 2) {
          results.push({
            path: currentPath,
            oldValue: change[0],
            newValue: change[1],
            type: 'modified'
          });
        } else if (change.length === 3 && change[2] === 0) {
          results.push({
            path: currentPath,
            oldValue: change[0],
            newValue: undefined,
            type: 'removed'
          });
        }
      } else if (typeof change === 'object') {
        // Recursively build children
        results.push({
          path: currentPath,
          oldValue,
          newValue,
          type: 'modified',
          children: this.buildDiffTree(
            change,
            oldValue,
            newValue,
            currentPath
          )
        });
      }
    });
    return results;
  }

  ngOnChanges() {
    try {
      let oldObj = null;
      let newObj = null;

      try {
        oldObj = this.oldJson ? JSON.parse(this.oldJson) : null;
      } catch (e) {
        console.warn('Invalid old JSON:', e);
      }

      try {
        newObj = this.newJson ? JSON.parse(this.newJson) : null;
      } catch (e) {
        console.warn('Invalid new JSON:', e);
      }

      this.generateDiffResults(oldObj, newObj);
      // Auto-expand logic based on flag
      this.expandedRows.clear();
      if (this.autoExpand === 'all') {
        this.diffResults.forEach((diff, i) => {
          if (this.isExpandable(diff)) {
            this.expandedRows.add(i);
          }
        });
      } else if (this.autoExpand === 'modified') {
        this.diffResults.forEach((diff, i) => {
          if (this.isExpandable(diff) && diff.type === 'modified') {
            this.expandedRows.add(i);
          }
        });
      }
      // 'none' does nothing (all collapsed)
    } catch (e) {
      console.error('Error generating diff:', e);
      this.diffResults = [];
    }
  }

  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current ? current[key] : undefined;
    }, obj);
  }

  isExpandable(diff: DiffResult): boolean {
    return this.isExpandableValue(diff.oldValue) || this.isExpandableValue(diff.newValue);
  }

  isExpandableValue(val: any): boolean {
    return val && typeof val === 'object' && (Array.isArray(val) ? val.length > 0 : Object.keys(val).length > 0);
  }

  toggleExpand(index: number) {
    if (this.expandedRows.has(index)) {
      this.expandedRows.delete(index);
    } else {
      this.expandedRows.add(index);
    }
  }

  isExpanded(index: number): boolean {
    return this.expandedRows.has(index);
  }

  getSubJson(val: any): string | null {
    if (!this.isExpandableValue(val)) return null;
    try {
      return JSON.stringify(val);
    } catch {
      return null;
    }
  }
}
