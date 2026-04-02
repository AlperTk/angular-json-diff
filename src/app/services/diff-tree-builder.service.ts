import { Injectable } from '@angular/core';
import { JsonDiffService } from './json-diff.service';
import { DiffResult, ChangeType } from './types';

@Injectable({
  providedIn: 'root'
})
export class DiffTreeBuilderService {

  constructor(private jsonDiffService: JsonDiffService) {}

  buildDiffResults(delta: any, oldObj: any, newObj: any, objectHashFunction: ((obj: any) => any)): DiffResult[] {
    this.objectHashFunction = objectHashFunction;
    if (!oldObj && newObj) {
      return this.handleObjectCreation(newObj);
    }

    if (oldObj && !newObj) {
      return this.handleObjectDeletion(oldObj);
    }

    // Both objects exist - show both columns
    return this.buildDiffTree(delta, oldObj, newObj);
  }

  private handleObjectCreation(newObj: any): DiffResult[] {
    return Object.entries(newObj).map(([key, value]) => ({
      path: key,
      oldValue: undefined,
      newValue: value,
      type: 'added' as ChangeType
    })).sort((a, b) => a.path.localeCompare(b.path));
  }

  private handleObjectDeletion(oldObj: any): DiffResult[] {
    return Object.entries(oldObj).map(([key, value]) => ({
      path: key,
      oldValue: value,
      newValue: undefined,
      type: 'removed' as ChangeType
    })).sort((a, b) => a.path.localeCompare(b.path));
  }

  private buildDiffTree(delta: any, oldObj: any, newObj: any, path: string = ''): DiffResult[] {
    // Detect type changes - if old and new have different types, mark entire structures as removed/added
    if (oldObj !== undefined && newObj !== undefined &&
        (typeof oldObj !== typeof newObj ||
         (Array.isArray(oldObj) && !Array.isArray(newObj)) ||
         (!Array.isArray(oldObj) && Array.isArray(newObj)))) {
      const results: DiffResult[] = [];
      if (oldObj !== undefined) {
        results.push({
          path: path || 'root',
          oldValue: oldObj,
          newValue: undefined,
          type: 'removed'
        });
      }
      if (newObj !== undefined) {
        results.push({
          path: path || 'root',
          oldValue: undefined,
          newValue: newObj,
          type: 'added'
        });
      }
      return results;
    }

    if (Array.isArray(oldObj) || Array.isArray(newObj)) {
      const oldArr = Array.isArray(oldObj) ? oldObj : [];
      const newArr = Array.isArray(newObj) ? newObj : [];
      return this.buildArrayDiffTree(delta, oldArr, newArr, path);
    }

    const allKeys = new Set<string>();
    if (oldObj && typeof oldObj === 'object') {
      Object.keys(oldObj).forEach(k => allKeys.add(k));
    }
    if (newObj && typeof newObj === 'object') {
      Object.keys(newObj).forEach(k => allKeys.add(k));
    }

    if (!delta) {
      return Array.from(allKeys).map(key => {
        const currentPath = path ? `${path}.${key}` : key;
        return {
          path: currentPath,
          oldValue: oldObj ? oldObj[key] : undefined,
          newValue: newObj ? newObj[key] : undefined,
          type: 'unchanged' as ChangeType
        };
      });
    }

    const results: DiffResult[] = [];
    allKeys.forEach(key => {
      this.processDiffKey(key, delta, oldObj, newObj, path, results);
    });
    return results;
  }

  private processDiffKey(
    key: string,
    delta: any,
    oldObj: any,
    newObj: any,
    path: string,
    results: DiffResult[]
  ): void {
    const currentPath = path ? `${path}.${key}` : key;
    const change = delta[key] ?? delta["_" + key];
    const oldValue = oldObj ? oldObj[key] : undefined;
    const newValue = newObj ? newObj[key] : undefined;

    if (change === undefined) {
      // Unchanged
      results.push({
        path: currentPath,
        oldValue,
        newValue,
        type: 'unchanged'
      });
    } else if (Array.isArray(change)) {
      results.push({
        path: currentPath,
        oldValue: oldValue,
        newValue: newValue,
        type: this.jsonDiffService.getChangeType(oldValue, newValue)
      });
    } else if (typeof change === 'object') {
      // Recursively build children
      results.push({
        path: currentPath,
        oldValue,
        newValue,
        type: 'modified',
        children: this.buildDiffTree(
          change,
          oldValue,
          newValue,
          currentPath
        )
      });
    }
  }

