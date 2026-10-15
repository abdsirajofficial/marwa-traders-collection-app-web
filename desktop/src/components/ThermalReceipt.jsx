import React, { useState } from 'react';
import { Printer, X, MapPin } from 'lucide-react';
import LocationMapModal from './LocationMapModal';

export default function ThermalReceipt({ payment, onClose }) {
  const [showLocationModal, setShowLocationModal] = useState(false);
  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const customerName = payment.customerId?.shopName || 'CUSTOMER';
  const collectorName = payment.collectedBy?.name || 'COLLECTOR';
  const locationName = payment.location?.locationName || payment.customerId?.address || 'Counter';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200">
        {/* Header bar */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-sky-400" />
            <span className="font-semibold text-sm">Thermal 58mm Receipt</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 58mm Thermal Printable Canvas */}
        <div className="p-6 bg-slate-50 flex justify-center">
          <div 
            id="thermal-receipt"
            className="w-[58mm] bg-white p-3 font-mono text-[11px] text-black shadow-md border border-slate-300 leading-tight"
          >
            <div className="text-center font-bold text-xs tracking-wider mb-0.5">
              MARWA TRADERS
            </div>
            <div className="text-center text-[10px] uppercase tracking-wider mb-2 border-b border-dashed border-black pb-1">
              PAYMENT RECEIPT
            </div>

            <div className="space-y-1 mb-2">
              <div className="flex justify-between">
                <span className="font-semibold">Receipt No:</span>
              </div>
              <div className="text-[10px] break-all font-bold">
                {payment.receiptNumber}
              </div>

              <div className="mt-1">
                <span className="font-semibold">Customer:</span>
                <div className="font-bold text-[11px]">{customerName.toUpperCase()}</div>
              </div>

              <div className="border-t border-dashed border-black my-1.5" />

              <div className="flex justify-between">
                <span>Previous Due:</span>
                <span className="font-semibold">₹{Number(payment.previousOutstanding || 0).toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between font-bold text-xs py-0.5 border-y border-dashed border-black">
                <span>Payment Recd:</span>
                <span>₹{Number(payment.amount || 0).toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between pt-0.5">
                <span>Balance Due:</span>
                <span className="font-bold">₹{Number(payment.remainingOutstanding || 0).toLocaleString('en-IN')}</span>
              </div>

              <div className="border-t border-dashed border-black my-1.5" />

              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-semibold">{payment.paymentMode || 'CASH'}</span>
              </div>

              <div className="flex justify-between">
                <span>Collected By:</span>
                <span className="font-semibold">{collectorName.toUpperCase()}</span>
              </div>

              <div className="flex justify-between">
                <span>Date:</span>
                <span>{formatDate(payment.createdAt)}</span>
              </div>

              <div className="flex justify-between">
                <span>Time:</span>
                <span>{formatTime(payment.createdAt)}</span>
              </div>

              <div className="mt-1 flex items-center justify-between">
                <span>Location:</span>
                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  className="text-[10px] text-sky-700 font-semibold underline hover:text-sky-900 flex items-center gap-0.5 cursor-pointer"
                  title="Click to view collection location on map"
                >
                  <MapPin className="w-2.5 h-2.5 text-sky-600" />
                  <span>{locationName}</span>
                </button>
              </div>
            </div>

            <div className="text-center text-[10px] font-bold tracking-widest mt-3 pt-2 border-t border-dashed border-black">
              THANK YOU
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-200 flex gap-2">
          <button
            onClick={() => setShowLocationModal(true)}
            className="py-2.5 px-3 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl text-xs font-semibold border border-sky-200 flex items-center gap-1.5 transition"
          >
            <MapPin className="w-3.5 h-3.5 text-sky-600" />
            <span>Map</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-sky-600/30 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Location Map Modal */}
      {showLocationModal && (
        <LocationMapModal
          locationData={{
            title: 'Payment Collection Presence',
            userName: payment.collectedBy?.name || 'Collector',
            userRole: payment.collectedBy?.role || 'CASH_COLLECTOR',
            eventName: `Cash Collection • ${payment.customerId?.shopName || 'Customer'}`,
            timestamp: payment.createdAt,
            address: locationName,
            latitude: payment.location?.latitude,
            longitude: payment.location?.longitude,
            receiptNumber: payment.receiptNumber,
            amount: payment.amount,
          }}
          onClose={() => setShowLocationModal(false)}
        />
      )}
    </div>
  );
}
