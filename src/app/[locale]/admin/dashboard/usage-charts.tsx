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
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";

// User growth (30d)
export function UsageAreaChart({
  data,
}: {
  data: { date: string; newUsers: number }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="newUsers"
            name="New Users"
            stroke="#6366F1"
            fillOpacity={1}
            fill="url(#colorUsers)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Extended timeline for additional entities (comments, participants, goodies, events)
export function ExtendedTimelineChart({
  data,
}: {
  data: {
    date: string;
    newComments: number;
    newParticipants: number;
    newGoodies: number;
    newEvents: number;
  }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="newComments"
            name="Comments"
            stroke="#8B5CF6"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="newParticipants"
            name="Participants"
            stroke="#10B981"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="newGoodies"
            name="Goodies"
            stroke="#EC4899"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="newEvents"
            name="Events"
            stroke="#F59E0B"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

type BarSeriesDef = { dataKey: string; name: string; color: string };
interface GenericDataRecord {
  [key: string]: string | number | null | undefined;
}
export function SimpleBarChart({
  data,
  xKey,
  bars,
}: {
  data: GenericDataRecord[];
  xKey: string;
  bars: BarSeriesDef[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ left: 0, right: 0, top: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 10 }}
            interval={0}
            angle={bars.length > 1 ? 0 : 0}
          />
          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {bars.map((b) => (
            <Bar
              key={b.dataKey}
              dataKey={b.dataKey}
              name={b.name}
              fill={b.color}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
