import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as jsondiffpatch from 'jsondiffpatch';
import { HighlightModule, HIGHLIGHT_OPTIONS } from 'ngx-highlightjs';

interface DiffDelta {
  [key: string]: [any] | [any, any] | [any, any, number];
}

interface LineChange {
  lineNumber: number;
  content: string;
  type: 'added' | 'removed' | 'modified';
}

@Component({
  selector: 'app-json-diff-viewer',
  standalone: true,
  imports: [CommonModule, HighlightModule],
  templateUrl: './json-diff-viewer.component.html',
  styleUrls: ['./json-diff-viewer.component.scss']
})
export class JsonDiffViewerComponent implements OnChanges {
  @Input() oldJson: string = '';
  @Input() newJson: string = '';
  
  oldJsonLines: { content: string; changed?: boolean; type?: string }[] = [];
  newJsonLines: { content: string; changed?: boolean; type?: string }[] = [];

  ngOnChanges() {
    try {
      const oldObj = JSON.parse(this.oldJson);
      const newObj = JSON.parse(this.newJson);
      
      const oldFormatted = JSON.stringify(oldObj, null, 2);
      const newFormatted = JSON.stringify(newObj, null, 2);
      
      this.oldJsonLines = oldFormatted.split('\n').map(line => ({ content: line }));
      this.newJsonLines = newFormatted.split('\n').map(line => ({ content: line }));
      
      const delta = jsondiffpatch.diff(oldObj, newObj) as DiffDelta;
      this.markChangedLines(delta);
    } catch (e) {
      console.error('Invalid JSON input:', e);
    }
  }

  private markChangedLines(delta: DiffDelta) {
    if (!delta) return;

    Object.keys(delta).forEach(key => {
      const change = delta[key];
      if (Array.isArray(change)) {
        const oldLineIndex = this.findLineIndex(this.oldJsonLines, key);
        const newLineIndex = this.findLineIndex(this.newJsonLines, key);

        if (change.length === 1) { // Added
          if (newLineIndex >= 0) {
            this.newJsonLines[newLineIndex].changed = true;
            this.newJsonLines[newLineIndex].type = 'added';
          }
        } else if (change.length === 2) { // Modified
          if (oldLineIndex >= 0) {
            this.oldJsonLines[oldLineIndex].changed = true;
            this.oldJsonLines[oldLineIndex].type = 'modified';
          }
          if (newLineIndex >= 0) {
            this.newJsonLines[newLineIndex].changed = true;
            this.newJsonLines[newLineIndex].type = 'modified';
          }
        } else if (change.length === 3 && change[2] === 0) { // Removed
          if (oldLineIndex >= 0) {
            this.oldJsonLines[oldLineIndex].changed = true;
            this.oldJsonLines[oldLineIndex].type = 'removed';
          }
        }
      }
    });
  }

  private findLineIndex(lines: { content: string }[], key: string): number {
    return lines.findIndex(line => line.content.includes(`"${key}"`));
  }
}