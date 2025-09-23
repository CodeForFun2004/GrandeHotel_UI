// src/pages/auth/LoginPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import styled from "@emotion/styled";
import { Global, css, keyframes } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import loginImg from "../../assets/images/login.avif";

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
/* Vào: từ PHẢI -> TRÁI */
const slideInRight = keyframes`from{transform:translateX(105%)}to{transform:translateX(0)}`;
/* Rời: từ TRÁI -> PHẢI */
const slideOutRight = keyframes`from{transform:translateX(0)}to{transform:translateX(105%)}`;

const contentIn = keyframes`from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}`;
const fadeOut = keyframes`from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(10px)}`;

/* Background parallax-ish */
/* Vào: đẩy nền nhẹ từ PHẢI -> TRÁI (dương -> 0) */
const bgIn = keyframes`from{transform:translateX(8%) scale(1.02)}to{transform:translateX(0) scale(1.02)}`;
/* Rời: nền nhích TRÁI -> PHẢI (0 -> +6%) */
const bgOutRight = keyframes`from{transform:translateX(0) scale(1.02)}to{transform:translateX(6%) scale(1.02)}`;

/* ===== Layout ===== */
const Section = styled.section`
  min-height: 100vh;
  min-block-size: 100svh;
  position: relative;
  overflow: hidden;
`;

const Hero = styled.aside<{ image?: string; appearing?: boolean; sliding?: boolean }>`
  position: absolute;
  inset: 0;
  z-index: 0;
  background:
    linear-gradient(0deg, rgba(0,0,0,.18), rgba(0,0,0,.18)),
    url(${p => p.image || loginImg}) center/cover no-repeat;
  will-change: transform;

  /* Vào trang */
  ${({ appearing, sliding }) =>
    appearing && !sliding && css`animation: ${bgIn} .55s ease both;`}

  /* Rời trang -> về bên phải */
  ${({ sliding }) =>
    sliding && css`animation: ${bgOutRight} .55s ease forwards;`}
`;

const HeroContent = styled.div`
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: ${LEFT_FR * 100}%;
  z-index: 1; color: #fff;

  display: flex; flex-direction: column; justify-content: center;
  padding: 0 72px; max-width: 800px;

  .title { margin: 0 0 14px; font-size: clamp(28px, 4.6vw, 44px); line-height: 1.15; font-weight: 800; text-shadow: 0 2px 16px rgba(0,0,0,.25); }
  .sub { margin: 0; font-size: 16px; opacity: .96; }

  @media (max-width: 980px) {
    width: 100%;
    padding: 40px 28px;
    align-items: flex-start;
  }
`;

const RightCol = styled.main<{ sliding?: boolean; appearing?: boolean }>`
  position: absolute; right: 0; top: 0; bottom: 0;
  width: ${RIGHT_FR * 100}%;
  z-index: 3;
  display: grid; place-items: center;

  /* Vào: từ phải sang trái */
  ${({ appearing, sliding }) =>
    appearing && !sliding && css`
      animation: ${slideInRight} .55s ease both;
      will-change: transform;
    `}

  /* Rời: từ trái sang phải */
  ${({ sliding }) =>
    sliding && css`
      animation: ${slideOutRight} .55s ease forwards;
      will-change: transform;
    `}
  @media (max-width: 980px) { width: 100%; }
`;

const WhitePanel = styled.div`
  position: absolute; top: 0; bottom: 0; left: -${OVERLAP}px; right: 0;
  background: ${COLORS.white};
  border-top-left-radius: ${RADIUS}px;
  border-bottom-left-radius: ${RADIUS}px;
  z-index: 0; transform: translateZ(0);

  @media (max-width: 980px){
    left: 0;
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

const Content = styled.div<{ sliding?: boolean; appearing?: boolean }>`
  width: 100%;
  ${({ appearing, sliding }) =>
    appearing && !sliding && css`animation: ${contentIn} .5s ease both;`}
  ${({ sliding }) =>
    sliding && css`animation: ${fadeOut} .35s ease forwards;`}
`;

const BigTitle = styled.h1`
  margin: 0 0 28px;
  font-size: clamp(28px, 5vw, 44px);
  line-height: 1.1;
  color: ${COLORS.ink};
  font-weight: 800;
  letter-spacing: .3px;
  text-align: left;
