import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatNavList, MatListItem } from '@angular/material/list';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-sidebar',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterLink, RouterLinkActive, MatNavList, MatListItem, MatIcon],
    template: `
        <mat-nav-list>
            @for (item of menuItems; track item.route) {
                <a mat-list-item [routerLink]="item.route" routerLinkActive="active-link">
                    <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                    <span matListItemTitle>{{ item.label }}</span>
                </a>
            }
        </mat-nav-list>
    `,
    styles: `
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            background-color: var(--mat-sys-primary-container);
        }

        mat-nav-list {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
        }

        a[mat-list-item] {
            display: flex !important;
            align-items: center !important;
            border-radius: 0;
            margin-inline-end: 0;
            --mat-list-list-item-label-text-color: var(--mat-sys-on-primary-container);
            --mat-list-list-item-leading-icon-color: var(--mat-sys-on-primary-container);
        }

        mat-icon[matlistitemicon] {
            flex-shrink: 0;
            align-self: center;
            margin-inline-end: 12px;
        }

        .active-link {
            background-color: var(--mat-sys-primary-fixed-dim) !important;
            --mat-list-list-item-label-text-color: var(--mat-sys-on-primary-fixed) !important;
            --mat-list-list-item-leading-icon-color: var(--mat-sys-on-primary-fixed) !important;
        }
    `,
})
export class Sidebar {
    protected readonly menuItems = [
        { route: '/home', label: 'Home', icon: 'home' },
        { route: '/settings', label: 'Settings', icon: 'settings' },
    ];
}
