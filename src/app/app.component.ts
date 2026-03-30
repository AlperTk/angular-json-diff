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
  "items": [
    {
      "id": 1,
      "name": "Item One",
      "value": 100
    },
    {
      "id": 2,
      "name": "Item Two",
      "value": 200
    },
    {
      "id": 3,
      "name": "Item Three",
      "value": 300
    },
    {
      "id": 4,
      "name": "Item Four",
      "value": 400
    },
    {
      "id": 5,
      "name": "Item Five",
      "value": 500
    }
  ],
  "metadata": {
    "version": "1.0",
    "timestamp": "2026-03-30T12:00:00Z"
  }
}

`;

  json2 = `
  {
    "items": [
      {
        "id": 1,
        "name": "Item One",
        "value": 100
      },
      {
        "id": 3,
        "name": "Item Three",
        "value": 350
      },
      {
        "id": 4,
        "name": "Item Four",
        "value": 400
      },
      {
        "id": 6,
        "name": "Item Six",
        "value": 600
      },
      {
        "id": 7,
        "name": "Item Seven",
        "value": 700
      }
    ],
    "metadata": {
      "version": "1.1",
      "timestamp": "2026-03-30T14:00:00Z"
    }
  }
`;

  activeTab: 'line' | 'table' = 'table';
}
