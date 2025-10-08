import React from "react";
import AvatarUpload from "./AvatarUpload";

interface ProfileHeaderProps {
  avatarUrl: string;
  tab: "profile" | "change";
  editing: boolean;
  uploading: boolean;
  onAvatarChange: (newAvatarUrl: string) => void;
  onUploadingChange: (uploading: boolean) => void;
  onStartEdit: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  avatarUrl,
  tab,
  editing,
  uploading,
  onAvatarChange,
  onUploadingChange,
  onStartEdit,
}) => {
  const Ic = {
    edit: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 17.25V21h3.75L18.81 8.94l-3.75-3.75L3 17.25Z"
          stroke="#9ca3af"
          strokeWidth="1.6"
        />
        <path d="M14.06 5.19l3.75 3.75" stroke="#9ca3af" strokeWidth="1.6" />
      </svg>
    ),
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Avatar + camera */}
        <AvatarUpload
          avatarUrl={avatarUrl}
          onAvatarChange={onAvatarChange}
          uploading={uploading}
          onUploadingChange={onUploadingChange}
        />

        <div>
          <div style={{ fontWeight: 800, fontSize: 20 }}>My Profile</div>
          <div style={{ color: "#9ca3af", fontSize: 13 }}>
            Real-time information and activities of your prototype.
          </div>
        </div>
      </div>

      {/* Nút Edit chỉ xuất hiện ở tab Profile */}
      {tab === "profile" && !editing && (
        <button
          onClick={onStartEdit}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 36,
            padding: "0 12px",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            background: "#fff",
            color: "#6b7280",
            fontWeight: 600,
          }}
          title="Edit"
        >
          {Ic.edit} Edit
        </button>
      )}
    </div>
  );
};

export default ProfileHeader;
