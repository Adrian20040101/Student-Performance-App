import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Licee } from './licee';

describe('Licee', () => {
  let component: Licee;
  let fixture: ComponentFixture<Licee>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Licee]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Licee);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
