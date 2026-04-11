import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>Settings</h2>
    <p>Application settings will appear here.</p>
  `,
})
export class Settings {}
