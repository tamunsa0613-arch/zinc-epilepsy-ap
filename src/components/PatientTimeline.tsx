'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface TimelineData {
  month: string;
  seizureCount: number;
  serumZinc: number | null;
  zincSupplementation: boolean;
}

interface PatientTimelineProps {
  data: TimelineData[];
}

export function PatientTimeline({ data }: PatientTimelineProps) {
  const sortedData = [...data].sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div className="space-y-6">
      {/* 発作頻度推移 */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">月別発作回数</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sortedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const [year, month] = value.split('-');
                return `${year}/${month}`;
              }}
            />
            <YAxis />
            <Tooltip
              formatter={(value) => [value ?? 0, '発作回数']}
              labelFormatter={(label) => {
                const [year, month] = label.split('-');
                return `${year}年${month}月`;
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="seizureCount"
              stroke="#ef4444"
              strokeWidth={2}
              name="発作回数"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 亜鉛濃度推移 */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">血清亜鉛濃度 (µg/dL)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sortedData.filter((d) => d.serumZinc !== null)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => {
                const [year, month] = value.split('-');
                return `${year}/${month}`;
              }}
            />
            <YAxis domain={[0, 150]} />
            <Tooltip
              formatter={(value) => [value ?? 0, '血清亜鉛']}
              labelFormatter={(label) => {
                const [year, month] = label.split('-');
                return `${year}年${month}月`;
              }}
            />
            <Legend />
            <ReferenceLine
              y={80}
              stroke="#9ca3af"
              strokeDasharray="5 5"
              label={{ value: '基準下限 (80)', position: 'right', fontSize: 12 }}
            />
            <Line
              type="monotone"
              dataKey="serumZinc"
              stroke="#3b82f6"
              strokeWidth={2}
              name="血清亜鉛"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 亜鉛補充状態のタイムライン */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">亜鉛補充状態</h3>
        <div className="flex flex-wrap gap-2">
          {sortedData.map((d) => (
            <div
              key={d.month}
              className={`px-3 py-1 rounded text-sm ${
                d.zincSupplementation
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {d.month.replace('-', '/')}: {d.zincSupplementation ? '補充中' : '補充なし'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
