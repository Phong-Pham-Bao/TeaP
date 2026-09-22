export interface ScheduleRow {
  id: string;
  stt: number;
  rank: string; // A2, B, C, etc.
  fullName: string;
  position: string; // ĐB,TN | ĐB,KK | TN, PCC | TN | PCP
  shiftMode: string; // CA12, CA8
  days: Record<number, string>; // day 1..31 -> 'X' | 'ĐB' | 'TN' | 'KK' | '10-18H' | 'PCP' | ''
}

export interface DayHeaderInfo {
  day: number;
  dayOfWeek: string;
  isWeekend: boolean;
}

export const INITIAL_SCHEDULE_ROWS: ScheduleRow[] = [
  {
    id: 's1',
    stt: 1,
    rank: 'A2',
    fullName: 'Nguyễn Thị Kim Thuý',
    position: 'ĐB, TN',
    shiftMode: 'CA12',
    days: { 1: 'ĐB', 2: 'ĐB', 6: 'X', 12: 'X', 19: 'X', 26: 'X' },
  },
  {
    id: 's2',
    stt: 2,
    rank: 'C',
    fullName: 'Nguyễn Trọng Hoá',
    position: 'ĐB, KK',
    shiftMode: 'CA12',
    days: { 1: 'KK', 2: 'X', 10: 'X', 16: 'X', 20: 'X', 26: 'X' },
  },
  {
    id: 's3',
    stt: 3,
    rank: 'B',
    fullName: 'Vũ Ngọc Quỳnh Như',
    position: 'TN, PCC',
    shiftMode: 'CA12',
    days: { 1: 'X', 2: 'TN', 8: 'X', 15: 'X', 22: 'X', 29: 'X' },
  },
  {
    id: 's4',
    stt: 4,
    rank: 'C',
    fullName: 'Trần Thanh Tâm',
    position: 'TN',
    shiftMode: 'CA12',
    days: { 1: 'TN', 2: '10-18H', 5: 'X', 11: 'X', 17: 'X', 21: 'X', 30: 'X' },
  },
  {
    id: 's5',
    stt: 5,
    rank: 'C',
    fullName: 'Trịnh Minh Trường',
    position: 'PCP',
    shiftMode: 'CA12',
    days: {
      1: '', 2: 'KK', 5: 'X', 7: 'X',
      12: 'X', 13: 'X', 14: 'X', 15: 'X', 16: 'X', 17: 'X', 18: 'X', 19: 'X',
      20: 'X', 21: 'X', 22: 'X', 23: 'X', 24: 'X', 25: 'X', 26: 'X', 27: 'X', 28: 'X', 29: 'X', 30: 'X', 31: 'X'
    },
  },
];

export const SHIFT_BADGE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  'X': { bg: 'bg-yellow-300 hover:bg-yellow-400', text: 'text-slate-900 font-extrabold', label: 'OFF' },
  'ĐB': { bg: 'bg-emerald-300 hover:bg-emerald-400', text: 'text-emerald-950 font-bold', label: 'Đứng Bếp/Bar' },
  'TN': { bg: 'bg-pink-300 hover:bg-pink-400', text: 'text-pink-950 font-bold', label: 'Thu Ngân' },
  'KK': { bg: 'bg-sky-300 hover:bg-sky-400', text: 'text-sky-950 font-bold', label: 'Kiểm Kho' },
  '10-18H': { bg: 'bg-amber-300 hover:bg-amber-400', text: 'text-amber-950 font-bold', label: '10h - 18h' },
  'PCP': { bg: 'bg-teal-200 hover:bg-teal-300', text: 'text-teal-950 font-bold', label: 'Pha Chế Phụ' },
};
