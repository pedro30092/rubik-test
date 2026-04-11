import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2>Home</h2>
    <p>Welcome to Rubik Learner dashboard.</p>
  `,
})
export class Home {}
