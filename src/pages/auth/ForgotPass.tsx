// src/pages/auth/ForgotPass.tsx
import React, { useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import { Global, css, keyframes } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import bgImg from "../../assets/images/login.avif";

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
const CORRECT_CODE = "123456";

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
/* Vào: panel từ phải -> trái */
const slideInRight = keyframes`from{transform:translateX(105%)}to{transform:translateX(0)}`;
/* Rời: panel từ trái -> phải */
const slideOutRight = keyframes`from{transform:translateX(0)}to{transform:translateX(105%)}`;

/* Nội dung */
const contentIn = keyframes`from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}`;

/* Nền */
const bgIn = keyframes`from{transform:translateX(8%) scale(1.02)}to{transform:translateX(0) scale(1.02)}`;
const bgOutRight = keyframes`from{transform:translateX(0) scale(1.02)}to{transform:translateX(6%) scale(1.02)}`;

/* ===== Layout ===== */
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

  /* Vào */
  ${({ appearing, slidingOut }) =>
    appearing && !slidingOut && css`animation:${slideInRight} .55s ease both; will-change: transform;`}

  /* Rời */
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

/* Titles */
const BigTitle = styled.h1`
  margin: 0 0 8px;
  font-size: clamp(28px, 5vw, 44px);
  line-height: 1.1;
  color: ${COLORS.ink};
  font-weight: 800;
`;
const SubTitle = styled.p` margin: 0 0 22px; color:#6b7280; `;

/* Centered variants dùng riêng cho Step 2 */
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

/* Centered note row dưới nút */
const CenterRow = styled.div`
  margin-top: 12px;
  display: flex;
  justify-content: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
  a{ color:${COLORS.brown700}; text-decoration:none; }
`;

const Small = styled.p` font-size:13px; color:#666; text-align:center; margin:12px 0 0; `;
const EyeBtn = styled.button`
  position:absolute; right:12px; top:0; bottom:0; margin-block:auto;
  width:36px; height:36px; display:grid; place-items:center;
  border:none; background:transparent; color:#7c7c7c; cursor:pointer; padding:0; line-height:0;
`;

/* ===== Component ===== */
type Step = 1 | 2 | 3;

const ForgotPass: React.FC = () => {
  const [appearing, setAppearing] = useState(true);
  const [slidingOut, setSlidingOut] = useState(false);
  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [email, setEmail] = useState("");
  const emailValid = /\S+@\S+\.\S+/.test(email);

  // Step 2 — 6-digit OTP
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [otpError, setOtpError] = useState<string | null>(null);
  const otpFilled = otp.every((d) => d.length === 1);

  // Step 3 — new password
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwOk, setPwOk] = useState(false);

  const bothFilled = pw1.length > 0 && pw2.length > 0;

  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setAppearing(false), 600);
    return () => clearTimeout(t);
  }, []);

  const masked = (e: string) => {
    const [name, domain] = e.split("@");
    if (!name || !domain) return e;
    const hide = name.slice(0, 2) + "****";
    const d = domain.split(".");
    return `${hide}@${d[0]?.slice(0, 2)}****.${d.slice(1).join(".") || ""}`;
  };

  const handleOtpChange = (i: number, v: string) => {
    const only = v.replace(/\D/g, "").slice(0, 1);
    const next = [...otp];
    next[i] = only;
    setOtp(next);

    if (only && otpRefs.current[i + 1]) otpRefs.current[i + 1]?.focus();
    if (!only && otpRefs.current[i - 1]) otpRefs.current[i - 1]?.focus();

    setOtpError(null);

    // Auto-verify khi đủ 6 số
    const code = next.join("");
    if (next.every((d) => d !== "")) {
      if (code === CORRECT_CODE) {
        setOtpError(null);
        setStep(3);
      } else {
        setOtpError("Reset code is incorrect.");
      }
    }
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

  const verifyManually = (e: React.MouseEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (otpFilled && code === CORRECT_CODE) {
      setOtpError(null);
      setStep(3);
    } else {
      setOtpError("Reset code is incorrect.");
    }
  };

  const resend = (e: React.MouseEvent) => {
    e.preventDefault();
    setOtp(["", "", "", "", "", ""]);
    setOtpError(null);
    otpRefs.current[0]?.focus();
  };

  const goLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    setSlidingOut(true); // animate out rồi mới về login
  };

  const handlePanelAnimationEnd = () => {
    if (slidingOut) navigate("/login");
  };

  // Submit đổi mật khẩu
  const submitNewPassword = (e: React.FormEvent) => {
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
    setPwOk(true);

    // Hiện success rồi animate rời trang và chuyển sang login
    setTimeout(() => {
      setSlidingOut(true);
    }, 900);
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
            <Content>
              {step === 1 && (
                <>
                  <BigTitle>Forgot password</BigTitle>
                  <SubTitle>Please enter your email to reset the password</SubTitle>

                  <Card>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (emailValid) setStep(2);
                      }}
                      noValidate
                    >
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

                      <Btn primary type="submit" disabled={!emailValid}>
                        Reset Password
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

                  <Btn primary onClick={verifyManually} disabled={!otpFilled}>
                    Verify Code
                  </Btn>

                  {otpError && <ErrorText role="alert">{otpError}</ErrorText>}

                  <CenterRow>
                    <span>Haven’t got the email yet?</span>
                    <a href="#" onClick={resend}>Resend email</a>
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
                        <EyeBtn type="button" onClick={() => setShow1((v) => !v)} aria-label="Toggle password">
                          {show1 ? "🙈" : "👁️"}
                        </EyeBtn>
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
                        <EyeBtn type="button" onClick={() => setShow2((v) => !v)} aria-label="Toggle confirm password">
                          {show2 ? "🙈" : "👁️"}
                        </EyeBtn>
                      </FloatField>

                      <div style={{ height: 14 }} />

                      <Btn primary type="submit" disabled={!bothFilled}>
                        Update Password
                      </Btn>
                    </form>
                  </Card>

                  {pwError && <ErrorText role="alert">{pwError}</ErrorText>}
                  {pwOk && <SuccessText>Password updated! Redirecting to Login…</SuccessText>}

                  <Small>
                    Remembered your password?{" "}
                    <a href="#" onClick={goLogin} style={{ color: COLORS.brown700, textDecoration: "none" }}>
                      Back to login
                    </a>
                  </Small>
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
