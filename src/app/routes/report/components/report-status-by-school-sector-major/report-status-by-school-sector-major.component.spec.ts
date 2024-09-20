import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportStatusBySchoolSectorMajorComponent } from './report-status-by-school-sector-major.component';

describe('ReportStatusBySchoolSectorMajorComponent', () => {
  let component: ReportStatusBySchoolSectorMajorComponent;
  let fixture: ComponentFixture<ReportStatusBySchoolSectorMajorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReportStatusBySchoolSectorMajorComponent]
    });
    fixture = TestBed.createComponent(ReportStatusBySchoolSectorMajorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
