import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

// Tạo 1 action đơn giản trong authSlice: authLoginSuccess(payload)
import { authLoginSuccess } from '../redux/slices/authSlice';

export default function AuthCallback() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
      }
    } catch (e) {
      console.error('Parse OAuth payload failed', e);
    } finally {
      navigate('/', { replace: true });
    }
  }, [dispatch, navigate]);

  return <div style={{ padding: 24 }}>Đang đăng nhập bằng Google...</div>;
}
