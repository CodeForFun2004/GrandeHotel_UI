// src/pages/auth/RegisterPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import styled from "@emotion/styled";
import { Global, css, keyframes } from "@emotion/react";
import { useNavigate } from "react-router-dom";
import registerImg from "../../assets/images/register.avif";

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

const LEFT_FR = 0.42;   // panel trái
const RIGHT_FR = 0.58;  // vùng text trên ảnh (phải)
const RADIUS = 56;
const OVERLAP = 32;

/* ===== Global ===== */
const GlobalStyles = () => (
  <Global styles={css`
    *{ box-sizing: border-box; }
    html, body, #root{ height: 100%; }
    body{
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
      color: ${COLORS.text};
      background: ${COLORS.page};
    }
    @media (prefers-reduced-motion: reduce){
      *{ animation-duration:.01ms !important; animation-iteration-count:1 !important; transition-duration:.01ms !important; }
    }
  `}/>
);

/* ===== Animations ===== */
/* Vào trang: panel từ TRÁI -> PHẢI */
const slideInLeft = keyframes`from{transform:translateX(-105%)}to{transform:translateX(0)}`;
/* Rời trang: panel từ PHẢI -> TRÁI */
const slideOutLeft = keyframes`from{transform:translateX(0)}to{transform:translateX(-105%)}`;

/* Nội dung */
const contentIn = keyframes`from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:translateX(0)}`;
const contentFadeOut = keyframes`from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-10px)}`;

/* ẢNH nền đồng bộ với panel */
const bgIn = keyframes`from{transform:translateX(-8%) scale(1.02)}to{transform:translateX(0) scale(1.02)}`;
/* Rời trang: ảnh dịch sang TRÁI để tạo cảm giác sang màn mới */
const bgOut = keyframes`from{transform:translateX(0) scale(1.02)}to{transform:translateX(-6%) scale(1.02)}`;

/* ===== Layout ===== */
const Section = styled.section`
  min-height: 100vh;
  min-block-size: 100svh;
  position: relative;
  overflow: hidden;
`;

const Background = styled.aside<{appearing?: boolean; slidingOut?: boolean}>`
  position: absolute; inset: 0; z-index: 0;
  background:
    linear-gradient(0deg, rgba(0,0,0,.18), rgba(0,0,0,.18)),
    url(${registerImg}) center/cover no-repeat;
  will-change: transform;
  ${({ appearing, slidingOut }) =>
    appearing && !slidingOut && css`animation: ${bgIn} .55s ease both;`}
  ${({ slidingOut }) =>
    slidingOut && css`animation: ${bgOut} .55s ease forwards;`}
`;

/* Text trên ảnh (phải) */
const HeroContent = styled.div`
  position: absolute;
  right: 0; top: 0; bottom: 0;
  width: ${RIGHT_FR * 100}%;
  z-index: 1; color: #fff;

  display: flex; flex-direction: column; justify-content: center; align-items: flex-start;
  padding: 0 72px; max-width: 800px; margin-left: auto;

  .title{ margin:0 0 14px; font-size:clamp(28px,4.6vw,44px); line-height:1.15; font-weight:800; text-shadow:0 2px 16px rgba(0,0,0,.25); }
  .sub{ margin:0; font-size:16px; opacity:.96; }

  @media (max-width:980px){
    width: 100%;
    padding: 40px 28px;
    align-items: flex-start;
  }
`;

/* Panel trái (overlay) */
const LeftCol = styled.main<{ appearing?: boolean; slidingOut?: boolean }>`
  position: absolute; left: 0; top: 0; bottom: 0;
  width: ${LEFT_FR * 100}%;
  z-index: 3;
  display: grid; place-items: center;

  ${({ appearing, slidingOut }) =>
    appearing && !slidingOut && css`animation: ${slideInLeft} .55s ease both; will-change:transform;`}
  ${({ slidingOut }) =>
    slidingOut && css`animation: ${slideOutLeft} .55s ease forwards; will-change:transform;`}

  @media (max-width:980px){ width: 100%; }
`;

