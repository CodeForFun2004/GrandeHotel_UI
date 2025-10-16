import React from "react";
import type { User } from "../types/profile.types";
import { LABEL, WRAP, LEFT_ICON, INPUT, CARET, CHIP, SELECT, DATE } from "../constants/profile.constants";

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
  phone: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 3h3l2 5-2 1a11 11 0 0 0 6 6l1-2 5 2v3a2 2 0 0 1-2 2c-9.5 0-17-7.5-17-17A2 2 0 0 1 6 3Z"
        stroke="#6b7280"
        strokeWidth="1.8"
      />
    </svg>
  ),
  gender: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="10" cy="14" r="4" stroke="#6b7280" strokeWidth="1.8" />
      <path
        d="M14 10l6-6M16 4h4v4"
        stroke="#6b7280"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
        stroke="#6b7280"
        strokeWidth="1.8"
      />
      <path
        d="M8 3v4M16 3v4M3 10h18"
        stroke="#6b7280"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  globe: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="#6b7280" strokeWidth="1.8" />
      <path
        d="M3 12h18M12 3c3.5 3.8 3.5 13.2 0 18-3.5-4.8-3.5-13.2 0-18Z"
        stroke="#6b7280"
        strokeWidth="1.8"
      />
    </svg>
  ),
};

interface ProfileFormProps {
  data: User;
  editing: boolean;
  saving: boolean;
  onChange: <K extends keyof User>(
    k: K
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onDiscard: () => void;
  onSave: () => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  data,
  editing,
  saving,
  onChange,
  onDiscard,
  onSave,
}) => {
  const lock = (opts?: { asSelect?: boolean }) => {
    const isSelect = !!opts?.asSelect;
    if (editing) return {};
    return isSelect ? { disabled: true } : { readOnly: true };
  };

  return (
    <>
      {/* Form 2 cột */}
      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
        }}
      >
        <div>
          <div style={LABEL}>Full Name</div>
          <div style={WRAP}>
            <div style={LEFT_ICON}>{Ic.user}</div>
            <input
              {...lock()}
              style={INPUT}
              value={data.fullname || ""}
              onChange={onChange("fullname")}
              placeholder="Enter your full name"
            />
          </div>
        </div>

        <div>
          <div style={LABEL}>Username</div>
          <div style={WRAP}>
            <div style={LEFT_ICON}>{Ic.user}</div>
            <input
              {...lock()}
              style={INPUT}
              value={data.username || ""}
              onChange={onChange("username")}
              placeholder="Enter username"
            />
          </div>
        </div>

        <div>
          <div style={LABEL}>Email Address</div>
          <div style={WRAP}>
            <div style={CHIP}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="14"
                  rx="2.5"
                  stroke="#6b7280"
                  strokeWidth="1.6"
                />
                <path
                  d="M4 7l8 6 8-6"
                  stroke="#6b7280"
                  strokeWidth="1.6"
                />
              </svg>
            </div>
            <input
              {...lock()}
              className="ph"
              style={INPUT}
              value={data.email || ""}
              onChange={onChange("email")}
              placeholder="Enter your email"
            />
          </div>
        </div>

        <div>
          <div style={LABEL}>Phone Number</div>
          <div style={WRAP}>
            <div style={{ ...CHIP, gap: 6 }}>{Ic.phone}</div>
            <input
              {...lock()}
              className="ph"
              style={INPUT}
              value={data.phone || ""}
              onChange={onChange("phone")}
              placeholder="Enter your phone number"
            />
          </div>
        </div>

        <div>
          <div style={LABEL}>Gender</div>
          <div style={WRAP}>
            <div style={LEFT_ICON}>{Ic.gender}</div>
            <select
              {...lock({ asSelect: true })}
              className="ui-select"
              style={SELECT}
              value={data.gender || ""}
              onChange={onChange("gender")}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            <div style={CARET}>▾</div>
          </div>
        </div>

        <div>
          <div style={LABEL}>Birthday</div>
          <div style={WRAP}>
            <div style={LEFT_ICON}>{Ic.calendar}</div>
            <input
              type="date"
              {...lock()}
              className="ui-date"
              style={DATE}
              value={data.birthday || ""}
              onChange={onChange("birthday")}
              placeholder=""
            />
            {!editing && <div style={CARET}>▾</div>}
          </div>
        </div>

        <div>
          <div style={LABEL}>Address</div>
          <div style={WRAP}>
            <div style={LEFT_ICON}>{Ic.globe}</div>
            <input
              {...lock()}
              style={INPUT}
              value={data.address || ""}
              onChange={onChange("address")}
              placeholder="Enter your address"
            />
          </div>
        </div>

        <div>
          <div style={LABEL}>Country</div>
          <div style={WRAP}>
            <div style={LEFT_ICON}>{Ic.globe}</div>
            <input
              {...lock()}
              style={INPUT}
              value={data.country || ""}
              onChange={onChange("country")}
              placeholder="Enter your country"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      {editing && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
            marginTop: 26,
          }}
        >
          <button
            onClick={onDiscard}
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#fff",
              fontWeight: 600,
            }}
          >
            Discard
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            style={{
              height: 40,
              padding: "0 16px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: saving ? "#6b7280" : "#111827",
              color: "#fff",
              fontWeight: 700,
              opacity: saving ? 0.7 : 1,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      )}
    </>
  );
};

export default ProfileForm;
