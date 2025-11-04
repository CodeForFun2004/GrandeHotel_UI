import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Room.css';
import * as reservationApi from '../api/reservation';
import * as hotelApi from '../api/hotel';
import heroBg from '../assets/images/login.avif';

const ReservationReview: React.FC = () => {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hotelName, setHotelName] = useState<string>('—');
  const [customerName, setCustomerName] = useState<string>('Khách lẻ');

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('reservationDraft');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      setDraft(parsed);
      // Attempt to infer customer name from localStorage or a common key (optional)
      try {
        const rawUser = localStorage.getItem('user');
        if (rawUser) {
          const user = JSON.parse(rawUser);
          // Prefer username for display
          if (user?.username) setCustomerName(user.username);
          else if (user?.fullname) setCustomerName(user.fullname);
          else if (user?.fullName) setCustomerName(user.fullName);
          else if (user?.name) setCustomerName(user.name);
          else if (user?.email) setCustomerName(user.email);
        }
      } catch { /* ignore */ }
    } catch (e: any) {
      setError('Không thể đọc dữ liệu tạm');
    }
  }, []);

  useEffect(() => {
    const fetchHotel = async () => {
      if (!draft?.hotelId) return;
      try {
        const hotel = await hotelApi.getHotelById(draft.hotelId);
        setHotelName(hotel?.name || '—');
      } catch {
        setHotelName('—');
      }
    };
    fetchHotel();
  }, [draft?.hotelId]);

  const total = useMemo(() => draft?.total ?? 0, [draft]);

  const formatDateOnly = (s?: string) => {
    if (!s) return '—';
    const tIdx = s.indexOf('T');
    if (tIdx > 0) return s.slice(0, tIdx);
    // fallback: try locale then fallback to raw
    try {
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
    } catch {}
    return s;
  };

  const onBack = () => {
    // Go back to rooms page with the same query string to edit
    const qs = draft?.queryString || '';
    navigate(`/rooms${qs}`);
  };

  const onConfirm = async () => {
    if (!draft) return;
    setLoading(true); 
    setError(null);
    
    try {
      // Kiểm tra token trước khi gọi API
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        console.error('❌ No access token found');
        return;
      }

      // Get customerId from localStorage - đảm bảo đọc đúng key
      // Cũng thử decode token để lấy user ID từ token (backend có thể check token thay vì payload)
      let customerId = 'guest';
      try {
        const rawUser = localStorage.getItem('user');
        if (rawUser) {
          const user = JSON.parse(rawUser);
          // Ưu tiên _id (MongoDB), sau đó id (có thể từ transform)
          customerId = user?._id || user?.id || 'guest';
          console.log('✅ Customer ID:', customerId, 'from user:', { _id: user?._id, id: user?.id });
        } else {
          console.warn('⚠️ No user found in localStorage');
        }
        
        // Thử decode token để lấy user ID từ token
        if (accessToken) {
          try {
            const tokenParts = accessToken.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              const tokenUserId = payload.id || payload.userId || payload._id;
              console.log('🔑 User ID from token:', tokenUserId);
              
              // Nếu token có user ID và khác với customerId, có thể đây là vấn đề
              if (tokenUserId && customerId !== 'guest' && tokenUserId !== customerId) {
                console.warn('⚠️ Token user ID does not match customerId:', {
                  tokenUserId,
                  customerId
                });
                // Có thể backend yêu cầu customerId phải match với token user ID
                // Thử dùng token user ID thay vì customerId từ localStorage
                customerId = tokenUserId;
                console.log('🔄 Using token user ID as customerId:', customerId);
              }
            }
          } catch (tokenErr) {
            console.warn('⚠️ Could not decode token:', tokenErr);
          }
        }
      } catch (err) {
        console.error('❌ Failed to get user from localStorage:', err);
        setError('Không thể lấy thông tin người dùng. Vui lòng đăng nhập lại.');
        return;
      }

      if (customerId === 'guest') {
        console.warn('⚠️ Using guest customerId');
        setError('Bạn cần đăng nhập để đặt phòng.');
        return;
      }

      const payload = {
        hotelId: draft.hotelId,
        customerId: customerId,
        checkInDate: draft.checkInDate,
        checkOutDate: draft.checkOutDate,
        numberOfGuests: (draft.selected || []).reduce((acc: number, s: any) => acc + s.adults + s.children + s.infants, 0),
        rooms: (draft.selected || []).map((s: any) => ({ 
          roomTypeId: s.roomTypeId, 
          quantity: s.quantity, 
          adults: s.adults, 
          children: s.children, 
          infants: s.infants 
        })),
      };

      // Kiểm tra xem customerId có match với token id không
      if (accessToken) {
        try {
          const tokenParts = accessToken.split('.');
          if (tokenParts.length === 3) {
            const tokenPayload = JSON.parse(atob(tokenParts[1]));
            console.log('🔍 Verifying customerId before request:', {
              customerIdInPayload: customerId,
              userIdInToken: tokenPayload.id,
              roleInToken: tokenPayload.role,
              match: customerId === tokenPayload.id
            });
            
            if (customerId !== tokenPayload.id) {
              console.warn('⚠️ WARNING: customerId does not match token id! Using token id instead.');
              // Sửa customerId trong request payload để match với token id
              payload.customerId = tokenPayload.id;
              console.log('🔄 Updated customerId to:', payload.customerId);
            }
          }
        } catch {}
      }
      
      // Log payload và so sánh với token
      console.log('📤 Creating reservation with payload:', { ...payload, rooms: payload.rooms.length });
      
      const res = await reservationApi.createReservation(payload);
      
      console.log('✅ Reservation created:', res?.reservation?._id || res?.reservation?.id);
      
      // Keep draft in sessionStorage for pending page
      sessionStorage.setItem('reservationDraft', JSON.stringify(draft));
      
      // Navigate to pending page to wait for approval
      const reservationId = res?.reservation?._id || res?.reservation?.id || '';
      navigate(`/reservation/pending?reservation=${reservationId}`);
    } catch (e: any) {
      console.error('❌ Reservation creation error:', e);
      const errorMessage = e?.response?.data?.message || e?.message || 'Xác nhận đặt phòng thất bại';
      
      // Kiểm tra xem có phải lỗi do thiếu role trong token không
      if (e?.response?.status === 401) {
        console.error('❌ 401 Unauthorized - Checking token...');
        
        // Kiểm tra token có role không
        const currentToken = localStorage.getItem('accessToken');
        if (currentToken) {
          try {
            const tokenParts = currentToken.split('.');
            if (tokenParts.length === 3) {
              const payload = JSON.parse(atob(tokenParts[1]));
              if (!payload.role) {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                  const user = JSON.parse(userStr);
                  if (user.role) {
                    setError(`Xác thực thất bại: Token không chứa thông tin quyền (role). Vui lòng đăng xuất và đăng nhập lại. (Role hiện tại: ${user.role})`);
                    console.error('❌ Token thiếu role field. User có role:', user.role);
                    console.error('❌ Backend refresh token endpoint cần được sửa để include role trong token');
                    setLoading(false);
                    return;
                  }
                }
              }
            }
          } catch {}
        }
        
        // Nếu không phải lỗi role, hiển thị error message thông thường
        setError(errorMessage || 'Xác thực thất bại. Vui lòng đăng nhập lại.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!draft) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <h3>Không có dữ liệu đặt phòng</h3>
        <button className="small-btn" onClick={() => navigate('/rooms')}>Quay lại chọn phòng</button>
      </div>
    );
  }

  return (
    <>
      <div className="hero-wrap" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="overlay" />
        <div className="container"><div className="text-center"><h1 className="mb-4 bread">Xác nhận đặt phòng</h1></div></div>
      </div>

      <section className="rooms-section review-wrapper">
      <div className="review-card">
        <h2 className="review-title">Đặt phòng</h2>
        <p className="review-subtitle">Vui lòng kiểm tra kỹ thông tin trước khi xác nhận</p>

        <div className="review-row">
          <span className="label">Khách hàng:</span>
          <span className="value">{customerName}</span>
        </div>

        <div className="review-row two-col">
          <div>
            <span className="label">Ngày check-in:</span>
            <span className="value">{formatDateOnly(draft.checkInDate)}</span>
          </div>
          <div>
            <span className="label">Ngày check-out:</span>
            <span className="value">{formatDateOnly(draft.checkOutDate)}</span>
          </div>
        </div>

        <div className="review-row">
          <span className="label">Khách sạn:</span>
          <span className="value">{hotelName}</span>
        </div>

        <div className="review-row">
          <span className="label">Phòng:</span>
        </div>
        <div className="room-list-indent">
          {(draft.selected || []).map((s: any) => (
            <div className="review-room-item" key={s.roomTypeId}>
              <div className="room-line">
                <span className="name">{s.name} x{s.quantity}</span>
                <span className="dots" />
                <span className="price">{(s.unitPrice * s.quantity * draft.nights).toLocaleString()} VNĐ</span>
              </div>
              <div className="review-room-guests">Số khách: {s.adults} NL, {s.children} TE, {s.infants} EB</div>
            </div>
          ))}
        </div>

        <hr />
        <div className="review-total">Tổng cộng: {total.toLocaleString()} VNĐ</div>
        {error && <div className="text-danger review-error">{error}</div>}
        <div className="review-actions">
          <button className="small-btn grey" onClick={onBack}>Quay lại</button>
          <button className="small-btn" disabled={loading} onClick={onConfirm}>{loading ? 'Đang xác nhận...' : 'Xác nhận & Thanh toán'}</button>
        </div>
      </div>
    </section>
    </>
  );
};

export default ReservationReview;