/* Panel trắng – bo góc phải, chồm sang phải */
const WhitePanel = styled.div`
  position: absolute;
  top: 0; bottom: 0; left: 0; right: -${OVERLAP}px;
  background: ${COLORS.white};
  border-top-right-radius: ${RADIUS}px;
  border-bottom-right-radius: ${RADIUS}px;
  z-index: 0; transform: translateZ(0);

  @media (max-width:980px){
    right: 0;
    border-radius: 0;
  }
`;

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.72 1.22 9.22 3.6l6.9-6.9C35.9 2.6 30.47 0 24 0 14.62 0 6.4 5.38 2.56 13.22l8.95 6.95C13.25 14.02 18.18 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.5 24.5c0-1.64-.16-3.22-.46-4.76H24v9.02h12.7c-.55 2.96-2.24 5.46-4.78 7.16l7.3 5.66C43.86 37.8 46.5 31.75 46.5 24.5z"/>
    <path fill="#FBBC05" d="M11.51 28.17A14.48 14.48 0 0 1 10.72 24c0-1.45.25-2.85.71-4.17l-8.95-6.95A23.94 23.94 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l8.95-6.61z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.14 15.9-5.85l-7.3-5.66c-2.04 1.37-4.66 2.17-8.6 2.17-5.82 0-10.75-4.52-12.49-10.28l-8.95 6.61C6.4 42.62 14.62 48 24 48z"/>
  </svg>
);

/* Bọc nội dung */
const ContentWrap = styled.div`
  width: 100%;
  max-width: 520px;
  padding: 40px 24px;
  position: relative;
  z-index: 1;
`;

const Content = styled.div<{ appearing?: boolean; slidingOut?: boolean }>`
  width: 100%;
  ${({ appearing, slidingOut }) =>
    appearing && !slidingOut && css`animation: ${contentIn} .5s ease both;`}
  ${({ slidingOut }) =>
    slidingOut && css`animation: ${contentFadeOut} .35s ease forwards;`}
`;

const BigTitle = styled.h1`
  margin: 0 0 28px;
  font-size: clamp(28px, 5vw, 44px);
  line-height: 1.1;
  color: ${COLORS.ink};
  font-weight: 800;
`;

const Card = styled.div` background: ${COLORS.white}; `;

/* Floating label */
const FloatField = styled.label`
  position: relative; display: block;
  input{
    width: 100%; height: 56px; border-radius: 12px;
    border: 1px solid ${COLORS.border}; padding: 18px 18px 0 18px;
    font-size: 16px; background: ${COLORS.white}; outline: 0;
    transition: border-color .2s, box-shadow .2s;
  }
  input::placeholder{ color: transparent; }
  span{
    position: absolute; left: 18px; top: 50%; transform: translateY(-50%);
    font-size: 16px; color: ${COLORS.muted}; background: ${COLORS.white};
    padding: 0 6px; pointer-events: none; transition: all .18s ease;
  }
  input:focus, input:not(:placeholder-shown){
    border-color: ${COLORS.brown};
    box-shadow: 0 0 0 4px color-mix(in oklab, ${COLORS.brown} 18%, transparent);
  }
  input:focus + span, input:not(:placeholder-shown) + span{
    top: 0; transform: translateY(-50%) scale(.88); color: ${COLORS.ink};
  }
`;

const Row = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin: 8px 0 18px; gap: 12px;
`;

const Btn = styled.button<{primary?:boolean}>`
  height: 52px; width: 100%; border-radius: 12px; font-weight: 700; cursor: pointer;
  border: 1px solid ${p=>p.primary?COLORS.brown:COLORS.border};
  background: ${p=>p.primary?COLORS.brown:COLORS.white};
  color: ${p=>p.primary?"#fff":COLORS.text};
  transition: background .2s, border-color .2s, opacity .2s;
  &:hover{ background: ${p=>p.primary?COLORS.brown600:"#faf7f2"}; border-color:${p=>p.primary?COLORS.brown600:"#e9dfcf"}; }
  &:disabled{ opacity:.5; cursor:not-allowed; background:${p=>p.primary?COLORS.brown:"#fafafa"}; border-color:${p=>p.primary?COLORS.brown:COLORS.border}; }
