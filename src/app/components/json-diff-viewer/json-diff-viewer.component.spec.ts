import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JsonDiffViewerComponent } from './json-diff-viewer.component';

describe('JsonDiffViewerComponent', () => {
  let component: JsonDiffViewerComponent;
  let fixture: ComponentFixture<JsonDiffViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JsonDiffViewerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(JsonDiffViewerComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should detect simple property changes', () => {
    component.oldJson = '{"name": "Alice", "age": 30}';
    component.newJson = '{"name": "Alice", "age": 31}';

    component.ngOnChanges();
    fixture.detectChanges();

    const modifiedLines = fixture.nativeElement.querySelectorAll('.modified');
    expect(modifiedLines.length).toBe(2); // One in each view
    expect(modifiedLines[0].textContent).toContain('age');
  });

  it('should detect nested object removal', () => {
    component.oldJson = `{
      "name": "Alice",
      "contact": {
        "email": "alice@email.com",
        "phone": {
          "home": "123-456",
          "mobile": "789-012"
        }
      }
    }`;
    component.newJson = '{"name": "Alice"}';

    component.ngOnChanges();
    fixture.detectChanges();

    const removedLines = fixture.nativeElement.querySelectorAll('.removed');
    expect(removedLines.length).toBe(7);
    expect(removedLines[0].textContent).toContain('contact');
  });

  it('should detect nested object addition', () => {
    component.oldJson = '{"name": "Alice"}';
    component.newJson = `{
      "name": "Alice",
      "contact": {
        "email": "alice@email.com"
      }
    }`;

    component.ngOnChanges();
    fixture.detectChanges();

    const addedLines = fixture.nativeElement.querySelectorAll('.added');
    expect(addedLines.length).toBe(3);
    expect(addedLines[0].textContent).toContain('contact');
  });

  it('should handle invalid JSON', () => {
    const originalError = console.error;
    console.error = jest.fn();
    
    component.oldJson = 'invalid json';
    component.newJson = '{"name": "Alice"}';

    component.ngOnChanges();
    fixture.detectChanges();

    expect(console.error).toHaveBeenCalled();
    
    // Restore original error function
    console.error = originalError;
  });

  it('should detect nested property modifications', () => {
    component.oldJson = `{
      "name": "Alice",
      "contact": {
        "email": "alice@old.com"
      }
    }`;
    component.newJson = `{
      "name": "Alice",
      "contact": {
        "email": "alice@new.com"
      }
    }`;

    component.ngOnChanges();
    fixture.detectChanges();

    const modifiedLines = fixture.nativeElement.querySelectorAll('.modified');
    expect(modifiedLines.length).toBe(2); // One in each view
    expect(modifiedLines[0].textContent).toContain('email');
  });

  it('should hide panel when JSON is null', () => {
    component.oldJson = null;
    component.newJson = '{"name": "Alice"}';

    component.ngOnChanges();
    fixture.detectChanges();

    const panels = fixture.nativeElement.querySelectorAll('.json-panel');
    expect(panels.length).toBe(1);
    expect(panels[0].classList.contains('new')).toBe(true);
  });

  it('should handle array changes correctly', () => {
    component.oldJson = '{"items": [1, 2, 3]}';
    component.newJson = '{"items": [1, 4, 3]}';

    component.ngOnChanges();
    fixture.detectChanges();

    const oldModifiedLines = Array.from<Element>(fixture.nativeElement.querySelectorAll('.removed'))
      .filter(el => el.textContent && el.textContent.includes('2'));
    const newModifiedLines = Array.from<Element>(fixture.nativeElement.querySelectorAll('.added'))
      .filter(el => el.textContent && el.textContent.includes('4'));

    expect(oldModifiedLines.length).toBe(1);
    expect(newModifiedLines.length).toBe(1);
  });

  it('should handle multiple property changes', () => {
    component.oldJson = '{"name": "Alice", "age": 30, "city": "New York"}';
    component.newJson = '{"name": "Bob", "age": 31, "city": "Boston"}';

    component.ngOnChanges();
    fixture.detectChanges();

    const modifiedLines = fixture.nativeElement.querySelectorAll('.modified');
    expect(modifiedLines.length).toBe(6); // Three changes in each view
  });

  it('should highlight array order changes as modifications', () => {
    component.oldJson = '{"items": [1, 2, 3]}';
    component.newJson = '{"items": [3, 2, 1]}';

    component.ngOnChanges();
    fixture.detectChanges();

    // Look for 'removed' and 'added' lines for the moved elements
    const oldRemovedLines = Array.from<Element>(fixture.nativeElement.querySelectorAll('.removed'))
      .filter(el => el.textContent && (el.textContent.includes('1') || el.textContent.includes('3')));
    const newAddedLines = Array.from<Element>(fixture.nativeElement.querySelectorAll('.added'))
      .filter(el => el.textContent && (el.textContent.includes('1') || el.textContent.includes('3')));

    // At least one of the moved numbers should be highlighted as changed in both views
    expect(oldRemovedLines.length).toBe(1);
    expect(newAddedLines.length).toBe(1);
  });

  it('should detect changes in deeply nested arrays and objects', () => {
    component.oldJson = '{"a": {"b": {"c": [1, 2, 3]}}}';
    component.newJson = '{"a": {"b": {"c": [1, 4, 3]}}}';

    component.ngOnChanges();
    fixture.detectChanges();

    const oldRemoved = Array.from<Element>(fixture.nativeElement.querySelectorAll('.removed'))
      .filter(el => el.textContent && el.textContent.includes('2'));
    const newAdded = Array.from<Element>(fixture.nativeElement.querySelectorAll('.added'))
      .filter(el => el.textContent && el.textContent.includes('4'));

    expect(oldRemoved.length).toBe(1);
    expect(newAdded.length).toBe(1);
  });

  it('should detect array item property changes', () => {
    component.oldJson = '[{"id": 1, "name": "Item One"}, {"id": 2, "name": "Item Two"}]';
    component.newJson = '[{"id": 1, "name": "Item One"}, {"id": 2, "name": "Item 2"}]';

    component.ngOnChanges();
    fixture.detectChanges();

    const modifiedLines = fixture.nativeElement.querySelectorAll('.modified');
    expect(modifiedLines.length).toBe(2); // One in each view
    expect(modifiedLines[0].textContent).toContain('name');
    expect(modifiedLines[0].textContent).toContain('Item Two');
    expect(modifiedLines[1].textContent).toContain('Item 2');
  });

  it('should detect type changes', () => {
    component.oldJson = '{"value": 123}';
    component.newJson = '{"value": "123"}';

    component.ngOnChanges();
    fixture.detectChanges();

    const modifiedLines = fixture.nativeElement.querySelectorAll('.modified');
    expect(modifiedLines.length).toBe(2); // One in each view
    expect(modifiedLines[0].textContent).toContain('value');
  });

  it('should detect null to value changes', () => {
    component.oldJson = '{"key": null}';
    component.newJson = '{"key": "not null"}';

    component.ngOnChanges();
    fixture.detectChanges();

    const modifiedLines = fixture.nativeElement.querySelectorAll('.modified');
    expect(modifiedLines.length).toBe(2);
    expect(modifiedLines[0].textContent).toContain('key');
  });

  it('should detect array item addition and removal', () => {
    component.oldJson = '{"arr": [1, 2, 3]}';
    component.newJson = '{"arr": [1, 2, 3, 4]}';

    component.ngOnChanges();
    fixture.detectChanges();

    const addedLines = Array.from<Element>(fixture.nativeElement.querySelectorAll('.added'))
      .filter(el => el.textContent && el.textContent.includes('4'));
    expect(addedLines.length).toBeGreaterThan(0);
  });

  it('should handle empty inputs', () => {
    component.oldJson = null;
    component.newJson = null;
    component.ngOnChanges();
    fixture.detectChanges();

    const panels = fixture.nativeElement.querySelectorAll('.json-panel');
    expect(panels.length).toBe(0); // or 2 panels with no content, depending on implementation
  });

  it('should identify unchanged properties', () => {
    component.oldJson = '{"a": 1, "b": 2}';
    component.newJson = '{"a": 1, "b": 2}';
    component.ngOnChanges();
    fixture.detectChanges();

    const added = fixture.nativeElement.querySelectorAll('.added');
    const removed = fixture.nativeElement.querySelectorAll('.removed');
    const modified = fixture.nativeElement.querySelectorAll('.modified');
    expect(added.length + removed.length + modified.length).toBe(0);
  });

  it('should detect array type changes from number to object', () => {
    component.oldJson = '{"b": [5]}';
    component.newJson = '{"b": [{"a": "b"}]}';

    component.ngOnChanges();
    fixture.detectChanges();

    const oldRemovedLines = Array.from<Element>(fixture.nativeElement.querySelectorAll('.removed'))
      .filter(el => el.textContent && el.textContent.includes('5'));
    const newAddedLines = Array.from<Element>(fixture.nativeElement.querySelectorAll('.added'))
      .filter(el => el.textContent &&
        (
          el.textContent.includes('"a": "b"')
          || el.textContent.includes('{')
          || el.textContent.includes('}')
        )
      );

    expect(oldRemovedLines.length).toBe(1);
    expect(newAddedLines.length).toBe(3);
  });
});