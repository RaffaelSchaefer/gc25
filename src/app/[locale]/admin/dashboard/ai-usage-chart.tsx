"use client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export function AIAreaChart({
  data,
}: {
  data: { date: string; aiUsage: number }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="aiUsage"
            name="AI-Nutzung"
            stroke="#f43f5e"
            fillOpacity={1}
            fill="url(#colorAI)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
