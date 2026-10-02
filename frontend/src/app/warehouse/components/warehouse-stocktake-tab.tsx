import React from 'react';
import { FeatureUnavailable } from '@/components/feature-unavailable';

export default function WarehouseStocktakeTab() {
  return <FeatureUnavailable title="Kiểm kê kho" description="Chưa có phiên kiểm kê, snapshot, recount, approval và stock posting bất biến. Chức năng sẽ được mở sau khi backend kiểm kê hoàn tất." roadmap="INV-04" />;
}
