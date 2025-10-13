// src/pages/auth/VerifyEmail.tsx
import React, { useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import { Global, css, keyframes } from "@emotion/react";
import { useLocation, useNavigate } from "react-router-dom";
import registerImg from "../../assets/images/register.avif";

// NEW: API + Redux + toast
import api from "../../api/axios";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../redux/store";
import { authLoginSuccess } from "../../redux/slices/authSlice";
import { toast } from "react-toastify";
import { routes } from "../../routes/AppRouter";

/* ===== Tokens ===== */
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
  danger: "#b42318",
  success: "#047857",
};
const LEFT_FR = 0.42;
const RIGHT_FR = 0.58;
const RADIUS = 56;
const OVERLAP = 32;

/** ✅ Điều chỉnh nếu BE route khác:
 *  - VERIFY_ENDPOINT: route BE xử lý verifyRegister (otp)
 *  - RESEND_ENDPOINT: route gửi lại OTP
 */
const VERIFY_ENDPOINT = "/auth/verify-register";
const RESEND_ENDPOINT = "/auth/register-request";

/* ===== Global ===== */
const GlobalStyles = () => (
  <Global
    styles={css`
      * {
        box-sizing: border-box;
      }
      html,
      body,
      #root {
        height: 100%;
      }
      body {
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto,
          Helvetica, Arial;
        color: ${COLORS.text};
        background: ${COLORS.page};
      }
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `}
  />
);

/* ===== Animations ===== */
const slideInLeft = keyframes`from{transform:translateX(-105%)}to{transform:translateX(0)}`;
const slideOutLeft = keyframes`from{transform:translateX(0)}to{transform:translateX(-105%)}`;
const contentIn = keyframes`from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:translateX(0)}`;
const contentFadeOut = keyframes`from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-10px)}`;
const bgIn = keyframes`from{transform:translateX(-8%) scale(1.02)}to{transform:translateX(0) scale(1.02)}`;
const bgOut = keyframes`from{transform:translateX(0) scale(1.02)}to{transform:translateX(-6%) scale(1.02)}`;

/* ===== Layout ===== */
const Section = styled.section`
  min-height: 100vh;
  min-block-size: 100svh;
  position: relative;
  overflow: hidden;
`;

const Background = styled.aside<{ appearing?: boolean; slidingOut?: boolean }>`
  position: absolute;
  inset: 0;
  z-index: 0;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.18)),
    url(${registerImg}) center/cover no-repeat;
  will-change: transform;
  ${({ appearing, slidingOut }) =>
    appearing &&
    !slidingOut &&
    css`
      animation: ${bgIn} 0.55s ease both;
    `}
  ${({ slidingOut }) =>
    slidingOut &&
    css`
      animation: ${bgOut} 0.55s ease forwards;
    `}
`;

const HeroContent = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: ${RIGHT_FR * 100}%;
  z-index: 1;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 72px;
  max-width: 800px;
  margin-left: auto;
  .title {
    margin: 0 0 14px;
    font-size: clamp(28px, 4.6vw, 44px);
    line-height: 1.15;
    font-weight: 800;
    text-shadow: 0 2px 16px rgba(0, 0, 0, 0.25);
  }
  .sub {
    margin: 0;
    font-size: 16px;
    opacity: 0.96;
  }
  @media (max-width: 980px) {
    width: 100%;
    padding: 40px 28px;
  }
`;

const LeftCol = styled.main<{ appearing?: boolean; slidingOut?: boolean }>`
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: ${LEFT_FR * 100}%;
  z-index: 3;
  display: grid;
  place-items: center;
  ${({ appearing, slidingOut }) =>
    appearing &&
    !slidingOut &&
    css`
      animation: ${slideInLeft} 0.55s ease both;
    `}
  ${({ slidingOut }) =>
    slidingOut &&
    css`
      animation: ${slideOutLeft} 0.55s ease forwards;
    `}
  @media (max-width:980px) {
    width: 100%;
  }
`;

const WhitePanel = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: -${OVERLAP}px;
  background: ${COLORS.white};
  border-top-right-radius: ${RADIUS}px;
  border-bottom-right-radius: ${RADIUS}px;
  z-index: 0;
  @media (max-width: 980px) {
    right: 0;
    border-radius: 0;
  }
`;

