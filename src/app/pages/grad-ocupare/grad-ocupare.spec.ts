import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GradOcupare } from './grad-ocupare';

describe('GradOcupare', () => {
  let component: GradOcupare;
  let fixture: ComponentFixture<GradOcupare>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GradOcupare]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GradOcupare);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
