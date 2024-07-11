import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { Params } from '@angular/router';
import { map, takeUntil } from 'rxjs';
import { pAdmin } from 'src/app/helpers/permission';
import { DESTROYER$ } from 'src/app/helpers/unsubscribe';
import { Course } from 'src/app/models/course';
import { BaseDatatable } from 'src/app/models/datatables/base.datatable';
import { TableColumn } from 'src/app/models/table-column';
import { CourseService } from 'src/app/services/course.service';
import { DialogService } from 'src/app/services/dialog.service';
import { LoadingService } from 'src/app/services/loading.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { Pagination } from 'src/app/shares/pagination/pagination';
import { SnackbarComponent } from 'src/app/shares/snackbar/components/snackbar/snackbar.component';
import { log } from 'util';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-report-course',
  templateUrl: './report-course.component.html',
  styleUrls: ['./report-course.component.scss']
})
export class ReportCourseComponent {
  date: string = new Date().toISOString();

  pCourse = pAdmin.course;
  formDate = inject(FormBuilder).group({
    start: [null, Validators.required],
    end: [null, Validators.required]
  });
  tableColumns: TableColumn[] = [
    {
      name: 'table.code',
      dataKey: 'code',
      custom: true
    },
    {
      name: 'table.major',
      dataKey: 'major',
      custom: true
    },
    {
      name: 'table.registration_start_date',
      dataKey: 'register_start_date',
      custom: true
    },
    {
      name: 'table.registration_end_date',
      dataKey: 'register_end_date',
      custom: true
    },
    {
      name: 'table.course_start_date',
      dataKey: 'course_start_date',
      custom: true
    },
    {
      name: 'table.course_end_date',
      dataKey: 'course_end_date',
      custom: true
    },
    {
      name: 'table.shift',
      dataKey: 'shift',
      custom: true
    },
    {
      name: 'table.school',
      dataKey: 'school',
      custom: true
    },
    {
      name: 'table.total_register',
      dataKey: 'total_register',
      custom: true
    },
    {
      name: 'table.total_register_female',
      dataKey: 'total_register_female',
      custom: true
    },
    {
      name: 'table.total_register_poorid',
      dataKey: 'total_register_poorid',
      custom: true
    },
    {
      name: 'table.total_register_poorid_female',
      dataKey: 'total_register_poorid_female',
      custom: true
    },
    {
      name: 'table.total_approve',
      dataKey: 'total_approve',
      custom: true
    },
    {
      name: 'table.total_approve_female',
      dataKey: 'total_approve_female',
      custom: true
    },
    {
      name: 'table.total_approve_poorid',
      dataKey: 'total_approve_poorid',
      custom: true
    },
    {
      name: 'table.total_approve_poorid_female',
      dataKey: 'total_approve_poorid_female',
      custom: true
    },
    {
      name: 'table.total_reject',
      dataKey: 'total_reject',
      custom: true
    },
    {
      name: 'table.total_reject_female',
      dataKey: 'total_reject_female',
      custom: true
    },
    {
      name: 'table.total_reject_poorid',
      dataKey: 'total_reject_poorid',
      custom: true
    },
    {
      name: 'table.total_reject_poorid_female',
      dataKey: 'total_reject_poorid_female',
      custom: true
    },
    {
      name: 'table.total_leave',
      dataKey: 'total_leave',
      custom: true
    },
    {
      name: 'table.total_leave_female',
      dataKey: 'total_leave_female',
      custom: true
    },
    {
      name: 'table.total_leave_poorid',
      dataKey: 'total_leave_poorid',
      custom: true
    },
    {
      name: 'table.total_leave_poorid_female',
      dataKey: 'total_leave_poorid_female',
      custom: true
    },
    {
      name: 'table.class_status',
      dataKey: 'class_status',
      custom: true
    }
  ];

  private readonly destroyer$ = DESTROYER$();

  tableDataSource: BaseDatatable<Course>;

  constructor(readonly loadingService: LoadingService, public courseService: CourseService) {}

