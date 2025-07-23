import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import React from "react";

export type TicketStatusChartData = {
  status: string;
  count: number;
};

export default function DashboardCharts({ data }: { data: TicketStatusChartData[] }) {
  return (
    <div className="w-full h-72 bg-white/60 dark:bg-slate-900/60 rounded-xl shadow-lg p-4 backdrop-blur-md">
      <h2 className="text-lg font-semibold mb-4 text-blue-700">Tickets par statut</h2>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="status" tick={{ fill: '#64748b', fontSize: 14 }} />
          <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 14 }} />
          <Tooltip wrapperClassName="!rounded-xl !shadow-lg !bg-white/90 !text-slate-900" />
          <Legend />
          <Bar dataKey="count" fill="#6366f1" radius={[8,8,0,0]} barSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
