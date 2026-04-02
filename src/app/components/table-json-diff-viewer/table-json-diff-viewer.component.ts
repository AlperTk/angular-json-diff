import { Component, Input, OnChanges, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JsonDiffService } from '../../services/json-diff.service';
import { DiffTreeBuilderService } from '../../services/diff-tree-builder.service';
import { DiffResult } from '../../services/types';

@Component({
  selector: 'app-table-json-diff-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table-json-diff-viewer.component.html',
  styleUrls: ['./table-json-diff-viewer.component.scss']
})
export class TableJsonDiffViewerComponent implements OnChanges {
  private jsonDiffService = inject(JsonDiffService);
  private diffTreeBuilderService = inject(DiffTreeBuilderService);

  @Input() oldJson: string | null = '';
  @Input() newJson: string | null = '';
  @Input() autoExpand: 'all' | 'changed' | 'none' = 'none';
  @Input() hideTypes: string[] = [];
  @Output() translate = new EventEmitter<{key: string, params?: any}>();
  @Input() objectHashFunction: ((obj: any) => any) = function (obj) {
    return obj && typeof obj === 'object' ? obj.id || JSON.stringify(obj) : obj;
  };

  _diffResults: DiffResult[] = [];
  showOriginalColumn = true;
  showModifiedColumn = true;
  expandedRows: Set<number> = new Set();

  set diffResults(results: DiffResult[]) {
    this._diffResults = this.filterDiffResults(results, this.hideTypes);
  }

  get diffResults(): DiffResult[] {
    return this._diffResults;
  }

  translateText(key: string, defaultValue: string, params?: any): string {
    if (this.translate.observers.length > 0) {
      this.translate.emit({key, params});
      return defaultValue;
    }
    return defaultValue;
  }

  // Helper method to translate change types
  translateType(type: string): string {
    return this.translateText(type, type);
  }

  private filterDiffResults(results: DiffResult[], hiddenTypes: string[]): DiffResult[] {
    return results.filter(diff => !hiddenTypes.includes(diff.type))
      .map(diff => {
        if (diff.children) {
          diff.children = this.filterDiffResults(diff.children, hiddenTypes);
        }
        return diff;
      });
  }

  private setColumnVisibility(oldObj: any, newObj: any): void {
    if (!oldObj && newObj) {
      this.showOriginalColumn = false;
      this.showModifiedColumn = true;
    } else if (oldObj && !newObj) {
      this.showOriginalColumn = true;
      this.showModifiedColumn = false;
    } else {
      this.showOriginalColumn = true;
      this.showModifiedColumn = true;
    }
  }

  private generateDiffResults(oldObj: any, newObj: any): void {
    this.setColumnVisibility(oldObj, newObj);
    const delta = this.jsonDiffService.computeDiff(oldObj, newObj, this.objectHashFunction);
    this.diffResults = this.diffTreeBuilderService.buildDiffResults(delta, oldObj, newObj, this.objectHashFunction);
  }

  ngOnChanges(): void {
    const oldResult = this.jsonDiffService.parseJson(this.oldJson);
    const newResult = this.jsonDiffService.parseJson(this.newJson);

    if (oldResult.error || newResult.error) {
      // keep behavior similar to previous implementation: warn already emitted by service
      this.diffResults = [];
      return;
    }

    this.generateDiffResults(oldResult.value, newResult.value);

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
  }

  isExpandable(diff?: DiffResult): boolean {
    if (!diff) {
      return false;
    }
    return this.isExpandableValue(diff.oldValue) || this.isExpandableValue(diff.newValue);
  }

  isExpandableValue(val: any): boolean {
    return val && typeof val === 'object' && (Array.isArray(val) ? val.length > 0 : Object.keys(val).length > 0);
  }

  toggleExpand(index: number): void {
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
