import { ExpenseCategory } from "@/types";

export const CATEGORIES: ExpenseCategory[] = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Health",
  "Entertainment",
  "Travel",
  "Other",
];

export const CATEGORY_CONFIG: Record<
  ExpenseCategory,
  { color: string; bg: string; icon: string; gradient: string }
> = {
  Food: {
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.15)",
    icon: "🍔",
    gradient: "from-amber-500 to-orange-500",
  },
  Transport: {
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.15)",
    icon: "🚗",
    gradient: "from-blue-500 to-cyan-500",
  },
  Shopping: {
    color: "#ec4899",
    bg: "rgba(236, 72, 153, 0.15)",
    icon: "🛍️",
    gradient: "from-pink-500 to-rose-500",
  },
  Bills: {
    color: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.15)",
    icon: "📋",
    gradient: "from-violet-500 to-purple-500",
  },
  Health: {
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.15)",
    icon: "🏥",
    gradient: "from-emerald-500 to-teal-500",
  },
  Entertainment: {
    color: "#f43f5e",
    bg: "rgba(244, 63, 94, 0.15)",
    icon: "🎬",
    gradient: "from-rose-500 to-pink-500",
  },
  Travel: {
    color: "#06b6d4",
    bg: "rgba(6, 182, 212, 0.15)",
    icon: "✈️",
    gradient: "from-cyan-500 to-sky-500",
  },
  Other: {
    color: "#6b7280",
    bg: "rgba(107, 114, 128, 0.15)",
    icon: "📦",
    gradient: "from-gray-500 to-slate-500",
  },
};

export const CHART_COLORS = [
  "#6174f6",
  "#f59e0b",
  "#10b981",
  "#ec4899",
  "#3b82f6",
  "#8b5cf6",
  "#06b6d4",
  "#6b7280",
];

export const CURRENCY_SYMBOL = "₹";
export const CURRENCY_CODE = "INR";

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/expenses", label: "Expenses", icon: "Receipt" },
  { href: "/analytics", label: "Analytics", icon: "BarChart3" },
  { href: "/budgets", label: "Budgets", icon: "Target" },
  { href: "/ai-chat", label: "AI Assistant", icon: "Sparkles" },
];

export const AI_SUGGESTED_PROMPTS = [
  "How much did I spend this month?",
  "What's my biggest spending category?",
  "Compare my spending to last month",
  "Which day of the week do I spend the most?",
  "Show me my top 5 expenses this month",
  "Am I on track with my budgets?",
];

// Demo seed data for new users
export const DEMO_EXPENSES = [
  { description: "Swiggy dinner order", category: "Food", amount: 450, merchant: "Swiggy", days_ago: 1 },
  { description: "Metro card recharge", category: "Transport", amount: 200, merchant: "Delhi Metro", days_ago: 2 },
  { description: "Amazon purchase", category: "Shopping", amount: 1299, merchant: "Amazon", days_ago: 3 },
  { description: "Electricity bill", category: "Bills", amount: 2100, merchant: "BSES", days_ago: 4 },
  { description: "Pharmacy - medicines", category: "Health", amount: 680, merchant: "MedPlus", days_ago: 5 },
  { description: "Netflix subscription", category: "Entertainment", amount: 649, merchant: "Netflix", days_ago: 6 },
  { description: "Zomato lunch", category: "Food", amount: 320, merchant: "Zomato", days_ago: 7 },
  { description: "Uber to office", category: "Transport", amount: 185, merchant: "Uber", days_ago: 8 },
  { description: "Groceries - Big Basket", category: "Shopping", amount: 2450, merchant: "BigBasket", days_ago: 9 },
  { description: "Internet bill - JioFiber", category: "Bills", amount: 999, merchant: "Jio", days_ago: 10 },
  { description: "Gym membership", category: "Health", amount: 1500, merchant: "Cult.fit", days_ago: 11 },
  { description: "Movie tickets - PVR", category: "Entertainment", amount: 840, merchant: "PVR Cinemas", days_ago: 12 },
  { description: "IndiGo flight booking", category: "Travel", amount: 4200, merchant: "IndiGo", days_ago: 14 },
  { description: "Coffee at Starbucks", category: "Food", amount: 420, merchant: "Starbucks", days_ago: 15 },
  { description: "Rapido bike ride", category: "Transport", amount: 95, merchant: "Rapido", days_ago: 16 },
  { description: "Mobile recharge", category: "Bills", amount: 299, merchant: "Airtel", days_ago: 17 },
  { description: "Haircut at salon", category: "Health", amount: 350, merchant: "Style Hub", days_ago: 18 },
  { description: "Spotify premium", category: "Entertainment", amount: 119, merchant: "Spotify", days_ago: 20 },
  { description: "Hotel booking Goa", category: "Travel", amount: 6500, merchant: "OYO", days_ago: 22 },
  { description: "Dominos pizza", category: "Food", amount: 560, merchant: "Dominos", days_ago: 24 },
];

export const DEMO_BUDGETS = [
  { category: "Food", monthly_limit: 5000 },
  { category: "Transport", monthly_limit: 2000 },
  { category: "Shopping", monthly_limit: 8000 },
  { category: "Bills", monthly_limit: 5000 },
  { category: "Health", monthly_limit: 3000 },
  { category: "Entertainment", monthly_limit: 2000 },
  { category: "Travel", monthly_limit: 10000 },
];
