import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JsonDiffViewerComponent } from './components/json-diff-viewer/json-diff-viewer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule, JsonDiffViewerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'my-angular-app';

  json1 = `{
  "id": 101,
  "name": "Alice",
  "age": 30,
  "email": "alice@example.com",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "zip": "10001"
  },
  "preferences": {
    "newsletter": true,
    "notifications": {
      "email": true,
      "sms": false
    }
  },
  "accountStatus": "active",
  "createdAt": "2023-07-01T10:00:00Z"
}`;

  json2 = `{
  "id": 101,
  "name": "Alice Smith",
  "age": 31,
  "phone": "123-456-7890",
  "address": {
    "street": "456 Market St",
    "city": "New York",
    "state": "NY"
  },
  "preferences": {
    "newsletter": false,
    "notifications": {
      "email": true,
      "sms": true,
      "push": true
    },
    "theme": "dark"
  },
  "accountStatus": "suspended",
  "lastLogin": "2024-05-20T08:30:00Z"
}`;
}
