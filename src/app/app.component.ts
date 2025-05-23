import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JsonDiffViewerComponent } from './components/json-diff-viewer/json-diff-viewer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FormsModule, JsonDiffViewerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'my-angular-app';

  json1 = `{
    "name": "Alice",
    "age": 30,
    "city": "Paris"
  }`;

  json2 = `{
    "name": "Alice",
    "age": 31,
    "city": "London"
  }`;
}
