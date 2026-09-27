import { AppShell } from '@/components/layout/app-shell';
import { AttendanceContent } from '@/components/attendance/attendance-content';

export default function AttendancePage() {
  return <AppShell activePage="attendance"><AttendanceContent /></AppShell>;
}
