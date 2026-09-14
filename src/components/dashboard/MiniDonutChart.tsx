"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface DonutData {
  category: string;
  total: number;
  color: string;
}

interface Props {
  data: DonutData[];
  total: number;
  symbol: string;
}

export function MiniDonutChart({ data, total, symbol }: Props) {
  return (
    <div className="relative h-44">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={72}
            paddingAngle={3}
            dataKey="total"
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as DonutData;
                return (
                  <div className="glass rounded-xl px-3 py-2 text-xs">
                    <div className="font-medium text-white">{item.category}</div>
                    <div className="text-slate-400">{formatCurrency(item.total, symbol)}</div>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-xs text-slate-500">Total</div>
        <div className="text-lg font-bold text-white">{formatCurrency(total, symbol)}</div>
      </div>
    </div>
  );
}
