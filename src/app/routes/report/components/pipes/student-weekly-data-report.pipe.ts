import { Pipe, PipeTransform } from '@angular/core';
import { StudentWeeklyDataReport } from 'src/app/models/report';

@Pipe({
  name: 'studentWeeklyDataReportPipe'
})
export class StudentWeeklyDataReportPipe implements PipeTransform {
  transform(data: StudentWeeklyDataReport[], key: string): StudentWeeklyDataReport | null {
    let result: StudentWeeklyDataReport;
    if (!!key && !!data) result = data?.find(value => String(value._id) == String(key));
    return result ?? null;
  }
}
