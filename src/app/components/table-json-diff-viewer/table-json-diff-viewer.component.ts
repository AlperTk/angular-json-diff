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
export class TableJsonDiffViewerComponent {
  @Input() oldJson: string | null = '';
  @Input() newJson: string | null = '';

  diffResults: DiffResult[] = [];
  showOriginalColumn = true;
  showModifiedColumn = true;

  private generateDiffResults(oldObj: any, newObj: any) {
    const results: DiffResult[] = [];

    // Handle complete object creation
    if (!oldObj && newObj) {
      this.showOriginalColumn = false;
      this.showModifiedColumn = true;
      Object.entries(newObj).forEach(([key, value]) => {
        results.push({
          path: key,
          oldValue: undefined,
          newValue: value,
          type: 'added'
        });
      });
      this.diffResults = results.sort((a, b) => a.path.localeCompare(b.path));
      return;
    }
    
    // Handle complete object deletion
    if (oldObj && !newObj) {
      this.showOriginalColumn = true;
      this.showModifiedColumn = false;
      Object.entries(oldObj).forEach(([key, value]) => {
        results.push({
          path: key,
          oldValue: value,
          newValue: undefined,
          type: 'removed'
        });
      });
      this.diffResults = results.sort((a, b) => a.path.localeCompare(b.path));
      return;
    }

    // Both objects exist - show both columns
    this.showOriginalColumn = true;
    this.showModifiedColumn = true;
    const delta = jsondiffpatch.diff(oldObj, newObj);
    const diffResults = this.flattenDiff(delta, oldObj, newObj);
    
    // Add unchanged values
    this.addUnchangedValues(oldObj, newObj, results);
    
    // Add the diff results to our results array
    results.push(...diffResults);
    
    // Sort results by path
    this.diffResults = results.sort((a, b) => a.path.localeCompare(b.path));
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
    } catch (e) {
      console.error('Error generating diff:', e);
      this.diffResults = [];
    }
  }

  private addUnchangedValues(oldObj: any, newObj: any, results: DiffResult[], parentPath: string = '') {
    if (!oldObj || !newObj) return;

    // Check if the entire object at this level is unchanged
    if (this.isObjectUnchanged(oldObj, newObj)) {
      // If this is not the root level, add as single unchanged entry
      if (parentPath) {
        results.push({
          path: parentPath,
          oldValue: oldObj,
          newValue: newObj,
          type: 'unchanged'
        });
        return; // Don't process children since we're showing the whole object
      }
    }

    Object.keys(oldObj).forEach(key => {
      const currentPath = parentPath ? `${parentPath}.${key}` : key;
      
      // Skip if this path is already in results
      if (!results.some(r => r.path === currentPath)) {
        const oldValue = oldObj[key];
        const newValue = newObj[key];

        if (typeof oldValue === 'object' && typeof newValue === 'object' && oldValue && newValue) {
          // For objects, check if they're identical
          if (this.isObjectUnchanged(oldValue, newValue)) {
            results.push({
              path: currentPath,
              oldValue: oldValue,
              newValue: newValue,
              type: 'unchanged'
            });
          } else {
            // If objects are different, recurse into them
            this.addUnchangedValues(oldValue, newValue, results, currentPath);
          }
        } else if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
          // For primitive values
          results.push({
            path: currentPath,
            oldValue: oldValue,
            newValue: newValue,
            type: 'unchanged'
          });
        }
      }
    });
  }

  // Add this new helper method
  private isObjectUnchanged(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;
    if (!obj1 || !obj2) return false;
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    return JSON.stringify(this.sortObject(obj1)) === JSON.stringify(this.sortObject(obj2));
  }

  // Add this helper method to ensure consistent object comparison
  private sortObject(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(this.sortObject.bind(this)).sort();
    }
    
    return Object.keys(obj)
      .sort()
      .reduce((result: any, key: string) => {
        result[key] = this.sortObject(obj[key]);
        return result;
      }, {});
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