`;

const Sep = styled.div`
  display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
  gap: 12px; color: #9aa0a6; font-size: 14px; margin: 14px 0;
  &::before, &::after{ content:""; height:1px; background:${COLORS.border}; }
`;

const Small = styled.p`
  font-size: 13px; color: #666; text-align: center; margin: 12px 0 0;
`;

const LinkBtn = styled.button`
  border: none; background: transparent; padding: 0;
  color: ${COLORS.brown700}; font-size: 14px; cursor: pointer;
  &:hover { text-decoration: underline; }
`;

/* ===== Page ===== */
const RegisterPage: React.FC = () => {
  const [appearing, setAppearing] = useState(true);
  const [slidingOut, setSlidingOut] = useState(false);

  // điều hướng đợi animation
  const [nextPath, setNextPath] = useState<string | null>(null);
  const [navState, setNavState] = useState<{ email?: string } | null>(null);

  // State cho các input
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");

  const canSubmit = useMemo(() => {
    const okName = fullName.trim().length > 0;
    const okPass = password.trim().length > 0;
    const okMail = /\S+@\S+\.\S+/.test(email.trim());
    return okName && okMail && okPass;
  }, [fullName, email, password]);

  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setAppearing(false), 650);
    return () => clearTimeout(t);
  }, []);

  const handleBackToLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    setNextPath("/auth/login");
    setNavState(null);
    setSlidingOut(true);           // rời trang: RIGHT -> LEFT
  };

  // submit -> sang VerifyEmail, truyền email, và cũng rời trang RIGHT -> LEFT
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setNextPath("/verify-email");
    setNavState({ email });        // <-- email để VerifyEmail hiển thị
    setSlidingOut(true);
  };

  const handleLeftColEnd = () => {
    if (slidingOut && nextPath) {
      navigate(nextPath, { state: navState });
    }
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
            <Content appearing={appearing} slidingOut={slidingOut}>
              <BigTitle>Create account</BigTitle>
              <Card>
                <form onSubmit={handleSubmit} noValidate>
                  <FloatField>
                    <input
                      type="text"
                      placeholder="Full name"
                      value={fullName}
                      onChange={(e)=>setFullName(e.target.value)}
                      required
                    />
                    <span>Full name</span>
                  </FloatField>

                  <div style={{height:14}} />
                  <FloatField>
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e)=>setEmail(e.target.value)}
                      required
                    />
                    <span>Email address</span>
                  </FloatField>

                  <div style={{height:14}} />
                  <FloatField>
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e)=>setPassword(e.target.value)}
                      required
                    />
                    <span>Password</span>
                  </FloatField>

                  <Row style={{marginTop:18}}>
                    <span style={{fontSize:12, color:"#777"}}>
                      By creating an account you agree to our terms.
                    </span>
                  </Row>

                  <Btn primary type="submit" disabled={!canSubmit}>Sign up</Btn>
                  <Sep><span>or</span></Sep>
                  <Btn type="button">
                    <div style={{display:"flex", alignItems:"center", justifyContent:"center", gap:10}}>
                      <GoogleLogo /> <span>Log in with Google</span>
                    </div>
                  </Btn>

                  <Small>
                    Already have an account?{" "}
                    <LinkBtn onClick={handleBackToLogin}>Log in</LinkBtn>
                  </Small>
                </form>
              </Card>
            </Content>
          </ContentWrap>
        </LeftCol>
      </Section>
    </>
  );
};

export default RegisterPage;
