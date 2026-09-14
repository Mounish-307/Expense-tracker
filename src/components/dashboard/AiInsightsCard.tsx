"use client";

import { useState } from "react";
import { Sparkles, X, Lightbulb, AlertTriangle, TrendingUp, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AiInsight } from "@/types";
import { cn } from "@/lib/utils";

const INSIGHT_CONFIG = {
  tip: { icon: Lightbulb, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  alert: { icon: AlertTriangle, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
  recommendation: { icon: TrendingUp, color: "text-brand-400", bg: "bg-brand-500/10 border-brand-500/20" },
  anomaly: { icon: Zap, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
};

export function AiInsightsCard({
  insights,
  userId,
}: {
  insights: AiInsight[];
  userId: string;
}) {
  const [visible, setVisible] = useState(insights);
  const supabase = createClient();

  async function dismissInsight(id: string) {
    setVisible((prev) => prev.filter((i) => i.id !== id));
    await supabase
      .from("ai_insights")
      .update({ dismissed: true })
      .eq("id", id)
      .eq("user_id", userId);
  }

  if (visible.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-4 border border-brand-500/20 animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-white">AI Insights</span>
        <span className="text-xs bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded-full px-1.5 py-0.5">
          {visible.length} new
        </span>
      </div>

      <div className="space-y-2">
        {visible.map((insight) => {
          const config = INSIGHT_CONFIG[insight.type];
          return (
            <div
              key={insight.id}
              className={cn(
                "flex items-start gap-3 rounded-xl p-3 border text-sm",
                config.bg
              )}
            >
              <config.icon className={cn("w-4 h-4 flex-shrink-0 mt-0.5", config.color)} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white text-xs mb-0.5">{insight.title}</div>
                <div className="text-slate-400 text-xs leading-relaxed">{insight.content}</div>
              </div>
              <button
                onClick={() => dismissInsight(insight.id)}
                className="text-slate-600 hover:text-slate-400 transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
