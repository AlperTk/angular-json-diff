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
  "identifier": "**********",
  "creator": null,
  "creationTimestamp": null,
  "details": "MASTERCARD",
  "dataFormat": "ASCII_HEX",
  "bankId": "******",
  "modifiedBy": null,
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
        "receiverPinA": "************************************************************",
        "receiverPinACheck": "****",
        "receiverPinAStatus": "ENABLED",
        "receiverPinB": "************************************************************",
        "receiverPinBCheck": "****",
        "receiverPinBStatus": "ENABLED",
        "receiverPinC": "************************************************************",
        "receiverPinCCheck": "****",
        "receiverPinCStatus": "ENABLED",
        "receiverPinIndex": 2,
        "issuerKey": "",
        "issuerKeyCheck": null,
        "issuerKeyStatus": null,
        "issuerPinA": "************************************************************",
        "issuerPinACheck": "****",
        "issuerPinAStatus": "ENABLED",
        "issuerPinB": "************************************************************",
        "issuerPinBCheck": "****",
        "issuerPinBStatus": "ENABLED",
        "issuerPinC": "************************************************************",
        "issuerPinCCheck": "****",
        "issuerPinCStatus": "ENABLED",
        "issuerPinIndex": 2,
        "mainKey": "************************************************************",
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
        "receiverPinA": "************************************************************",
        "receiverPinACheck": "****",
        "receiverPinAStatus": "ENABLED",
        "receiverPinB": "************************************************************",
        "receiverPinBCheck": "****",
        "receiverPinBStatus": "ENABLED",
        "receiverPinC": "************************************************************",
        "receiverPinCCheck": "****",
        "receiverPinCStatus": "ENABLED",
        "receiverPinIndex": 2,
        "issuerKey": "",
        "issuerKeyCheck": null,
        "issuerKeyStatus": null,
        "issuerPinA": "************************************************************",
        "issuerPinACheck": "****",
        "issuerPinAStatus": "ENABLED",
        "issuerPinB": "************************************************************",
        "issuerPinBCheck": "****",
        "issuerPinBStatus": "ENABLED",
        "issuerPinC": "************************************************************",
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
  "identifier": "**********",
  "creator": null,
  "creationTimestamp": null,
  "details": "MASTERCARD",
  "dataFormat": "ASCII_HEX",
  "bankId": "******",
  "modificationTimestamp": null,
  "operationMode": "PROCESS_REQUEST",
  "environment": "production",
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
      "region": "US-EAST",
      "keyConfig": {
        "receiverKey": "",
        "receiverKeyCheck": null,
        "receiverKeyStatus": null,
        "receiverPinA": "************************************************************",
        "receiverPinACheck": "****",
        "receiverPinAStatus": "ENABLED",
        "receiverPinB": "************************************************************",
        "receiverPinBCheck": "****",
        "receiverPinBStatus": "ENABLED",
        "receiverPinC": "************************************************************",
        "receiverPinCCheck": "****",
        "receiverPinCStatus": "ENABLED",
        "issuerKey": "",
        "issuerKeyCheck": null,
        "issuerKeyStatus": null,
        "issuerPinA": "************************************************************",
        "issuerPinACheck": "****",
        "issuerPinAStatus": "ENABLED",
        "issuerPinB": "************************************************************",
        "issuerPinBCheck": "****",
        "issuerPinBStatus": "ENABLED",
        "issuerPinC": "************************************************************",
        "issuerPinCCheck": "****",
        "issuerPinCStatus": "ENABLED",
        "mainKey": "************************************************************",
        "mainKeyCheck": "****",
        "mainKeyDate": null,
        "mainKeyType": "Q",
        "usage": "AUTH",
        "isEncrypted": true
      }
    },
    {
      "server": "192.168.1.2",
      "connectionPort": "9090",
      "locationId": "11",
      "connectionStatus": "ENABLED",
      "region": "US-EAST",
      "keyConfig": {
        "receiverKey": "",
        "receiverKeyCheck": null,
        "receiverKeyStatus": null,
        "receiverPinA": "************************************************************",
        "receiverPinACheck": "****",
        "receiverPinAStatus": "ENABLED",
        "receiverPinB": "************************************************************",
        "receiverPinBCheck": "****",
        "receiverPinBStatus": "ENABLED",
        "receiverPinC": "************************************************************",
        "receiverPinCCheck": "****",
        "receiverPinCStatus": "ENABLED",
        "issuerKey": "",
        "issuerKeyCheck": null,
        "issuerKeyStatus": null,
        "issuerPinA": "************************************************************",
        "issuerPinACheck": "****",
        "issuerPinAStatus": "ENABLED",
        "issuerPinB": "************************************************************",
        "issuerPinBCheck": "****",
        "issuerPinBStatus": "ENABLED",
        "issuerPinC": "************************************************************",
        "issuerPinCCheck": "****",
        "issuerPinCStatus": "ENABLED",
        "mainKey": "************************************************************",
        "mainKeyCheck": "****",
        "mainKeyDate": null,
        "mainKeyType": "Q",
        "usage": "AUTH",
        "isEncrypted": true
      }
    }
  ],
  "category": "secure"
}
`;

  activeTab: 'line' | 'table' = 'line';
}
