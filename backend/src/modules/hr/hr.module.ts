import { Module } from '@nestjs/common';
import { AttendanceService } from './services/attendance.service';
import { ScheduleService } from './services/schedule.service';
import { SalaryService } from './services/salary.service';
import { AnnouncementService } from './services/announcement.service';
import { AttendanceController } from './controllers/attendance.controller';
import { ScheduleController } from './controllers/schedule.controller';
import { SalaryController } from './controllers/salary.controller';
import { AnnouncementController } from './controllers/announcement.controller';

@Module({
  controllers: [
    AttendanceController,
    ScheduleController,
    SalaryController,
    AnnouncementController,
  ],
  providers: [
    AttendanceService,
    ScheduleService,
    SalaryService,
    AnnouncementService,
  ],
  exports: [
    AttendanceService,
    ScheduleService,
    SalaryService,
    AnnouncementService,
  ],
})
export class HrModule {}
