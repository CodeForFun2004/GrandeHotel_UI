import React, { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { setCredentials } from "../../../redux/slices/authSlice";
import type { RootState, AppDispatch } from "../../../redux/store";
import api from "../../../api/axios";
import cameraIcon from "../../../assets/camera.png";
import { DEFAULT_AVATAR } from "../constants/profile.constants";

interface AvatarUploadProps {
  avatarUrl: string;
  onAvatarChange: (newAvatarUrl: string) => void;
  uploading: boolean;
  onUploadingChange: (uploading: boolean) => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  avatarUrl,
  onAvatarChange,
  uploading,
  onUploadingChange,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((s: RootState) => s.auth);
  const currentUser = auth.user;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onPickAvatar = () => fileInputRef.current?.click();

  const onAvatarChangeHandler: React.ChangeEventHandler<HTMLInputElement> = async (
    e
  ) => {
    const f = e.target.files?.[0];
    if (!f) return;

    // Upload thật trước, không preview ngay
    const userId = (currentUser as { _id?: string; id?: string })?._id || (currentUser as { _id?: string; id?: string })?.id;
    if (!userId) {
      toast.error("Không xác định được user id. Hãy đăng nhập lại.");
      return;
    }

    const form = new FormData();
    form.append("avatar", f);

    onUploadingChange(true);
    try {
      const res = await api.put(`/users/${userId}/avatar`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // API trả { user: { ... , avatar } }
      const updatedUser = res.data?.user;

      // Cập nhật redux + localStorage (sẽ cập nhật Header web)
      dispatch(setCredentials({ user: updatedUser }));

      // Cập nhật ProfileHeader và ProfileSidebar sau khi upload thành công
      onAvatarChange(updatedUser?.avatar || "");

      // Hiển thị toast thành công
      toast.success("Cập nhật avatar thành công!");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Upload avatar thất bại";
      toast.error(msg);
    } finally {
      onUploadingChange(false);
      // reset input để có thể chọn lại cùng 1 file nếu muốn
      e.currentTarget.value = "";
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <img
        src={avatarUrl}
        alt="avatar"
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          display: "block",
        }}
        onError={(e) =>
          ((e.target as HTMLImageElement).src = DEFAULT_AVATAR)
        }
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={onAvatarChangeHandler}
      />
      <button
        type="button"
        onClick={onPickAvatar}
        aria-label="Change avatar"
        title={uploading ? "Uploading..." : "Change avatar"}
        disabled={uploading}
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
          cursor: uploading ? "not-allowed" : "pointer",
          opacity: uploading ? 0.7 : 1,
        }}
      >
        <img
          src={cameraIcon}
          alt="camera"
          style={{
            width: 18,
            height: 18,
            display: "block",
            objectFit: "contain",
          }}
        />
      </button>
    </div>
  );
};

export default AvatarUpload;
