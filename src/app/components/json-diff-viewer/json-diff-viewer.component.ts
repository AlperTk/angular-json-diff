import { Component, Input, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HighlightModule } from 'ngx-highlightjs';
import { JsonDiffService } from '../../services/json-diff.service';
import { JsonLineDiffService, LineInfo } from '../../services/json-line-diff.service';

@Component({
  selector: 'app-json-diff-viewer',
  standalone: true,
  imports: [CommonModule, HighlightModule],
  templateUrl: './json-diff-viewer.component.html',
  styleUrls: ['./json-diff-viewer.component.scss']
})
export class JsonDiffViewerComponent implements OnChanges {
  private jsonDiffService = inject(JsonDiffService);
  private jsonLineDiffService = inject(JsonLineDiffService);

  @Input() oldJson: string | null = '';
  @Input() newJson: string | null = '';
  @Input() objectHashFunction: ((obj: any) => any) = function (obj) {
    return obj && typeof obj === 'object' ? obj.id || JSON.stringify(obj) : obj;
  };


  oldJsonLines: LineInfo[] = [];
  newJsonLines: LineInfo[] = [];

  ngOnChanges() {
    const oldResult = this.jsonDiffService.parseJson(this.oldJson);
    const newResult = this.jsonDiffService.parseJson(this.newJson);

    if (oldResult.error || newResult.error) {
      console.error('Invalid JSON input:', oldResult.error || newResult.error);
      this.oldJsonLines = [];
      this.newJsonLines = [];
      return;
    }

    const lines = this.jsonLineDiffService.buildLinesForJson(oldResult.value, newResult.value, this.objectHashFunction);
    this.oldJsonLines = lines.oldJsonLines;
    this.newJsonLines = lines.newJsonLines;
  }
}
