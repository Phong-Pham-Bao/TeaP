import React from 'react';
import { FeatureUnavailable } from '@/components/feature-unavailable';

export default function WarehouseDispatchTab() {
  return <FeatureUnavailable title="Điều chuyển nhiều bước" description="Chưa có chứng từ request/approve/pick/dispatch/receive và tồn đang vận chuyển. Dữ liệu mẫu đã được gỡ để tránh xác nhận điều chuyển giả." roadmap="INV-03" />;
}
