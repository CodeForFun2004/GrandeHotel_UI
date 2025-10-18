// src/pages/customer/Profile.tsx
import React, { useMemo, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../redux/store";
import { setCredentials } from "../../redux/slices/authSlice";
import { toast } from "react-toastify";
import api from "../../api/axios";

// Components
import ProfileSidebar from "./components/ProfileSidebar";
import ProfileHeader from "./components/ProfileHeader";
import ProfileForm from "./components/ProfileForm";
import ChangePasswordForm from "./components/ChangePasswordForm";

// Types and constants
import type { User, Tab, PasswordState, ShowPasswordState } from "./types/profile.types";
import { DEFAULT_AVATAR } from "./constants/profile.constants";


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


const Profile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((s: RootState) => s.auth);
  const currentUser = auth.user as User | null;

  const [data, setData] = useState<User>(currentUser || {
    username: "",
    fullname: "",
    email: "",
    phone: "",
    avatar: "",
    address: "",
    gender: "other",
    birthday: "",
    country: "",
    role: "customer"
  } as User);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<Tab>("profile");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Helper function to format birthday for HTML date input
  const formatBirthdayForInput = (birthday: string | undefined): string => {
    if (!birthday) return "";
    
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
      return birthday;
    }
    
    // If it's in DD/MM/YYYY format, convert to YYYY-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(birthday)) {
      const [day, month, year] = birthday.split('/');
      return `${year}-${month}-${day}`;
    }
    
    // If it's a Date object or ISO string, convert to YYYY-MM-DD
    try {
      const date = new Date(birthday);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch {
      console.warn("Could not parse birthday:", birthday);
    }
    
    return "";
  };

  // Initialize data from currentUser when component mounts
  useEffect(() => {
    if (currentUser) {
      console.log("Current User:", currentUser);
      console.log("User ID:", (currentUser as { _id?: string; id?: string })?._id || (currentUser as { _id?: string; id?: string })?.id);
      console.log("Birthday from API:", currentUser.birthday);
      console.log("Birthday type:", typeof currentUser.birthday);
      
      setData({
        ...currentUser,
        _id: (currentUser as { _id?: string; id?: string })?._id || (currentUser as { _id?: string; id?: string })?.id || "",
        username: currentUser.username || "",
        fullname: currentUser.fullname || "",
        email: currentUser.email || "",
        phone: currentUser.phone || "",
        avatar: currentUser.avatar || "",
        address: currentUser.address || "",
        gender: currentUser.gender || "other",
        birthday: formatBirthdayForInput(currentUser.birthday),
        country: currentUser.country || "",
        role: currentUser.role || "customer"
      });
    }
  }, [currentUser]);

  const avatarUrl = data.avatar?.trim() || DEFAULT_AVATAR;

  const fullName = useMemo(
    () => data.fullname || "Your name",
    [data.fullname]
  );

  const onChange =
    <K extends keyof User>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setData((d) => ({ ...d, [k]: e.target.value as User[K] }));

  const startEdit = () => setEditing(true);

  const onDiscard = () => {
      if (confirm("Are you sure you want to discard the changes?")) {
      if (currentUser) {
        setData({
          ...currentUser,
          _id: (currentUser as { _id?: string; id?: string })?._id || (currentUser as { _id?: string; id?: string })?.id || "",
          username: currentUser.username || "",
          fullname: currentUser.fullname || "",
          email: currentUser.email || "",
          phone: currentUser.phone || "",
          avatar: currentUser.avatar || "",
          address: currentUser.address || "",
          gender: currentUser.gender || "other",
          birthday: formatBirthdayForInput(currentUser.birthday),
          country: currentUser.country || "",
          role: currentUser.role || "customer"
        });
      }
      setEditing(false);
      toast.info("Changes discarded.");
    }
  };

  const onSave = async () => {
    const userId = data._id || (currentUser as { _id?: string; id?: string })?.id || (currentUser as { _id?: string; id?: string })?._id;
    console.log("Save - data._id:", data._id);
    console.log("Save - currentUser.id:", (currentUser as { _id?: string; id?: string })?.id);
    console.log("Save - currentUser._id:", (currentUser as { _id?: string; id?: string })?._id);
    console.log("Save - final userId:", userId);
    
    if (!userId) {
      toast.error("User ID not found");
      return;
    }

    setSaving(true);
    try {
      const response = await api.put(`/users/${userId}`, {
        fullname: data.fullname,
        email: data.email,
        phone: data.phone,
        address: data.address,
        gender: data.gender,
        birthday: data.birthday,
        country: data.country,
      });

      // Update Redux store with new user data
      dispatch(setCredentials({ user: response.data.user }));
      
      setEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = error?.response?.data?.message || error?.message || "Failed to update profile";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const onAvatarChange = (newAvatarUrl: string) => {
    setData((d) => ({ ...d, avatar: newAvatarUrl }));
  };

  // Change Password tab state
  const [pw, setPw] = useState<PasswordState>({ cur: "", n: "", c: "" });
  const [pwOk, setPwOk] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [show, setShow] = useState<ShowPasswordState>({ cur: false, n: false, c: false });
  const [changingPw, setChangingPw] = useState(false);

  return (
    <div
      className={`profile-page ${editing ? "editing" : ""}`}
      style={{ background: "#fff", minHeight: "100vh" }}
    >
      <GlobalFix />
      {/* Header đen */}
      <div style={{ height: 80, background: "#000" }} />

      <div
        style={{
          width: "100%",
          padding: 24,
          display: "grid",
          gridTemplateColumns: "25% 75%",
          gap: 24,
          boxSizing: "border-box",
        }}
      >
        <ProfileSidebar
          avatarUrl={avatarUrl}
          name={fullName}
          role={data.role || "customer"}
        />

        <section
          style={{
            background: "#fff",
            border: "1px solid #f1f5f9",
            borderRadius: 16,
            padding: 24,
          }}
        >
          <ProfileHeader
            avatarUrl={avatarUrl}
            tab={tab}
            editing={editing}
            uploading={uploading}
            onAvatarChange={onAvatarChange}
            onUploadingChange={setUploading}
            onStartEdit={startEdit}
          />

          {/* Tabs */}
          <div
            style={{
              marginTop: 10,
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <button
              onClick={() => setTab("profile")}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: tab === "profile" ? "#111827" : "#6b7280",
                fontWeight: tab === "profile" ? 700 : 500,
                textDecoration: tab === "profile" ? "underline" : "none",
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
                textDecoration: tab === "change" ? "underline" : "none",
              }}
            >
              Change Password
            </button>
          </div>

          {/* CONTENT BY TAB */}
          {tab === "profile" ? (
            <ProfileForm
              data={data}
              editing={editing}
              saving={saving}
              onChange={onChange}
              onDiscard={onDiscard}
              onSave={onSave}
            />
          ) : (
            <ChangePasswordForm
              pw={pw}
              setPw={setPw}
              show={show}
              setShow={setShow}
              pwOk={pwOk}
              setPwOk={setPwOk}
              pwError={pwError}
              setPwError={setPwError}
              changingPw={changingPw}
              setChangingPw={setChangingPw}
            />
          )}
        </section>
      </div>
    </div>
  );
};

export default Profile;
