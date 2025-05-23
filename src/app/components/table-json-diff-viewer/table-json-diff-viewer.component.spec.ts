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
    expect(component.diffResults.find(r => r.path === 'nested.a')).toEqual({
      path: 'nested.a',
      oldValue: 1,
      newValue: 2,
      type: 'modified'
    });
  });
});
