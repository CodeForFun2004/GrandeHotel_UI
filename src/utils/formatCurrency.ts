export const formatVND = (n: number): string => {
  if (!Number.isFinite(n)) return "—";
  try {
    return n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
  } catch {
    return `${Math.round(n).toLocaleString("vi-VN")} ₫`;
  }
};

export const formatVNDInMillions = (n: number): string => {
  if (!Number.isFinite(n)) return "—";
  const inMillions = n / 1000000; // Convert to millions
  if (inMillions >= 1) {
    return `${inMillions.toFixed(1)}M₫`;
  } else if (inMillions >= 0.1) {
    return `${inMillions.toFixed(2)}M₫`;
  } else {
    return `${n.toLocaleString("vi-VN")}₫`;
  }
};

export const formatVNDAbbreviated = (n: number): string => {
  if (!Number.isFinite(n)) return "—";

  // Format VND with abbreviated units
  if (n >= 1000000000) { // Billion
    return `${(n / 1000000000).toFixed(1)}T₫`;
  } else if (n >= 1000000) { // Million
    return `${(n / 1000000).toFixed(1)}Tr₫`;
  } else if (n >= 1000) { // Thousand
    return `${(n / 1000).toFixed(0)}N₫`;
  } else {
    return `${n.toLocaleString("vi-VN")}₫`;
  }
};
