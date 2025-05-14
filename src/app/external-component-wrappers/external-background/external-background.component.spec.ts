import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExternalBackgroundComponent } from './external-background.component';

describe('ExternalBackgroundComponent', () => {
  let component: ExternalBackgroundComponent;
  let fixture: ComponentFixture<ExternalBackgroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExternalBackgroundComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExternalBackgroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
