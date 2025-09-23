// src/pages/customer/Profile.tsx
import React, { useMemo, useRef, useState } from "react";
import styled from "styled-components";
import cameraIcon from "../../assets/camera.png";

/* ============ COLORS cho EyeBtn (tránh lỗi nếu dự án chưa có COLORS) ============ */
const COLORS = { brown700: "#7a4b2b" };

/* ============ EyeBtn như bạn gửi ============ */
const EyeBtn = styled.button`
  position: absolute; right: 12px; top: 0; bottom: 0; margin-block: auto;
  width: 36px; height: 36px; display: grid; place-items: center;
  border: none; background: transparent; color: #7c7c7c; cursor: pointer; padding: 0; line-height: 0;
  &:hover { color: ${COLORS.brown700}; }
`;

/* =================== Types =================== */
type Gender = "Male" | "Female" | "Other";
type Account = {
  FirstName: string;
  LastName: string;
  Email: string;
  PhoneNumber?: string;
  Gender?: Gender;
  DOB?: string; // yyyy-MM-dd
  Address?: string;
  Country?: string;
  AvatarURL?: string;
};

const SEED: Account = {
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

/* =================== Global CSS =================== */
const GlobalFix: React.FC = () => (
  <style>{`
    :root { --grey:#6b7280; --border:#e7dfe4; --split:#f3f4f6; --text:#1f2937; }
    .ph::placeholder { color:#9ca3af; opacity:.9; }

    .ui-select{appearance:none;-webkit-appearance:none;-moz-appearance:none;background:transparent;padding-right:0}
    select.ui-select::-ms-expand{display:none}

    .profile-page .ui-date{appearance:none;-webkit-appearance:none;-moz-appearance:none;background:transparent;padding-right:0}
    .profile-page .ui-date::-webkit-calendar-picker-indicator{display:none;opacity:0}
    .profile-page .ui-date::-webkit-inner-spin-button,.profile-page .ui-date::-webkit-clear-button{display:none}
    .profile-page.editing .ui-date{appearance:auto;-webkit-appearance:auto;-moz-appearance:auto;padding-right:28px}
    .profile-page.editing .ui-date::-webkit-calendar-picker-indicator{display:block;opacity:1;cursor:pointer;margin-right:8px;padding:2px}

    input:disabled,select:disabled{ background-color:transparent; color:inherit }
  `}</style>
);

/* =================== Icons =================== */
const Ic = {
  user: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="#6b7280" strokeWidth="1.8" />
      <path d="M4 20c2.2-3 6-4.5 8-4.5S17.8 17 20 20" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  phone: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 3h3l2 5-2 1a11 11 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2c-9.5 0-17-7.5-17-17A2 2 0 0 1 6 3Z" stroke="#6b7280" strokeWidth="1.8" />
    </svg>
  ),
  gender: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="10" cy="14" r="4" stroke="#6b7280" strokeWidth="1.8" />
      <path d="M14 10l6-6M16 4h4v4" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="#6b7280" strokeWidth="1.8" />
      <path d="M8 3v4M16 3v4M3 10h18" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  globe: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="#6b7280" strokeWidth="1.8" />
      <path d="M3 12h18M12 3c3.5 3.8 3.5 13.2 0 18-3.5-4.8-3.5-13.2 0-18Z" stroke="#6b7280" strokeWidth="1.8" />
    </svg>
  ),
  mail: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="#6b7280" strokeWidth="1.8" />
      <path d="M4 7l8 6 8-6" stroke="#6b7280" strokeWidth="1.8" />
    </svg>
  ),
  chevron: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 6l6 6-6 6" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  edit: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 17.25V21h3.75L18.81 8.94l-3.75-3.75L3 17.25Z" stroke="#9ca3af" strokeWidth="1.6" />
      <path d="M14.06 5.19l3.75 3.75" stroke="#9ca3af" strokeWidth="1.6" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" stroke="#6b7280" strokeWidth="1.6" />
      <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-1.7-2.9-2.3.9c-.5-.4-1.1-.7-1.7-1L14.7 3h-3.4L10.8 5.5c-.6.3-1.2.6-1.7 1l-2.3-.9L5 8.5 7 10a7 7 0 0 0 0 2L5 13.5l1.7 2.9 2.3-.9c.5.4 1.1.7 1.7 1L11.3 21h3.4l.3-2.5c.6-.3 1.2-.6 1.7-1l2.3.9L21 13.5 19 12Z" stroke="#6b7280" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  bag: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 8h12l-1 10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8Z" stroke="#6b7280" strokeWidth="1.8" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" stroke="#6b7280" strokeWidth="1.8" />
    </svg>
  ),
  card: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="#6b7280" strokeWidth="1.8" />
      <rect x="7" y="14" width="4" height="2" rx="1" fill="#6b7280" />
      <rect x="15" y="14" width="2" height="2" rx="1" fill="#6b7280" />
      <path d="M3 10h18" stroke="#6b7280" strokeWidth="1.2" />
    </svg>
  ),
  heart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 8.5c0 4.5-8 9-8 9s-8-4.5-8-9a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 8.5Z" stroke="#6b7280" strokeWidth="1.8" />
    </svg>
  ),
  headset: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 12a8 8 0 1 1 16 0" stroke="#6b7280" strokeWidth="1.8" />
      <rect x="3" y="12" width="4" height="6" rx="1.5" stroke="#6b7280" strokeWidth="1.8" />
      <rect x="17" y="12" width="4" height="6" rx="1.5" stroke="#6b7280" strokeWidth="1.8" />
    </svg>
  ),
  chat: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 6h16v9H9l-5 4V6Z" stroke="#6b7280" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
  logout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 7V5a2 2 0 0 1 2-2h8v18h-8a2 2 0 0 1-2-2v-2" stroke="#ef4444" strokeWidth="1.8" />
      <path d="M13 12H3m0 0 3-3m-3 3 3 3" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
};