  onLoad(pagination?): void {
    this.loadingService.setLoading('page', true);
    let startDate: string = `${new Date(this.formDate.value.start).toLocaleDateString('en-ZA')} ${new Date(
      this.formDate.value.start
    ).toLocaleTimeString('en-US', { hour12: false })}`;
    let endDate: string = `${new Date(this.formDate.value.end).toLocaleDateString('en-ZA')} ${new Date(
      this.formDate.value.end
    ).toLocaleTimeString('en-US', { hour12: false })}`;
    this.courseService.getDataCourseByDateRange({ ...pagination, start_date: startDate, end_date: endDate }).subscribe({
      next: res => {
      
        this.tableDataSource = res;
        takeUntil(this.destroyer$);
        this.loadingService.setLoading('page', false);
      }
    });
  }
  formatDate(date: Date) {
    // Ensure date is a valid Date object
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    // Get date components
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    // Return formatted date string (example: "DD-MM-YYYY")
    return `${day}-${month}-${year}`;
  }
  onExportFile(): void {
    // Set limit to 0 to fetch all data
    const pagination = { limit: 0 };
    const startDate: string = `${new Date(this.formDate.value.start).toLocaleDateString('en-ZA')} ${new Date(
      this.formDate.value.start
    ).toLocaleTimeString('en-US', { hour12: false })}`;
    const endDate: string = `${new Date(this.formDate.value.end).toLocaleDateString('en-ZA')} ${new Date(
      this.formDate.value.end
    ).toLocaleTimeString('en-US', { hour12: false })}`;

    this.courseService.getDataCourseByDateRange({ ...pagination, start_date: startDate, end_date: endDate }).subscribe({
      next: res => {
        let dataExportColumn = [];
        for (let course of res.list) {
          const currentDate = new Date();
          dataExportColumn.push({
            id: course._id,
            'វគ្គសិក្សា': course.code,
            'ជំនាញ': course.apply_majors.name,
            'ថ្ងៃចុះឈ្មោះ': this.formatDate(new Date(course.registation_start)),
            'ថ្ងៃបិទការចុះឈ្មោះ': this.formatDate(new Date(course.registation_end)),
            'ថ្ងៃចាប់ផ្តើមសិក្សា': this.formatDate(new Date(course.course_start)),
            'ថ្ងៃបញ្ចប់ការសិក្សា': this.formatDate(new Date(course.course_end)),
            'វេន': course.shifts.name,
            'គ្រឹះស្ថាន អ.ប.វ.': course?.schools?.name,
            'ចំនួនចុះឈ្មោះ (សរុប)': course['total_submit_student_count'],
            'ចំនួនចុះឈ្មោះ (ស្រី)': course['total_submit_student_female_count'],
            'ចំនួនចុះឈ្មោះដែលមានប័ណ្ណ (សរុប)': course['total_submit_poorid_student_count'],
            'ចំនួនចុះឈ្មោះដែលមានប័ណ្ណ (ស្រី)': course['total_submit_poorid_student_female_count'],
            'ចំនួនអនុម័ត (សរុប)': course['total_student_active_count'],
            'ចំនួនអនុម័ត (ស្រី)': course['total_student_active_female_count'],
            'ចំនួនអនុម័តដែលមានប័ណ្ណ (សរុប)': course['total_student_active_poorid_count'],
            'ចំនួនអនុម័តដែលមានប័ណ្ណ (ស្រី)': course['total_student_active_poorid_female_count'],
            'ចំនួនបដិសេធ (សរុប)': course['total_student_reject_count'],
            'ចំនួនបដិសេធ (ស្រី)': course['total_student_reject_female_count'],
            'ចំនួនបដិសេធដែលមានប័ណ្ណ (សរុប)': course['total_student_reject_poorid_count'],
            'ចំនួនបដិសេធដែលមានប័ណ្ណ (ស្រី)': course['total_student_reject_poorid_female_count'],
            'ចំនួនបោះបង់ក្រោយពេលអនុម័ត (សរុប)': course['total_student_leave_count'],
            'ចំនួនបោះបង់ក្រោយពេលអនុម័ត​ (ស្រី)': course['total_student_leave_female_count'],
            'ចំនួនបោះបង់ក្រោយពេលអនុម័តដែលមានប័ណ្ណ (សរុប)': course['total_student_leave_poorid_count'],
            'ចំនួនបោះបង់ក្រោយពេលអនុម័តដែលមានប័ណ្ណ​ (ស្រី)': course['total_student_leave_poorid_female_count'],
            'ស្ថានភាពថ្នាក់':
              currentDate >= new Date(course.course_start) && currentDate < new Date(course.course_end)
                ? 'ដំណើរការ'
                : currentDate > new Date(course.course_end) && currentDate > new Date(course.course_start)
                ? 'បានបិទ'
                : 'រងចាំពិនិត្យ'
          });
        }
        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataExportColumn);
        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Course-Table-Sheet');
        // Save to file
        XLSX.writeFile(wb, 'Course-table.xlsx');
      }
    });
  }

  onInputDate(): void {
    let data = this.formDate.value;
    if (!!data.start && !!data.end && new Date(data.start).getTime() > new Date(data.end).getTime()) {
      this.formDate.controls.end.markAsTouched();
      this.formDate.controls.end.setErrors({ 'minDate': true });
    } else if (!!this.formDate.controls.end.value && this.formDate.controls.end.invalid) {
      this.formDate.controls.end.setErrors(null);
    }
  }

  dateRangeChange(): void {
    if (this.formDate.valid) {
      this.onLoad();
    } else return;
  }

  onDateChange(): void {
    this.formDate.markAllAsTouched();
    this.dateRangeChange();
  }

  goTo(pagination?: Pagination) {
    this.onLoad(pagination);
  }
}
