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
    if (change.length === 1) { // Added
      this.markObjectLines(this.newJsonLines, key, change[0], 'added');
    } else if (change.length === 2) { // Modified
      const oldLineIndex = this.findLineWithKey(this.oldJsonLines, key);
      const newLineIndex = this.findLineWithKey(this.newJsonLines, key);
      
      if (oldLineIndex >= 0) {
        this.markLine(this.oldJsonLines, oldLineIndex, 'modified');
      }
      if (newLineIndex >= 0) {
        this.markLine(this.newJsonLines, newLineIndex, 'modified');
      }
    } else if (change.length === 3 && change[2] === 0) { // Removed
      this.markObjectLines(this.oldJsonLines, key, change[0], 'removed');
    }
  }

  private markObjectLines(lines: { content: string; changed?: boolean; type?: string }[], key: string, value: any, type: string) {
    const startIndex = this.findLineWithKey(lines, key);
    if (startIndex < 0) return;

    // Mark the key line
    this.markLine(lines, startIndex, type);

    // If value is an object or array, mark all its lines
    if (typeof value === 'object' && value !== null) {
      const indentLevel = this.getIndentLevel(lines[startIndex].content);
      let currentIndex = startIndex + 1;
      let foundClosing = false;

      while (currentIndex < lines.length && !foundClosing) {
        const currentLine = lines[currentIndex].content;
        const currentIndent = this.getIndentLevel(currentLine);

        if (currentIndent <= indentLevel) {
          // Check if this is the closing bracket for our object
          if (this.isClosingBracket(currentLine)) {
            this.markLine(lines, currentIndex, type);
            foundClosing = true;
          }
          break;
        }

        this.markLine(lines, currentIndex, type);
        currentIndex++;
      }
    }
  }

  private memoizedIndentLevel = new Map<string, number>();

  private getIndentLevel(line: string): number {
    if (this.memoizedIndentLevel.has(line)) {
      return this.memoizedIndentLevel.get(line)!;
    }
    const match = line.match(/^\s*/);
    const result = match ? match[0].length : 0;
    this.memoizedIndentLevel.set(line, result);
    return result;
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

  private isClosingBracket(line: string): boolean {
    const trimmed = line.trim();
    return trimmed === '}' || trimmed === ']' || trimmed.endsWith('},') || trimmed.endsWith('],');
  }
}