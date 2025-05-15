import { CUSTOM_ELEMENTS_SCHEMA, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ExternalBackgroundComponent } from './external-component-wrappers/external-background/external-background.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ExternalBackgroundComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent {
  title = 'pymo';
}
