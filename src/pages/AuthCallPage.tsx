import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Navigate } from 'react-router-dom';

// Tạo 1 action đơn giản trong authSlice: authLoginSuccess(payload)
import { authLoginSuccess } from '../redux/slices/authSlice';

export default function AuthCallback() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    try {
      const hash = window.location.hash; // #data=...
      const params = new URLSearchParams(hash.slice(1));
      const raw = params.get('data');

      if (raw) {
        const { accessToken, refreshToken, user } = JSON.parse(decodeURIComponent(raw));

        // Lưu tạm vào localStorage để tái sử dụng chung với flow hiện tại
        // (Bạn đã có /refresh và logout dựa vào token body → vẫn chạy ok)
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // Đưa user vào Redux để HomePage hiển thị ngay
        dispatch(authLoginSuccess({ user, accessToken, refreshToken }));
        
        setIsProcessing(false);
      } else {
        setHasError(true);
        setIsProcessing(false);
      }
    } catch (e) {
      console.error('Parse OAuth payload failed', e);
      setHasError(true);
      setIsProcessing(false);
    }
  }, [dispatch, navigate]);

  if (hasError) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <h2>Đăng nhập thất bại</h2>
        <p>Đã xảy ra lỗi khi đăng nhập bằng Google. Vui lòng thử lại.</p>
        <button onClick={() => navigate('/auth/login')}>
          Quay lại trang đăng nhập
        </button>
      </div>
    );
  }

  if (isProcessing) {
    return <div style={{ padding: 24 }}>Đang đăng nhập bằng Google...</div>;
  }

  // Google login luôn redirect về trang chủ
  return <Navigate to="/" replace />;
}
