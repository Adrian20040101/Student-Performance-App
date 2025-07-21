import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupedSpecializationRow } from './grouped-specialization-row';

describe('GroupedSpecializationRow', () => {
  let component: GroupedSpecializationRow;
  let fixture: ComponentFixture<GroupedSpecializationRow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupedSpecializationRow]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupedSpecializationRow);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
