import { Component, inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { map, takeUntil } from 'rxjs';
import { DESTROYER$ } from 'src/app/helpers/unsubscribe';
import { ApplyCountBySchool } from 'src/app/models/report';
import { LoadingService } from 'src/app/services/loading.service';
import { ReportService } from 'src/app/services/report.service';
import { Pagination } from 'src/app/shares/pagination/pagination';
import { environment } from 'src/environments/environment';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-report-weekly',
  templateUrl: './report-weekly.component.html',
  styleUrls: ['./report-weekly.component.scss']
})
export class ReportWeeklyComponent {
  private readonly destroyer$ = DESTROYER$();

  readonly loadingService = inject(LoadingService);
  private readonly reportService = inject(ReportService);

  date: Date = new Date();
  endDate: Date = new Date(this.date.getFullYear(), this.date.getMonth() + 1, 0);

  form = inject(FormBuilder).group({
    end: [null, Validators.required]
  });

  // Add later
  requestUrl: string = environment.api_url + this.reportService.path + '/weekly_report';

  baseColumn: string[] = ['position', 'startDate', 'endDate', 'major', 'schools'];
  exportColumn: string[] = this.baseColumn;
  tableDataSource = new MatTableDataSource<ApplyCountBySchool>(null);
  displayedColumns: string[] = this.baseColumn;

  baseTopColumn: string[] = ['#', 'ថ្ងៃចូលរៀន', 'ថ្ងៃបញ្ចប់វគ្គ', 'ឈ្មោះជំនាញ', 'ឈ្មោះគ្រឹះស្ថាន'];

  topColumn: string[] = this.baseTopColumn;
  dynamicColumn: { _id: string; name: string; subColumns: any[] }[];
  thirdColumn: string[];
  thirdDisplayedColumn: string[];
  data: ApplyCountBySchool;

  params = {
    limit: 10,
    page: 1
  };
  total: 0;
  total_count;

  onLoad(pagination?): void {
    this.loadingService.setLoading('page', true);
    let data = [];

    let endDate: string = `${new Date(this.form.value.end).toLocaleDateString('en-ZA')} ${new Date(
      this.form.value.end
    ).toLocaleTimeString('en-US', { hour12: false })}`;

    this.reportService
      .getWeeklyReport({ ...this.params, ...pagination, end_date: endDate })
      .pipe(
        map(map => {
          if (map?.report_data?.length > 0) {
            map.report_data.forEach((body, index) => {
              data.push({
                ...body,
                colSpan: this.baseTopColumn?.length - 1,
                index: (this.params.page - 1) * this.params.limit + (index + 1)
              });
            });
          }

          //columns management
          if (map?.header_columns?.length > 0) {
            //second header in table
            this.exportColumn = []; //assign to table
            this.dynamicColumn = []; //display
            this.thirdColumn = [];

            this.topColumn = [...this.baseTopColumn, ...map?.header_columns.map(map => map.name)];

            //mapping second header
            for (let index = 0; index < map.header_columns?.length; index++) {
              let result = map.header_columns[index];

              // Original 6 columns for each second header
              for (let j = 0; j < 6; j++) {
                this.exportColumn.push('th' + index + j);
                const dynamicColumnEntry = {
                  name: 'th' + index + j,
                  _id: result._id,
                  subColumns: []
                };

                // Adding 3 additional sub-columns to each column's subColumns
                for (let k = 0; k < 3; k++) {
                  this.thirdColumn.push('th' + index + j + 'sub' + k);
                  dynamicColumnEntry.subColumns.push({
                    name: 'th' + index + j + 'sub' + k,
                    _id: result._id
                  });
                }

                this.dynamicColumn.push(dynamicColumnEntry);
              }
            }
          }
          return map;
        }),
        takeUntil(this.destroyer$)
      )
      .subscribe({
        next: res => {
          this.data = res;
          
          this.tableDataSource = new MatTableDataSource(data);
          this.displayedColumns = [...this.baseColumn, ...this.exportColumn];
          this.thirdDisplayedColumn = [...this.baseColumn, ...this.thirdColumn];
          this.loadingService.setLoading('page', false);
          this.total_count = res.total_count;

          setTimeout(() => {
            this.onCheckTable();
          }, 0);
        },
        error: () => this.loadingService.setLoading('page', false)
      });
  }
  async onExportFile(): Promise<void> {
    this.loadingService.setLoading('page', true);
    let endDate: string = `${new Date(this.form.value.end).toLocaleDateString('en-ZA')} ${new Date(
      this.form.value.end
    ).toLocaleTimeString('en-US', { hour12: false })}`;
    let calcPage = Math.ceil(this.total_count / this.params.limit);
    let allData = [];
    let num = 1;

    for (let i = 1; i <= calcPage; i++) {
      let page = { page: i };
      let data = await this.reportService.getWeeklyReport({ ...page, end_date: endDate }).toPromise();

      for (const body of data.report_data) {
        // Exclude the `_id` field from report_data
        let { _id, student_data, course_end, course_start, ...reportDataWithoutId } = body;

        // Formate Date When exports
        let start_date = new Date(body.course_start);
        let end_date = new Date(body.course_end);

        // Display each data in only one row
        let row = { '#': num, course_start: start_date, course_end: end_date, ...reportDataWithoutId };
        body.student_data.forEach((student, index) => {
          // Exclude the `_id` field from each student_data
          let { _id, ...studentWithoutId } = student;
          for (let key in studentWithoutId) {
            row[`student_${index + 1}_${key}`] = studentWithoutId[key];
          }
        });
        allData.push(row);
        num++;
      }
    }
    // Prepare the worksheet using the flattened data
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(allData);

    // Create a new workbook and append the worksheet
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // Save the workbook to a file
    XLSX.writeFile(wb, 'file.xlsx');
    this.loadingService.setLoading('page', false);
  }

  // onExportFile(): void {
  //   const table = document.getElementById('table')?.cloneNode(true) as HTMLElement;
  //   const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(table);

  //   // Create a new workbook and append the worksheet
  //   const wb: XLSX.WorkBook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  //   // Save the workbook to a file
  //   XLSX.writeFile(wb, 'file.xlsx');
  // }

  onCheckTable(): void {
    const table = document.getElementById('table');

    //remove th element -> class = display-none from table element
    //TODO: custom view when export to excel
    let thRemove1 = table
      .getElementsByTagName('thead')[0]
      ?.getElementsByTagName('tr')[1]
      ?.getElementsByClassName('display-none');

    for (let i = thRemove1?.length - 1; i >= 0; i--) {
      thRemove1[i]?.remove();
    }
    let thRemove2 = table
      .getElementsByTagName('thead')[0]
      ?.getElementsByTagName('tr')[2]
      ?.getElementsByClassName('display-none');

    for (let i = thRemove2?.length - 1; i >= 0; i--) {
      thRemove2[i]?.remove();
    }

    //remove td element -> class = display-none from table element
    //TODO: custom view when export to excel
    let tds = table.getElementsByTagName('tbody')[0]?.children;
    for (let index = 0; index < tds?.length; index++) {
      let tdRemove = tds[index]?.getElementsByClassName('display-none');
      for (let i = tdRemove?.length - 1; i >= 0; i--) {
        tdRemove[i]?.remove();
      }
    }
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

  trackByFn(index: number, item: any): void {
    return item?._id ?? index ?? item?.name ?? item;
  }
  goTo(pagination?: Pagination) {
    this.params.page = pagination.page;
    this.onLoad(pagination);
  }
}