// Eye icons
const Eye = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" stroke="#6b7280" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="3.5" stroke="#6b7280" strokeWidth="1.8" />
  </svg>
);
const EyeOff = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" stroke="#6b7280" strokeWidth="1.8"/>
    <path d="M3 3l18 18" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

/* =================== Reusable styles =================== */
const LABEL: React.CSSProperties  = { fontSize: 14, fontWeight: 700, color: "#4b5563", marginBottom: 10, textAlign: "left" };
const WRAP: React.CSSProperties   = { display: "flex", alignItems: "center", height: 48, border: "1px solid var(--border)", borderRadius: 16, background: "#fff", overflow: "hidden" };
const LEFT_ICON: React.CSSProperties = { width: 48, display: "flex", alignItems: "center", justifyContent: "center", height: "100%", borderRight: "1px solid var(--split)", opacity: 0.85 };
const INPUT: React.CSSProperties  = { flex: 1, height: "100%", padding: "0 14px", border: "none", outline: "none", background: "transparent", fontSize: 15, color: "var(--text)" };
const CARET: React.CSSProperties  = { width: 44, height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderLeft: "1px solid var(--split)", userSelect: "none" };
const CHIP: React.CSSProperties   = { marginLeft: 8, height: 32, display: "flex", alignItems: "center", gap: 8, padding: "0 10px", border: "1px solid #eadbe2", background: "#fbf6f8", borderRadius: 12, color: "#6b7280" };
const SELECT: React.CSSProperties = { ...(INPUT as any), appearance: "none", WebkitAppearance: "none" as any, MozAppearance: "none", background: "transparent", paddingRight: 0 };
const DATE: React.CSSProperties   = { ...INPUT, appearance: "none", WebkitAppearance: "none" as any, MozAppearance: "none", background: "transparent", paddingRight: 0 };

/* =================== Sidebar =================== */
const Sidebar: React.FC<{ avatarUrl: string; name: string; role: string }> = ({ avatarUrl, name, role }) => {
  const Item = (icon: React.ReactNode, label: string, active?: boolean, chevron?: boolean) => (
    <div
      key={label}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        padding: "10px 12px", borderRadius: 12, marginBottom: 6,
        background: active ? "#eef2ff" : "transparent",
        border: active ? "1px solid #e5e7eb" : "1px solid transparent",
        color: active ? "#111827" : "#6b7280", fontWeight: 600,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>{icon}{label}</span>
      {chevron && Ic.chevron}
    </div>
  );

  return (
    <aside style={{ background: "#fff1f2", border: "1px solid #ffe4e6", borderRadius: 16, padding: 12, display: "flex", flexDirection: "column", minHeight: 560 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 10 }}>
        <img src={avatarUrl} alt="avatar" style={{ width: 36, height: 36, borderRadius: "50%" }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{name}</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{role}</div>
        </div>
      </div>

      {Item(Ic.user, "Personal Data", true)}
      {Item(Ic.card, "Payment Account")}
      {Item(Ic.bag, "Trips", false, true)}
      {Item(Ic.heart, "Wish Lists")}
      {Item(Ic.headset, "Support")}
      {Item(Ic.chat, "Reviews")}
      <div style={{ height: 1, background: "#f3f4f6", margin: "8px 4px 6px" }} />
      {Item(Ic.settings, "Settings")}

      <div style={{ flex: 1 }} />
      <button
        onClick={() => { window.location.href = "/"; }}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 12, border: "none", background: "transparent", color: "#ef4444", fontWeight: 700, cursor: "pointer", alignSelf: "flex-start" }}
      >
        {Ic.logout} Log out
      </button>
    </aside>
  );
};

