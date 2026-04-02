import { Component, Input, OnChanges, Output, EventEmitter } from '@angular/core';
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
  @Input() autoExpand: 'all' | 'changed' | 'none' = 'none';
  @Input() hideTypes: string[] = [];
  @Output() translate = new EventEmitter<{key: string, params?: any}>();
  @Input() objectHashFunction: ((obj: any) => any) = function (obj) {
    return obj.id || JSON.stringify(obj);
  };

  _diffResults: DiffResult[] = [];
  showOriginalColumn = true;
  showModifiedColumn = true;
  expandedRows: Set<number> = new Set();

  set diffResults(results: DiffResult[]) {
    this._diffResults = this.filterDiffResults(results, this.hideTypes);
  }

  get diffResults(): DiffResult[] {
    // return this.filterDiffResults(this._diffResults, this.hideTypes);
    return this._diffResults;
  }

  translateText(key: string, defaultValue: string, params?: any): string {
    if (this.translate.observers.length > 0) {
      this.translate.emit({key, params});
      
      return defaultValue;
    }
    // If no translation function, return default text
    return defaultValue;
  }

  // Helper method to translate change types
  translateType(type: string): string {
    return this.translateText(type, type);
  }

  private filterDiffResults(results: DiffResult[], hiddenTypes: string[]): DiffResult[] {
    return results.filter(diff => {
      return !hiddenTypes.includes(diff.type)
    }).map(diff => {
      if (diff.children) {
        diff.children = this.filterDiffResults(diff.children, hiddenTypes);
      }
      return diff;
    });
  }

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
      objectHash: this.objectHashFunction,
      arrays: {
        detectMove: false // treat order changes as modifications
      }
    });
    const delta = diffpatcher.diff(oldObj, newObj);


    const cleanedDelta = delta
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

  /**
   * Processes a single diff key and pushes the result to the results array.
   */
  private processDiffKey(
    key: string,
    delta: any,
    oldObj: any,
    newObj: any,
    path: string,
    results: DiffResult[]
  ) {
    const currentPath = path ? `${path}.${key}` : key;
    const change = delta[key] ?? delta["_" + key];
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
      results.push({
        path: currentPath,
        oldValue: oldValue,
        newValue: newValue,
        type: this.getChangeType(oldValue, newValue)
      });
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
  }

  private getChangeType(oldValue: any, newValue: any): 'added' | 'removed' | 'modified' | 'unchanged' {
    if (oldValue === undefined && newValue !== undefined) {
      return 'added';
    } else if (oldValue !== undefined && newValue === undefined) {
      return 'removed';
    } else if (oldValue !== newValue) {
      return 'modified';
    } else {
      return 'unchanged';
    }
  }

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
      this.processDiffKey(key, delta, oldObj, newObj, path, results);
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
      } else if (this.autoExpand === 'changed') {
        this.diffResults.forEach((diff, i) => {
          if (this.isExpandable(diff) && diff.type !== 'unchanged') {
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