`;

const Card = styled.div` background: ${COLORS.white}; `;

const FloatField = styled.label`
  position: relative; display: block;

  input{
    width: 100%; height: 56px; border-radius: 12px;
    border: 1px solid ${COLORS.border}; padding: 18px 52px 0 18px;
    font-size: 16px; background: ${COLORS.white}; outline: 0;
    transition: border-color .2s, box-shadow .2s, background .2s;
  }
  input::placeholder{ color: transparent; }

  span{
    position: absolute; left: 18px; top: 50%; transform: translateY(-50%);
    font-size: 16px; color: ${COLORS.muted}; pointer-events: none;
    background: ${COLORS.white}; padding: 0 6px; transition: all .18s ease;
  }

  input:focus, input:not(:placeholder-shown){
    border-color: ${COLORS.brown};
    box-shadow: 0 0 0 4px color-mix(in oklab, ${COLORS.brown} 18%, transparent);
  }
  input:focus + span, input:not(:placeholder-shown) + span{
    top: 0; transform: translateY(-50%) scale(.88); color: ${COLORS.ink};
  }
`;

const EyeBtn = styled.button`
  position: absolute; right: 12px; top: 0; bottom: 0; margin-block: auto;
  width: 36px; height: 36px; display: grid; place-items: center;
  border: none; background: transparent; color: #7c7c7c; cursor: pointer; padding: 0; line-height: 0;
  &:hover { color: ${COLORS.brown700}; }
`;

const Row = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin: 8px 0 18px; gap: 12px;
`;

const Check = styled.label`
  display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: ${COLORS.text};
  input{ width: 18px; height: 18px; accent-color: ${COLORS.brown}; }
`;

const LinkA = styled.a`
  color: ${COLORS.brown700}; text-decoration: none; font-size: 14px;
  &:hover { text-decoration: underline; }
`;

const LinkBtn = styled.button`
  border: none; background: transparent; padding: 0;
  color: ${COLORS.brown700}; font-size: 14px; cursor: pointer;
  &:hover { text-decoration: underline; }
`;

const Btn = styled.button<{ primary?: boolean }>`
  height: 52px; width: 100%; border-radius: 12px; font-weight: 700; cursor: pointer;
  border: 1px solid ${p=>p.primary?COLORS.brown:COLORS.border};
  background: ${p=>p.primary?COLORS.brown:COLORS.white};
  color: ${p=>p.primary?"#fff":COLORS.text};
  transition: background .2s, border-color .2s, opacity .2s;

  &:hover{ background:${p=>p.primary?COLORS.brown600:"#faf7f2"}; border-color:${p=>p.primary?COLORS.brown600:"#e9dfcf"}; }

  &:disabled{
    opacity:.5;
    cursor:not-allowed;
    background:${p=>p.primary?COLORS.brown:COLORS.white};
  }
`;

const Sep = styled.div`
  display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
  gap: 12px; color: #9aa0a6; font-size: 14px; margin: 14px 0;
  &::before, &::after { content:""; height:1px; background:${COLORS.border}; }
`;

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.72 1.22 9.22 3.6l6.9-6.9C35.9 2.6 30.47 0 24 0 14.62 0 6.4 5.38 2.56 13.22l8.95 6.95C13.25 14.02 18.18 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.5 24.5c0-1.64-.16-3.22-.46-4.76H24v9.02h12.7c-.55 2.96-2.24 5.46-4.78 7.16l7.3 5.66C43.86 37.8 46.5 31.75 46.5 24.5z"/>
    <path fill="#FBBC05" d="M11.51 28.17A14.48 14.48 0 0 1 10.72 24c0-1.45.25-2.85.71-4.17l-8.95-6.95A23.94 23.94 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l8.95-6.61z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.14 15.9-5.85l-7.3-5.66c-2.04 1.37-4.66 2.17-8.6 2.17-5.82 0-10.75-4.52-12.49-10.28l-8.95 6.61C6.4 42.62 14.62 48 24 48z"/>
  </svg>
);

const Small = styled.p`
  font-size: 13px; color: #666; text-align: center; margin: 12px 0 0;
`;

const ErrorText = styled.p`
  margin: 10px 0 0;
  font-size: 13px;
  color: #b42318;
`;

