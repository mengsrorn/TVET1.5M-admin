import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Params } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'jquery';
import { Observable } from 'rxjs';
import { BaseDatatable } from 'src/app/models/datatables/base.datatable';
import { useFilter } from 'src/app/models/filter';
import { TableColumn } from 'src/app/models/table-column';
import { LoadingService } from 'src/app/services/loading.service';
import { ReportService } from 'src/app/services/report.service';
import { Pagination } from 'src/app/shares/pagination/pagination';
import * as XLSX from 'xlsx';
@Component({
  selector: 'app-report-student-internship',
  templateUrl: './report-student-internship.component.html',
  styleUrls: ['./report-student-internship.component.scss']
})
export class ReportStudentInternshipComponent {
  readonly loadingService = inject(LoadingService);
  private readonly reportService = inject(ReportService);
  requestUrl: string;
  params = {
    limit: 10,
    page: 1,
    end_date: null
  };
  filterData$: Observable<unknown> = this.reportService.approvedStudentFilterData();
  form = inject(FormBuilder).group({
    end: [null, Validators.required]
  });

  tableColumns: TableColumn[] = [
    {
      name: 'table.name',
      dataKey: 'name',
      custom: true,
      isSortable: true
    },
    {
      name: 'table.gender',
      dataKey: 'gender',
      custom: true
    },
    {
      name: 'table.type_poverty_status',
      dataKey: 'type_poverty_status',
      custom: true
    },
    {
      name: 'table.schools',
      dataKey: 'schools',
      custom: true,
      isSortable: true
    },
    {
      name: 'table.major',
      dataKey: 'major',
      custom: true
    },
    {
      name: 'table.type_internship',
      dataKey: 'type_internship',
      custom: true
    },
    {
      name: 'table.start_date',
      dataKey: 'start_date',
      custom: true
    },
    {
      name: 'table.end_date',
      dataKey: 'end_date',
      custom: true
    },
    {
      name: 'table.pass_fail',
      dataKey: 'pass_fail',
      custom: true
    },
    {
      name: 'table.development_partner_name',
      dataKey: 'development_partner_name',
      custom: true,
      isSortable: true
    },

    {
      name: 'table.development_partner_name_en',
      dataKey: 'development_partner_name_en',
      custom: true,
      isSortable: true
    },
    {
      name: 'table.development_partners_phone',
      dataKey: 'development_partners_phone',
      custom: true
    },
    {
      name: 'table.development_partners_bussiness',
      dataKey: 'development_partners_bussiness',
      custom: true
    },
    {
      name: 'table.type_development_partners',
      dataKey: 'type_development_partners',
      custom: true
    },
    {
      name: 'form.address.city',
      dataKey: 'city_province',
      custom: true
    },
    {
      name: 'form.address.district',
      dataKey: 'district',
      custom: true
    },
    {
      name: 'form.address.village',
      dataKey: 'village',
      custom: true
    },
    {
      name: 'table.job_opportunity',
      dataKey: 'job_opportunity',
      custom: true
    },
    {
      name: 'table.income',
      dataKey: 'income',
      custom: true
    }
  ];
  tableData: BaseDatatable<any>;
  filterParams;
  useFilter: useFilter[] = ['student_internships'];

  constructor(public translate: TranslateService) {}

  onLoad(pagination?: Pagination) {
    this.loadingService.setLoading('page', true);
    let data = [];

    let endDate: string = `${new Date(this.form.value.end).toLocaleDateString('en-ZA')} ${new Date(
      this.form.value.end
    ).toLocaleTimeString('en-US', { hour12: false })}`;
    this.reportService
      ?.getStudentInternship({ ...this.params, ...pagination, ...this.filterParams, end_date: endDate })
      .subscribe({
        next: res => {
          //console.log(res);
          this.tableData = res;
          this.loadingService.setLoading('page', false);
        }
      });
  }

  dateRangeChange(): void {
    if (this.form.valid) {
      this.onLoad();
    } else return;
  }

  onDateChange(): void {
    this.form.markAllAsTouched();
    this.dateRangeChange();
  }

