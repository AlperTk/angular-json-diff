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
});
