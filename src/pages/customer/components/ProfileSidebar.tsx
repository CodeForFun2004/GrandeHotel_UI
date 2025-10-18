import React from "react";

// Icons
const Ic = {
  user: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="#6b7280" strokeWidth="1.8" />
      <path
        d="M4 20c2.2-3 6-4.5 8-4.5S17.8 17 20 20"
        stroke="#6b7280"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  card: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="2"
        stroke="#6b7280"
        strokeWidth="1.8"
      />
      <rect x="7" y="14" width="4" height="2" rx="1" fill="#6b7280" />
      <rect x="15" y="14" width="2" height="2" rx="1" fill="#6b7280" />
      <path d="M3 10h18" stroke="#6b7280" strokeWidth="1.2" />
    </svg>
  ),
  bag: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 8h12l-1 10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8Z"
        stroke="#6b7280"
        strokeWidth="1.8"
      />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" stroke="#6b7280" strokeWidth="1.8" />
    </svg>
  ),
  heart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 8.5c0 4.5-8 9-8 9s-8-4.5-8-9a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 8.5Z"
        stroke="#6b7280"
        strokeWidth="1.8"
      />
    </svg>
  ),
  headset: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 12a8 8 0 1 1 16 0" stroke="#6b7280" strokeWidth="1.8" />
      <rect
        x="3"
        y="12"
        width="4"
        height="6"
        rx="1.5"
        stroke="#6b7280"
        strokeWidth="1.8"
      />
      <rect
        x="17"
        y="12"
        width="4"
        height="6"
        rx="1.5"
        stroke="#6b7280"
        strokeWidth="1.8"
      />
    </svg>
  ),
  chat: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16v9H9l-5 4V6Z"
        stroke="#6b7280"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z"
        stroke="#6b7280"
        strokeWidth="1.6"
      />
      <path
        d="M19 12a7 7 0 0 0-.1-1l2-1.5-1.7-2.9-2.3.9c-.5-.4-1.1-.7-1.7-1L14.7 3h-3.4L10.8 5.5c-.6.3-1.2.6-1.7 1l-2.3-.9L5 8.5 7 10a7 7 0 0 0 0 2L5 13.5l1.7 2.9 2.3-.9c.5.4 1.1.7 1.7 1L11.3 21h3.4l.3-2.5c.6-.3 1.2-.6 1.7-1l2.3.9L21 13.5 19 12Z"
        stroke="#6b7280"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  chevron: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 6l6 6-6 6"
        stroke="#6b7280"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  logout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 7V5a2 2 0 0 1 2-2h8v18h-8a2 2 0 0 1-2-2v-2"
        stroke="#ef4444"
        strokeWidth="1.8"
      />
      <path
        d="M13 12H3m0 0 3-3m-3 3 3 3"
        stroke="#ef4444"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
};

interface ProfileSidebarProps {
  avatarUrl: string;
  name: string;
  role: string;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  avatarUrl,
  name,
  role,
}) => {
  const Item = (
    icon: React.ReactNode,
    label: string,
    active?: boolean,
    chevron?: boolean
  ) => (
    <div
      key={label}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "10px 12px",
        borderRadius: 12,
        marginBottom: 6,
        background: active ? "#eef2ff" : "transparent",
        border: active ? "1px solid #e5e7eb" : "1px solid transparent",
        color: active ? "#111827" : "#6b7280",
        fontWeight: 600,
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {icon}
        {label}
      </span>
      {chevron && Ic.chevron}
    </div>
  );

  return (
    <aside
      style={{
        background: "#fff1f2",
        border: "1px solid #ffe4e6",
        borderRadius: 16,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        minHeight: 560,
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, padding: 10 }}
      >
        <img
          src={avatarUrl}
          alt="avatar"
          style={{ width: 36, height: 36, borderRadius: "50%" }}
        />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>
            {name}
          </div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
            {role}
          </div>
        </div>
      </div>

      {Item(Ic.user, "Personal Data", true)}
      {Item(Ic.card, "Payment Account")}
      {Item(Ic.bag, "Trips", false, true)}
      {Item(Ic.heart, "Wish Lists")}
      {Item(Ic.headset, "Support")}
      {Item(Ic.chat, "Reviews")}
      <div
        style={{ height: 1, background: "#f3f4f6", margin: "8px 4px 6px" }}
      />
      {Item(Ic.settings, "Settings")}

      <div style={{ flex: 1 }} />
      <button
        onClick={() => {
          window.location.href = "/";
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 12px",
          borderRadius: 12,
          border: "none",
          background: "transparent",
          color: "#ef4444",
          fontWeight: 700,
          cursor: "pointer",
          alignSelf: "flex-start",
        }}
      >
        {Ic.logout} Log out
      </button>
    </aside>
  );
};

export default ProfileSidebar;
