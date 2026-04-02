import { Injectable } from '@angular/core';
import * as jsondiffpatch from 'jsondiffpatch';
import { ChangeType } from './types';

@Injectable({
  providedIn: 'root'
})
export class JsonDiffService {

  parseJson(jsonString: string | null): { value: any; error?: any } {
    if (!jsonString) {
      return { value: null };
    }
    try {
      return { value: JSON.parse(jsonString) };
    } catch (e) {
      console.warn('Invalid JSON:', e);
      return { value: null, error: e };
    }
  }

  computeDiff(oldObj: any, newObj: any, objectHashFunction: ((obj: any) => any)): any {
    const diffpatcher = jsondiffpatch.create({
      objectHash: objectHashFunction,
      arrays: {
        detectMove: false // treat order changes as modifications
      }
    });
    return diffpatcher.diff(oldObj, newObj);
  }

  getChangeType(oldValue: any, newValue: any): ChangeType {
    if (oldValue === undefined && newValue !== undefined) {
      return 'added';
    } else if (oldValue !== undefined && newValue === undefined) {
      return 'removed';
    } else if (oldValue !== newValue) {
      return 'modified';
    } else {
      return 'unchanged';
    }
  }

  areValuesEqual(oldValue: any, newValue: any): boolean {
    if (oldValue === newValue) {
      return true;
    }
    if (typeof oldValue !== typeof newValue) {
      return false;
    }
    if (oldValue === null || newValue === null) {
      return false;
    }
    try {
      return JSON.stringify(oldValue) === JSON.stringify(newValue);
    } catch {
      return false;
    }
  }
}