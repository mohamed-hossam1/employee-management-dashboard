import { Component } from '@angular/core';

import { ThemeSettingsComponent } from '../../components/theme-settings/theme-settings';
import { NotificationSettingsComponent } from '../../components/notification-settings/notification-settings';
import { AccountSettingsComponent } from '../../components/account-settings/account-settings';

@Component({
  selector: 'app-settings-page',
  imports: [
    ThemeSettingsComponent,
    NotificationSettingsComponent,
    AccountSettingsComponent
  ],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.css'
})
export class SettingsPage {}
