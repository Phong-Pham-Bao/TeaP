import React from 'react';
import { FeatureUnavailable } from '@/components/feature-unavailable';

export default function ManagerTrainingTab() {
  return <FeatureUnavailable title="Đào tạo nhân viên" description="Chưa có khóa học, bài kiểm tra, nguồn điểm và quyền xem kết quả ở backend. Màn hình không còn hiển thị điểm mẫu." roadmap="EXT-02" />;
}