const ContentWrap = styled.div`
  width: 100%;
  max-width: 520px;
  padding: 40px 24px;
  position: relative;
  z-index: 1;
`;

const Content = styled.div<{ appearing?: boolean; slidingOut?: boolean }>`
  width: 100%;
  text-align: center;
  ${({ appearing, slidingOut }) =>
    appearing &&
    !slidingOut &&
    css`
      animation: ${contentIn} 0.5s ease both;
    `}
  ${({ slidingOut }) =>
    slidingOut &&
    css`
      animation: ${contentFadeOut} 0.35s ease forwards;
    `}
`;

const BigTitle = styled.h1`
  margin: 0 0 12px;
  font-size: clamp(28px, 5vw, 44px);
  line-height: 1.1;
  color: ${COLORS.ink};
  font-weight: 800;
`;
const Subdesc = styled.p`
  margin: 0 0 18px;
  font-size: 16px;
  color: ${COLORS.muted};
`;

const OtpRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin: 8px 0 16px;
`;
const OtpInput = styled.input`
  width: 62px;
  height: 62px;
  border-radius: 14px;
  border: 1px solid ${COLORS.border};
  text-align: center;
  font-weight: 700;
  font-size: 26px;
  outline: none;
  background: ${COLORS.white};
  transition: border-color 0.2s, box-shadow 0.2s;
  &:focus {
    border-color: ${COLORS.brown};
    box-shadow: 0 0 0 4px color-mix(in oklab, ${COLORS.brown} 18%, transparent);
  }
`;

const Btn = styled.button<{ primary?: boolean }>`
  height: 52px;
  width: 100%;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid ${(p) => (p.primary ? COLORS.brown : COLORS.border)};
  background: ${(p) => (p.primary ? COLORS.brown : COLORS.white)};
  color: ${(p) => (p.primary ? "#fff" : COLORS.text)};
  transition: background 0.2s, border-color 0.2s, opacity 0.2s;
  &:hover {
    background: ${(p) => (p.primary ? COLORS.brown600 : "#faf7f2")};
    border-color: ${(p) => (p.primary ? COLORS.brown600 : "#e9dfcf")};
  }
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    background: #cbbba0;
    border-color: #cbbba0;
    color: #fff;
  }
`;

const SepRow = styled.p`
  margin: 14px 0 0;
  font-size: 14px;
  color: ${COLORS.muted};
  text-align: center;
`;
const Resend = styled.button`
  border: none;
  background: transparent;
  padding: 0;
  color: ${COLORS.brown700};
  font-size: 14px;
  cursor: pointer;
`;
const ErrorText = styled.p`
  color: ${COLORS.danger};
  font-size: 13px;
  margin: 10px 0 0;
`;
const SuccessText = styled.p`
  color: ${COLORS.success};
  font-size: 14px;
  margin: 12px 0 0;
  font-weight: 600;
