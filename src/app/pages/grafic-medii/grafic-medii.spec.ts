import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraficMedii } from './grafic-medii';

describe('GraficMedii', () => {
  let component: GraficMedii;
  let fixture: ComponentFixture<GraficMedii>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraficMedii]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GraficMedii);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
