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
  "cardType": "MASTERCARD",
  "modificationTimestamp": null,
  "operationMode": "PROCESS_REQUEST",
  "settings": [
    {
      "category": "MESSAGE_OPTIONS",
      "settingName": "header-length",
      "settingValue": 128
    },
    {
      "category": "ENCRYPTION_OPTIONS",
      "settingName": "dynamic-key",
      "settingValue": "false"
    }
  ],
  "locationConfigs": [
    {
      "server": "192.168.1.1",
      "connectionPort": "8080",
      "locationId": "10",
      "connectionStatus": "ENABLED",
      "keyConfig": {
        "receiverKey": "",
        "receiverKeyCheck": null,
        "receiverKeyStatus": null,
        "mainKeyCheck": "****",
        "mainKeyDate": null,
        "mainKeyType": "Q",
        "usage": "AUTH"
      }
    },
    {
      "server": "192.168.1.2",
      "connectionPort": "9090",
      "locationId": "11",
      "connectionStatus": "ENABLED",
      "keyConfig": {
        "receiverKey": "",
        "receiverKeyCheck": null,
        "receiverKeyStatus": null,
        "issuerPinCCheck": "****",
        "issuerPinCStatus": "ENABLED",
        "issuerPinIndex": 2,
        "mainKey": "************************************************************",
        "mainKeyCheck": "****",
        "mainKeyDate": null,
        "mainKeyType": "Q",
        "usage": "AUTH"
      }
    }
  ],
  "category": "secure"
}
`;

  json2 = `
{
  "cardType": "MASTERCARD",
  "modificationTimestamp": null,
  "operationMode": "PROCESS_REQUEST",
  "settings": [
    {
      "category": "MESSAGE_OPTIONS",
      "settingName": "header-length",
      "settingValue": 128
    },
    {
      "category": "ENCRYPTION_OPTIONS",
      "settingName": "dynamic-key",
      "settingValue": "false"
    }
  ],
  "locationConfigs": [
    {
      "server": "192.168.1.1",
      "connectionPort": "8080",
      "locationId": "10",
      "connectionStatus": "ENABLED",
      "keyConfig": {
        "receiverKey": "",
        "receiverKeyCheck": null,
        "receiverKeyStatus": null,
        "mainKeyCheck": "****",
        "mainKeyDate": null,
        "mainKeyType": "Q",
        "usage": "AUTH"
      }
    },
    {
      "server": "192.168.1.2",
      "connectionPort": "9090",
      "locationId": "11",
      "connectionStatus": "ENABLED",
      "keyConfig": {
        "receiverKey": "2",
        "receiverKeyCheck": null,
        "receiverKeyStatus": null,
        "issuerPinCCheck": "****",
        "issuerPinCStatus": "ENABLED",
        "issuerPinIndex": 2,
        "mainKey": "************************************************************",
        "mainKeyCheck": "****",
        "mainKeyDate": null,
        "mainKeyType": "Q",
        "usage": "AUTH"
      }
    }
  ],
  "category": "secure"
}
`;

  activeTab: 'line' | 'table' = 'table';
}
