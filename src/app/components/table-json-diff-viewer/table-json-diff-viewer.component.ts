import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as jsondiffpatch from 'jsondiffpatch';

interface DiffResult {
  path: string;
  oldValue: any;
  newValue: any;
  type: 'added' | 'removed' | 'modified' | 'unchanged';
}

@Component({
  selector: 'app-table-json-diff-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table-json-diff-viewer.component.html',
  styleUrls: ['./table-json-diff-viewer.component.scss']
})
export class TableJsonDiffViewerComponent implements OnChanges {
  @Input() oldJson: string = '';
  @Input() newJson: string = '';

  diffResults: DiffResult[] = [];

  ngOnChanges() {
    try {
      const oldObj = JSON.parse(this.oldJson);
      const newObj = JSON.parse(this.newJson);
      this.generateDiffResults(oldObj, newObj);
    } catch (e) {
      console.error('Invalid JSON input:', e);
    }
  }

  private generateDiffResults(oldObj: any, newObj: any) {
    const delta = jsondiffpatch.diff(oldObj, newObj);
    const results = this.flattenDiff(delta, oldObj, newObj);
    
    // Add unchanged values
    this.addUnchangedValues(oldObj, newObj, results);
    
    // Sort results by path
    this.diffResults = results.sort((a, b) => a.path.localeCompare(b.path));
  }

  private addUnchangedValues(oldObj: any, newObj: any, results: DiffResult[], parentPath: string = '') {
    if (!oldObj || !newObj) return;

    Object.keys(oldObj).forEach(key => {
      const currentPath = parentPath ? `${parentPath}.${key}` : key;
      
      // Skip if this path is already in results
      if (!results.some(r => r.path === currentPath)) {
        const oldValue = oldObj[key];
        const newValue = newObj[key];

        if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
          results.push({
            path: currentPath,
            oldValue: oldValue,
            newValue: newValue,
            type: 'unchanged'
          });
        }

        // Recursively check nested objects
        if (oldValue && newValue && typeof oldValue === 'object' && typeof newValue === 'object') {
          this.addUnchangedValues(oldValue, newValue, results, currentPath);
        }
      }
    });
  }

  private flattenDiff(delta: any, oldObj: any, newObj: any, path: string = ''): DiffResult[] {
    if (!delta) return [];

    const results: DiffResult[] = [];

    Object.keys(delta).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      const change = delta[key];

      if (Array.isArray(change)) {
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
        results.push(...this.flattenDiff(
          change,
          oldObj ? this.getValueByPath(oldObj, currentPath) : undefined,
          newObj ? this.getValueByPath(newObj, currentPath) : undefined,
          currentPath
        ));
      }
    });

    return results;
  }

  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current ? current[key] : undefined;
    }, obj);
  }
}