/* ===== Component ===== */
const LoginPage: React.FC = () => {
  const [showPw, setShowPw] = useState(false);
  const [sliding, setSliding] = useState(false);
  const [appearing, setAppearing] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  /* NEW: lưu đường dẫn đích để animate xong mới chuyển */
  const [nextPath, setNextPath] = useState<string | null>(null);

  const navigate = useNavigate();

  // Only enable when email looks valid + password not empty
  const canSubmit = useMemo(() => {
    const okMail = /\S+@\S+\.\S+/.test(email.trim());
    const okPass = password.trim().length > 0;
    return okMail && okPass;
  }, [email, password]);

  useEffect(() => {
    const t = setTimeout(() => setAppearing(false), 650);
    return () => clearTimeout(t);
  }, []);

  const startSlideTo = (path: string) => {
    setNextPath(path);
    setSliding(true); // chạy animation rời: trái -> phải
  };

  const handleCreateClick = (e: React.MouseEvent) => {
    e.preventDefault();
    startSlideTo("/register");
  };

  const handleForgot = (e: React.MouseEvent) => {
    e.preventDefault();
    startSlideTo("/forgot-password");
  };

  const handleRightColEnd = () => {
    if (sliding && nextPath) navigate(nextPath);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    // Demo auth: user1@gmail.com / user1
    if (email.trim().toLowerCase() === "user1@gmail.com" && password === "user1") {
      setError(null);
      navigate("/");
    } else {
      setError("Email hoặc mật khẩu không đúng. Gợi ý: user1@gmail.com / user1");
    }
  };

  return (
    <>
      <GlobalStyles />
      <Section>
        <Hero
          appearing={appearing}
          sliding={sliding}
          image={loginImg}
          aria-label="Nature scenery background"
        />

        <HeroContent>
          <div className="title">
            Your Pathway to
            <br /> Comfortable Stays
          </div>
          <p className="sub">
            Effortless booking • Warm service • Memorable experiences
          </p>
        </HeroContent>

        <RightCol
          appearing={appearing}
          sliding={sliding}
          onAnimationEnd={handleRightColEnd}
        >
          <WhitePanel />
          <ContentWrap>
            <Content appearing={appearing} sliding={sliding}>
              <BigTitle>Log in</BigTitle>

              <Card>
                <form onSubmit={handleSubmit} noValidate>
                  <FloatField>
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <span>Email address</span>
                  </FloatField>

                  <div style={{ height: 16 }} />

                  <FloatField>
                    <input
                      type={showPw ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <span>Password</span>
                    <EyeBtn
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? "Hide password" : "Show password"}
                      aria-pressed={showPw}
                      title={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? (
                        // eye-off
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                          <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          <path d="M2 12s4-7 10-7c2.1 0 4 .7 5.6 1.7" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
                          <path d="M22 12s-4 7-10 7c-2.2 0-4.1-.7-5.8-1.9" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
                          <path d="M9.5 9.5a4.5 4.5 0 0 0 6.4 6.3" stroke="currentColor" strokeWidth="1.6" fill="none" />
                        </svg>
                      ) : (
                        // eye
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                          <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7Z" stroke="currentColor" strokeWidth="1.6"/>
                          <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.6"/>
                        </svg>
                      )}
                    </EyeBtn>
                  </FloatField>

                  <Row>
                    <Check>
                      <input type="checkbox" /> <span>Remember me</span>
                    </Check>
                    <LinkA href="#" onClick={handleForgot}>Forgot password?</LinkA>
                  </Row>

                  <Btn primary type="submit" disabled={!canSubmit}>Login</Btn>

                  {error && <ErrorText role="alert">{error}</ErrorText>}

                  <Sep><span>or</span></Sep>

                  <Btn type="button">
                    <div style={{display:"flex", alignItems:"center", justifyContent:"center", gap:10}}>
                      <GoogleLogo /> <span>Log in with Google</span>
                    </div>
                  </Btn>

                  <Small>
                    New to Grand Hotel?{" "}
                    <LinkBtn onClick={handleCreateClick}>Create Account</LinkBtn>
                  </Small>
                </form>
              </Card>
            </Content>
          </ContentWrap>
        </RightCol>
      </Section>
    </>
  );
};

export default LoginPage;