  private buildArrayDiffTree(delta: any, oldArr: any[], newArr: any[], path: string = ''): DiffResult[] {
    // Detect type changes - if one is array and other is not, mark entire structures as removed/added
    if ((Array.isArray(oldArr) && !Array.isArray(newArr)) ||
        (!Array.isArray(oldArr) && Array.isArray(newArr))) {
      const results: DiffResult[] = [];
      if (Array.isArray(oldArr) && oldArr.length > 0) {
        results.push({
          path: path || 'root',
          oldValue: oldArr,
          newValue: undefined,
          type: 'removed'
        });
      }
      if (Array.isArray(newArr) && newArr.length > 0) {
        results.push({
          path: path || 'root',
          oldValue: undefined,
          newValue: newArr,
          type: 'added'
        });
      }
      return results;
    }

    const results: DiffResult[] = [];
    const usedNewIndices = new Set<number>();

    const arrayDelta = delta && delta._t === 'a' ? delta : null;
    const pureRemovals = new Set<number>();
    const replacements = new Set<number>();

    const countRemovedBefore = (index: number): number => {
      let removedBefore = 0;
      pureRemovals.forEach(i => { if (i < index) removedBefore++; });
      return removedBefore;
    };

    if (arrayDelta) {
      Object.keys(arrayDelta).forEach(key => {
        if (key === '_t') {
          return;
        }
        if (key.startsWith('_')) {
          const idx = Number(key.slice(1));
          if (arrayDelta[String(idx)] !== undefined) {
            replacements.add(idx);
          } else {
            pureRemovals.add(idx);
          }
        }
      });
    }

    const hashToNewIndices = new Map<any, number[]>();
    newArr.forEach((item, index) => {
      const hash = this.objectHashFunction(item);
      const existing = hashToNewIndices.get(hash) || [];
      existing.push(index);
      hashToNewIndices.set(hash, existing);
    });

    const takeHashMatchIndex = (item: any): number | undefined => {
      const hash = this.objectHashFunction(item);
      const candidates = hashToNewIndices.get(hash);
      if (!candidates || candidates.length === 0) {
        return undefined;
      }
      while (candidates.length > 0) {
        const idx = candidates.shift()!;
        if (!usedNewIndices.has(idx)) {
          return idx;
        }
      }
      return undefined;
    };

    for (let index = 0; index < oldArr.length; index++) {
      const oldItem = oldArr[index];
      const currentPath = path ? `${path}.${index}` : `${index}`;

      const removedDelta = arrayDelta?.[`_${index}`];
      const deltaEntry = arrayDelta?.[String(index)];
      const isReplacement = replacements.has(index);
      const isPureRemoval = pureRemovals.has(index);
      const isInsertionOnly = deltaEntry !== undefined && !isReplacement && !isPureRemoval;

      if (isReplacement) {
        const newValue = Array.isArray(deltaEntry)
          ? (deltaEntry.length > 0 ? deltaEntry[0] : (index < newArr.length ? newArr[index] : undefined))
          : (index < newArr.length ? newArr[index] : undefined);

        // If we have object hash mismatch, this is a remove + add (identity changed), not a modification.
        if (oldItem && newValue && typeof oldItem === 'object' && typeof newValue === 'object') {
          const oldHash = this.objectHashFunction(oldItem);
          const newHash = this.objectHashFunction(newValue);
          if (oldHash !== newHash) {
            results.push({
              path: currentPath,
              oldValue: oldItem,
              newValue: undefined,
              type: 'removed'
            });
            continue;
          }
        }

        if (index < newArr.length) {
          usedNewIndices.add(index);
        }

        results.push({
          path: currentPath,
          oldValue: oldItem,
          newValue,
          type: this.jsonDiffService.getChangeType(oldItem, newValue)
        });
        continue;
      }

      if (isPureRemoval) {
        const removedBefore = Array.from(pureRemovals).filter(i => i < index).length;
        const effectiveNewIndex = index - removedBefore;
        const hash = this.objectHashFunction(oldItem);
        const allNewIndexes = hashToNewIndices.get(hash) || [];
        const availableNewIndexes = allNewIndexes.filter(i => !usedNewIndices.has(i));
        const existsInNew = availableNewIndexes.length > 0;
        const hadEntryInNew = allNewIndexes.length > 0;

        if (removedBefore > 0 && effectiveNewIndex >= 0 && effectiveNewIndex < newArr.length && !usedNewIndices.has(effectiveNewIndex)) {
          const newValue = newArr[effectiveNewIndex];
          usedNewIndices.add(effectiveNewIndex);
          const type = this.jsonDiffService.areValuesEqual(oldItem, newValue) ? 'unchanged' : 'modified';
          results.push({
            path: currentPath,
            oldValue: oldItem,
            newValue,
            type
          });
          continue;
        }

        if (removedBefore === 0 && hadEntryInNew && index < newArr.length && !usedNewIndices.has(index)) {
          const newValue = newArr[index];
          usedNewIndices.add(index);
          const type = this.jsonDiffService.areValuesEqual(oldItem, newValue) ? 'unchanged' : 'modified';
          results.push({
            path: currentPath,
            oldValue: oldItem,
            newValue,
            type
          });
          continue;
        }

        if (existsInNew) {
          const mappedNew = availableNewIndexes[0];
          usedNewIndices.add(mappedNew);
          const newValue = newArr[mappedNew];
          const type = this.jsonDiffService.areValuesEqual(oldItem, newValue) ? 'unchanged' : 'modified';
          results.push({
            path: currentPath,
            oldValue: oldItem,
            newValue,
            type
          });
          continue;
        }

        results.push({
          path: currentPath,
          oldValue: oldItem,
          newValue: undefined,
          type: 'removed'
        });
        continue;
      }

      const removedBefore = countRemovedBefore(index)
      const effectiveNewIndex = index - removedBefore;

      if (deltaEntry !== undefined && removedBefore > 0) {
        const hashIndex = takeHashMatchIndex(oldItem);
        if (hashIndex !== undefined) {
          const newValue = newArr[hashIndex];
          usedNewIndices.add(hashIndex);
          const type = this.jsonDiffService.areValuesEqual(oldItem, newValue) ? 'unchanged' : 'modified';
          results.push({
            path: currentPath,
            oldValue: oldItem,
            newValue,
            type
          });
          continue;
        }
      }

      if (deltaEntry !== undefined && !isInsertionOnly) {
        const newValue = Array.isArray(deltaEntry)
          ? (deltaEntry.length > 0 ? deltaEntry[0] : (index < newArr.length ? newArr[index] : undefined))
          : (index < newArr.length ? newArr[index] : undefined);

        if (index < newArr.length) {
          usedNewIndices.add(index);
        }

        if (Array.isArray(deltaEntry)) {
          results.push({
            path: currentPath,
            oldValue: oldItem,
            newValue,
            type: this.jsonDiffService.getChangeType(oldItem, newValue)
          });
        } else if (deltaEntry && typeof deltaEntry === 'object') {
          results.push({
            path: currentPath,
            oldValue: oldItem,
            newValue,
            type: 'modified',
            children: this.buildDiffTree(deltaEntry, oldItem, newValue, currentPath)
          });
        } else {
          results.push({
            path: currentPath,
            oldValue: oldItem,
            newValue,
            type: this.jsonDiffService.getChangeType(oldItem, newValue)
          });
        }
        continue;
      }

      let newIndex: number | undefined;

      if (oldItem && typeof oldItem === 'object') {
        newIndex = takeHashMatchIndex(oldItem);
      }

      if (newIndex === undefined && effectiveNewIndex >= 0 && effectiveNewIndex < newArr.length && !usedNewIndices.has(effectiveNewIndex)) {
        newIndex = effectiveNewIndex;
      }

      if (newIndex === undefined) {
        newIndex = takeHashMatchIndex(oldItem);
      }

      if (newIndex === undefined) {
        results.push({
          path: currentPath,
          oldValue: oldItem,
          newValue: undefined,
          type: 'removed'
        });
        continue;
      }

      usedNewIndices.add(newIndex);
      const newValue = newArr[newIndex];
      const type = this.jsonDiffService.areValuesEqual(oldItem, newValue) ? 'unchanged' : 'modified';

      results.push({
        path: currentPath,
        oldValue: oldItem,
        newValue,
        type
      });
    }

    let addedRowIndex = results.length;
    newArr.forEach((newItem, index) => {
      if (usedNewIndices.has(index)) {
        return;
      }
      const currentPath = path ? `${path}.${addedRowIndex}` : `${addedRowIndex}`;
      results.push({
        path: currentPath,
        oldValue: undefined,
        newValue: newItem,
        type: 'added'
      });
      addedRowIndex++;
    });

    return results;
  }

  // Note: objectHashFunction needs to be passed or injected
  private objectHashFunction: ((obj: any) => any) = function (obj) {
    return obj.id || JSON.stringify(obj);
  };
}