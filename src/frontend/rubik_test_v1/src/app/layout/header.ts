import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';

@Component({
    selector: 'app-header',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatToolbar],
    template: `
        <mat-toolbar color="primary">
            <span class="title">Rubik Learner</span>
        </mat-toolbar>
    `,
    styles: `
        mat-toolbar {
            position: sticky;
            top: 0;
            z-index: 1;
            background-color: var(--mat-sys-primary);
            color: var(--mat-sys-on-primary);
        }

        .title {
            font-weight: 500;
        }
    `,
})
export class Header {}
