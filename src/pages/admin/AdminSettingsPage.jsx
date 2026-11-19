import React, { useState } from 'react';
import { Settings, Shield, Bell, Database, Lock, CheckCircle, Save } from 'lucide-react';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';

export const AdminSettingsPage = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('compliance');
  const [codLimit, setCodLimit] = useState(5000);
  const [expressDeliveryFee, setExpressDeliveryFee] = useState(30);

  const auditLogs = [
    { timestamp: '19 Nov 2026, 10:45 AM', actor: 'Subhash Bose (Chief Pharmacist)', action: 'Prescription Verified (RX-9921)', ip: '103.21.144.12', status: 'PASS' },
    { timestamp: '19 Nov 2026, 10:38 AM', actor: 'Rahul Das (Rider)', action: 'Pickup Code Scanned (OW-89214)', ip: '49.37.202.99', status: 'PASS' },
    { timestamp: '19 Nov 2026, 10:15 AM', actor: 'Rajiv Sen (Super Admin)', action: 'Batch Expiry Notice Sent to MedPlus', ip: '182.74.88.10', status: 'PASS' },
    { timestamp: '19 Nov 2026, 09:30 AM', actor: 'System Daemon', action: 'Daily Token Queue Reset & Recalibration', ip: 'Internal Cluster', status: 'PASS' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-forest-900">
          Platform Configuration & CDSCO Compliance
        </h1>
        <p className="text-xs text-brandText-secondary mt-0.5">
          West Bengal healthcare regulatory policies, system parameters, and immutable security audit logs.
        </p>
      </div>

      <div className="flex items-center gap-2 border-b border-brandBorder-subtle pb-2">
        <button
          onClick={() => setActiveTab('compliance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'compliance'
              ? 'bg-forest-800 text-white shadow-sm'
              : 'text-brandText-secondary hover:bg-forest-50 hover:text-forest-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>CDSCO & Drug Safety</span>
        </button>

        <button
          onClick={() => setActiveTab('parameters')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'parameters'
              ? 'bg-forest-800 text-white shadow-sm'
              : 'text-brandText-secondary hover:bg-forest-50 hover:text-forest-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Commerce Parameters</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'audit'
              ? 'bg-forest-800 text-white shadow-sm'
              : 'text-brandText-secondary hover:bg-forest-50 hover:text-forest-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Security Audit Trail</span>
        </button>
      </div>

      {activeTab === 'compliance' && (
        <div className="bg-surface-pure rounded-2xl border border-brandBorder-subtle p-6 space-y-5 shadow-card max-w-3xl">
          <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Regulatory Compliance Active</p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Oshud Wala operates in strict compliance with the West Bengal State Pharmacy Council (WBSPC)
                and CDSCO e-pharmacy guidelines. Schedule H/H1 medicines require valid prescription verification
                before delivery dispatch.
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl border border-brandBorder-subtle bg-surface-warm">
              <div>
                <p className="font-bold text-forest-900">Mandatory Rx for Schedule H & H1</p>
                <p className="text-[11px] text-brandText-secondary">
                  Automatically halt order progression until registered pharmacist approves
                </p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 text-forest-600 rounded" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-brandBorder-subtle bg-surface-warm">
              <div>
                <p className="font-bold text-forest-900">Two-Factor OTP on Delivery Handover</p>
                <p className="text-[11px] text-brandText-secondary">
                  Require customer 4-digit SMS OTP prior to rider completing delivery
                </p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 text-forest-600 rounded" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-brandBorder-subtle bg-surface-warm">
              <div>
                <p className="font-bold text-forest-900">Expiry Alert Threshold</p>
                <p className="text-[11px] text-brandText-secondary">
                  Flag batches expiring within 30 days and restrict automated dispatch
                </p>
              </div>
              <span className="font-bold text-forest-800 px-3 py-1 bg-forest-100 rounded-lg">
                30 Days
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'parameters' && (
        <div className="bg-surface-pure rounded-2xl border border-brandBorder-subtle p-6 space-y-5 shadow-card max-w-2xl">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-forest-800">
                Max Cash on Delivery (COD) Limit (₹)
              </label>
              <input
                type="number"
                value={codLimit}
                onChange={(e) => setCodLimit(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 border border-brandBorder-subtle rounded-xl text-xs bg-surface-warm font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-forest-800">
                Standard Express Delivery Fee (₹)
              </label>
              <input
                type="number"
                value={expressDeliveryFee}
                onChange={(e) => setExpressDeliveryFee(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 border border-brandBorder-subtle rounded-xl text-xs bg-surface-warm font-mono font-bold"
              />
            </div>

            <Button
              variant="primary"
              size="sm"
              leftIcon={Save}
              onClick={() => addToast('System parameters saved successfully!', 'success')}
              className="text-xs"
            >
              Save Parameters
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-surface-pure rounded-2xl border border-brandBorder-subtle overflow-hidden shadow-card">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-warm/60 border-b border-brandBorder-subtle">
                <th className="p-3.5 font-bold text-forest-900">Timestamp</th>
                <th className="p-3.5 font-bold text-forest-900">Operator / Actor</th>
                <th className="p-3.5 font-bold text-forest-900">Operation Action</th>
                <th className="p-3.5 font-bold text-forest-900">IP Address</th>
                <th className="p-3.5 font-bold text-forest-900 text-right">Integrity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brandBorder-subtle/70">
              {auditLogs.map((log, idx) => (
                <tr key={idx} className="hover:bg-forest-50/30">
                  <td className="p-3.5 text-brandText-secondary font-mono text-[11px]">{log.timestamp}</td>
                  <td className="p-3.5 font-bold text-forest-900">{log.actor}</td>
                  <td className="p-3.5 text-brandText-main">{log.action}</td>
                  <td className="p-3.5 font-mono text-[11px] text-brandText-muted">{log.ip}</td>
                  <td className="p-3.5 text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsPage;
