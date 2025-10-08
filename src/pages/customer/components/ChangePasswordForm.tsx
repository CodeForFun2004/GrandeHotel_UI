import React from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { CHANGE_PW_ENDPOINT } from "../constants/profile.constants";
import type { PasswordState, ShowPasswordState } from "../types/profile.types";

// Eye icons
const Eye = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
      stroke="#6b7280"
      strokeWidth="1.8"
    />
    <circle cx="12" cy="12" r="3.5" stroke="#6b7280" strokeWidth="1.8" />
  </svg>
);

const EyeOff = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path
      d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
      stroke="#6b7280"
      strokeWidth="1.8"
    />
    <path
      d="M3 3l18 18"
      stroke="#6b7280"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const EyeBtn = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    style={{
      position: "absolute",
      right: 12,
      top: 0,
      bottom: 0,
      marginBlock: "auto",
      width: 36,
      height: 36,
      display: "grid",
      placeItems: "center",
      border: "none",
      background: "transparent",
      color: "#7c7c7c",
      cursor: "pointer",
      padding: 0,
      lineHeight: 0,
      ...props.style,
    }}
  >
    {children}
  </button>
);

interface ChangePasswordFormProps {
  pw: PasswordState;
  setPw: React.Dispatch<React.SetStateAction<PasswordState>>;
  show: ShowPasswordState;
  setShow: React.Dispatch<React.SetStateAction<ShowPasswordState>>;
  pwOk: boolean;
  setPwOk: React.Dispatch<React.SetStateAction<boolean>>;
  pwError: string | null;
  setPwError: React.Dispatch<React.SetStateAction<string | null>>;
  changingPw: boolean;
  setChangingPw: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  pw,
  setPw,
  show,
  setShow,
  pwOk,
  setPwOk,
  pwError,
  setPwError,
  changingPw,
  setChangingPw,
}) => {
  const handleSavePw = async () => {
    // clear cờ & lỗi cũ
    setPwOk(false);
    setPwError(null);

    // validate phía client
    if (!pw.cur || !pw.n || !pw.c) {
      setPwError("Please fill all fields.");
      return;
    }
    if (pw.n.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    if (pw.n !== pw.c) {
      setPwError("New password and confirmation do not match.");
      return;
    }

    setChangingPw(true);
    try {
      // Sử dụng axios raw để bypass interceptor tự động logout
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `http://localhost:1000/api${CHANGE_PW_ENDPOINT}`,
        {
          currentPassword: pw.cur,
          newPassword: pw.n,
          confirmNewPassword: pw.c,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
        }
      );

      setPwOk(true);
      setPw({ cur: "", n: "", c: "" });
      toast.success("Password changed successfully.");
    } catch (err: unknown) {
      console.log(
        "CHANGE PW ERROR:",
        (err as { response?: { status?: number; data?: any } })?.response?.status,
        (err as { response?: { data?: any } })?.response?.data,
        err
      );
      
      const error = err as { 
        response?: { 
          status?: number; 
          data?: { message?: string } 
        }; 
        message?: string 
      };
      
      // Xử lý các loại lỗi khác nhau
      let errorMessage = "Failed to change password";
      
      if (error?.response?.status === 400) {
        // Lỗi validation - mật khẩu hiện tại không đúng
        errorMessage = error?.response?.data?.message || "Mật khẩu hiện tại không đúng";
      } else if (error?.response?.status === 401) {
        // Lỗi xác thực - nhưng KHÔNG logout, chỉ báo lỗi
        errorMessage = "Mật khẩu hiện tại không đúng";
      } else if (error?.response?.status === 422) {
        // Lỗi validation khác
        errorMessage = error?.response?.data?.message || "Dữ liệu không hợp lệ";
      } else {
        // Lỗi khác
        errorMessage = error?.response?.data?.message || error?.message || "Có lỗi xảy ra, vui lòng thử lại";
      }
      
      setPwError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setChangingPw(false);
    }
  };

  if (pwOk) {
    return (
      <div
        style={{
          maxWidth: 520,
          padding: 16,
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          background: "#f9fafb",
          color: "#111827",
          fontWeight: 600,
        }}
      >
        Password changed successfully. You can continue editing your
        profile or switch back to the Profile tab.
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      {/* Không căn giữa input, chỉ giới hạn chiều rộng nếu muốn */}
      <div style={{ display: "grid", gap: 12, maxWidth: 460 }}>
        {/* Current password */}
        <div style={{ position: "relative" }}>
          <input
            type={show.cur ? "text" : "password"}
            placeholder="Current password"
            value={pw.cur}
            onChange={(e) =>
              setPw((p) => ({ ...p, cur: e.target.value }))
            }
            style={{
              width: "100%",
              height: 44,
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              padding: "0 48px 0 12px",
              fontSize: 14,
            }}
          />
          <EyeBtn
            type="button"
            onClick={() => setShow((s) => ({ ...s, cur: !s.cur }))}
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
            onChange={(e) =>
              setPw((p) => ({ ...p, n: e.target.value }))
            }
            style={{
              width: "100%",
              height: 44,
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              padding: "0 48px 0 12px",
              fontSize: 14,
            }}
          />
          <EyeBtn
            type="button"
            onClick={() => setShow((s) => ({ ...s, n: !s.n }))}
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
            onChange={(e) =>
              setPw((p) => ({ ...p, c: e.target.value }))
            }
            style={{
              width: "100%",
              height: 44,
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              padding: "0 48px 0 12px",
              fontSize: 14,
            }}
          />
          <EyeBtn
            type="button"
            onClick={() => setShow((s) => ({ ...s, c: !s.c }))}
            aria-label={show.c ? "Hide" : "Show"}
            title={show.c ? "Hide password" : "Show password"}
          >
            {show.c ? EyeOff : Eye}
          </EyeBtn>
        </div>
      </div>

      {/* Error message */}
      {pwError && (
        <div
          style={{
            color: "#ef4444",
            fontSize: 14,
            marginTop: 8,
            maxWidth: 460,
          }}
        >
          {pwError}
        </div>
      )}

      {/* Save căn giữa, nằm dưới nhóm input */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: 16,
          maxWidth: 460,
        }}
      >
        <button
          onClick={handleSavePw}
          disabled={changingPw}
          style={{
            height: 38,
            padding: "0 20px",
            borderRadius: 10,
            border: "1px solid #e5e7eb",
            background: changingPw ? "#6b7280" : "#111827",
            color: "#fff",
            fontWeight: 700,
            minWidth: 160,
            opacity: changingPw ? 0.7 : 1,
            cursor: changingPw ? "not-allowed" : "pointer",
          }}
        >
          {changingPw ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
};

export default ChangePasswordForm;
