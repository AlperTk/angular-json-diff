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
    "name": "Alice",
    "contact": {
      "email": "alice@email.com",
      "phone": {
        "home": "123-456",
        "mobile": "789-012"
      }
    }
  }`;

  json2 = `{
    "name": "Alice"
  }`;
}
