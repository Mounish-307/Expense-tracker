"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function ExpenseActions({ expenseId }: { expenseId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  async function handleDelete() {
    if (!confirm("Delete this expense?")) return;
    setDeleting(true);
    await supabase.from("expenses").delete().eq("id", expenseId);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={handleDelete}
        disabled={deleting}
        title="Delete expense"
        className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
      >
        {deleting ? (
          <div className="w-3.5 h-3.5 border border-rose-400/50 border-t-rose-400 rounded-full animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}
