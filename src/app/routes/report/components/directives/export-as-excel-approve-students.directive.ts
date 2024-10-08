import { formatDate } from '@angular/common';
import { Directive, HostListener, Input } from '@angular/core';
import { Params } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';
import { Unsubscribe } from 'src/app/helpers/unsubscribe';
import { StudentRequests } from 'src/app/models/student';
import { LoadingService } from 'src/app/services/loading.service';
import { ReportService } from 'src/app/services/report.service';
import { FullNamePipe } from 'src/app/shares/name/pipes/full-name.pipe';
import { TranslateApiPipe } from 'src/app/shares/translate-api/translate-api.pipe';
import * as XLSX from 'xlsx';

const EXCEL_EXTENSION = '.xlsx';

@Directive({
  selector: '[appExportAsExcelApproveStudents]',
  providers: [FullNamePipe, TranslateApiPipe]
})
export class ExportAsExcelApproveStudentsDirective extends Unsubscribe {
  enumStatus = [
    'បានបិទ',
    'កំពុងសិក្សា',
    'មិនទាន់ស្នើ',
    'ស្នើសុំ',
    'រង់ចាំសិក្សា',
    'បន្តការសិក្សា',
    '',
    '',
    'បញ្ចប់ការសិក្សា',
    'បានចាកចេញ',
    'បានចាកចេញមុនរៀន',
    'បានចាកចេញពេលរៀន'
  ];
  @Input('appExportAsExcelApproveStudents') data: { params: Params; filterParams: Params };

  constructor(
    private loadingService: LoadingService,
    private reportService: ReportService,
    private fullNamePipe: FullNamePipe,
    private translateService: TranslateService,
    private translateAPIPipe: TranslateApiPipe
  ) {
    super();
  }

  @HostListener('click') onClick() {
    this.getApprovedList();
  }

  // getApprovedList() {
  //   this.loadingService.setLoading('page', true);
  //   this.reportService
  //     .getApprovedList({ ...this.data.params, limit: 0, ...this.data?.filterParams })
  //     .pipe(takeUntil(this.unsubscribe$))
  //     .subscribe(res => {
  //       this.loadingService.setLoading('page', false);
  //       return this.xlsx(res.list);
  //     });
  // }

  async getApprovedList() {
    this.loadingService.setLoading('page', true);

    const limit = 10000;
    let page = 1;
    const allData = [];

    while (true) {
      const res = await this.reportService
        .getApprovedList({ ...this.data.params, limit, page, ...this.data?.filterParams })
        .pipe(takeUntil(this.unsubscribe$))
        .toPromise();

      allData.push(...res.list);

      if (res.list.length < limit) {
        // If the data fetched is less than the limit, we have reached the last page
        break;
      } else {
        // Otherwise, fetch the next page
        page++;
      }
    }

    this.loadingService.setLoading('page', false);
    this.xlsx(allData);
  }

  xlsx(list: StudentRequests[]) {
    let data = this.mapData(list);

    /* make the worksheet */
    var worksheet = XLSX.utils.json_to_sheet(data);

    /* add to workbook */
    var workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Approve Students');

    /* generate an XLSX file */
    const fileName = 'Approve Students Report' + '_export_' + new Date().getTime() + EXCEL_EXTENSION;
    XLSX.writeFile(workbook, fileName);
  }

  mapData(list: StudentRequests[]) {
    let result = [];
    for (let index = 0; index < list.length; index++) {
      const element = list[index];
      const item = {
        '#': index + 1,
        [this.translateService.instant('table.name')]: this.fullNamePipe.transform(element, 'km'),
        [this.translateService.instant('table.name_en')]: this.fullNamePipe.transform(element, 'en'),
        [this.translateService.instant('table.gender')]: this.translateService.instant(
          'form.gender.' + element?.gender
        ),
        [this.translateService.instant('table.date_birth')]: formatDate(
          new Date(element?.date_of_birth),
          'dd-MM-yyyy',
          'en-US'
        ),
        [this.translateService.instant('table.phone')]: element?.phone_number,
        [this.translateService.instant('form.place_birth.title')]: element?.place_of_birth?.name,
        [this.translateService.instant('form.address.title')]: element?.address.name,
        [this.translateService.instant('table.schools')]: this.translateAPIPipe.transform(
          element?.schools,
          this.translateService.currentLang
        ),
        [this.translateService.instant('table.major')]: this.translateAPIPipe.transform(
          element?.apply_majors,
          this.translateService.currentLang
        ),
        [this.translateService.instant('table.shift')]: this.translateAPIPipe.transform(
          element?.shifts,
          this.translateService.currentLang
        ),
        [this.translateService.instant('table.poor_id')]: element?.poor_id,
        [this.translateService.instant('table.type_poverty_status')]: element?.type_poverty_status,
        [this.translateService.instant('form.id_card_number')]: element?.id_card_number,
        [this.translateService.instant('attendance.name')]: element?.average_attendance,
        [this.translateService.instant('table.course_start_date')]: new Date(element?.courses_start),
        [this.translateService.instant('table.course_end_date')]: new Date(element?.courses_end),
        [this.translateService.instant('table.course_code')]: element?.courses_code,
        [this.translateService.instant('table.position')]: element?.student_occupations?.position,
        [this.translateService.instant('table.income')]: element?.student_occupations?.income,
        [this.translateService.instant('table.bonus')]: element?.student_occupations?.bonus,
        [this.translateService.instant('table.dormitory')]:
          element?.student_occupations?.dormitory === 1 ? 'មាន' : 'មិនមាន',
        [this.translateService.instant('table.transportation')]:
          element?.student_occupations?.transportation === 1 ? 'មាន' : 'មិនមាន',
        [this.translateService.instant('table.has_meal')]:
          element?.student_occupations?.has_meal === 1
            ? 'អាហារពេលព្រឹក'
            : element?.student_occupations?.has_meal === 2
            ? 'អាហារពេលថ្ងៃ'
            : element?.student_occupations?.has_meal === 3
            ? 'ទាំងពីរពេល'
            : 'មិនមាន',
        [this.translateService.instant('table.skill_matched')]:
          element?.student_occupations?.skill_matched === 1
            ? 'ប្រើ'
            : element?.student_occupations?.skill_matched === 2
            ? 'ប្រើតិចតួច'
            : 'មិនប្រើ',
        [this.translateService.instant('table.company_name')]: element?.student_occupations?.company_profile?.name,
        [this.translateService.instant('table.company_address')]:
          element?.student_occupations?.company_profile?.address?.company_address,
        [this.translateService.instant('table.other')]: element?.student_occupations?.other_info,
        [this.translateService.instant('table.status')]:
          this.enumStatus[element?.scholarship_status === -3 ? 'បដិសេធ' : element?.scholarship_status]
      };
      result.push(item);
    }

    return result;
  }
}
