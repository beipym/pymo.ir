import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ExternalBackgroundComponent } from './external-component-wrappers/external-background/external-background.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ExternalBackgroundComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'pymo';
}
