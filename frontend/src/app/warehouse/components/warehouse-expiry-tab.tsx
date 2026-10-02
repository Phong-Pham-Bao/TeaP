import React from 'react';
import { FeatureUnavailable } from '@/components/feature-unavailable';

export default function WarehouseExpiryTab() {
  return <FeatureUnavailable title="Lô và hạn sử dụng" description="Schema hiện chưa có lot, expiry, quarantine và FEFO. Danh sách lô mẫu đã được gỡ để không hiển thị tồn không có thật." roadmap="INV-02" />;
}
