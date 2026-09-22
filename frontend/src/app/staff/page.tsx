'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { 
  Home, Calendar, Clock, User, Bell,
  Coffee, Store, ShieldCheck, LogOut,
  CheckCircle, AlertCircle, Eye, FileText,
  Award, Star, Medal, BookOpen, ChevronRight,
  TrendingUp, Check, X, MapPin, CalendarDays,
  Sparkles, CheckCheck
} from 'lucide-react';

type StaffTab = 'home' | 'schedule' | 'attendance' | 'profile' | 'notices';

interface WorkShift {
  id: string;
  date: string;
  dayName: string;
  shiftName: string;
  timeRange: string;
  position: string;
  status: 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED';
  note?: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  shiftName: string;
  checkInTime: string;
  checkOutTime?: string;
  totalHours: string;
  status: 'Đúng giờ' | 'Đi muộn' | 'Đang trong ca';
}

interface ManagerNotice {
  id: string;
  docNumber: string;
  title: string;
  category: 'QUY_DINH' | 'DAO_TAO' | 'KHEN_THUONG' | 'LICH_TRINH';
  categoryLabel: string;
  badgeColor: string;
  senderName: string;
  senderRole: string;
  date: string;
  isImportant?: boolean;
  isRead?: boolean;
  summary: string;
  fullContent: string;
}

