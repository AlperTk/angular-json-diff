import { Injectable } from '@angular/core';
import { JsonDiffService } from './json-diff.service';

export interface LineInfo {
  content: string;
  changed?: boolean;
  type?: string;
}

@Injectable({
  providedIn: 'root'
})
export class JsonLineDiffService {
  constructor(private jsonDiffService: JsonDiffService) {}

  sortObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObject(item));
    }
    const sortedKeys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
    const result: { [key: string]: any } = {};
    for (const key of sortedKeys) {
      result[key] = this.sortObject(obj[key]);
    }
    return result;
  }

  buildLinesForJson(oldObj: any, newObj: any, objectHashFunction: (obj: any) => any): { oldJsonLines: LineInfo[]; newJsonLines: LineInfo[] } {
    // Clear memoization to avoid stale state across multiple JSON diffs in long-living components.
    this.memoizedIndentLevel.clear();

    const splitLines = (formatted: string) => formatted.replace(/\r\n/g, '\n').split('\n');

    if (!oldObj && newObj) {
      const newFormatted = JSON.stringify(this.sortObject(newObj), null, 2);
      return {
        oldJsonLines: [],
        newJsonLines: splitLines(newFormatted).map(line => ({ content: line, changed: true, type: 'added' }))
      };
    }

    if (oldObj && !newObj) {
      const oldFormatted = JSON.stringify(this.sortObject(oldObj), null, 2);
      return {
        oldJsonLines: splitLines(oldFormatted).map(line => ({ content: line, changed: true, type: 'removed' })),
        newJsonLines: []
      };
    }

    if (!oldObj || !newObj) {
      return { oldJsonLines: [], newJsonLines: [] };
    }

    // Detect type changes - if old and new have different types, mark all lines as changed
    const hasTypeChange = (Array.isArray(oldObj) && !Array.isArray(newObj)) ||
                         (!Array.isArray(oldObj) && Array.isArray(newObj)) ||
                         (typeof oldObj !== typeof newObj && typeof oldObj === 'object' && typeof newObj === 'object');

    if (hasTypeChange) {
      const oldFormatted = JSON.stringify(this.sortObject(oldObj), null, 2);
      const newFormatted = JSON.stringify(this.sortObject(newObj), null, 2);
      return {
        oldJsonLines: splitLines(oldFormatted).map(line => ({ content: line, changed: true, type: 'removed' })),
        newJsonLines: splitLines(newFormatted).map(line => ({ content: line, changed: true, type: 'added' }))
      };
    }

    const sortedOld = this.sortObject(oldObj);
    const sortedNew = this.sortObject(newObj);

    const oldFormatted = JSON.stringify(sortedOld, null, 2);
    const newFormatted = JSON.stringify(sortedNew, null, 2);

    const oldJsonLines = oldFormatted.split('\n').map(line => ({ content: line }));
    const newJsonLines = newFormatted.split('\n').map(line => ({ content: line }));

    const delta = this.jsonDiffService.computeDiff(sortedOld, sortedNew, objectHashFunction);
    this.markChangedLines(delta, oldJsonLines, newJsonLines);

    return { oldJsonLines, newJsonLines };
  }

  markChangedLines(delta: any, oldJsonLines: LineInfo[], newJsonLines: LineInfo[], parentKey = ''): void {
    if (!delta) return;

    Object.entries(delta).forEach(([key, change]) => {
      const fullKey = parentKey ? `${parentKey}.${key}` : key;
      if (Array.isArray(change)) {
        this.handleArrayChange(fullKey, change, oldJsonLines, newJsonLines);
      } else if (typeof change === 'object') {
        this.markChangedLines(change, oldJsonLines, newJsonLines, fullKey);
      }
    });
  }

  private handleArrayChange(key: string, change: any[], oldJsonLines: LineInfo[], newJsonLines: LineInfo[]): void {
    if (change.length === 1) {
      this.markObjectLines(newJsonLines, key, change[0], 'added');
      return;
    }

    const isRemoved = change.length === 3 && change[2] === 0;
    if (isRemoved) {
      this.markObjectLines(oldJsonLines, key, change[0], 'removed');
      return;
    }

    if (change.length === 2) {
      const parts = key.split('.');
      const lastPart = parts[parts.length - 1];

      if (!isNaN(Number(lastPart))) {
        const parentKey = parts.slice(0, -1).join('.');
        const parentLineIndexOld = this.findLineWithKey(oldJsonLines, parentKey);
        if (parentLineIndexOld >= 0) this.markLine(oldJsonLines, parentLineIndexOld, 'modified');
        const parentLineIndexNew = this.findLineWithKey(newJsonLines, parentKey);
        if (parentLineIndexNew >= 0) this.markLine(newJsonLines, parentLineIndexNew, 'modified');
      } else {
        const oldLineIndex = this.findLineWithKey(oldJsonLines, key);
        const newLineIndex = this.findLineWithKey(newJsonLines, key);
        if (oldLineIndex >= 0) this.markLine(oldJsonLines, oldLineIndex, 'modified');
        if (newLineIndex >= 0) this.markLine(newJsonLines, newLineIndex, 'modified');
      }
    }
  }

  private markObjectLines(lines: LineInfo[], key: string, value: any, type: string): void {
    const startIndex = this.findLineWithKey(lines, key);
    if (startIndex < 0) return;

    this.markLine(lines, startIndex, type);

    if (value && typeof value === 'object') {
      const indentLevel = this.getIndentLevel(lines[startIndex].content);
      let currentIndex = startIndex + 1;
      let foundClosing = false;

      while (currentIndex < lines.length && !foundClosing) {
        const currentLine = lines[currentIndex].content;
        const currentIndent = this.getIndentLevel(currentLine);

        if (currentIndent <= indentLevel) {
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

  getIndentLevel(line: string): number {
    if (this.memoizedIndentLevel.has(line)) {
      return this.memoizedIndentLevel.get(line)!;
    }
    const match = line.match(/^\s*/);
    const result = match ? match[0].length : 0;
    this.memoizedIndentLevel.set(line, result);
    return result;
  }

  private markLine(lines: LineInfo[], index: number, type: string): void {
    lines[index].changed = true;
    lines[index].type = type;
  }

  findLineWithKey(lines: LineInfo[], key: string): number {
    // Exact key match (literal keys that may contain dots) should take precedence.
    const directKey = `"${key}":`;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].content.trim().includes(directKey)) {
        return i;
      }
    }

    const parts = key.split('.');
    let currentPart = parts[parts.length - 1];

    if (currentPart.startsWith('_') && !isNaN(Number(currentPart.slice(1)))) {
      currentPart = currentPart.slice(1);
    }

    if (!isNaN(Number(currentPart))) {
      const arrayIndex = Number(currentPart);
      const parentKey = parts.slice(0, -1).join('.');
      const parentStart = parentKey ? this.findLineWithKey(lines, parentKey) : -1;

      if (parentStart !== -1) {
        const lineContent = lines[parentStart].content.trim();
        if (lineContent.includes('[') && lineContent.includes(']')) {
          const openBracketIdx = lineContent.indexOf('[');
          const closeBracketIdx = lineContent.lastIndexOf(']');
          if (openBracketIdx !== -1 && closeBracketIdx !== -1 && closeBracketIdx > openBracketIdx) {
            const elements = lineContent.substring(openBracketIdx + 1, closeBracketIdx).split(',').map(e => e.trim());
            if (arrayIndex < elements.length) {
              return parentStart;
            }
          }
        }
      }

      let level = 0;
      let inArray = false;
      let itemCount = -1;
      const startingPoint = parentStart !== -1 ? parentStart : 0;

      for (let i = startingPoint; i < lines.length; i++) {
        const trimmed = lines[i].content.trim();
        if (inArray && level === 1) {
          if (trimmed === ']' || trimmed === '],') break;
          itemCount++;
          if (itemCount === arrayIndex) return i;
          if (trimmed.endsWith('{') || trimmed.endsWith('[')) {
            level++;
          }
        } else {
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

    const keyToFind = `"${currentPart}":`;
    const parentKey = parts.slice(0, -1).join('.');
    if (parentKey) {
      const parentLineIdx = this.findLineWithKey(lines, parentKey);
      if (parentLineIdx >= 0) {
        const parentIndent = this.getIndentLevel(lines[parentLineIdx].content);
        for (let i = parentLineIdx + 1; i < lines.length; i++) {
          const currentLine = lines[i].content;
          const currentIndent = this.getIndentLevel(currentLine);
          const trimmed = currentLine.trim();
          if (currentIndent <= parentIndent && (trimmed.startsWith('}') || trimmed.startsWith(']'))) {
            break;
          }
          if (trimmed.includes(keyToFind)) return i;
        }
        return -1;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].content.trim();
      if (trimmed.includes(keyToFind)) return i;
    }
    return -1;
  }

  private isClosingBracket(line: string): boolean {
    const trimmed = line.trim();
    return trimmed === '}' || trimmed === ']' || trimmed.endsWith('},') || trimmed.endsWith('],');
  }
}
