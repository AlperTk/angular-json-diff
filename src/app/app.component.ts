import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JsonDiffViewerComponent } from './components/json-diff-viewer/json-diff-viewer.component';
import { TableJsonDiffViewerComponent } from './components/table-json-diff-viewer/table-json-diff-viewer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    JsonDiffViewerComponent,
    TableJsonDiffViewerComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'my-angular-app';

  json1 = `{"items": [1, 2, 3]}`;

  json2 = `{"items": [1, 2, 4]}`;

  activeTab: 'line' | 'table' = 'line';
}
