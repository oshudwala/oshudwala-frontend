import React from 'react';
import { UserCheck, Calendar, Clock, Stethoscope, Search, Plus, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';

export const ReceptionistDashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <div className="bg-surface-pure rounded-3xl p-6 sm:p-8 border border-brandBorder-subtle shadow-card flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="w-20 h-20 rounded-full bg-forest-100 border-4 border-forest-600 flex items-center justify-center text-forest-700 shadow-card">
            <UserCheck className="w-10 h-10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-forest-800">
                Clinic Reception Desk
              </h1>
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-forest-100 text-forest-800 border border-forest-200">
                Receptionist Desk
              </span>
            </div>
            <p className="text-xs text-brandText-secondary mt-1">{user?.fullName || user?.name || user?.email}</p>
            <p className="text-xs text-forest-600 font-semibold mt-0.5 font-mono">Mobile: {user?.phone}</p>
          </div>
        </div>
      </div>

      <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-heading font-bold text-lg text-forest-800">Today's Patient Check-in Tokens</h3>
            <p className="text-xs text-brandText-secondary">
              Generate physical chamber tokens and record arrival check-ins for doctor consultation queues
            </p>
          </div>
          <Button variant="primary" size="sm" leftIcon={Plus}>
            Issue Walk-in Token
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-brandBorder-subtle text-brandText-secondary font-semibold">
                <th className="py-3 px-3">Token</th>
                <th className="py-3 px-3">Patient Name</th>
                <th className="py-3 px-3">Doctor Chamber</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brandBorder-subtle">
              <tr className="hover:bg-forest-50/40">
                <td className="py-3 px-3 font-bold font-mono text-forest-800">TOKEN #14</td>
                <td className="py-3 px-3 font-semibold text-brandText-main">Rahul Sen</td>
                <td className="py-3 px-3 text-brandText-secondary">Dr. Priya Sharma (General Physician)</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    IN CONSULTATION
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <Button variant="outline" size="sm">Completed</Button>
                </td>
              </tr>
              <tr className="hover:bg-forest-50/40">
                <td className="py-3 px-3 font-bold font-mono text-forest-800">TOKEN #15</td>
                <td className="py-3 px-3 font-semibold text-brandText-main">Aparna Das</td>
                <td className="py-3 px-3 text-brandText-secondary">Dr. Priya Sharma (General Physician)</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    WAITING IN CHAMBER
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <Button variant="primary" size="sm">Call Next</Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboardPage;
