import React from 'react';
import { FeatureUnavailable } from '@/components/feature-unavailable';

export default function ManagerChecklistTab() {
  return <FeatureUnavailable title="Checklist vận hành" description="Chưa có checklist run, assignee, evidence và lịch sử xác nhận ở backend. Trạng thái mẫu trong trình duyệt đã được loại bỏ." roadmap="OPS-01" />;
}
