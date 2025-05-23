import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as jsondiffpatch from 'jsondiffpatch';

interface DiffDelta {
  [key: string]: [any] | [any, any] | [any, any, number];
}

@Component({
  selector: 'app-json-diff-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './json-diff-viewer.component.html',
  styleUrls: ['./json-diff-viewer.component.scss']
})
export class JsonDiffViewerComponent implements OnChanges {
  @Input() oldJson: string = '';
  @Input() newJson: string = '';
  
  differences: { key: string; oldValue: any; newValue: any; status: 'added' | 'removed' | 'modified' }[] = [];

  ngOnChanges() {
    try {
      const oldObj = JSON.parse(this.oldJson);
      const newObj = JSON.parse(this.newJson);
      this.generateDiff(oldObj, newObj);
    } catch (e) {
      console.error('Invalid JSON input:', e);
    }
  }

  private generateDiff(oldObj: any, newObj: any) {
    const delta = jsondiffpatch.diff(oldObj, newObj) as DiffDelta;
    this.differences = [];

    if (delta) {
      Object.keys(delta).forEach(key => {
        const change = delta[key];
        if (Array.isArray(change)) {
          if (change.length === 1) {
            this.differences.push({
              key,
              oldValue: undefined,
              newValue: change[0],
              status: 'added'
            });
          } else if (change.length === 2) {
            this.differences.push({
              key,
              oldValue: change[0],
              newValue: change[1],
              status: 'modified'
            });
          } else if (change.length === 3 && change[2] === 0) {
            this.differences.push({
              key,
              oldValue: change[0],
              newValue: undefined,
              status: 'removed'
            });
          }
        }
      });
    }
  }
}