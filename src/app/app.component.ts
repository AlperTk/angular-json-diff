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

  json1 = `
{
  "name": "Alice",
  "age": 30,
  "email": "alice@example.com",
  "isActive": true,
  "roles": ["admin", "editor"],
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "zip": "12345"
  },
  "lastLogin": "2025-05-27T10:30:00Z"
}
`;

  json2 = `
{
  "name": "Alice",
  "age": 30,
  "email": "alice2@example.com",
  "isActive": true,
  "roles": ["admin2", "editor"],
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "zip": "12345"
  },
  "lastLogin": "2025-05-27T10:30:00Z"
}
`;

  activeTab: 'line' | 'table' = 'table';
}
