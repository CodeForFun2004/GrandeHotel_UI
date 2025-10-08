import type { Account } from "../types/profile.types";

export const SEED: Account = {
  FirstName: "Emnilly",
  LastName: "Morgan",
  Email: "em***an@gmail.com",
  PhoneNumber: "(+34) 000 000 000",
  Gender: undefined,
  DOB: "1997-06-17",
  Address: "123 Main Street, Spring",
  Country: "United States",
  AvatarURL: "",
};

export const DEFAULT_AVATAR = "https://i.pravatar.cc/120?img=15";
export const CHANGE_PW_ENDPOINT = "/password/change";

// Reusable styles
export const LABEL: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#4b5563",
  marginBottom: 10,
  textAlign: "left",
};

export const WRAP: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  height: 48,
  border: "1px solid var(--border)",
  borderRadius: 16,
  background: "#fff",
  overflow: "hidden",
};

export const LEFT_ICON: React.CSSProperties = {
  width: 48,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100%",
  borderRight: "1px solid var(--split)",
  opacity: 0.85,
};

export const INPUT: React.CSSProperties = {
  flex: 1,
  height: "100%",
  padding: "0 14px",
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: 15,
  color: "var(--text)",
};

export const CARET: React.CSSProperties = {
  width: 44,
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderLeft: "1px solid var(--split)",
  userSelect: "none",
};

export const CHIP: React.CSSProperties = {
  marginLeft: 8,
  height: 32,
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "0 10px",
  border: "1px solid #eadbe2",
  background: "#fbf6f8",
  borderRadius: 12,
  color: "#6b7280",
};

export const SELECT: React.CSSProperties = {
  ...INPUT,
  appearance: "none",
  WebkitAppearance: "none" as React.CSSProperties["WebkitAppearance"],
  MozAppearance: "none",
  background: "transparent",
  paddingRight: 0,
};

export const DATE: React.CSSProperties = {
  ...INPUT,
  appearance: "none",
  WebkitAppearance: "none" as React.CSSProperties["WebkitAppearance"],
  MozAppearance: "none",
  background: "transparent",
  paddingRight: 0,
};
