import { Component, ElementRef, AfterViewInit, OnDestroy, ViewChild, ChangeDetectionStrategy, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';

@Component({
  selector: 'app-external-background',
  imports: [],
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './external-background.component.html',
  styleUrl: './external-background.component.scss'
})
export class ExternalBackgroundComponent implements AfterViewInit {
  hello = '#ffffff'
 
  ngAfterViewInit(): void {

  }
}
