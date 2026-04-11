import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenav, MatSidenavContainer, MatSidenavContent } from '@angular/material/sidenav';
import { Header } from './layout/header';
import { Sidebar } from './layout/sidebar';

@Component({
    selector: 'app-root',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [RouterOutlet, MatSidenavContainer, MatSidenav, MatSidenavContent, Header, Sidebar],
    templateUrl: './app.html',
    styleUrls: ['./app.scss'],
})
export class App {}
