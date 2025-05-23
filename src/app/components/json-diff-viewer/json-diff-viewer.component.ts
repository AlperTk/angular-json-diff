import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as jsondiffpatch from 'jsondiffpatch';
import { HighlightModule } from 'ngx-highlightjs';

interface DiffDelta {
  [key: string]: any;
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

  private markChangedLines(delta: DiffDelta, parentKey: string = '') {
    if (!delta) return;

    Object.entries(delta).forEach(([key, change]) => {
      const fullKey = parentKey ? `${parentKey}.${key}` : key;
      
      if (Array.isArray(change)) {
        this.handleArrayChange(fullKey, change);
      } else if (typeof change === 'object') {
        // Recursive call for nested objects
        this.markChangedLines(change, fullKey);
      }
    });
  }

  private handleArrayChange(key: string, change: any[]) {
    const oldLineIndex = this.findLineWithKey(this.oldJsonLines, key);
    const newLineIndex = this.findLineWithKey(this.newJsonLines, key);

    if (change.length === 1) { // Added
      if (newLineIndex >= 0) {
        this.markLine(this.newJsonLines, newLineIndex, 'added');
      }
    } else if (change.length === 2) { // Modified
      if (oldLineIndex >= 0) {
        this.markLine(this.oldJsonLines, oldLineIndex, 'modified');
      }
      if (newLineIndex >= 0) {
        this.markLine(this.newJsonLines, newLineIndex, 'modified');
      }
    } else if (change.length === 3 && change[2] === 0) { // Removed
      if (oldLineIndex >= 0) {
        this.markLine(this.oldJsonLines, oldLineIndex, 'removed');
      }
    }
  }

  private markLine(lines: { content: string; changed?: boolean; type?: string }[], index: number, type: string) {
    lines[index].changed = true;
    lines[index].type = type;
  }

  private findLineWithKey(lines: { content: string }[], key: string): number {
    const parts = key.split('.');
    let currentPart = parts[parts.length - 1];
    return lines.findIndex(line => {
      const trimmed = line.content.trim();
      return trimmed.includes(`"${currentPart}":`);
    });
  }
}