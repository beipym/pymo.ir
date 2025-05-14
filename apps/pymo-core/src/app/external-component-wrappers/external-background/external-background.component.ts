import { Component, ElementRef, AfterViewInit, OnDestroy, ViewChild, ChangeDetectionStrategy} from '@angular/core';

// Declare the global variable to inform TypeScript about its existence and structure
declare var MyViteBackground: {
  initialize: (targetElement: HTMLElement) => void;
  destroy: (targetElement: HTMLElement) => void;
};

@Component({
  selector: 'app-external-background',
  imports: [],
  templateUrl: './external-background.component.html',
  styleUrl: './external-background.component.scss'
})
export class ExternalBackgroundComponent {
  @ViewChild('backgroundHost') backgroundHost!: ElementRef<HTMLDivElement>;

  private isInitialized = false;

  ngAfterViewInit(): void {
    if (typeof MyViteBackground !== 'undefined' && MyViteBackground.initialize) {
      if (this.backgroundHost && this.backgroundHost.nativeElement) {
        MyViteBackground.initialize(this.backgroundHost.nativeElement);
        this.isInitialized = true;
      } else {
        console.error('Angular wrapper: backgroundHost element not found.');
      }
    } else {
      console.error('MyViteBackground script not loaded or initialize function not found.');
    }
  }

  ngOnDestroy(): void {
    if (this.isInitialized && typeof MyViteBackground !== 'undefined' && MyViteBackground.destroy) {
      if (this.backgroundHost && this.backgroundHost.nativeElement) {
        MyViteBackground.destroy(this.backgroundHost.nativeElement);
      }
    }
  }
}