export default function StaffPortalPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<StaffTab>('home');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  
  // Trạng thái chấm công hôm nay
  const [attendanceStatus, setAttendanceStatus] = useState<'NOT_CHECKED_IN' | 'CHECKED_IN' | 'CHECKED_OUT'>('NOT_CHECKED_IN');
  const [todayCheckInTime, setTodayCheckInTime] = useState<string>('');
  const [todayCheckOutTime, setTodayCheckOutTime] = useState<string>('');
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);

  // Lịch làm việc
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [shiftFilter, setShiftFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED'>('ALL');

  // Thông báo văn bản từ Quản lý
  const [notices, setNotices] = useState<ManagerNotice[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<ManagerNotice | null>(null);
  const [noticeFilter, setNoticeFilter] = useState<string>('ALL');

  // Hồ sơ & Bậc nghề nghiệp
  const [userProfile, setUserProfile] = useState({
    fullName: user?.fullName || 'Nguyễn Văn Nhân Sự',
    email: user?.email || 'hr@teap.vn',
    phone: '0912 345 678',
    branchName: 'Chi nhánh Quận 1 (TeaP Q.1)',
    joinDate: '15/09/2025',
    position: 'Pha chế chính (Barista)',
    stage: 'Chính Thức' as 'Hội nhập' | 'Thử việc' | 'Chính Thức',
    rank: 'Bậc B' as 'Bậc C' | 'Bậc B' | 'Bậc A',
    kpiScore: 98,
    attendanceScore: 100,
    ruleScore: 99,
  });

  const [testRecords, setTestRecords] = useState<any[]>([]);
  const [selectedTestToView, setSelectedTestToView] = useState<any | null>(null);

  // Đồng hồ thời gian thực
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Nạp dữ liệu cá nhân & lịch làm việc từ localStorage hoặc mock chuẩn
  useEffect(() => {
    loadStaffData();
  }, [user]);

  const loadStaffData = () => {
    const staffName = user?.fullName || 'Nguyễn Văn Nhân Sự';
    const staffEmail = user?.email || 'hr@teap.vn';

    // Đọc điểm & cấp bậc lưu nếu có
    const storedScores = JSON.parse(localStorage.getItem('teap_staff_scores') || '{}');
    const myData = storedScores[user?.id || ''] || {};

    setUserProfile({
      fullName: staffName,
      email: staffEmail,
      phone: '0912 345 678',
      branchName: 'Chi nhánh Quận 1 (TeaP Q.1)',
      joinDate: '15/09/2025',
      position: myData.position || 'Pha chế chính (Barista)',
      stage: myData.stage || 'Chính thức',
      rank: myData.rank || 'Bậc B',
      kpiScore: myData.kpiScore ?? 98,
      attendanceScore: myData.attendanceScore ?? 100,
      ruleScore: myData.ruleScore ?? 99,
    });

    // Lịch làm việc 7 ngày tới
    const sampleShifts: WorkShift[] = [
      {
        id: 'SHIFT-01',
        date: '14/09/2026',
        dayName: 'Hôm nay (Thứ Hai)',
        shiftName: 'Ca Sáng',
        timeRange: '07:00 – 15:00',
        position: 'Pha chế chính (Barista)',
        status: 'IN_PROGRESS',
        note: 'Chuẩn bị quầy bar, kiểm tra cốt trà và máy pha espresso đầu ca.',
      },
      {
        id: 'SHIFT-02',
        date: '15/09/2026',
        dayName: 'Ngày mai (Thứ Ba)',
        shiftName: 'Ca Sáng',
        timeRange: '07:00 – 15:00',
        position: 'Pha chế chính (Barista)',
        status: 'UPCOMING',
        note: 'Phối hợp với thu ngân giờ cao điểm trưa 11h30 - 13h00.',
      },
      {
        id: 'SHIFT-03',
        date: '16/09/2026',
        dayName: 'Thứ Tư',
        shiftName: 'Ca Tối',
        timeRange: '14:30 – 22:30',
        position: 'Đọc bill / Điều phối ly',
        status: 'UPCOMING',
        note: 'Kiểm tra tem nhãn size M/L và độ đường đá theo yêu cầu khách.',
      },
      {
        id: 'SHIFT-04',
        date: '17/09/2026',
        dayName: 'Thứ Năm',
        shiftName: 'Ca Tối',
        timeRange: '14:30 – 22:30',
        position: 'Pha chế chính (Barista)',
        status: 'UPCOMING',
        note: 'Vệ sinh máy móc, tiệt trùng khay topping cuối ngày (Quy trình 5S).',
      },
      {
        id: 'SHIFT-05',
        date: '18/09/2026',
        dayName: 'Thứ Sáu',
        shiftName: 'Ca Sáng',
        timeRange: '07:00 – 15:00',
        position: 'Pha chế chính (Barista)',
        status: 'UPCOMING',
        note: 'Tiếp nhận nguyên liệu từ kho tổng Teap ERP lúc 08:30.',
      },
      {
        id: 'SHIFT-06',
        date: '12/09/2026',
        dayName: 'Thứ Bảy tuần trước',
        shiftName: 'Ca Sáng',
        timeRange: '07:00 – 15:00',
        position: 'Pha chế chính',
        status: 'COMPLETED',
        note: 'Hoàn thành tốt, không xảy ra sai sót món.',
      },
      {
        id: 'SHIFT-07',
        date: '13/09/2026',
        dayName: 'Chủ Nhật tuần trước',
        shiftName: 'Ca Tối',
        timeRange: '14:30 – 22:30',
        position: 'Pha chế chính',
        status: 'COMPLETED',
        note: 'Doanh số quầy đạt 120% mục tiêu ngày.',
      },
    ];
    setShifts(sampleShifts);

    // Lịch sử chấm công
    const storedAtt = JSON.parse(localStorage.getItem('teap_staff_attendance') || 'null');
    if (storedAtt) {
      setAttendanceStatus(storedAtt.status);
      setTodayCheckInTime(storedAtt.checkInTime || '');
      setTodayCheckOutTime(storedAtt.checkOutTime || '');
      setAttendanceHistory(storedAtt.history || []);
    } else {
      const defaultHistory: AttendanceRecord[] = [
        { id: 'ATT-101', date: '13/09/2026', shiftName: 'Ca Tối (14:30 - 22:30)', checkInTime: '14:25', checkOutTime: '22:35', totalHours: '8.2 giờ', status: 'Đúng giờ' },
        { id: 'ATT-102', date: '12/09/2026', shiftName: 'Ca Sáng (07:00 - 15:00)', checkInTime: '06:55', checkOutTime: '15:05', totalHours: '8.1 giờ', status: 'Đúng giờ' },
        { id: 'ATT-103', date: '11/09/2026', shiftName: 'Ca Sáng (07:00 - 15:00)', checkInTime: '06:50', checkOutTime: '15:00', totalHours: '8.1 giờ', status: 'Đúng giờ' },
        { id: 'ATT-104', date: '10/09/2026', shiftName: 'Ca Tối (14:30 - 22:30)', checkInTime: '14:28', checkOutTime: '22:30', totalHours: '8.0 giờ', status: 'Đúng giờ' },
        { id: 'ATT-105', date: '09/09/2026', shiftName: 'Ca Sáng (07:00 - 15:00)', checkInTime: '06:58', checkOutTime: '15:02', totalHours: '8.0 giờ', status: 'Đúng giờ' },
      ];
      setAttendanceHistory(defaultHistory);
    }

    // Văn bản thông báo từ Quản lý bên trên
    const sampleNotices: ManagerNotice[] = [
      {
        id: 'DOC-2026-08',
        docNumber: '08/TB-QLQ1',
        title: 'Kế hoạch Tổ chức Kỳ thi Sát hạch Nâng bậc C - B - A Quý I/2026',
        category: 'DAO_TAO',
        categoryLabel: 'Đào tạo & Thi bậc',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        senderName: 'Trần Thị Quản Lý',
        senderRole: 'Quản Lý Cửa Hàng TeaP Q.1',
        date: '12/09/2026',
        isImportant: true,
        summary: 'Thông báo lịch sát hạch tay nghề pha chế và quy trình đọc bill POS cho toàn thể nhân sự thử việc và nhân sự bậc C muốn nâng lên bậc B.',
        fullContent: `Kính gửi: Toàn thể Cán bộ nhân viên Chi nhánh TeaP Quận 1,

Căn cứ quy chế đào tạo nhân sự năm 2026 của Chuỗi Trà Sữa TeaP, Ban Quản lý Chi nhánh thông báo kế hoạch tổ chức kỳ thi sát hạch nâng bậc tay nghề như sau:

1. Đối tượng tham gia:
- Nhân viên đang trong giai đoạn Thử việc có nguyện vọng xét lên Chính thức (Bậc C).
- Nhân sự Bậc C có thời gian làm việc trên 3 tháng có nguyện vọng thăng cấp lên Bậc B.

2. Tiêu chuẩn đánh giá (Thang điểm 100):
- Môn 1: Lý thuyết Menu & Định lượng nguyên liệu (Tối thiểu 80/100).
- Môn 2: Thực hành pha chế & Tốc độ ra món dưới 90s/ly (Tối thiểu 80/100).
- Môn 3: Kỹ năng đọc bill POS và hạn chế sai sót (Tối thiểu 80/100).
- Môn 4: Quy chuẩn Vệ sinh ATVSTP & Tác phong 5S (Tối thiểu 85/100).
* Điểm trung bình bài thi ≥ 80 điểm sẽ được phê duyệt nâng bậc ngay trong kỳ lương tiếp theo.

3. Thời gian tổ chức:
Bắt đầu từ ngày 20/09/2026 đến hết ngày 25/09/2026 trực tiếp tại quầy bar chi nhánh.

Đề nghị các bạn nhân sự chủ động ôn luyện kỹ định lượng các món trà sữa best-seller và size ly chuẩn.`,
      },
      {
        id: 'DOC-2026-14',
        docNumber: '14/QĐ-BĐH',
        title: 'Quyết định Ban hành Bộ Tiêu chuẩn Định lượng & Công thức Trà Trái Cây Mới',
        category: 'QUY_DINH',
        categoryLabel: 'Quy định pha chế',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        senderName: 'Ban Điều Hành F&B Chuỗi TeaP',
        senderRole: 'Tổng Công Ty TeaP ERP',
        date: '10/09/2026',
        isImportant: true,
        summary: 'Cập nhật định lượng syrup và độ ngọt chuẩn cho nhóm sản phẩm Trà Đào Cam Sả, Trà Vải Lychee và Trà Chanh Dây.',
        fullContent: `QUYẾT ĐỊNH BAN HÀNH QUY CHUẨN ĐỊNH LƯỢNG NGUYÊN LIỆU MÙA HÈ 2026

Điều 1: Kể từ ngày 15/09/2026, toàn bộ nhân sự Barista áp dụng định lượng chuẩn mới:
- Trà Đào Cam Sả: 120ml Cốt trà đen + 25ml Nước đường + 2 lát cam vàng + 3 miếng đào ngâm.
- Trà Vải Lychee: 100ml Cốt trà Lài + 30ml Syrup vải + 2 trái vải tươi.
- Mức đá chuẩn: 70% đá cho tất cả các ly size L giao hàng.

Điều 2: Nhân viên đọc bill và pha chế kiểm tra kỹ ghi chú giảm đường (30%, 50%, 70%) của khách trên máy POS để tránh việc phải pha lại gây hao hụt nguyên liệu.

Điều 3: Bộ phận Quản lý chi nhánh có trách nhiệm giám sát và kiểm tra ngẫu nhiên chất lượng đồ uống hàng ngày.`,
      },
      {
        id: 'DOC-2026-05',
        docNumber: '05/TB-5S',
        title: 'Nội quy Thực hiện Vệ sinh Quầy Bar & Tiêu chuẩn An toàn Thực phẩm 5S',
        category: 'QUY_DINH',
        categoryLabel: 'Nội quy 5S',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        senderName: 'Trần Thị Quản Lý',
        senderRole: 'Quản Lý Cửa Hàng',
        date: '08/09/2026',
        isImportant: false,
        summary: 'Quy định về việc đeo găng tay khi gắp topping, bảo quản trân châu trong nồi ủ ấm không quá 6 tiếng và tổng vệ sinh cuối ca.',
        fullContent: `QUY TRÌNH DUY TRÌ VỆ SINH 5S TẠI QUẦY PHA CHẾ:

1. Sàng lọc (Seiri): Loại bỏ các dụng cụ pha chế nứt vỡ, nguyên liệu hết hạn sử dụng trong ngày.
2. Sắp xếp (Seiton): Ca đong ml, shaker, muỗng múc trân châu đặt đúng vị trí khay tiệt trùng.
3. Sạch sẽ (Seiso): Lau sạch quầy inox sau mỗi 10 ly nước xuất xưởng. Không để nước trà đọng trên mặt bàn pha chế.
4. Săn sóc (Seiketsu): Luôn đội mũ trùm tóc, tạp dề sạch và đeo khẩu trang y tế khi đứng quầy.
5. Sẵn sàng (Shitsuke): Bàn giao ca đúng giờ, kiểm đếm tồn kho topping trước khi ký biên bản giao ca.

Nhân sự tuân thủ nghiêm túc sẽ được cộng tối đa 100 điểm Nội quy trong tháng.`,
      },
      {
        id: 'DOC-2026-01',
        docNumber: '01/KT-Q1',
        title: 'Khen thưởng Nhân sự Xuất sắc Đạt KPI & Chuyên cần 100% Tháng 08/2026',
        category: 'KHEN_THUONG',
        categoryLabel: 'Khen thưởng',
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        senderName: 'Ban Giám Đốc & Quản Lý Cửa Hàng',
        senderRole: 'Ban Khen Thưởng TeaP',
        date: '01/09/2026',
        isImportant: false,
        summary: 'Vinh danh các nhân viên có thái độ phục vụ tận tâm, ra món nhanh và không vi phạm quy chế chấm công.',
        fullContent: `THƯ VINH DANH & KHEN THƯỞNG NHÂN SỰ XUẤT SẮC

Ban Quản lý Chi nhánh TeaP Quận 1 xin trân trọng biểu dương và khen thưởng các nhân sự đã có thành tích nổi bật trong tháng 08/2026:
- Tinh thần trách nhiệm cao, luôn có mặt trước giờ vào ca 10 phút.
- Tốc độ pha chế đạt chuẩn dưới 60 giây/ly trong khung giờ cao điểm trưa.
- Đạt 100 điểm Chuyên cần và điểm KPI xuất sắc.

Mức thưởng 500.000 VNĐ đã được chuyển thẳng vào kỳ lương tháng này kèm giấy khen danh dự. Chúc các bạn tiếp tục giữ vững phong độ và lan tỏa năng lượng tích cực đến toàn đội ngũ!`,
      },
    ];
    setNotices(sampleNotices);

    // Bài thi nâng bậc cá nhân
    const sampleTests = [
      {
        id: 'TEST-1002',
        testTitle: 'Nâng Cấp Bậc B - Tốc Độ Pha Chế & Quầy Bar Cao Điểm',
        targetRankOrStage: 'Bậc B',
        date: '05/03/2026',
        evaluatorName: 'Trần Thị Quản Lý (Store Manager)',
        scoreTheory: 88,
        scorePractice: 90,
        scoreOperation: 85,
        scoreHygiene: 92,
        averageScore: 88.8,
        passed: true,
        feedback: 'Đạt chuẩn tốc độ phục vụ giờ cao điểm, ghi nhớ định lượng topping chuẩn xác, hỗ trợ đồng đội rất nhiệt tình.',
      },
      {
        id: 'TEST-1003',
        testTitle: 'Sát Hạch Bậc C - Menu Định Lượng & Quy Trình Đọc Bill',
        targetRankOrStage: 'Bậc C',
        date: '10/01/2026',
        evaluatorName: 'Trần Thị Quản Lý (Store Manager)',
        scoreTheory: 85,
        scorePractice: 82,
        scoreOperation: 84,
        scoreHygiene: 90,
        averageScore: 85.3,
        passed: true,
        feedback: 'Nắm vững phân loại size M/L và các loại trà sữa, hoàn thành tốt kỳ thử việc lên nhân viên chính thức.',
      },
    ];
    setTestRecords(sampleTests);
  };

  // Thao tác Vào Ca (Check-in)
  const handleCheckIn = () => {
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const todayStr = new Date().toLocaleDateString('vi-VN');
    setAttendanceStatus('CHECKED_IN');
    setTodayCheckInTime(timeStr);

    const newRecord: AttendanceRecord = {
      id: `ATT-${Date.now().toString().slice(-4)}`,
      date: todayStr,
      shiftName: 'Ca Sáng (07:00 - 15:00)',
      checkInTime: timeStr,
      totalHours: 'Đang tính...',
      status: 'Đúng giờ',
    };

    const updated = [newRecord, ...attendanceHistory];
    setAttendanceHistory(updated);

    localStorage.setItem('teap_staff_attendance', JSON.stringify({
      status: 'CHECKED_IN',
      checkInTime: timeStr,
      checkOutTime: '',
      history: updated,
    }));

    alert(`✅ Bạn đã Vào Ca (Check-in) thành công lúc ${timeStr}!\nChúc bạn một ca làm việc tràn đầy năng lượng tại TeaP.`);
  };

  // Thao tác Hết Ca (Check-out)
  const handleCheckOut = () => {
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setAttendanceStatus('CHECKED_OUT');
    setTodayCheckOutTime(timeStr);

    const updated = attendanceHistory.map((item, idx) => {
      if (idx === 0) {
        return {
          ...item,
          checkOutTime: timeStr,
          totalHours: '8.0 giờ',
          status: 'Đúng giờ' as const,
        };
      }
      return item;
    });

    setAttendanceHistory(updated);

    localStorage.setItem('teap_staff_attendance', JSON.stringify({
      status: 'CHECKED_OUT',
      checkInTime: todayCheckInTime,
      checkOutTime: timeStr,
      history: updated,
    }));

    alert(`🎉 Bạn đã Kết Thúc Ca (Check-out) thành công lúc ${timeStr}!\nCảm ơn bạn đã hoàn thành tốt ca trực hôm nay.`);
  };

  const filteredShifts = shifts.filter((s) => {
    if (shiftFilter === 'UPCOMING') return s.status === 'UPCOMING' || s.status === 'IN_PROGRESS';
    if (shiftFilter === 'COMPLETED') return s.status === 'COMPLETED';
    return true;
  });

  const filteredNotices = notices.filter((n) => {
    if (noticeFilter === 'ALL') return true;
    return n.category === noticeFilter;
  });

  // Menu bên trái dành cho Nhân sự
  const staffMenu = [
    { key: 'home' as StaffTab, icon: <Home className="w-5 h-5" />, label: 'Trang chủ' },
    { key: 'schedule' as StaffTab, icon: <Calendar className="w-5 h-5" />, label: 'Lịch làm việc' },
    { key: 'attendance' as StaffTab, icon: <Clock className="w-5 h-5" />, label: 'Chấm công' },
    { key: 'profile' as StaffTab, icon: <User className="w-5 h-5" />, label: 'Hồ sơ của tôi' },
    { 
      key: 'notices' as StaffTab, 
      icon: <Bell className="w-5 h-5" />, 
      label: 'Thông báo từ Quản lý',
      badge: notices.filter(n => n.isImportant).length
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* SIDEBAR DÀNH CHO NHÂN SỰ */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        {/* Brand */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 flex items-center justify-center shadow-md shadow-emerald-700/20 text-white">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-extrabold text-slate-900 leading-tight tracking-tight">TeaP Staff</div>
              <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1 mt-0.5">
                <Store className="w-3.5 h-3.5" />
                <span>Cổng Nhân Sự</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between">
            <div className="truncate pr-2">
              <div className="text-xs font-bold text-slate-900 truncate">{userProfile.fullName}</div>
              <div className="text-[10px] text-emerald-800 font-medium truncate">{userProfile.position}</div>
            </div>
            <span className="flex-shrink-0 text-[10px] font-extrabold uppercase bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-md">
              NHÂN SỰ
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3.5 space-y-1.5">
          <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Không gian làm việc</div>
          {staffMenu.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-md shadow-emerald-800/20'
                    : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-amber-400 text-slate-950' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Chi nhánh đang công tác */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Chi nhánh công tác</div>
          <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span>{userProfile.branchName}</span>
          </div>
        </div>

        {/* Logout */}
        <div className="p-3.5 border-t border-slate-100">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition border border-rose-100"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất tài khoản</span>
          </button>
        </div>
      </aside>

      {/* VÙNG NỘI DUNG CHÍNH */}
      <main className="flex-1 min-w-0 p-8 overflow-y-auto">
        {/* ================= TAB 1: TRANG CHỦ ================= */}
        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header Greeting Banner */}
            <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-emerald-200 mb-2 border border-white/10">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Hệ Thống Quản Lý Nhân Sự TeaP</span>
                  </div>
                  <h1 className="text-2xl font-black tracking-tight">
                    Xin chào, {userProfile.fullName}!
                  </h1>
                  <p className="text-xs text-emerald-100/90 mt-1">
                    Chúc bạn một ca làm việc vui vẻ và đạt hiệu suất xuất sắc hôm nay tại {userProfile.branchName}.
                  </p>
                </div>

                {/* Clock */}
                <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 text-right self-start md:self-auto">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Thời gian thực</div>
                  <div className="text-xl font-black tracking-tight font-mono">
                    {currentTime.toLocaleTimeString('vi-VN')}
                  </div>
                  <div className="text-[11px] text-emerald-100 font-medium">
                    {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Ca làm việc hôm nay */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ca làm việc hôm nay</span>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Ca Sáng
                  </span>
                </div>
                <div className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  <span>07:00 – 15:00</span>
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  Vị trí phân công: <strong className="text-slate-900">{userProfile.position}</strong>
                </div>
                <button
                  onClick={() => setActiveTab('schedule')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1 pt-1"
                >
                  <span>Xem lịch ca tuần này</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Trạng thái chấm công */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trạng thái chấm công</span>
                  {attendanceStatus === 'NOT_CHECKED_IN' && (
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      Chưa vào ca
                    </span>
                  )}
                  {attendanceStatus === 'CHECKED_IN' && (
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 animate-pulse">
                      Đang trong ca
                    </span>
                  )}
                  {attendanceStatus === 'CHECKED_OUT' && (
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      Đã hết ca
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-600">
                  {attendanceStatus === 'NOT_CHECKED_IN' && 'Bạn chưa bấm chấm công ca sáng hôm nay.'}
                  {attendanceStatus === 'CHECKED_IN' && `Đã check-in lúc: ${todayCheckInTime}`}
                  {attendanceStatus === 'CHECKED_OUT' && `Đã hoàn thành ca: ${todayCheckInTime} – ${todayCheckOutTime}`}
                </div>

                <div>
                  {attendanceStatus === 'NOT_CHECKED_IN' && (
                    <button
                      onClick={handleCheckIn}
                      className="w-full py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Vào Ca (Check-in) Ngay</span>
                    </button>
                  )}
                  {attendanceStatus === 'CHECKED_IN' && (
                    <button
                      onClick={handleCheckOut}
                      className="w-full py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Hết Ca (Check-out)</span>
                    </button>
                  )}
                  {attendanceStatus === 'CHECKED_OUT' && (
                    <div className="text-center py-1.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-500 border border-slate-100">
                      Ca làm việc hôm nay đã đóng
                    </div>
                  )}
                </div>
              </div>

              {/* Điểm KPI & Chuyên cần */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đánh giá thi đua</span>
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                    {userProfile.rank}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="text-[10px] font-bold text-slate-500">KPI</div>
                    <div className="text-base font-black text-emerald-800">{userProfile.kpiScore}</div>
                  </div>
                  <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="text-[10px] font-bold text-slate-500">Chuyên cần</div>
                    <div className="text-base font-black text-indigo-800">{userProfile.attendanceScore}</div>
                  </div>
                  <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="text-[10px] font-bold text-slate-500">Nội quy</div>
                    <div className="text-base font-black text-amber-800">{userProfile.ruleScore}</div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('profile')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1"
                >
                  <span>Xem chi tiết hồ sơ & bài thi</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Thông báo văn bản mới từ Quản lý bên trên */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">Thông Báo & Văn Bản Từ Quản Lý</h3>
                    <p className="text-xs text-slate-500">Chỉ đạo vận hành, kế hoạch đào tạo và nội quy mới nhất</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('notices')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1"
                >
                  <span>Xem tất cả ({notices.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {notices.slice(0, 3).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => setSelectedNotice(n)}
                    className="p-4 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/60 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${n.badgeColor}`}>
                          {n.categoryLabel}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400 font-medium">{n.docNumber}</span>
                        {n.isImportant && (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            Quan trọng
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 text-xs sm:text-sm hover:text-emerald-800 transition">
                        {n.title}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{n.summary}</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="text-[11px] font-medium text-slate-400">{n.date}</div>
                      <div className="text-[11px] font-bold text-emerald-800 mt-1 flex items-center gap-1 justify-end">
                        <span>Đọc văn bản</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: LỊCH LÀM VIỆC ================= */}
        {activeTab === 'schedule' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Lịch Phân Ca Làm Việc Của Tôi</h1>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  Xem chi tiết lịch ca trực, thời gian và vị trí được Quản lý phân công tại {userProfile.branchName}
                </p>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-1.5 text-xs bg-white p-1 rounded-xl border border-slate-200 shadow-sm self-start sm:self-auto">
                <button
                  onClick={() => setShiftFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    shiftFilter === 'ALL' ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Tất cả ca ({shifts.length})
                </button>
                <button
                  onClick={() => setShiftFilter('UPCOMING')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    shiftFilter === 'UPCOMING' ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Ca sắp tới
                </button>
                <button
                  onClick={() => setShiftFilter('COMPLETED')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    shiftFilter === 'COMPLETED' ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Ca đã hoàn thành
                </button>
              </div>
            </div>

            {/* Shift Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredShifts.map((s) => (
                <div
                  key={s.id}
                  className={`p-5 rounded-2xl border shadow-sm transition space-y-3 ${
                    s.status === 'IN_PROGRESS'
                      ? 'bg-emerald-50/40 border-emerald-300 ring-2 ring-emerald-600/20'
                      : s.status === 'COMPLETED'
                      ? 'bg-white border-slate-200/80 opacity-80'
                      : 'bg-white border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                        s.shiftName.includes('Sáng') ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-slate-900">{s.dayName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{s.date}</div>
                      </div>
                    </div>

                    {s.status === 'IN_PROGRESS' && (
                      <span className="whitespace-nowrap inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>CA HIỆN TẠI</span>
                      </span>
                    )}
                    {s.status === 'UPCOMING' && (
                      <span className="whitespace-nowrap text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                        Sắp diễn ra
                      </span>
                    )}
                    {s.status === 'COMPLETED' && (
                      <span className="whitespace-nowrap text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        Đã hoàn tất
                      </span>
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Khung giờ:</span>
                      <strong className="text-slate-900 font-black">{s.timeRange} ({s.shiftName})</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Vị trí đảm nhiệm:</span>
                      <strong className="text-emerald-800 font-extrabold">{s.position}</strong>
                    </div>
                  </div>

                  {s.note && (
                    <div className="text-[11px] text-slate-600 italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-100">
                      Ghi chú ca: &ldquo;{s.note}&rdquo;
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 3: CHẤM CÔNG ================= */}
        {activeTab === 'attendance' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hệ Thống Chấm Công Trực Tuyến</h1>
              <p className="text-xs font-medium text-slate-500 mt-1">
                Ghi nhận thời gian vào ca, kết thúc ca và kiểm tra bảng tổng kết ngày công trong tháng
              </p>
            </div>

            {/* Live Clock & Action Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5 border-slate-100">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đồng hồ chấm công chi nhánh</div>
                  <div className="text-4xl font-black text-slate-900 font-mono tracking-tight">
                    {currentTime.toLocaleTimeString('vi-VN')}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {attendanceStatus === 'NOT_CHECKED_IN' && (
                    <button
                      onClick={handleCheckIn}
                      className="px-6 py-3.5 bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-white rounded-xl text-sm font-black transition flex items-center gap-2 shadow-lg shadow-emerald-800/20"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>BẮT ĐẦU VÀO CA (CHECK-IN)</span>
                    </button>
                  )}

                  {attendanceStatus === 'CHECKED_IN' && (
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Giờ vào ca</div>
                        <div className="text-sm font-black text-emerald-800">{todayCheckInTime}</div>
                      </div>
                      <button
                        onClick={handleCheckOut}
                        className="px-6 py-3.5 bg-rose-700 hover:bg-rose-800 active:bg-rose-900 text-white rounded-xl text-sm font-black transition flex items-center gap-2 shadow-lg shadow-rose-700/20"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>KẾT THÚC CA (CHECK-OUT)</span>
                      </button>
                    </div>
                  )}

                  {attendanceStatus === 'CHECKED_OUT' && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                      <CheckCheck className="w-4 h-4 text-emerald-600" />
                      <span>Bạn đã hoàn thành ca làm việc hôm nay ({todayCheckInTime} – {todayCheckOutTime})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Monthly Stats Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Tổng ngày công tháng</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">24 <span className="text-xs font-normal text-slate-500">ngày</span></div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Tổng giờ làm việc</div>
                  <div className="text-2xl font-black text-emerald-800 mt-1">192 <span className="text-xs font-normal text-slate-500">giờ</span></div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Tỷ lệ đúng giờ</div>
                  <div className="text-2xl font-black text-indigo-800 mt-1">100%</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Điểm chuyên cần</div>
                  <div className="text-2xl font-black text-amber-700 mt-1">100 / 100</div>
                </div>
              </div>
            </div>

            {/* Attendance History Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-emerald-700" />
                  <span>Lịch Sử Chấm Công Các Ngày Gần Đây</span>
                </h4>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {attendanceHistory.length} bản ghi
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[680px]">
                  <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4 whitespace-nowrap">Ngày</th>
                      <th className="py-3 px-4 whitespace-nowrap">Ca trực</th>
                      <th className="py-3 px-4 whitespace-nowrap">Giờ vào (Check-in)</th>
                      <th className="py-3 px-4 whitespace-nowrap">Giờ ra (Check-out)</th>
                      <th className="py-3 px-4 whitespace-nowrap">Tổng giờ</th>
                      <th className="py-3 px-4 text-center whitespace-nowrap">Tình trạng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {attendanceHistory.map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">{att.date}</td>
                        <td className="py-3 px-4 text-slate-700 font-medium whitespace-nowrap">{att.shiftName}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-800 whitespace-nowrap">{att.checkInTime}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">{att.checkOutTime || '—'}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">{att.totalHours}</td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className="whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {att.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: HỒ SƠ CỦA TÔI ================= */}
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hồ Sơ & Năng Lực Nhân Sự</h1>
              <p className="text-xs font-medium text-slate-500 mt-1">
                Thông tin cá nhân, giai đoạn làm việc, cấp bậc tay nghề C - B - A và biên bản sát hạch
              </p>
            </div>

            {/* Profile Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b pb-6 border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-emerald-700/20">
                    {userProfile.fullName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-slate-900">{userProfile.fullName}</h2>
                      <span className="whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ⭐ {userProfile.stage}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {userProfile.position} &bull; Mã NV: <strong className="font-mono text-slate-700">TEAP-NV88</strong>
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                      <span>Email: <strong className="text-slate-700 font-mono">{userProfile.email}</strong></span>
                      <span>SĐT: <strong className="text-slate-700 font-mono">{userProfile.phone}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Cấp bậc nghề nghiệp</div>
                  <div className="text-xl font-black text-purple-900 mt-0.5 flex items-center sm:justify-end gap-1.5">
                    <span>🥇</span>
                    <span>{userProfile.rank}</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-bold mt-1">Đủ điều kiện thi thăng hạng Bậc A</div>
                </div>
              </div>

              {/* 3 Thi Đua Metric Sliders / Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 space-y-1">
                  <div className="flex justify-between text-xs font-bold text-emerald-950">
                    <span>Điểm KPI Năng Suất:</span>
                    <span className="font-black text-emerald-800">{userProfile.kpiScore} / 100</span>
                  </div>
                  <div className="w-full bg-emerald-200/60 rounded-full h-2 mt-2">
                    <div className="bg-emerald-700 h-2 rounded-full" style={{ width: `${userProfile.kpiScore}%` }}></div>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1">Đo lường tốc độ ra món & tỷ lệ chính xác bill</div>
                </div>

                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-1">
                  <div className="flex justify-between text-xs font-bold text-indigo-950">
                    <span>Điểm Chuyên Cần:</span>
                    <span className="font-black text-indigo-800">{userProfile.attendanceScore} / 100</span>
                  </div>
                  <div className="w-full bg-indigo-200/60 rounded-full h-2 mt-2">
                    <div className="bg-indigo-700 h-2 rounded-full" style={{ width: `${userProfile.attendanceScore}%` }}></div>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1">Không nghỉ không phép, đi làm đúng giờ 100%</div>
                </div>

                <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100 space-y-1">
                  <div className="flex justify-between text-xs font-bold text-amber-950">
                    <span>Điểm Nội Quy & 5S:</span>
                    <span className="font-black text-amber-800">{userProfile.ruleScore} / 100</span>
                  </div>
                  <div className="w-full bg-amber-200/60 rounded-full h-2 mt-2">
                    <div className="bg-amber-600 h-2 rounded-full" style={{ width: `${userProfile.ruleScore}%` }}></div>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1">Đồng phục, tác phong và vệ sinh an toàn thực phẩm</div>
                </div>
              </div>
            </div>

            {/* Test Assessment Records */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-700" />
                    <span>Lịch Sử Bài Sát Hạch & Quyết Định Nâng Bậc</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Biên bản thi được Quản lý Cửa hàng thẩm định và ký duyệt</p>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  {testRecords.length} kỳ thi đã đạt
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[760px]">
                  <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3.5 px-4 whitespace-nowrap">Mã bài thi</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Tên kỳ thi sát hạch</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Ngày thi</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">Điểm TB</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">Kết quả</th>
                      <th className="py-3.5 px-4 whitespace-nowrap">Người chấm thi</th>
                      <th className="py-3.5 px-4 text-center whitespace-nowrap">Chứng nhận</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {testRecords.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">{t.id}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{t.testTitle}</div>
                          <div className="text-[11px] text-slate-400">Đạt danh hiệu: <strong>{t.targetRankOrStage}</strong></div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{t.date}</td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 text-xs">
                            {t.averageScore} / 100
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="whitespace-nowrap inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5" /> ĐẠT CHUẨN
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">{t.evaluatorName}</td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => setSelectedTestToView(t)}
                            className="whitespace-nowrap px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition border border-indigo-200 inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Xem phiếu
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: THÔNG BÁO TỪ QUẢN LÝ ================= */}
        {activeTab === 'notices' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Văn Bản & Thông Báo Từ Quản Lý</h1>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  Chỉ thị vận hành, quyết định ban hành tiêu chuẩn và kế hoạch công tác từ cấp quản lý bên trên
                </p>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-1.5 text-xs bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto self-start sm:self-auto">
                {[
                  { key: 'ALL', label: 'Tất cả' },
                  { key: 'DAO_TAO', label: 'Đào tạo & Thi bậc' },
                  { key: 'QUY_DINH', label: 'Quy định & 5S' },
                  { key: 'KHEN_THUONG', label: 'Khen thưởng' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setNoticeFilter(f.key)}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-lg font-bold transition ${
                      noticeFilter === f.key ? 'bg-emerald-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Notices */}
            <div className="space-y-4">
              {filteredNotices.map((n) => (
                <div
                  key={n.id}
                  onClick={() => setSelectedNotice(n)}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 hover:border-emerald-300 hover:shadow-md transition cursor-pointer space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold border ${n.badgeColor}`}>
                        {n.categoryLabel}
                      </span>
                      <span className="font-mono text-xs text-slate-400 font-bold">Số: {n.docNumber}</span>
                      {n.isImportant && (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-rose-200">
                          HỎA TỐC / QUAN TRỌNG
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 font-medium">Ban hành ngày: <strong>{n.date}</strong></div>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 hover:text-emerald-800 transition">
                      {n.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mt-1.5">
                      {n.summary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <div className="text-slate-500">
                      Người ký duyệt: <strong className="text-slate-800">{n.senderName}</strong> ({n.senderRole})
                    </div>
                    <div className="text-emerald-700 font-bold flex items-center gap-1">
                      <span>Đọc toàn văn</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL XEM CHI TIẾT VĂN BẢN THÔNG BÁO TỪ QUẢN LÝ */}
      {selectedNotice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in">
            <div className="flex justify-between items-start border-b pb-3 border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${selectedNotice.badgeColor}`}>
                    {selectedNotice.categoryLabel}
                  </span>
                  <span className="font-mono text-xs text-slate-500 font-bold">Số: {selectedNotice.docNumber}</span>
                </div>
                <h3 className="text-lg font-black text-slate-900">{selectedNotice.title}</h3>
              </div>
              <button onClick={() => setSelectedNotice(null)} className="p-1.5 hover:bg-slate-100 rounded-xl transition">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Cơ quan / Cấp ban hành</div>
                <div className="font-bold text-slate-900 mt-0.5">{selectedNotice.senderName} &bull; {selectedNotice.senderRole}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Ngày hiệu lực</div>
                <div className="font-mono font-bold text-slate-700 mt-0.5">{selectedNotice.date}</div>
              </div>
            </div>

            <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed bg-white p-4 rounded-xl border border-slate-200 font-sans">
              {selectedNotice.fullContent}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-400">Đã phổ biến tới toàn bộ nhân sự chi nhánh TeaP</span>
              <button
                onClick={() => setSelectedNotice(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
              >
                Đóng văn bản
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM PHIẾU ĐIỂM SÁT HẠCH CHI TIẾT */}
      {selectedTestToView && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex justify-between items-start border-b pb-3 border-slate-100">
              <div>
                <div className="text-[10px] font-extrabold uppercase text-emerald-700 tracking-wider">HỆ THỐNG TRÀ SỮA TEAP &bull; {userProfile.branchName}</div>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">Phiếu Điểm Sát Hạch Chuyên Môn</h3>
              </div>
              <button onClick={() => setSelectedTestToView(null)} className="p-1.5 hover:bg-slate-100 rounded-xl transition">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Nhân sự dự thi</div>
                  <div className="font-extrabold text-slate-900 text-sm mt-0.5">{userProfile.fullName}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Mã & Ngày</div>
                  <div className="font-mono font-bold text-slate-700 mt-0.5">{selectedTestToView.id} ({selectedTestToView.date})</div>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="text-[10px] text-emerald-700 font-bold uppercase">Kỳ thi đánh giá</div>
                <div className="font-extrabold text-slate-900 text-sm mt-0.5">{selectedTestToView.testTitle}</div>
                <div className="text-xs text-emerald-700 mt-1">Mục tiêu thăng cấp: <strong>{selectedTestToView.targetRankOrStage}</strong></div>
              </div>

              <div className="space-y-2 border-t border-b py-3 border-slate-100">
                {[
                  { l: '1. Lý thuyết Menu & Định lượng', s: selectedTestToView.scoreTheory },
                  { l: '2. Thực hành quầy bar & Tốc độ ra món', s: selectedTestToView.scorePractice },
                  { l: '3. Thao tác POS & Kiểm soát bill', s: selectedTestToView.scoreOperation },
                  { l: '4. Vệ sinh ATVSTP & Tác phong 5S', s: selectedTestToView.scoreHygiene },
                ].map((x) => (
                  <div key={x.l} className="flex justify-between">
                    <span className="text-slate-600">{x.l}:</span>
                    <span className="font-bold text-slate-900">{x.s} / 100</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 font-black text-sm">
                  <span className="text-slate-900">ĐIỂM TRUNG BÌNH:</span>
                  <span className="text-emerald-800 text-base">{selectedTestToView.averageScore} / 100</span>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Nhận xét của Quản lý chấm thi:</div>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 mt-1 italic leading-relaxed">
                  &ldquo;{selectedTestToView.feedback}&rdquo;
                </p>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-500">Người chấm: <strong>{selectedTestToView.evaluatorName}</strong></span>
                <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                  KẾT QUẢ: ĐẠT CHUẨN
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button onClick={() => setSelectedTestToView(null)} className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition">
                Đóng phiếu điểm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
