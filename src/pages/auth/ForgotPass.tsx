// src/pages/auth/ForgotPass.tsx
import React, { useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import { Global, css, keyframes } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import bgImg from "../../assets/images/login.avif";

import api from "../../api/axios";
import { toast } from "react-toastify";
import { routes } from "../../routes/AppRouter";

/* ====== ENDPOINTS ====== */
const SEND_OTP_ENDPOINT   = "/auth/forgot-password"; // { email }
const RESET_PW_ENDPOINT   = "/auth/reset-password";  // { email, otp, newPassword, reNewPassword }

/* ===== Colors ===== */
const COLORS = {
  white: "#FFFFFF",
  page: "#FFFFFF",
  brown: "#7A5A1E",
  brown600: "#6B4F1B",
  brown700: "#5E4316",
  border: "#E5E7EB",
  text: "#2C2C2C",
  ink: "#111827",
  muted: "#6B7280",
  primary: "#4F7FF7",
  danger: "#b42318",
  success: "#047857",
};

const LEFT_FR = 0.58;
const RIGHT_FR = 0.42;
const RADIUS = 56;
const OVERLAP = 32;

/* ===== Global ===== */
const GlobalStyles = () => (
  <Global
    styles={css`
      * { box-sizing: border-box; }
      html, body, #root { height: 100%; }
      body {
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
        color: ${COLORS.text};
        background: ${COLORS.page};
      }
      @media (prefers-reduced-motion: reduce) {
        * { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
      }
    `}
  />
);

/* ===== Animations ===== */
const slideInRight = keyframes`from{transform:translateX(105%)}to{transform:translateX(0)}`;
const slideOutRight = keyframes`from{transform:translateX(0)}to{transform:translateX(105%)}`;
const contentIn = keyframes`from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}`;
const bgIn = keyframes`from{transform:translateX(8%) scale(1.02)}to{transform:translateX(0) scale(1.02)}`;
const bgOutRight = keyframes`from{transform:translateX(0) scale(1.02)}to{transform:translateX(6%) scale(1.02)}`;

/* ===== Layout & UI ===== */
const Section = styled.section`
  min-height: 100vh;
  min-block-size: 100svh;
  position: relative;
  overflow: hidden;
`;

const Hero = styled.aside<{ appearing?: boolean; slidingOut?: boolean }>`
  position: absolute; inset: 0; z-index: 0;
  background:
    linear-gradient(0deg, rgba(0,0,0,.18), rgba(0,0,0,.18)),
    url(${bgImg}) center/cover no-repeat;

  ${({ appearing, slidingOut }) =>
    appearing && !slidingOut && css`animation:${bgIn} .55s ease both;`}

  ${({ slidingOut }) =>
    slidingOut && css`animation:${bgOutRight} .55s ease forwards;`}
`;

const HeroContent = styled.div`
  position: absolute; left: 0; top: 0; bottom: 0;
  width: ${LEFT_FR * 100}%;
  color: #fff; z-index: 1;
  display: flex; flex-direction: column; justify-content: center;
  padding: 0 72px; max-width: 800px;
  .title{ margin:0 0 14px; font-size:clamp(28px,4.6vw,44px); line-height:1.15; font-weight:800; text-shadow:0 2px 16px rgba(0,0,0,.25); }
  .sub{ margin:0; font-size:16px; opacity:.96; }
  @media (max-width:980px){ width:100%; padding:40px 28px; }
`;

const RightCol = styled.main<{ appearing?: boolean; slidingOut?: boolean }>`
  position: absolute; right: 0; top: 0; bottom: 0;
  width: ${RIGHT_FR * 100}%; z-index: 3;
  display: grid; place-items: center;

  ${({ appearing, slidingOut }) =>
    appearing && !slidingOut && css`animation:${slideInRight} .55s ease both; will-change: transform;`}

  ${({ slidingOut }) =>
    slidingOut && css`animation:${slideOutRight} .55s ease forwards; will-change: transform;`}

  @media (max-width:980px){ width: 100%; }
`;

const WhitePanel = styled.div`
  position: absolute; top:0; bottom:0; left:-${OVERLAP}px; right:0;
  background:${COLORS.white};
  border-top-left-radius:${RADIUS}px;
  border-bottom-left-radius:${RADIUS}px;
  z-index:0;
  @media (max-width:980px){ left:0; border-radius:0; }
`;

const ContentWrap = styled.div`
  width: 100%; max-width: 520px; padding: 40px 24px; position: relative; z-index: 1;
`;

const Content = styled.div`
  width: 100%; animation: ${contentIn} .5s ease both;
`;

const BigTitle = styled.h1`
  margin: 0 0 8px;
  font-size: clamp(28px, 5vw, 44px);
  line-height: 1.1;
  color: ${COLORS.ink};
  font-weight: 800;
`;
const SubTitle = styled.p` margin: 0 0 22px; color:#6b7280; `;

const CenterTitle = styled(BigTitle)` text-align:center; `;
const CenterSub = styled(SubTitle)` text-align:center; `;

const Card = styled.div` background:${COLORS.white}; `;

const FloatField = styled.label`
  position:relative; display:block;
  input{
    width:100%; height:56px; border-radius:12px;
    border:1px solid ${COLORS.border}; padding:18px 18px 0 18px;
    font-size:16px; background:${COLORS.white}; outline:0;
    transition:border-color .2s, box-shadow .2s;
  }
  input::placeholder{ color:transparent; }
  span{
    position:absolute; left:18px; top:50%; transform:translateY(-50%);
    font-size:16px; color:${COLORS.muted}; background:${COLORS.white}; padding:0 6px;
    pointer-events:none; transition:all .18s ease;
  }
  input:focus, input:not(:placeholder-shown){
    border-color:${COLORS.brown};
    box-shadow:0 0 0 4px color-mix(in oklab, ${COLORS.brown} 18%, transparent);
  }
  input:focus + span, input:not(:placeholder-shown) + span{
    top:0; transform:translateY(-50%) scale(.88); color:${COLORS.ink};
  }
`;

const Btn = styled.button<{primary?: boolean; disabled?: boolean}>`
  height:52px; width:100%; border-radius:12px; font-weight:700; cursor:pointer;
  border:1px solid ${p=>p.primary?COLORS.primary:COLORS.border};
  background:${p=>p.primary?COLORS.primary:COLORS.white};
  color:${p=>p.primary?"#fff":COLORS.text};
  opacity:${p=>p.disabled? .6 : 1};
  pointer-events:${p=>p.disabled? "none" : "auto"};
  transition:background .2s, border-color .2s, opacity .2s;
  &:hover{ background:${p=>p.primary? "#3f6de6" : "#faf7f2"}; border-color:${p=>p.primary? "#3f6de6" : "#e9dfcf"}; }
`;

/* OTP */
const OtpWrap = styled.div`
  display:flex; justify-content:center; gap:12px; margin-bottom:10px; flex-wrap:wrap;
`;
const OtpInput = styled.input`
  width:54px; height:54px; border-radius:12px; text-align:center;
  font-size:20px; font-weight:700; border:1px solid ${COLORS.border};
  transition: border-color .2s, box-shadow .2s;
  &:focus{ outline:none; border-color:${COLORS.brown}; box-shadow:0 0 0 4px color-mix(in oklab, ${COLORS.brown} 18%, transparent); }
`;

const ErrorText = styled.p`
  color:${COLORS.danger}; font-size:13px; margin:6px 0 0; text-align:center;
`;
const SuccessText = styled.p`
  color:${COLORS.success}; font-size:14px; margin:10px 0 0; text-align:center; font-weight:600;
`;

const CenterRow = styled.div`
  margin-top: 12px;
  display: flex;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
  a{ color:${COLORS.brown700}; text-decoration:none; }
`;

type Step = 1 | 2 | 3;

const ForgotPass: React.FC = () => {
  const [appearing, setAppearing] = useState(true);
  const [slidingOut, setSlidingOut] = useState(false);
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [email, setEmail] = useState(() => localStorage.getItem("fpEmail") || "");
  const emailValid = /\S+@\S+\.\S+/.test(email);
  const [sending, setSending] = useState(false);

  // Step 2 — 6-digit OTP
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0); // resend CD
  const otpFilled = otp.every((d) => d.length === 1);

  // Step 3 — new password
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwOk, setPwOk] = useState(false);
  const [resetting, setResetting] = useState(false);

  const bothFilled = pw1.length > 0 && pw2.length > 0;

  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setAppearing(false), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const masked = (e: string) => {
    const [name, domain] = e.split("@");
    if (!name || !domain) return e;
    const hide = name.slice(0, 2) + "****";
    const d = domain.split(".");
    return `${hide}@${d[0]?.slice(0, 2)}****.${d.slice(1).join(".") || ""}`;
  };

  /* ---------- STEP 1: GỬI OTP ---------- */
  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid) return;

    setSending(true);
    try {
      await api.post(SEND_OTP_ENDPOINT, { email: email.trim() });
      toast.info("A reset code has been sent to your email.");
      localStorage.setItem("fpEmail", email.trim());
      setCooldown(60);
      setStep(2);
      setOtp(["", "", "", "", "", ""]);
      setOtpError(null);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to send reset code";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  /* Paste 6 số 1 lần */
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = Array(6).fill("");
    for (let i = 0; i < text.length && i < 6; i++) next[i] = text[i]!;
    setOtp(next);
    otpRefs.current[Math.min(text.length, 5)]?.focus();
  };

  const handleOtpChange = (i: number, v: string) => {
    const only = v.replace(/\D/g, "").slice(0, 1);
    const next = [...otp];
    next[i] = only;
    setOtp(next);
    setOtpError(null);

    if (only && otpRefs.current[i + 1]) otpRefs.current[i + 1]?.focus();
    if (!only && otpRefs.current[i - 1]) otpRefs.current[i - 1]?.focus();
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      e.preventDefault();
      const next = [...otp];
      next[i - 1] = "";
      setOtp(next);
      otpRefs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) otpRefs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) otpRefs.current[i + 1]?.focus();
  };

  /* ---------- STEP 2: TIẾP TỤC (KHÔNG VERIFY API) ---------- */
  const continueToReset = () => {
    if (!otpFilled) {
      setOtpError("Please enter the 6-digit code.");
      return;
    }
    setOtpError(null);
    setStep(3); // verify sẽ diễn ra ở bước resetPassword
  };

  const resend = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!emailValid || cooldown > 0) return;

    try {
      await api.post(SEND_OTP_ENDPOINT, { email: email.trim() });
      toast.info("A new code has been sent to your email.");
      setOtp(["", "", "", "", "", ""]);
      setOtpError(null);
      otpRefs.current[0]?.focus();
      setCooldown(60);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to resend code";
      setOtpError(msg);
      toast.error(msg);
    }
  };

  /* ---------- STEP 3: ĐỔI MẬT KHẨU (VERIFY + RESET GỘP TRONG BE) ---------- */
  const submitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwOk(false);

    if (!bothFilled) return;
    if (pw1.length < 6) {
      setPwError("Password must be at least 6 characters.");
      return;
    }
    if (pw1 !== pw2) {
      setPwError("Passwords do not match.");
      return;
    }

    setPwError(null);
    setResetting(true);
    try {
      const body = {
        email: (email || "").trim(),
        otp: otp.join(""),
        newPassword: pw1,
        reNewPassword: pw2,
      };

      await api.post(RESET_PW_ENDPOINT, body);

      setPwOk(true);
      toast.success("Password updated. Redirecting to Login…");

      // dọn dẹp
      localStorage.removeItem("fpEmail");

      setTimeout(() => {
        setSlidingOut(true);
      }, 900);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to update password";
      setPwError(msg);
      toast.error(msg);
    } finally {
      setResetting(false);
    }
  };

  const goLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    setSlidingOut(true);
  };

  const handlePanelAnimationEnd = () => {
    if (slidingOut) navigate(routes.LOGIN_PATH);
  };

  return (
    <>
      <GlobalStyles />
      <Section>
        <Hero appearing={appearing} slidingOut={slidingOut} />
        <HeroContent>
          <div className="title">Grand Hotel</div>
          <p className="sub">Account security • Simple steps • Peace of mind</p>
        </HeroContent>

        <RightCol
          appearing={appearing}
          slidingOut={slidingOut}
          onAnimationEnd={handlePanelAnimationEnd}
        >
          <WhitePanel />
          <ContentWrap>
            <Content onPaste={step === 2 ? handlePaste : undefined}>
              {step === 1 && (
                <>
                  <BigTitle>Forgot password</BigTitle>
                  <SubTitle>Please enter your email to reset the password</SubTitle>

                  <Card>
                    <form onSubmit={requestReset} noValidate>
                      <FloatField>
                        <input
                          type="email"
                          placeholder="Your Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                        <span>Your Email</span>
                      </FloatField>

                      <div style={{ height: 14 }} />

                      <Btn primary type="submit" disabled={!emailValid || sending}>
                        {sending ? "Sending..." : "Reset Password"}
                      </Btn>
                    </form>
                  </Card>
                </>
              )}

              {step === 2 && (
                <>
                  <CenterTitle>Check your email</CenterTitle>
                  <CenterSub>
                    We sent a reset code to <b>{masked(email)}</b>. Enter the <b>6-digit</b> code mentioned in the email.
                  </CenterSub>

                  <OtpWrap>
                    {otp.map((d, i) => (
                      <OtpInput
                        key={i}
                        value={d}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        aria-label={`Digit ${i + 1}`}
                      />
                    ))}
                  </OtpWrap>

                  <Btn primary onClick={continueToReset} disabled={!otpFilled}>
                    Continue
                  </Btn>

                  {otpError && <ErrorText role="alert">{otpError}</ErrorText>}

                  <CenterRow>
                    <span>Haven’t got the email yet?</span>
                    <a href="#" onClick={resend}>
                      {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
                    </a>
                  </CenterRow>
                </>
              )}

              {step === 3 && (
                <>
                  <BigTitle>Set a new password</BigTitle>
                  <SubTitle>Create a new password. Ensure it differs from previous ones for security</SubTitle>

                  <Card>
                    <form onSubmit={submitNewPassword} noValidate>
                      <FloatField>
                        <input
                          type={show1 ? "text" : "password"}
                          placeholder="Enter your new password"
                          value={pw1}
                          onChange={(e) => { setPw1(e.target.value); setPwError(null); }}
                          required
                        />
                        <span>Password</span>
                        <button
                          type="button"
                          onClick={() => setShow1((v) => !v)}
                          aria-label="Toggle password"
                          style={{ position:'absolute', right:12, top:10, background:'transparent', border:'none', cursor:'pointer' }}
                        >
                          {show1 ? "🙈" : "👁️"}
                        </button>
                      </FloatField>

                      <div style={{ height: 14 }} />

                      <FloatField>
                        <input
                          type={show2 ? "text" : "password"}
                          placeholder="Re-enter password"
                          value={pw2}
                          onChange={(e) => { setPw2(e.target.value); setPwError(null); }}
                          required
                        />
                        <span>Confirm Password</span>
                        <button
                          type="button"
                          onClick={() => setShow2((v) => !v)}
                          aria-label="Toggle confirm password"
                          style={{ position:'absolute', right:12, top:10, background:'transparent', border:'none', cursor:'pointer' }}
                        >
                          {show2 ? "🙈" : "👁️"}
                        </button>
                      </FloatField>

                      <div style={{ height: 14 }} />

                      <Btn primary type="submit" disabled={!bothFilled || resetting}>
                        {resetting ? "Updating..." : "Update Password"}
                      </Btn>
                    </form>
                  </Card>

                  {pwError && <ErrorText role="alert">{pwError}</ErrorText>}
                  {pwOk && <SuccessText>Password updated! Redirecting to Login…</SuccessText>}

                  <p style={{ fontSize:13, color:"#666", textAlign:"center", margin:"12px 0 0" }}>
                    Remembered your password?{" "}
                    <a href="#" onClick={goLogin} style={{ color: COLORS.brown700, textDecoration: "none" }}>
                      Back to login
                    </a>
                  </p>
                </>
              )}
            </Content>
          </ContentWrap>
        </RightCol>
      </Section>
    </>
  );
};

export default ForgotPass;