`;

/* ===== Component ===== */
const VerifyEmail: React.FC = () => {
  const [appearing, setAppearing] = useState(true);
  const [slidingOut, setSlidingOut] = useState(false);
  const [nextPath, setNextPath] = useState<string | null>(null);

  const [otp, setOtp] = useState(Array(6).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  // email truyền từ RegisterPage via navigate(..., { state: { email } })
  const email: string =
    (location.state as { email: string })?.email ||
    localStorage.getItem("pendingEmail") || // fallback nếu user refresh trang
    "";

  // Lưu lại để survive refresh (tuỳ bạn thích có hay không)
  useEffect(() => {
    if (email) localStorage.setItem("pendingEmail", email);
  }, [email]);

  useEffect(() => {
    const t = setTimeout(() => setAppearing(false), 650);
    return () => clearTimeout(t);
  }, []);

  // cooldown resend timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handleChange = (i: number, v: string) => {
    const digit = v.replace(/\D/g, "").slice(0, 1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    setError(null);
    if (digit && i < 5) inputsRef.current[i + 1]?.focus();
  };

  const handleKeyDown = (
    i: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      e.preventDefault();
      const next = [...otp];
      next[i - 1] = "";
      setOtp(next);
      inputsRef.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) inputsRef.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) inputsRef.current[i + 1]?.focus();
  };

  // Paste nguyên 6 số 1 lần
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = Array(6).fill("");
    for (let i = 0; i < text.length && i < 6; i++) next[i] = text[i]!;
    setOtp(next);
    inputsRef.current[Math.min(text.length, 5)]?.focus();
  };

  const filled = otp.every((d) => d !== "");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Missing email. Please go back to Register.");
      return;
    }
    if (!filled) return;

    const code = otp.join("");
    setSubmitting(true);
    setError(null);

    try {
      // Gọi verifyRegister
      const res = await api.post(VERIFY_ENDPOINT, { email, otp: code });

      // BE trả { user, accessToken, refreshToken }
      const { user, accessToken, refreshToken } = res.data || {};
      if (!accessToken || !refreshToken || !user) {
        throw new Error("Invalid server response");
      }

      // ✅ cập nhật Redux + localStorage qua reducer có sẵn
      dispatch(authLoginSuccess({ user, accessToken, refreshToken }));
      localStorage.removeItem("pendingEmail");

      setOk(true);
      toast.success("Email verified. Welcome!");
      // Rời trang với animation → về HOME
      setNextPath(routes.HOME_PATH);
      setSlidingOut(true);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Verification failed";
      setOk(false);
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    if (!email || cooldown > 0) return;
    setResending(true);
    setError(null);
    try {
      // Ưu tiên lấy từ sessionStorage (có password), fallback sang local (không có pass)
      const regRaw =
        sessionStorage.getItem("pendingReg") ||
        localStorage.getItem("pendingReg"); // nếu bạn từng lưu
      let payload: unknown;

      if (regRaw) {
        payload = JSON.parse(regRaw);
      } else {
        const noPassRaw = localStorage.getItem("pendingRegNoPass");
        if (noPassRaw) {
          // Backend của bạn có thể yêu cầu password ở register-request.
          // Nếu BE bắt buộc password mà ở đây không có → sẽ báo lỗi.
          payload = JSON.parse(noPassRaw);
        } else {
          // Hạ cánh mềm nhất – chỉ gửi email (sẽ fail nếu BE cần đủ fields)
          payload = { email };
        }
      }

      await api.post(RESEND_ENDPOINT, payload);
      toast.info("A new code has been sent to your email.");
      setCooldown(60);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to resend code";
      setError(msg);
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  // Đợi animation rời trang xong rồi mới navigate
  const handleLeftColEnd = () => {
    if (slidingOut && nextPath) navigate(nextPath, { replace: true });
  };

  return (
    <>
      <GlobalStyles />
      <Section>
        <Background appearing={appearing} slidingOut={slidingOut} />
        <HeroContent>
          <div className="title">Welcome to Grand Hotel</div>
          <p className="sub">Fast booking • Member perks • Seamless stays</p>
        </HeroContent>

        <LeftCol
          appearing={appearing}
          slidingOut={slidingOut}
          onAnimationEnd={handleLeftColEnd}
        >
          <WhitePanel />
          <ContentWrap>
            <Content
              appearing={appearing}
              slidingOut={slidingOut}
              onPaste={handlePaste}
            >
              <BigTitle>Check your email</BigTitle>
              <Subdesc>
                We sent a <strong>verification code</strong> to{" "}
                <strong>{email || "your email"}</strong>. Enter the{" "}
                <strong>6-digit</strong> code.
              </Subdesc>

              <form onSubmit={submit} noValidate>
                <OtpRow>
                  {otp.map((val, i) => (
                    <OtpInput
                      key={i}
                      ref={(el) => {
                        inputsRef.current[i] = el;
                      }}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </OtpRow>

                <Btn primary type="submit" disabled={!filled || submitting}>
                  {submitting ? "Verifying..." : "Verify Code"}
                </Btn>

                {error && <ErrorText role="alert">{error}</ErrorText>}
                {ok && (
                  <SuccessText>
                    Verification successful! Redirecting…
                  </SuccessText>
                )}

                <SepRow>
                  Haven’t got the email yet?{" "}
                  <Resend
                    type="button"
                    onClick={resend}
                    disabled={resending || cooldown > 0}
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend email"}
                  </Resend>
                </SepRow>
              </form>
            </Content>
          </ContentWrap>
        </LeftCol>
      </Section>
    </>
  );
};

export default VerifyEmail;
