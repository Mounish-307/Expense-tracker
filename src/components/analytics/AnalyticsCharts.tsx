"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface Props {
  monthlyData: { month: string; total: number; budget: number }[];
  categoryData: { category: string; value: number; percentage: number; color: string }[];
  dailyData: { date: number; amount: number }[];
  budgetData: { category: string; budget: number; actual: number; icon: string }[];
  symbol: string;
}

const RADIAN = Math.PI / 180;

interface CustomLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percentage?: number;
}

function CustomLabel({
  cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percentage = 0,
}: CustomLabelProps) {
  if (percentage < 8) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="600">
      {percentage}%
    </text>
  );
}

const tooltipStyle = {
  backgroundColor: "#1a1d27",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  padding: "8px 12px",
  color: "#f1f5f9",
  fontSize: "12px",
};

export function AnalyticsCharts({
  monthlyData,
  categoryData,
  dailyData,
  budgetData,
  symbol,
}: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly spending bar chart */}
      <div className="glass rounded-2xl p-5 lg:col-span-2">
        <h2 className="font-semibold text-white mb-1">Monthly Spending Trend</h2>
        <p className="text-xs text-slate-500 mb-5">Last 6 months vs budget</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} barGap={4} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${symbol}${(v / 1000).toFixed(0)}k`}
              width={45}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number, name: string) => [
                formatCurrency(value, symbol),
                name === "total" ? "Spent" : "Budget",
              ]}
            />
            <Legend
              formatter={(value) => (
                <span style={{ color: "#94a3b8", fontSize: 11 }}>
                  {value === "total" ? "Spent" : "Budget"}
                </span>
              )}
            />
            <Bar dataKey="total" fill="#6174f6" radius={[6, 6, 0, 0]} name="total" />
            <Bar dataKey="budget" fill="rgba(255,255,255,0.06)" radius={[6, 6, 0, 0]} name="budget" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category pie chart */}
      <div className="glass rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-1">Category Breakdown</h2>
        <p className="text-xs text-slate-500 mb-3">This month</p>
        {categoryData.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-slate-600 text-sm">
            No data for this month
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  labelLine={false}
                  label={CustomLabel}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [formatCurrency(value, symbol), "Amount"]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {categoryData.map((item) => (
                <div key={item.category} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-xs text-slate-400 flex-1">{item.category}</span>
                  <span className="text-xs text-white font-medium">
                    {formatCurrency(item.value, symbol)}
                  </span>
                  <span className="text-xs text-slate-600 w-7 text-right">
                    {item.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Daily spending area chart */}
      <div className="glass rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-1">Daily Spending</h2>
        <p className="text-xs text-slate-500 mb-3">Current month</p>
        {dailyData.length === 0 ? (
          <div className="h-52 flex items-center justify-center text-slate-600 text-sm">
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="dailyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6174f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6174f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${symbol}${(v / 1000).toFixed(1)}k`}
                width={40}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [formatCurrency(value, symbol), "Spent"]}
                labelFormatter={(label) => `Day ${label}`}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#6174f6"
                strokeWidth={2}
                fill="url(#dailyGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Budget vs Actual */}
      {budgetData.length > 0 && (
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <h2 className="font-semibold text-white mb-1">Budget vs Actual</h2>
          <p className="text-xs text-slate-500 mb-5">This month performance</p>
          <div className="space-y-4">
            {budgetData.map((item) => {
              const pct = Math.min((item.actual / item.budget) * 100, 100);
              const over = item.actual > item.budget;
              return (
                <div key={item.category}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{item.icon}</span>
                      <span className="text-sm font-medium text-white">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={over ? "text-rose-400 font-semibold" : "text-slate-400"}>
                        {formatCurrency(item.actual, symbol)} spent
                      </span>
                      <span className="text-slate-600">/ {formatCurrency(item.budget, symbol)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: over
                          ? "linear-gradient(90deg, #f43f5e, #fb7185)"
                          : pct > 80
                          ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                          : "linear-gradient(90deg, #6174f6, #a855f7)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
