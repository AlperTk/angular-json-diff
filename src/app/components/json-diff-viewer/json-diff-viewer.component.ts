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
    console.log(`Searching for key: "${key}"`);

    const parts = key.split('.');
    let currentPart = parts[parts.length - 1];
    console.log(`Current key part: "${currentPart}"`);

    // Handle underscore-prefixed array indices (e.g., _0)
    if (currentPart.startsWith('_') && !isNaN(Number(currentPart.slice(1)))) {
      currentPart = currentPart.slice(1);
      console.log(`Detected underscore-prefixed index. Cleaned part: "${currentPart}"`);
    }

    // If currentPart is numeric → array index
    if (!isNaN(Number(currentPart))) {
      const arrayIndex = Number(currentPart);
      const parentKey = parts.slice(0, -1).join('.');
      console.log(`Array index detected: ${arrayIndex}, Parent key: "${parentKey}"`);

      const parentStart = parentKey ? this.findLineWithKey(lines, parentKey) : -1;
      console.log(`Parent key line index: ${parentStart}`);

      // If parent array is inline on one line:
      if (parentStart !== -1) {
        const lineContent = lines[parentStart].content.trim();
        console.log(`Parent line content: "${lineContent}"`);

        const openBracketIdx = lineContent.indexOf('[');
        const closeBracketIdx = lineContent.lastIndexOf(']');

        if (openBracketIdx !== -1 && closeBracketIdx !== -1 && closeBracketIdx > openBracketIdx) {
          const arrayContent = lineContent.substring(openBracketIdx + 1, closeBracketIdx);
          const elements = arrayContent.split(',').map(e => e.trim());
          console.log(`Inline array detected with elements:`, elements);

          if (arrayIndex < elements.length) {
            console.log(`Returning parent line index for inline array element: ${parentStart}`);
            return parentStart;
          } else {
            console.log(`Array index out of bounds`);
            return -1;
          }
        }
      }

      // Multiline array fallback
      let level = 0;
      let index = -1;
      let inArray = false;
      const startingPoint = parentStart !== -1 ? parentStart : 0;
      for (let i = startingPoint; i < lines.length; i++) {
        const trimmed = lines[i].content.trim();
        console.log(`Scanning line ${i}: "${trimmed}"`);

        if (trimmed.endsWith('[')) {
          level++;
          if (level === 1) inArray = true;
          continue;
        } else if (trimmed.endsWith(']') || trimmed.endsWith('],')) {
          if (level === 1) inArray = false;
          level--;
          continue;
        } else if (trimmed.endsWith('{')) {
          level++;
        } else if (trimmed.endsWith('}')) {
          level--;
        }

        if (inArray && level === 1) {

          index++;
          console.log(`Array element index ${index} at line ${i}`);

          if (index === arrayIndex) {
            console.log(`Found array element at line ${i}`);
            return i; // i starts from parent line index so we add +1
          }
        }
      }

      console.log(`Array element not found`);
      return -1;
    }

    // Handle object key lookup
    const keyToFind = `"${currentPart}":`;
    console.log(`Looking for object key: ${keyToFind}`);

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].content.trim();
      if (trimmed.includes(keyToFind)) {
        console.log(`Found key at line ${i}: "${trimmed}"`);
        return i;
      }
    }

    console.log(`Key "${keyToFind}" not found`);
    return -1;
  }




  private isClosingBracket(line: string): boolean {
    const trimmed = line.trim();
    return trimmed === '}' || trimmed === ']' || trimmed.endsWith('},') || trimmed.endsWith('],');
  }
}