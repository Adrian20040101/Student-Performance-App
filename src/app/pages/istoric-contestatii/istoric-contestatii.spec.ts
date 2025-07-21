import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IstoricContestatii } from './istoric-contestatii';

describe('IstoricContestatii', () => {
  let component: IstoricContestatii;
  let fixture: ComponentFixture<IstoricContestatii>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IstoricContestatii]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IstoricContestatii);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
