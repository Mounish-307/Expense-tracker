export type ExpenseCategory =
  | "Food"
  | "Transport"
  | "Shopping"
  | "Bills"
  | "Health"
  | "Entertainment"
  | "Travel"
  | "Other";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  currency_symbol: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  merchant: string | null;
  expense_date: string;
  receipt_url: string | null;
  notes: string | null;
  ai_categorized: boolean;
  ai_confidence: number | null;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category: ExpenseCategory;
  monthly_limit: number;
  created_at: string;
  updated_at: string;
}

export interface AiInsight {
  id: string;
  user_id: string;
  type: "tip" | "alert" | "recommendation" | "anomaly";
  title: string;
  content: string;
  category: string | null;
  dismissed: boolean;
  created_at: string;
}

export interface ExpenseFormData {
  amount: string;
  category: ExpenseCategory;
  description: string;
  merchant: string;
  expense_date: string;
  notes: string;
  receipt_file?: File | null;
}

export interface CategorySummary {
  category: ExpenseCategory;
  total: number;
  count: number;
  percentage: number;
}

export interface MonthlyData {
  month: string;
  total: number;
  budget?: number;
}

export interface DashboardStats {
  totalThisMonth: number;
  totalLastMonth: number;
  totalAllTime: number;
  expenseCount: number;
  topCategory: string;
  savingsRate: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface CategorizationResult {
  category: ExpenseCategory;
  confidence: number;
  reasoning: string;
}

export interface ReceiptData {
  amount?: number;
  merchant?: string;
  description?: string;
  category?: ExpenseCategory;
  date?: string;
}
