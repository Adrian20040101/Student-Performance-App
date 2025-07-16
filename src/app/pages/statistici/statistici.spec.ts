import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Statistici } from './statistici';

describe('Statistici', () => {
  let component: Statistici;
  let fixture: ComponentFixture<Statistici>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Statistici]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Statistici);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