  onInputDate(): void {
    let data = this.form.value;
    if (!data.end) {
      // !!data.start &&  && new Date(data.start).getTime() > new Date(data.end).getTime()
      this.form.controls.end.markAsTouched();
      this.form.controls.end.setErrors({ 'minDate': true });
    } else if (!!this.form.controls.end.value && this.form.controls.end.invalid) this.form.controls.end.setErrors(null);
  }

  onExportFile(): void {
    const pagination = { limit: 0 };

    const endDate: string = `${new Date(this.form.value.end).toLocaleDateString('en-ZA')} ${new Date(
      this.form.value.end
    ).toLocaleTimeString('en-US', { hour12: false })}`;
    this.reportService.getStudentInternship({ ...pagination, ...this.filterParams, end_date: endDate }).subscribe({
      next: res => {
        let dataExportColumn = [];
        for (let [index, student] of res.list.entries()) {
          dataExportColumn.push({
            '#': index + 1,
            'ឈ្មោះ': student?.last_name + ' ' + student?.first_name || '--/--',
            'ភេទ': student?.gender || '--/--',
            'ស្ថានភាពក្រីក្រ': student?.type_poverty_status || '--/--',
            'គ្រឹះស្ថាន អ.ប.វ.': student?.schools?.name || '--/--',
            'ជំនាញ': student?.courses?.apply_majors?.name || '--/--',
            'ប្រភេទកម្មសិក្សា':
              student?.student_internships?.type_internships === 1 ? 'កម្មសិក្សា' : 'ទស្សនកិច្ច' || '--//--',
            'ថ្ងៃចាប់ផ្តើម': student?.student_internships?.start_date || '--/--',
            'ថ្ងៃបញ្ចប់': student.student_internships?.end_date || '--/--',
            'ជាប់​ ឬ ធ្លាក់': student?.student_internships?.pass_fail === 1 ? 'ជាប់' : 'ធ្លាក់' || '--//--',
            'ឈ្មោះដៃគូអភិវឌ្ឍន៍': student?.student_internships?.development_partners?.name || '--/--',
            'ឈ្មោះឡាតាំងដៃគូអភិវឌ្ឍន៍': student?.student_internships?.development_partners?.name_en || '--/--',
            'លេខទូរស័ព្ទដៃគូអភិវឌ្ឍន៍': student?.student_internships?.development_partners?.phone_number || '--/--',
            'ប្រភេទជំនួញដៃគូអភិវឌ្ឍន៍': student?.student_internships?.development_partners?.bussiness || '--/--',
            'ប្រភេទដៃគូអភិវឌ្ឍន៍':
              student?.student_internships?.development_partners?.type_development_partners === 1
                ? 'ក្នុងប្រទេស'
                : student?.student_internships?.development_partners?.type_development_partners === 2
                ? 'ក្រៅប្រទេស'
                : student?.student_internships?.development_partners?.type_development_partners === 3
                ? 'ជាមួយគ្រឹះស្ថានជាតិ'
                : student?.student_internships?.development_partners?.type_development_partners === 4
                ? 'ជាមួយគ្រឹះស្ថានអន្តរជាតិ'
                : student?.student_internships?.development_partners?.type_development_partners === 5
                ? 'ជាមួយវិស័យឯកជន'
                : '--/--',
            'រាជធានី/ខេត្ត': student?.student_internships?.development_partners?.address?.city_provinces?.name,
            'ស្រុក/ខណ្ឌ': student?.student_internships?.development_partners?.address?.districts?.name,
            'ភូមិ': student?.student_internships?.development_partners?.address?.villages?.name,
            'ឱកាសការងារ': student?.student_internships?.job_opportunity === true ? 'ទទួលបាន' : 'មិនទទួលបាន' || '--/--',
            'ប្រាក់ខែ': student?.student_internships?.salary
          });
        }
        const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataExportColumn);

        const wb: XLSX.WorkBook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

        /* save to file */
        XLSX.writeFile(wb, 'file.xlsx');
      }
    });
  }

  setParams(filterParams: Params): void {
    if (Object.keys(filterParams).length < 1) this.filterParams = [];
    else this.filterParams = filterParams;
  }

  goTo(pagination: Pagination): void {
    this.onLoad(pagination);
  }
}
