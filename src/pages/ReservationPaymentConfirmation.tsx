import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { 
  CheckCircle, 
  Error,
  Refresh
} from '@mui/icons-material';
import heroBg from '../assets/images/login.avif';
import './ReservationPaymentConfirmation.css';

const ReservationPaymentConfirmation: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reservationId = searchParams.get('reservation');
  
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!reservationId) {
      navigate('/rooms');
      return;
    }
    
    // Simulate payment confirmation process
    confirmPayment();
  }, [reservationId, navigate]);

  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (status === 'success' && countdown === 0) {
      navigate(`/reservation/bill?reservation=${reservationId}`);
    }
  }, [status, countdown, navigate, reservationId]);

  const confirmPayment = async () => {
    try {
      setError(null);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock payment confirmation
      const paymentData = {
        paymentMethod: 'bank_transfer',
        transactionId: `TXN_${Date.now()}`,
        status: 'completed',
        confirmedAt: new Date().toISOString()
      };
      
      // In real app, call: await reservationApi.confirmPayment(reservationId, paymentData);
      console.log('Payment confirmed:', paymentData);
      
      setStatus('success');
    } catch (e: any) {
      setError(e?.message || 'Xác nhận thanh toán thất bại');
      setStatus('error');
    }
  };

  const handleRetry = () => {
    setStatus('processing');
    setError(null);
    confirmPayment();
  };

  const handleGoToBill = () => {
    navigate(`/reservation/bill?reservation=${reservationId}`);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  if (status === 'processing') {
    return (
      <div className="payment-confirmation-page">
        <div className="confirmation-container">
          <div className="processing-section">
            <div className="spinner-container">
              <Spinner animation="border" variant="primary" />
            </div>
            <h2 className="processing-title">Đang xác nhận thanh toán...</h2>
            <p className="processing-description">
              Vui lòng chờ trong giây lát. Chúng tôi đang xử lý giao dịch của bạn.
            </p>
            <div className="processing-steps">
              <div className="step active">
                <div className="step-icon">
                  <CheckCircle />
                </div>
                <div className="step-text">Đã nhận thông tin thanh toán</div>
              </div>
              <div className="step active">
                <div className="step-icon">
                  <Spinner animation="border" size="sm" />
                </div>
                <div className="step-text">Đang xác minh giao dịch</div>
              </div>
              <div className="step">
                <div className="step-icon">
                  <CheckCircle />
                </div>
                <div className="step-text">Hoàn tất xác nhận</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="payment-confirmation-page">
        <div className="confirmation-container">
          <div className="error-section">
            <div className="error-icon">
              <Error />
            </div>
            <h2 className="error-title">Xác nhận thanh toán thất bại</h2>
            <p className="error-description">
              {error || 'Đã xảy ra lỗi trong quá trình xác nhận thanh toán. Vui lòng thử lại.'}
            </p>
            <div className="error-actions">
              <button className="btn-retry" onClick={handleRetry}>
                <Refresh className="me-2" />
                Thử lại
              </button>
              <button className="btn-back" onClick={() => navigate('/rooms')}>
                Quay lại chọn phòng
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-confirmation-page">
      <div className="confirmation-container">
        <div className="success-section">
          <div className="success-icon">
            <CheckCircle />
          </div>
          <h2 className="success-title">Thanh toán thành công!</h2>
          <p className="success-description">
            Giao dịch của bạn đã được xác nhận thành công. Chúng tôi sẽ chuyển hướng bạn đến trang hóa đơn trong {countdown} giây.
          </p>
          <div className="success-details">
            <div className="detail-item">
              <span className="detail-label">Mã đặt phòng:</span>
              <span className="detail-value">{reservationId}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Thời gian xác nhận:</span>
              <span className="detail-value">{new Date().toLocaleString('vi-VN')}</span>
            </div>
          </div>
          <div className="success-actions">
            <button className="btn-bill" onClick={handleGoToBill}>
              <CheckCircle className="me-2" />
              Xem hóa đơn ngay
            </button>
            <button className="btn-back" onClick={handleBackToHome} style={{ marginLeft: '10px' }}>
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationPaymentConfirmation;
