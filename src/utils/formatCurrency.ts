export const formatVND = (n: number): string => {
  if (!Number.isFinite(n)) return "—";
  try {
    return n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
  } catch {
    return `${Math.round(n).toLocaleString("vi-VN")} ₫`;
  }
};
