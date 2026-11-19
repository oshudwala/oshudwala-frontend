import React from 'react';
import { Calendar, Clock, MapPin, Building2, CheckCircle } from 'lucide-react';
import Button from '../../components/common/Button';

export const DoctorSchedulePage = () => {
  const scheduleSlots = [
    { day: 'Monday', clinic: 'Apollo Clinic, Salt Lake Kolkata', morning: '09:30 AM – 01:30 PM', evening: '05:00 PM – 08:30 PM', chamber: 'Room 204' },
    { day: 'Tuesday', clinic: 'Apollo Clinic, Salt Lake Kolkata', morning: '09:30 AM – 01:30 PM', evening: '05:00 PM – 08:30 PM', chamber: 'Room 204' },
    { day: 'Wednesday', clinic: 'BM Birla Heart Research Centre', morning: '10:00 AM – 02:00 PM', evening: 'Chamber Closed', chamber: 'OPD Block C' },
    { day: 'Thursday', clinic: 'Apollo Clinic, Salt Lake Kolkata', morning: '09:30 AM – 01:30 PM', evening: '05:00 PM – 08:30 PM', chamber: 'Room 204' },
    { day: 'Friday', clinic: 'Apollo Clinic, Salt Lake Kolkata', morning: '09:30 AM – 01:30 PM', evening: '05:00 PM – 08:30 PM', chamber: 'Room 204' },
    { day: 'Saturday', clinic: 'Apollo Clinic, Salt Lake Kolkata', morning: '10:00 AM – 02:00 PM', evening: 'Chamber Closed', chamber: 'Room 204' },
    { day: 'Sunday', clinic: 'Rest / Weekly Off', morning: 'Emergency On-Call', evening: 'Emergency On-Call', chamber: 'Hospital Triage' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-forest-900">
          Weekly Consultation Timetable
        </h1>
        <p className="text-xs text-brandText-secondary mt-0.5">
          Configured chamber shifts across partner polyclinics in Kolkata.
        </p>
      </div>

      <div className="bg-surface-pure rounded-3xl border border-brandBorder-subtle shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-warm/60 border-b border-brandBorder-subtle">
                <th className="p-4 font-bold text-forest-900">Day of Week</th>
                <th className="p-4 font-bold text-forest-900">Assigned Clinic & Chamber</th>
                <th className="p-4 font-bold text-forest-900">Morning Shift</th>
                <th className="p-4 font-bold text-forest-900">Evening Shift</th>
                <th className="p-4 font-bold text-forest-900 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brandBorder-subtle/70">
              {scheduleSlots.map((item) => (
                <tr key={item.day} className="hover:bg-forest-50/30">
                  <td className="p-4 font-bold text-forest-900">{item.day}</td>
                  <td className="p-4">
                    <p className="font-semibold text-brandText-main">{item.clinic}</p>
                    <p className="text-[11px] text-brandText-muted">{item.chamber}</p>
                  </td>
                  <td className="p-4 font-medium text-forest-800">{item.morning}</td>
                  <td className="p-4 font-medium text-forest-800">{item.evening}</td>
                  <td className="p-4 text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorSchedulePage;
