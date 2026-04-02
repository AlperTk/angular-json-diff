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
  @Input() oldJson: string | null = '';
  @Input() newJson: string | null = '';

  oldJsonLines: { content: string; changed?: boolean; type?: string }[] = [];
  newJsonLines: { content: string; changed?: boolean; type?: string }[] = [];

  private sortObject(obj: any): any {
    // Handle null, undefined, and non-objects
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    // Do NOT sort arrays, just recursively sort their items
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObject(item));
    }

    // Sort object keys
    const sortedKeys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
    const result: { [key: string]: any } = {};

    for (const key of sortedKeys) {
      result[key] = this.sortObject(obj[key]);
    }

    return result;
  }

  ngOnChanges() {
    try {
      // Handle cases where one of the JSONs is empty/null
      if (!this.oldJson && this.newJson) {
        const newObj = this.sortObject(JSON.parse(this.newJson));
        const newFormatted = JSON.stringify(newObj, null, 2);
        this.newJsonLines = newFormatted.split('\n').map(line => ({
          content: line,
          changed: true,
          type: 'added'
        }));
        this.oldJsonLines = [];
        return;
      }

      if (this.oldJson && !this.newJson) {
        const oldObj = this.sortObject(JSON.parse(this.oldJson));
        const oldFormatted = JSON.stringify(oldObj, null, 2);
        this.oldJsonLines = oldFormatted.split('\n').map(line => ({
          content: line,
          changed: true,
          type: 'removed'
        }));
        this.newJsonLines = [];
        return;
      }

      // Regular diff logic for when both JSONs exist
      if (!this.oldJson || !this.newJson) {
        console.error('Both oldJson and newJson must be non-null for comparison');
        return;
      }

      const oldObj = this.sortObject(JSON.parse(this.oldJson));
      const newObj = this.sortObject(JSON.parse(this.newJson));

      const oldFormatted = JSON.stringify(oldObj, null, 2);
      const newFormatted = JSON.stringify(newObj, null, 2);

      this.oldJsonLines = oldFormatted.split('\n').map(line => ({ content: line }));
      this.newJsonLines = newFormatted.split('\n').map(line => ({ content: line }));

      // Use custom diffpatcher to detect array order changes
      const diffpatcher = jsondiffpatch.create({
        arrays: {
          detectMove: false // treat order changes as modifications
        }
      });
      const delta = diffpatcher.diff(oldObj, newObj) as DiffDelta;
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
    } else if (change.length === 2) { // Modified - we need to find the actual line containing the modified property
      // For array item property changes, look for lines that contain the property being changed
      const parts = key.split('.');
      const lastPart = parts[parts.length - 1];
      
      // If last part is a number, it's an array index, so we need to find the parent object
      if (!isNaN(Number(lastPart))) {
        // For nested changes like "1.name", we need to mark the parent object line and the property line
        const parentKey = parts.slice(0, -1).join('.');
        const parentLineIndex = this.findLineWithKey(this.oldJsonLines, parentKey);
        if (parentLineIndex >= 0) {
          this.markLine(this.oldJsonLines, parentLineIndex, 'modified');
        }
        const newParentLineIndex = this.findLineWithKey(this.newJsonLines, parentKey);
        if (newParentLineIndex >= 0) {
          this.markLine(this.newJsonLines, newParentLineIndex, 'modified');
        }
      } else {
        // For regular property changes in objects
        const oldLineIndex = this.findLineWithKey(this.oldJsonLines, key);
        const newLineIndex = this.findLineWithKey(this.newJsonLines, key);

        if (oldLineIndex >= 0) {
          this.markLine(this.oldJsonLines, oldLineIndex, 'modified');
        }
        if (newLineIndex >= 0) {
          this.markLine(this.newJsonLines, newLineIndex, 'modified');
        }
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

    // Handle underscore-prefixed array indices (e.g., _0)
    if (currentPart.startsWith('_') && !isNaN(Number(currentPart.slice(1)))) {
      currentPart = currentPart.slice(1);
    }

    // If currentPart is numeric → array index
    if (!isNaN(Number(currentPart))) {
      const arrayIndex = Number(currentPart);
      const parentKey = parts.slice(0, -1).join('.');

      const parentStart = parentKey ? this.findLineWithKey(lines, parentKey) : -1;

      // If we have a parent and it's an inline array on one line:
      if (parentStart !== -1) {
        const lineContent = lines[parentStart].content.trim();

        // Check if it's an inline array
        if (lineContent.includes('[') && lineContent.includes(']')) {
          const openBracketIdx = lineContent.indexOf('[');
          const closeBracketIdx = lineContent.lastIndexOf(']');

          if (openBracketIdx !== -1 && closeBracketIdx !== -1 && closeBracketIdx > openBracketIdx) {
            const arrayContent = lineContent.substring(openBracketIdx + 1, closeBracketIdx);
            const elements = arrayContent.split(',').map(e => e.trim());

            // If we're looking for an element that exists in the inline array
            if (arrayIndex < elements.length) {
              // For inline arrays, we should return the parent line since the entire array is marked
              return parentStart;
            }
          }
        }
      }

      // Multiline array fallback – count only array-item boundaries, not every inner line.
      // Rules:
      //   • A line at level 1 (direct child of the target array) is the START of a new item.
      //   • If that line opens a block ({ or [) we increase level so inner lines are skipped.
      //   • Closing brackets (} / ]) restore the level.
      let level = 0;
      let inArray = false;
      let itemCount = -1;
      const startingPoint = parentStart !== -1 ? parentStart : 0;

      for (let i = startingPoint; i < lines.length; i++) {
        const trimmed = lines[i].content.trim();

        if (inArray && level === 1) {
          // ── At the direct-child level of the target array ──
          // Closing bracket ends the array – stop searching.
          if (trimmed === ']' || trimmed === '],') {
            break;
          }

          // Every line here is the start of a new array item.
          itemCount++;
          if (itemCount === arrayIndex) {
            return i;
          }

          // If this item opens a block, step into it so inner lines are skipped.
          if (trimmed.endsWith('{') || trimmed.endsWith('[')) {
            level++;
          }
          // Primitive items (no block) keep level at 1 → next line = next item.
        } else {
          // ── Not yet inside the target array, or inside a nested block ──
          if (trimmed.endsWith('[')) {
            level++;
            if (level === 1) inArray = true;
          } else if (trimmed === ']' || trimmed === '],') {
            if (level === 1) inArray = false;
            level--;
          } else if (trimmed.endsWith('{')) {
            level++;
          } else if (trimmed === '}' || trimmed === '},') {
            level--;
          }
        }
      }

      return -1;
    }

    // Handle object key lookup
    const keyToFind = `"${currentPart}":`;

    // When there is a parent key, restrict the search to the parent's scope so
    // we don't accidentally match a same-named property in a different object.
    const parentKey = parts.slice(0, -1).join('.');
    if (parentKey) {
      const parentLineIdx = this.findLineWithKey(lines, parentKey);
      if (parentLineIdx >= 0) {
        const parentIndent = this.getIndentLevel(lines[parentLineIdx].content);

        for (let i = parentLineIdx + 1; i < lines.length; i++) {
          const currentLine = lines[i].content;
          const currentIndent = this.getIndentLevel(currentLine);
          const trimmed = currentLine.trim();

          // Stop once we have left the parent's scope.
          if (currentIndent <= parentIndent && (trimmed.startsWith('}') || trimmed.startsWith(']'))) {
            break;
          }

          if (trimmed.includes(keyToFind)) {
            return i;
          }
        }
        return -1;
      }
    }

    // No parent (or parent not found) – fall back to a global search.
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].content.trim();
      if (trimmed.includes(keyToFind)) {
        return i;
      }
    }

    return -1;
  }




  private isClosingBracket(line: string): boolean {
    const trimmed = line.trim();
    return trimmed === '}' || trimmed === ']' || trimmed.endsWith('},') || trimmed.endsWith('],');
  }
}