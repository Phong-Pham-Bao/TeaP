'use client';

import React, { useState } from 'react';
import { 
  PackagePlus, Plus, Calendar, DollarSign, 
  CheckCircle2, X, FileText, Search 
} from 'lucide-react';
import { SupplierReceipt } from './warehouse-types';

const INITIAL_RECEIPTS: SupplierReceipt[] = [
  { id: 'rc-1', receiptNumber: 'PNK-260915-01', supplierName: 'Dalat Milk Vietnam Co.', receivedDate: '2026-09-15', materialName: 'Sữa tươi thanh trùng 1L', batchNumber: 'LOT-DLM-2609A', expiryDate: '2026-09-25', quantity: 200, unit: 'Hộp', unitPrice: 32000, totalCost: 6400000 },
  { id: 'rc-2', receiptNumber: 'PNK-260914-04', supplierName: 'Công Ty Trà Tân Cương Thái Nguyên', receivedDate: '2026-09-14', materialName: 'Trà Đen Lạc Xương Thượng Hạng', batchNumber: 'LOT-TLX-2608B', expiryDate: '2027-09-14', quantity: 150, unit: 'Kg', unitPrice: 180000, totalCost: 27000000 },
  { id: 'rc-3', receiptNumber: 'PNK-260912-02', supplierName: 'Gia Thịnh Phát Food Ingredients', receivedDate: '2026-09-12', materialName: 'Trân Châu Đen Hoàng Kim Ô Long', batchNumber: 'LOT-TC-2609C', expiryDate: '2027-03-12', quantity: 300, unit: 'Kg', unitPrice: 42000, totalCost: 12600000 },
  { id: 'rc-4', receiptNumber: 'PNK-260910-09', supplierName: 'Đại Đồng Tiến Plastic Packaging', receivedDate: '2026-09-10', materialName: 'Ly Nhựa PP 700ml & Nắp Cầu', batchNumber: 'LOT-LY-260901', expiryDate: '2029-09-10', quantity: 10000, unit: 'Cái', unitPrice: 650, totalCost: 6500000 },
];

export default function WarehouseReceiptsTab() {
  const [receipts, setReceipts] = useState<SupplierReceipt[]>(INITIAL_RECEIPTS);
  const [showModal, setShowModal] = useState(false);
  const [supplier, setSupplier] = useState('Dalat Milk Vietnam Co.');
  const [material, setMaterial] = useState('Sữa tươi thanh trùng 1L');
  const [batch, setBatch] = useState('LOT-DLM-2609B');
  const [qty, setQty] = useState(100);
  const [unit, setUnit] = useState('Hộp');
  const [price, setPrice] = useState(32000);
  const [exp, setExp] = useState('2026-09-28');

  const handleCreateReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    const newReceipt: SupplierReceipt = {
      id: `rc_${Date.now()}`,
      receiptNumber: `PNK-260916-${Math.floor(10 + Math.random() * 90)}`,
      supplierName: supplier,
      receivedDate: new Date().toISOString().slice(0, 10),
      materialName: material,
      batchNumber: batch,
      expiryDate: exp,
      quantity: qty,
      unit: unit,
      unitPrice: price,
      totalCost: qty * price,
    };
    setReceipts(prev => [newReceipt, ...prev]);
    setShowModal(false);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-emerald-700" />
            Nhập Kho Từ Nhà Cung Cấp (Inward PO)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Tiếp nhận nguyên liệu, kiểm đếm chất lượng, lưu số lô (Batch) và hạn sử dụng (Expiry Date).</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Tạo Phiếu Nhập Kho
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Số Phiếu</th>
                <th className="py-3 px-4">Nhà Cung Cấp</th>
                <th className="py-3 px-4">Nguyên Liệu</th>
                <th className="py-3 px-4">Số Lô (Batch No)</th>
                <th className="py-3 px-4">Hạn Sử Dụng</th>
                <th className="py-3 px-4 text-right">Số Lượng</th>
                <th className="py-3 px-4 text-right">Đơn Giá Nhập</th>
                <th className="py-3 px-4 text-right">Tổng Tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receipts.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.receiptNumber}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{r.supplierName}</td>
                  <td className="py-3 px-4 font-bold text-emerald-950">{r.materialName}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600 bg-slate-50/50 px-2 py-0.5 rounded">{r.batchNumber}</td>
                  <td className="py-3 px-4 font-mono text-slate-700 font-medium">{r.expiryDate}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{r.quantity.toLocaleString()} {r.unit}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-600">{r.unitPrice.toLocaleString('vi-VN')} đ</td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-800">{r.totalCost.toLocaleString('vi-VN')} đ</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900">Lập Phiếu Nhập Hàng Nhà Cung Cấp</h3>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateReceipt} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nhà Cung Cấp</label>
                <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none" required />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên Nguyên Vật Liệu</label>
                <input type="text" value={material} onChange={e => setMaterial(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số Lô (Batch No)</label>
                  <input type="text" value={batch} onChange={e => setBatch(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none" required />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hạn Sử Dụng (Exp Date)</label>
                  <input type="date" value={exp} onChange={e => setExp(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none" required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số lượng</label>
                  <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none" required />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Đơn vị</label>
                  <input type="text" value={unit} onChange={e => setUnit(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none" required />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Đơn giá nhập</label>
                  <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none" required />
                </div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between font-bold text-xs text-emerald-950">
                <span>Tổng giá trị nhập:</span>
                <span className="font-mono text-emerald-800 font-extrabold text-sm">{(qty * price).toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-emerald-800 text-white rounded-xl font-bold shadow-xs hover:bg-emerald-700">Lưu phiếu nhập</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
