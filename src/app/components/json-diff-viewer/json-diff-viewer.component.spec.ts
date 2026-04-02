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

    // Check for any changed lines (modified, added, or removed)
    const changedLines = fixture.nativeElement.querySelectorAll('[class*="removed"], [class*="added"], [class*="modified"]');
    expect(changedLines.length).toBeGreaterThan(0);
    const hasNameChange = Array.from(changedLines).some(el => 
      el.textContent.includes('name') && 
      (el.textContent.includes('Item Two') || el.textContent.includes('Item 2'))
    );
    expect(hasNameChange).toBe(true);
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

  it('should detect value to null as modification', () => {
    component.oldJson = '{"key": "value"}';
    component.newJson = '{"key": null}';
    component.ngOnChanges();
    fixture.detectChanges();

    const modifiedLines = fixture.nativeElement.querySelectorAll('.modified');
    expect(modifiedLines.length).toBe(2);
    expect(modifiedLines[0].textContent).toContain('key');
  });

  it('should handle empty object without changes', () => {
    component.oldJson = '{}';
    component.newJson = '{}';
    component.ngOnChanges();
    fixture.detectChanges();

    const added = fixture.nativeElement.querySelectorAll('.added');
    const removed = fixture.nativeElement.querySelectorAll('.removed');
    const modified = fixture.nativeElement.querySelectorAll('.modified');
    expect(added.length + removed.length + modified.length).toBe(0);
  });

  it('should handle empty array without changes', () => {
    component.oldJson = '[]';
    component.newJson = '[]';
    component.ngOnChanges();
    fixture.detectChanges();

    const added = fixture.nativeElement.querySelectorAll('.added');
    const removed = fixture.nativeElement.querySelectorAll('.removed');
    const modified = fixture.nativeElement.querySelectorAll('.modified');
    expect(added.length + removed.length + modified.length).toBe(0);
  });

  it('should detect boolean changes', () => {
    component.oldJson = '{"flag": true}';
    component.newJson = '{"flag": false}';
    component.ngOnChanges();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.modified').length).toBe(2);
  });

  it('should detect unicode keys and values', () => {
    component.oldJson = '{"🔑": "🚪"}';
    component.newJson = '{"🔑": "🔓"}';
    component.ngOnChanges();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.modified').length).toBe(2);
  });

  it('should parse windows CRLF line endings correctly', () => {
    component.oldJson = '{\r\n"a": 1\r\n}';
    component.newJson = '{\r\n"a": 2\r\n}';
    component.ngOnChanges();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.modified').length).toBe(2);
  });

  it('should handle keys containing dots literally', () => {
    component.oldJson = '{"a.b": 1}';
    component.newJson = '{"a.b": 2}';
    component.ngOnChanges();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.modified').length).toBe(2);
  });

  it('should detect array reorder duplicates', () => {
    component.oldJson = '{"arr": [1, 1, 2]}';
    component.newJson = '{"arr": [2, 1, 1]}';
    component.ngOnChanges();
    fixture.detectChanges();

    const removed = fixture.nativeElement.querySelectorAll('.removed');
    const added = fixture.nativeElement.querySelectorAll('.added');
    expect(removed.length).toBeGreaterThan(0);
    expect(added.length).toBeGreaterThan(0);
  });

  it('should recover from invalid to valid JSON on sequential changes', () => {
    const originalError = console.error;
    console.error = jest.fn();

    component.oldJson = 'invalid';
    component.newJson = '{"a":1}';
    component.ngOnChanges();
    fixture.detectChanges();

    expect(console.error).toHaveBeenCalled();

    component.oldJson = '{"a":1}';
    component.newJson = '{"a":2}';
    component.ngOnChanges();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.modified').length).toBe(2);
    console.error = originalError;
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

  it('should handle array removal scenario', () => {
    // Testing the specific scenario from HTML output
    component.oldJson = '[{"id": 1}, {"id": 2}, {"id": 3}]';
    component.newJson = '[{"id": 2}, {"id": 3}]';
    component.ngOnChanges();
    fixture.detectChanges();
    
  const removedLines = fixture.nativeElement.querySelectorAll('.removed');
  expect(removedLines.length).toBe(3); // 3 lines for the removed object
  
  // Validate each line content - what we actually get is the full object structure
  expect(removedLines[0].textContent.trim()).toBe('{'); // Opening brace of removed object
  expect(removedLines[1].textContent.trim()).toBe('"id": 1'); // Property content
  expect(removedLines[2].textContent.trim()).toBe('},'); // Closing brace with comma (due to JSON formatting)
  });

  // Array vs Object comparison tests
  describe('Array vs Object Comparison', () => {
    it('should detect transformation from array to object', () => {
      component.oldJson = `[
    {
      "id": 1,
      "name": "Item One",
      "value": 100
    }
]`;
      component.newJson = `{
  "items": [
    {
      "id": 1,
      "name": "Item One",
      "value": 100
    }
  ],
  "metadata": {
    "version": "1.1",
    "timestamp": "2026-03-30T14:00:00Z"
  }
}`;
      component.ngOnChanges();
      fixture.detectChanges();

      // When structure completely changes from array to object wrapper,
      // both JSON views should be rendered
      const oldPanel = fixture.nativeElement.querySelector('.json-panel.old');
      const newPanel = fixture.nativeElement.querySelector('.json-panel.new');
      
      expect(oldPanel).toBeTruthy();
      expect(newPanel).toBeTruthy();
      
      // Check for content from old structure (array format)
      expect(oldPanel?.textContent).toContain('Item One');
      expect(oldPanel?.textContent).toContain('100');
      
      // Check for content from new structure (wrapped in object)
      expect(newPanel?.textContent).toContain('items');
      expect(newPanel?.textContent).toContain('metadata');
      expect(newPanel?.textContent).toContain('version');
      expect(newPanel?.textContent).toContain('Item One');
    });

    it('should detect root level change from array to object', () => {
      component.oldJson = '[1, 2, 3]';
      component.newJson = '{"numbers": [1, 2, 3]}';
      
      component.ngOnChanges();
      fixture.detectChanges();

      // Both views should display their respective JSON
      const oldPanel = fixture.nativeElement.querySelector('.json-panel.old');
      const newPanel = fixture.nativeElement.querySelector('.json-panel.new');
      
      expect(oldPanel?.textContent).toContain('[');
      expect(oldPanel?.textContent).toContain('1');
      expect(newPanel?.textContent).toContain('numbers');
      expect(newPanel?.textContent).toContain('[');
    });

    it('should detect root level change from object to array', () => {
      component.oldJson = '{"items": [1, 2, 3]}';
      component.newJson = '[1, 2, 3]';
      
      component.ngOnChanges();
      fixture.detectChanges();

      // Both views should display their respective JSON
      const oldPanel = fixture.nativeElement.querySelector('.json-panel.old');
      const newPanel = fixture.nativeElement.querySelector('.json-panel.new');
      
      expect(oldPanel?.textContent).toContain('items');
      expect(oldPanel?.textContent).toContain('[');
      expect(newPanel?.textContent).toContain('[');
      expect(newPanel?.textContent).toContain('1');
    });

    it('should handle array of objects vs single object', () => {
      component.oldJson = '[{"type": "A", "count": 1}, {"type": "B", "count": 2}]';
      component.newJson = '{"type": "A", "count": 1}';
      
      component.ngOnChanges();
      fixture.detectChanges();

      // When structure changes from array to object, both should be rendered
      const oldPanel = fixture.nativeElement.querySelector('.json-panel.old');
      const newPanel = fixture.nativeElement.querySelector('.json-panel.new');
      
      expect(oldPanel?.textContent).toContain('[');
      expect(oldPanel?.textContent).toContain('type');
      expect(newPanel?.textContent).toContain('{');
      expect(newPanel?.textContent).toContain('type');
    });

    it('should detect wrapping array in new object structure', () => {
      component.oldJson = '[{"id": 1, "name": "Item"}]';
      component.newJson = '{"data": [{"id": 1, "name": "Item"}], "success": true}';
      
      component.ngOnChanges();
      fixture.detectChanges();

      // When array is wrapped in an object, both structures should be rendered
      const oldPanel = fixture.nativeElement.querySelector('.json-panel.old');
      const newPanel = fixture.nativeElement.querySelector('.json-panel.new');
      
      expect(oldPanel?.textContent).toContain('[');
      expect(oldPanel?.textContent).toContain('id');
      expect(newPanel?.textContent).toContain('data');
      expect(newPanel?.textContent).toContain('success');
    });

    it('should detect change from empty array to object', () => {
      component.oldJson = '[]';
      component.newJson = '{"count": 0, "items": []}';
      
      component.ngOnChanges();
      fixture.detectChanges();

      // When empty array becomes an object with properties
      const oldPanel = fixture.nativeElement.querySelector('.json-panel.old');
      const newPanel = fixture.nativeElement.querySelector('.json-panel.new');
      
      expect(oldPanel?.textContent).toContain('[]');
      expect(newPanel?.textContent).toContain('count');
      expect(newPanel?.textContent).toContain('items');
    });

    it('should detect change from empty object to array', () => {
      component.oldJson = '{}';
      component.newJson = '[{"empty": true}]';
      
      component.ngOnChanges();
      fixture.detectChanges();

      // When root structure completely changes from object to array,
      // the component should render both JSON structures
      const oldPanel = fixture.nativeElement.querySelector('.json-panel.old');
      const newPanel = fixture.nativeElement.querySelector('.json-panel.new');
      
      expect(oldPanel?.textContent).toContain('{}');
      expect(newPanel?.textContent).toContain('[');
      expect(newPanel?.textContent).toContain('empty');
    });

    it('should detect complex nested array to object transformation', () => {
      component.oldJson = `[
  {"category": "A", "items": [1, 2, 3]},
  {"category": "B", "items": [4, 5, 6]}
]`;
      component.newJson = `{
  "categories": [
    {"category": "A", "items": [1, 2, 3]},
    {"category": "B", "items": [4, 5, 6]}
  ],
  "totalCount": 2
}`;
      
      component.ngOnChanges();
      fixture.detectChanges();

      // When root structure changes from array to object,
      // both views should display their JSON with structural differences
      const oldPanel = fixture.nativeElement.querySelector('.json-panel.old');
      const newPanel = fixture.nativeElement.querySelector('.json-panel.new');
      
      expect(oldPanel?.textContent).toContain('category');
      expect(newPanel?.textContent).toContain('categories');
      expect(newPanel?.textContent).toContain('totalCount');
    });

    it('should detect array vs object with same content but different structure', () => {
      component.oldJson = '[{"id": 1, "value": "A"}, {"id": 2, "value": "B"}]';
      component.newJson = '{"records": [{"id": 1, "value": "A"}, {"id": 2, "value": "B"}]}';
      
      component.ngOnChanges();
      fixture.detectChanges();

      // The component should display both structures with their content
      const oldPanel = fixture.nativeElement.querySelector('.json-panel.old');
      const newPanel = fixture.nativeElement.querySelector('.json-panel.new');
      
      expect(oldPanel?.textContent).toContain('id');
      expect(oldPanel?.textContent).toContain('value');
      expect(newPanel?.textContent).toContain('records');
      expect(newPanel?.textContent).toContain('id');
      expect(newPanel?.textContent).toContain('value');
    });
  });
});