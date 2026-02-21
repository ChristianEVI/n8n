import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Activity, FlaskConical, TrendingUp, Calendar, Building2, Upload
} from 'lucide-react';
import { fetchStats, fetchTimeline, fetchTopMolecules, fetchTopClients } from '../lib/api';
import { formatDate, formatDateShort } from '../lib/utils';

function KpiCard({ icon: Icon, title, value, sub, color }: {
  icon: React.ElementType; title: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="kpi-card">
      <div className={`kpi-icon ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</div>
        <div className="text-sm font-medium text-gray-700 mt-0.5">{title}</div>
        {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: fetchStats });
  const { data: timeline } = useQuery({ queryKey: ['timeline'], queryFn: fetchTimeline });
  const { data: topMolecules } = useQuery({ queryKey: ['top-molecules'], queryFn: () => fetchTopMolecules(10) });
  const { data: topClients } = useQuery({ queryKey: ['top-clients'], queryFn: () => fetchTopClients(10) });

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 text-sm">Loading dashboard...</div>
      </div>
    );
  }

  const timelineData = (timeline || []).map((d: { month: string; count: number }) => ({
    month: formatDateShort(d.month + '-01'),
    count: d.count,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">aRMP Sales Intelligence Overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Activity}
          title="Total Inquiries"
          value={stats.totalInquiries}
          color="bg-primary"
        />
        <KpiCard
          icon={Building2}
          title="Unique Clients"
          value={stats.uniqueClients}
          color="bg-blue-500"
        />
        <KpiCard
          icon={FlaskConical}
          title="Unique Molecules"
          value={stats.uniqueMolecules}
          color="bg-emerald-500"
        />
        <KpiCard
          icon={TrendingUp}
          title="Inquiries This Year"
          value={stats.inquiriesThisYear}
          color="bg-amber-500"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="font-semibold text-gray-900">Inquiries Over Time</h3>
              <p className="text-xs text-gray-400 mt-0.5">Monthly inquiry volume (2017–2026)</p>
            </div>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: string) => v.slice(0, 6)}
                  interval={11}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#1F4E79"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="Inquiries"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Molecules */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="font-semibold text-gray-900">Top 10 Molecules</h3>
              <p className="text-xs text-gray-400 mt-0.5">Most frequently requested INN</p>
            </div>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topMolecules || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="inn"
                  tick={{ fontSize: 10 }}
                  width={100}
                  tickFormatter={(v: string) => v?.length > 14 ? v.slice(0, 13) + '…' : v}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}
                />
                <Bar dataKey="count" fill="#1F4E79" radius={[0, 4, 4, 0]} name="Inquiries" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="font-semibold text-gray-900">Top 10 Clients</h3>
              <p className="text-xs text-gray-400 mt-0.5">By number of inquiries</p>
            </div>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topClients || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="client_name"
                  tick={{ fontSize: 10 }}
                  width={120}
                  tickFormatter={(v: string) => v?.length > 16 ? v.slice(0, 15) + '…' : v}
                />
                <Tooltip
                  contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8 }}
                />
                <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} name="Inquiries" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="font-semibold text-gray-900">Recent Activity</h3>
              <p className="text-xs text-gray-400 mt-0.5">Last 10 inquiries added</p>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {(stats.recentActivity || []).map((item: {
              type: string; project_key: string; client_name: string; date: string; detail: string;
            }, i: number) => (
              <div key={i} className="px-5 py-3 flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-primary">{item.project_key}</span>
                    <span className="text-xs text-gray-400">{formatDate(item.date)}</span>
                  </div>
                  <div className="text-sm text-gray-700 truncate">{item.client_name}</div>
                  {item.detail && (
                    <div className="text-xs text-gray-400 truncate mt-0.5">{item.detail}</div>
                  )}
                </div>
              </div>
            ))}
            {(!stats.recentActivity || stats.recentActivity.length === 0) && (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                No data yet. Import your Excel files to get started.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {stats.totalInquiries === 0 && (
        <div className="card p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Data Yet</h3>
          <p className="text-sm text-gray-500 mb-4">
            Import your Excel files to start using the Sales Intelligence tool.
          </p>
          <a href="/import" className="btn-primary">
            <Upload className="w-4 h-4" />
            Go to Data Import
          </a>
        </div>
      )}
    </div>
  );
}
