import { TestBed } from '@angular/core/testing';
import { DiffTreeBuilderService } from './diff-tree-builder.service';
import { JsonDiffService } from './json-diff.service';

class MockJsonDiffService {
  computeDiff() { return {}; }
  getChangeType() { return 'modified'; }
  areValuesEqual() { return false; }
}

describe('DiffTreeBuilderService', () => {
  let service: DiffTreeBuilderService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DiffTreeBuilderService,
        { provide: JsonDiffService, useClass: MockJsonDiffService }
      ]
    });

    service = TestBed.inject(DiffTreeBuilderService);
  });

  describe('Type Change Detection', () => {
    it('should detect array to object change and mark as removed/added', () => {
      const oldObj = [{ id: 1, name: 'Item One', value: 100 }];
      const newObj = { metadata: { version: '1.1', timestamp: '2026-03-30T14:00:00Z' } };

      const result = service.buildDiffResults({}, oldObj, newObj, (obj) => JSON.stringify(obj));

      expect(result.length).toBe(2);
      expect(result[0].type).toBe('removed');
      expect(result[0].oldValue).toEqual(oldObj);
      expect(result[0].newValue).toBeUndefined();
      expect(result[1].type).toBe('added');
      expect(result[1].oldValue).toBeUndefined();
      expect(result[1].newValue).toEqual(newObj);
    });

    it('should detect object to array change and mark as removed/added', () => {
      const oldObj = { metadata: { version: '1.0' } };
      const newObj = [{ id: 1, name: 'Item One' }];

      const result = service.buildDiffResults({}, oldObj, newObj, (obj) => JSON.stringify(obj));

      expect(result.length).toBe(2);
      expect(result[0].type).toBe('removed');
      expect(result[0].oldValue).toEqual(oldObj);
      expect(result[1].type).toBe('added');
      expect(result[1].newValue).toEqual(newObj);
    });

    it('should detect scalar to object change', () => {
      const oldObj = "string value";
      const newObj = { key: 'value' };

      const result = service.buildDiffResults({}, oldObj, newObj, (obj) => JSON.stringify(obj));

      expect(result.length).toBe(2);
      expect(result[0].type).toBe('removed');
      expect(result[0].oldValue).toEqual(oldObj);
      expect(result[1].type).toBe('added');
      expect(result[1].newValue).toEqual(newObj);
    });
  });
});