/* =================== Main =================== */
type Tab = "profile" | "change";

const Profile: React.FC = () => {
  const baseline = useRef<Account>(SEED);
  const [data, setData] = useState<Account>(baseline.current);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<Tab>("profile");

  const DEFAULT_AVATAR = "https://i.pravatar.cc/120?img=15";
  const avatarUrl = data.AvatarURL?.trim() ? (data.AvatarURL as string) : DEFAULT_AVATAR;

  const fullName = useMemo(
    () => `${data.FirstName || ""} ${data.LastName || ""}`.trim() || "Your name",
    [data.FirstName, data.LastName]
  );

  const onChange =
    <K extends keyof Account>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setData((d) => ({ ...d, [k]: e.target.value as any }));

  const startEdit = () => setEditing(true);

  const onDiscard = () => {
    const changed = JSON.stringify(data) !== JSON.stringify(baseline.current);
    if (changed) {
      if (confirm("Are you sure you want to discard the changes?")) {
        setData(baseline.current);
        setEditing(false);
        alert("Changes discarded.");
      }
    } else {
      setEditing(false);
    }
  };

  const onSave = () => {
    if (confirm("Are you sure you want to save changes?")) {
      baseline.current = data;
      setEditing(false);
      alert("Saved successfully.");
    }
  };

  // Change Password tab state
  const [pw, setPw] = useState({ cur: "", n: "", c: "" });
  const [pwDone, setPwDone] = useState(false);
  const [show, setShow] = useState({ cur: false, n: false, c: false });

  const handleSavePw = () => {
    if (!pw.cur || !pw.n || !pw.c) { alert("Please fill all fields."); return; }
    if (pw.n !== pw.c) { alert("New password and confirmation do not match."); return; }
    if (confirm("Confirm change password?")) {
      alert("Password changed successfully.");
      setPwDone(true);
      setPw({ cur: "", n: "", c: "" });
    }
  };

  // Upload avatar — always allowed
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevObjectUrl = useRef<string | null>(null);
  const onPickAvatar = () => fileInputRef.current?.click();
  const onAvatarChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    if (prevObjectUrl.current) URL.revokeObjectURL(prevObjectUrl.current);
    prevObjectUrl.current = url;
    setData((d) => ({ ...d, AvatarURL: url }));
  };

  const lock = (props: any = {}) =>
    editing ? props : { ...props, readOnly: true, disabled: props?.asSelect ? true : false };

  return (
    <div className={`profile-page ${editing ? "editing" : ""}`} style={{ background: "#fff", minHeight: "100vh" }}>
      <GlobalFix />
      {/* Header đen */}
      <div style={{ height: 80, background: "#000" }} />

      <div style={{ width: "100%", padding: 24, display: "grid", gridTemplateColumns: "25% 75%", gap: 24, boxSizing: "border-box" }}>
        <Sidebar avatarUrl={avatarUrl} name={fullName} role="Customer Operations" />

        <section style={{ background: "#fff", border: "1px solid #f1f5f9", borderRadius: 16, padding: 24 }}>
          {/* Header trong card */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Avatar + camera */}
              <div style={{ position: "relative" }}>
                <img
                  src={avatarUrl}
                  alt="avatar"
                  style={{ width: 64, height: 64, borderRadius: "50%", display: "block" }}
                  onError={(e) => ((e.target as HTMLImageElement).src = DEFAULT_AVATAR)}
                />
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onAvatarChange} />
                <button
                  type="button"
                  onClick={onPickAvatar}
                  aria-label="Change avatar"
                  title="Change avatar"
                  style={{
                    position: "absolute",
                    right: -6,
                    bottom: -6,
                    width: 32,
                    height: 32,
                    zIndex: 50,
                    borderRadius: "9999px",
                    border: "1px solid #e5e7eb",
                    background: "#ffffff",
                    boxShadow: "0 2px 10px rgba(0,0,0,.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 0,
                    cursor: "pointer",
                  }}
                >
                  <img src={cameraIcon} alt="camera" style={{ width: 18, height: 18, display: "block", objectFit: "contain" }} />
                </button>
              </div>

              <div>
                <div style={{ fontWeight: 800, fontSize: 20 }}>My Profile</div>
                <div style={{ color: "#9ca3af", fontSize: 13 }}>Real-time information and activities of your prototype.</div>
              </div>
            </div>

            {/* Nút Edit chỉ xuất hiện ở tab Profile */}
            {tab === "profile" && !editing && (
              <button
                onClick={startEdit}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 36, padding: "0 12px", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontWeight: 600 }}
                title="Edit"
              >
                {Ic.edit} Edit
              </button>
            )}
          </div>

          {/* Tabs */}
          <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setTab("profile")}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: tab === "profile" ? "#111827" : "#6b7280",
                fontWeight: tab === "profile" ? 700 : 500,
                textDecoration: tab === "profile" ? "underline" : "none"
              }}
            >
              Profile
            </button>
            <span style={{ color: "#9ca3af" }}>|</span>
            <button
              onClick={() => setTab("change")}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: tab === "change" ? "#111827" : "#6b7280",
                fontWeight: tab === "change" ? 700 : 500,
                textDecoration: tab === "change" ? "underline" : "none"
              }}
            >
              Change Password
            </button>
          </div>

          {/* CONTENT BY TAB */}
          {tab === "profile" ? (
            <>
              {/* Form 2 cột */}
              <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <div>
                  <div style={LABEL}>First Name</div>
                  <div style={WRAP}>
                    <div style={LEFT_ICON}>{Ic.user}</div>
                    <input {...lock()} style={INPUT} value={data.FirstName} onChange={onChange("FirstName")} placeholder="Emnilly" />
                  </div>
                </div>

                <div>
                  <div style={LABEL}>Last Name</div>
                  <div style={WRAP}>
                    <div style={LEFT_ICON}>{Ic.user}</div>
                    <input {...lock()} style={INPUT} value={data.LastName} onChange={onChange("LastName")} placeholder="Morgan" />
                  </div>
                </div>

                <div>
                  <div style={LABEL}>Email Address</div>
                  <div style={WRAP}>
                    <div style={CHIP}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="#6b7280" strokeWidth="1.6"/>
                        <path d="M4 7l8 6 8-6" stroke="#6b7280" strokeWidth="1.6"/>
                      </svg>
                    </div>
                    <input {...lock({ type:"email" })} className="ph" style={INPUT} value={data.Email} onChange={onChange("Email")} placeholder="em***an@gmail.com" />
                  </div>
                </div>

                <div>
                  <div style={LABEL}>Phone Number</div>
                  <div style={WRAP}>
                    <div style={{ ...CHIP, gap: 6 }}>{Ic.phone}</div>
                    <input {...lock()} className="ph" style={INPUT} value={data.PhoneNumber || ""} onChange={onChange("PhoneNumber")} placeholder="(+34) 000 000 000" />
                  </div>
                </div>

                <div>
                  <div style={LABEL}>Gender</div>
                  <div style={WRAP}>
                    <div style={LEFT_ICON}>{Ic.gender}</div>
                    <select {...lock({ asSelect: true })} className="ui-select" style={SELECT} value={data.Gender || ""} onChange={onChange("Gender")}>
                      <option value="">Gender</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                    <div style={CARET}>▾</div>
                  </div>
                </div>

                <div>
                  <div style={LABEL}>Birthday</div>
                  <div style={WRAP}>
                    <div style={LEFT_ICON}>{Ic.calendar}</div>
                    <input type="date" {...lock()} className="ui-date" style={DATE} value={data.DOB || ""} onChange={onChange("DOB")} />
                    {!editing && <div style={CARET}>▾</div>}
                  </div>
                </div>

                <div>
                  <div style={LABEL}>Address</div>
                  <div style={WRAP}>
                    <div style={LEFT_ICON}>{Ic.globe}</div>
                    <input {...lock()} style={INPUT} value={data.Address || ""} onChange={onChange("Address")} placeholder="123 Main Street, Spring" />
                  </div>
                </div>

                <div>
                  <div style={LABEL}>Country</div>
                  <div style={WRAP}>
                    <div style={LEFT_ICON}>{Ic.globe}</div>
                    <select {...lock({ asSelect: true })} className="ui-select" style={SELECT} value={data.Country || ""} onChange={onChange("Country")}>
                      <option value="">Select country</option>
                      <option>United States</option>
                      <option>Viet Nam</option>
                      <option>United Kingdom</option>
                      <option>Japan</option>
                      <option>Spain</option>
                    </select>
                    <div style={CARET}>▾</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {editing && (
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 26 }}>
                  <button onClick={onDiscard} style={{ height: 40, padding: "0 16px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", fontWeight: 600 }}>
                    Discard
                  </button>
                  <button onClick={onSave} style={{ height: 40, padding: "0 16px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#111827", color: "#fff", fontWeight: 700 }}>
                    Save changes
                  </button>
                </div>
              )}
            </>
          ) : (
            // ====== TAB: CHANGE PASSWORD ======
            <div style={{ marginTop: 16 }}>
              {!pwDone ? (
                <>
                  {/* Không căn giữa input, chỉ giới hạn chiều rộng nếu muốn */}
                  <div style={{ display: "grid", gap: 12, maxWidth: 460 }}>
                    {/* Current password */}
                    <div style={{ position: "relative" }}>
                      <input
                        type={show.cur ? "text" : "password"}
                        placeholder="Current password"
                        value={pw.cur}
                        onChange={(e)=>setPw(p=>({...p, cur: e.target.value}))}
                        style={{ width:"100%", height: 44, borderRadius: 12, border: "1px solid #e5e7eb", padding: "0 48px 0 12px", fontSize: 14 }}
                      />
                      <EyeBtn
                        type="button"
                        onClick={()=>setShow(s=>({...s, cur: !s.cur}))}
                        aria-label={show.cur ? "Hide" : "Show"}
                        title={show.cur ? "Hide password" : "Show password"}
                      >
                        {show.cur ? EyeOff : Eye}
                      </EyeBtn>
                    </div>

                    {/* New password */}
                    <div style={{ position: "relative" }}>
                      <input
                        type={show.n ? "text" : "password"}
                        placeholder="New password"
                        value={pw.n}
                        onChange={(e)=>setPw(p=>({...p, n: e.target.value}))}
                        style={{ width:"100%", height: 44, borderRadius: 12, border: "1px solid #e5e7eb", padding: "0 48px 0 12px", fontSize: 14 }}
                      />
                      <EyeBtn
                        type="button"
                        onClick={()=>setShow(s=>({...s, n: !s.n}))}
                        aria-label={show.n ? "Hide" : "Show"}
                        title={show.n ? "Hide password" : "Show password"}
                      >
                        {show.n ? EyeOff : Eye}
                      </EyeBtn>
                    </div>

                    {/* Confirm password */}
                    <div style={{ position: "relative" }}>
                      <input
                        type={show.c ? "text" : "password"}
                        placeholder="Confirm new password"
                        value={pw.c}
                        onChange={(e)=>setPw(p=>({...p, c: e.target.value}))}
                        style={{ width:"100%", height: 44, borderRadius: 12, border: "1px solid #e5e7eb", padding: "0 48px 0 12px", fontSize: 14 }}
                      />
                      <EyeBtn
                        type="button"
                        onClick={()=>setShow(s=>({...s, c: !s.c}))}
                        aria-label={show.c ? "Hide" : "Show"}
                        title={show.c ? "Hide password" : "Show password"}
                      >
                        {show.c ? EyeOff : Eye}
                      </EyeBtn>
                    </div>
                  </div>

                  {/* Save căn giữa, nằm dưới nhóm input */}
                  <div style={{ display:"flex", justifyContent:"center", marginTop: 16, maxWidth: 460 }}>
                    <button
                      onClick={handleSavePw}
                      style={{ height: 38, padding: "0 20px", borderRadius: 10, border: "1px solid #e5e7eb",
                              background: "#111827", color: "#fff", fontWeight: 700, minWidth: 160 }}
                    >
                      Save
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ maxWidth: 520, padding: 16, border: "1px solid #e5e7eb", borderRadius: 12, background: "#f9fafb", color: "#111827", fontWeight: 600 }}>
                  Password changed successfully. You can continue editing your profile or switch back to the Profile tab.
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Profile;
