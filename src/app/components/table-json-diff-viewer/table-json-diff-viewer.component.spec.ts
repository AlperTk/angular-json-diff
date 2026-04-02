import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableJsonDiffViewerComponent } from './table-json-diff-viewer.component';

describe('TableJsonDiffViewerComponent', () => {
  let component: TableJsonDiffViewerComponent;
  let fixture: ComponentFixture<TableJsonDiffViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableJsonDiffViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableJsonDiffViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle empty inputs', () => {
    component.oldJson = '';
    component.newJson = '';
    component.ngOnChanges();
    expect(component.diffResults).toEqual([]);
  });

  it('should handle invalid JSON inputs', () => {
    component.oldJson = 'invalid json';
    component.newJson = '{invalid json}';
    component.ngOnChanges();
    expect(component.diffResults).toEqual([]);
  });

  it('should detect added properties', () => {
    component.oldJson = '{"a": 1}';
    component.newJson = '{"a": 1, "b": 2}';
    component.ngOnChanges();
    expect(component.diffResults.find(r => r.path === 'b')).toEqual({
      path: 'b',
      oldValue: undefined,
      newValue: 2,
      type: 'added'
    });
  });

  it('should detect removed properties', () => {
    component.oldJson = '{"a": 1, "b": 2}';
    component.newJson = '{"a": 1}';
    component.ngOnChanges();
    expect(component.diffResults.find(r => r.path === 'b')).toEqual({
      path: 'b',
      oldValue: 2,
      newValue: undefined,
      type: 'removed'
    });
  });

  it('should detect modified properties', () => {
    component.oldJson = '{"a": 1}';
    component.newJson = '{"a": 2}';
    component.ngOnChanges();
    expect(component.diffResults.find(r => r.path === 'a')).toEqual({
      path: 'a',
      oldValue: 1,
      newValue: 2,
      type: 'modified'
    });
  });

  it('should identify unchanged properties', () => {
    component.oldJson = '{"a": 1, "b": 2}';
    component.newJson = '{"a": 1, "b": 2}';
    component.ngOnChanges();
    expect(component.diffResults.find(r => r.path === 'a')).toEqual({
      path: 'a',
      oldValue: 1,
      newValue: 1,
      type: 'unchanged'
    });
  });

  it('should handle nested objects', () => {
    component.oldJson = '{"nested": {"a": 1}}';
    component.newJson = '{"nested": {"a": 2}}';
    component.ngOnChanges();
    const nestedDiff = component.diffResults.find(r => r.path === 'nested');
    expect(nestedDiff).toBeDefined();
    expect(Array.isArray(nestedDiff?.children)).toBe(true);
    expect(nestedDiff?.children?.find(c => c.path === 'nested.a')).toEqual({
      path: 'nested.a',
      oldValue: 1,
      newValue: 2,
      type: 'modified'
    });
  });

  it('should detect changes inside arrays', () => {
    component.oldJson = '{"arr": [1, 2, 3]}';
    component.newJson = '{"arr": [1, 4, 3]}';
    component.ngOnChanges();
    const arrDiff = component.diffResults.find(r => r.path === 'arr');
    expect(arrDiff).toBeDefined();
    expect(Array.isArray(arrDiff?.children)).toBe(true);
    expect(arrDiff?.children?.find(r => r.path === 'arr.1' && r.type === 'modified')).toEqual({
      path: 'arr.1',
      oldValue: 2,
      newValue: 4,
      type: 'modified'
    });
  });

  it('should detect added array items', () => {
    component.oldJson = '{"arr": [1, 2]}';
    component.newJson = '{"arr": [1, 2, 3]}';
    component.ngOnChanges();
    const arrDiff = component.diffResults.find(r => r.path === 'arr');
    expect(arrDiff).toBeDefined();
    expect(Array.isArray(arrDiff?.children)).toBe(true);
    expect(arrDiff?.children?.find(r => r.path === 'arr.2')).toEqual({
      path: 'arr.2',
      oldValue: undefined,
      newValue: 3,
      type: 'added'
    });
  });

  it('should detect removed array items', () => {
    component.oldJson = '{"arr": [1, 2, 3]}';
    component.newJson = '{"arr": [1, 2]}';
    component.ngOnChanges();
    const arrDiff = component.diffResults.find(r => r.path === 'arr');
    expect(arrDiff).toBeDefined();
    expect(Array.isArray(arrDiff?.children)).toBe(true);
    expect(arrDiff?.children?.find(r => r.path === 'arr.2')).toEqual({
      path: 'arr.2',
      oldValue: 3,
      newValue: undefined,
      type: 'removed'
    });
  });

  it('should detect type changes', () => {
    component.oldJson = '{"value": 123}';
    component.newJson = '{"value": "123"}';
    component.ngOnChanges();
    expect(component.diffResults.find(r => r.path === 'value')).toEqual({
      path: 'value',
      oldValue: 123,
      newValue: "123",
      type: 'modified'
    });
  });

  it('should detect null to value changes', () => {
    component.oldJson = '{"key": null}';
    component.newJson = '{"key": "not null"}';
    component.ngOnChanges();
    expect(component.diffResults.find(r => r.path === 'key')).toEqual({
      path: 'key',
      oldValue: null,
      newValue: "not null",
      type: 'modified'
    });
  });

  it('should return all properties as added if oldJson is null', () => {
    component.oldJson = null;
    component.newJson = '{"a": 1}';
    component.ngOnChanges();
    expect(component.diffResults.find(r => r.path === 'a')).toEqual({
      path: 'a',
      oldValue: undefined,
      newValue: 1,
      type: 'added'
    });
  });

  it('should return all properties as removed if newJson is null', () => {
    component.oldJson = '{"a": 1}';
    component.newJson = null;
    component.ngOnChanges();
    expect(component.diffResults.find(r => r.path === 'a')).toEqual({
      path: 'a',
      oldValue: 1,
      newValue: undefined,
      type: 'removed'
    });
  });

  it('should detect array order changes as modifications', () => {
    component.oldJson = '{"arr": [1, 2, 3]}';
    component.newJson = '{"arr": [3, 2, 1]}';
    component.ngOnChanges();
    // Should detect removed and added for moved items
    const arrDiff = component.diffResults.find(r => r.path === 'arr');
    expect(arrDiff).toBeDefined();
    expect(Array.isArray(arrDiff?.children)).toBe(true);
    expect(arrDiff?.children?.find(r => r.path === 'arr.0')).toEqual({
      path: 'arr.0',
      oldValue: 1,
      newValue: 3,
      type: 'modified'
    });
    expect(arrDiff?.children?.find(r => r.path === 'arr.2')).toEqual({
      path: 'arr.2',
      oldValue: 3,
      newValue: 1,
      type: 'modified'
    });
  });

  it('should detect changes in deeply nested arrays and objects', () => {
    component.oldJson = '{"a": {"b": {"c": [1, 2, 3]}}}';
    component.newJson = '{"a": {"b": {"c": [1, 4, 3]}}}';
    component.ngOnChanges();
    const aDiff = component.diffResults.find(r => r.path === 'a');
    expect(aDiff).toBeDefined();
    const bDiff = aDiff?.children?.find(r => r.path === 'a.b');
    expect(bDiff).toBeDefined();
    const cDiff = bDiff?.children?.find(r => r.path === 'a.b.c');
    expect(cDiff).toBeDefined();
    expect(Array.isArray(cDiff?.children)).toBe(true);
    expect(cDiff?.children?.find(r => r.path === 'a.b.c.1' && r.type === 'modified')).toEqual({
      path: 'a.b.c.1',
      oldValue: 2,
      newValue: 4,
      type: 'modified'
    });
  });

  it('should handle multiple property changes', () => {
    component.oldJson = '{"name": "Alice", "age": 30, "city": "New York"}';
    component.newJson = '{"name": "Bob", "age": 31, "city": "Boston"}';
    component.ngOnChanges();

    expect(component.diffResults.find(r => r.path === 'name')).toEqual({
      path: 'name',
      oldValue: 'Alice',
      newValue: 'Bob',
      type: 'modified'
    });
    expect(component.diffResults.find(r => r.path === 'age')).toEqual({
      path: 'age',
      oldValue: 30,
      newValue: 31,
      type: 'modified'
    });
    expect(component.diffResults.find(r => r.path === 'city')).toEqual({
      path: 'city',
      oldValue: 'New York',
      newValue: 'Boston',
      type: 'modified'
    });
  });

  it('should handle array removal scenario', () => {
    // Testing the specific scenario from HTML output with correct JSON
    component.oldJson = '[{"id": 1}, {"id": 2}, {"id": 3}]';
    component.newJson = '[{"id": 2}, {"id": 3}]';
    component.ngOnChanges();
    
    expect(component.diffResults.length).toBe(3);
    
    // Check first item - removed (id=1 was in old but not new)
    const firstItem = component.diffResults[0];
    expect(firstItem.path).toBe('0');
    expect(firstItem.type).toBe('removed');
    expect(firstItem.oldValue).toEqual({id: 1});
    expect(firstItem.newValue).toBeUndefined();
    
    // Check second item - unchanged (id=2 exists in both)
    const secondItem = component.diffResults[1];
    expect(secondItem.path).toBe('1');
    expect(secondItem.type).toBe('unchanged');
    expect(secondItem.oldValue).toEqual({id: 2});
    expect(secondItem.newValue).toEqual({id: 2});
    
    // Check third item - unchanged (id=3 exists in both)
    const thirdItem = component.diffResults[2];
    expect(thirdItem.path).toBe('2');
    expect(thirdItem.type).toBe('unchanged');
    expect(thirdItem.oldValue).toEqual({id: 3});
    expect(thirdItem.newValue).toEqual({id: 3});
  });

  it('should handle auto-expand functionality', () => {
    component.oldJson = '[{"id": 1}, {"id": 2}]';
    component.newJson = '[{"id": 2}, {"id": 3}]';
    component.autoExpand = 'changed';
    component.ngOnChanges();
    
    // Should expand rows that are not unchanged
    expect(component.expandedRows.size).toBe(2); // Rows 0 and 2 should be expanded (removed and added)
    expect(component.isExpanded(0)).toBe(true);
    expect(component.isExpanded(1)).toBe(false); // unchanged row
    expect(component.isExpanded(2)).toBe(true); // added row
    
    // Test with autoExpand='all'
    component.autoExpand = 'all';
    component.ngOnChanges();
    expect(component.expandedRows.size).toBe(3); // All rows should be expanded
    expect(component.isExpanded(0)).toBe(true);
    expect(component.isExpanded(1)).toBe(true);
    expect(component.isExpanded(2)).toBe(true);
    
    // Test with autoExpand='none'
    component.autoExpand = 'none';
    component.ngOnChanges();
    expect(component.expandedRows.size).toBe(0); // No rows should be expanded
  });

  it('should handle expandable row logic', () => {
    component.oldJson = '[{"id": 1}, {"id": 2}]';
    component.newJson = '[{"id": 2}, {"id": 3}]';
    component.ngOnChanges();
    
    // Check if rows are expandable
    const firstItem = component.diffResults[0];
    const secondItem = component.diffResults[1];
    const thirdItem = component.diffResults[2];
    
    expect(component.isExpandable(firstItem)).toBe(true); // Object has properties to expand
    expect(component.isExpandable(secondItem)).toBe(true); // Object has properties to expand  
    expect(component.isExpandable(thirdItem)).toBe(true); // Object has properties to expand
  });

  it('should handle column visibility correctly', () => {
    component.oldJson = '[{"id": 1}, {"id": 2}]';
    component.newJson = '[{"id": 2}, {"id": 3}]';
    component.ngOnChanges();
    
    // Both columns should be visible since we have both old and new values
    expect(component.showOriginalColumn).toBe(true);
    expect(component.showModifiedColumn).toBe(true);
  });

});

