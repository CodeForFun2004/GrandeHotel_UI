import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

// Tạo 1 action đơn giản trong authSlice: authLoginSuccess(payload)
import { authLoginSuccess } from '../redux/slices/authSlice';
import { RoleBasedRedirect } from '../routes/RoleBasedRoute';

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

        console.log('🔍 Google OAuth Callback Data:', { accessToken, refreshToken, user });

        // Đảm bảo user có role, nếu không có thì set default là customer
        const userWithRole = {
          ...user,
          role: user.role || 'customer' // Fallback to customer if role is missing
        };

        console.log('🔍 User with role:', userWithRole);

        // Lưu tạm vào localStorage để tái sử dụng chung với flow hiện tại
        // (Bạn đã có /refresh và logout dựa vào token body → vẫn chạy ok)
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // Đưa user vào Redux để HomePage hiển thị ngay
        // Backend phải đảm bảo user.role = "customer" cho Google OAuth
        dispatch(authLoginSuccess({ user: userWithRole, accessToken, refreshToken }));
        
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

  // Google login sử dụng RoleBasedRedirect để redirect theo role
  return <RoleBasedRedirect />;
}
