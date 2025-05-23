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
    expect(removedLines.length).toBeGreaterThan(0);
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
    expect(addedLines.length).toBeGreaterThan(0);
    expect(addedLines[0].textContent).toContain('contact');
  });

  it('should handle invalid JSON', () => {
    spyOn(console, 'error');
    component.oldJson = 'invalid json';
    component.newJson = '{"name": "Alice"}';
    
    component.ngOnChanges();
    fixture.detectChanges();

    expect(console.error).toHaveBeenCalled();
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

  it('should mark all lines as added when old JSON is empty', () => {
    component.oldJson = '';
    component.newJson = '{"name": "Alice", "age": 30}';
    
    component.ngOnChanges();
    fixture.detectChanges();

    const addedLines = fixture.nativeElement.querySelectorAll('.added');
    expect(addedLines.length).toBe(4); // All lines should be marked as added
    expect(fixture.nativeElement.querySelector('.json-panel.old')).toBeFalsy();
  });

  it('should mark all lines as removed when new JSON is empty', () => {
    component.oldJson = '{"name": "Alice", "age": 30}';
    component.newJson = '';
    
    component.ngOnChanges();
    fixture.detectChanges();

    const removedLines = fixture.nativeElement.querySelectorAll('.removed');
    expect(removedLines.length).toBe(4); // All lines should be marked as removed
    expect(fixture.nativeElement.querySelector('.json-panel.new')).toBeFalsy();
  });
});