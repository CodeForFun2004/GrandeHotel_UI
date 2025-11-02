import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { 
  QrCode, 
  AccountBalance,
  CheckCircle,
  ArrowBack,
  Refresh
} from '@mui/icons-material';
import * as reservationApi from '../api/reservation';
import * as hotelApi from '../api/hotel';
import heroBg from '../assets/images/login.avif';
import './ReservationQRPayment.css';

interface Reservation {
  _id: string;
  hotelId: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  rooms: Array<{
    roomTypeId: string;
    quantity: number;
    adults: number;
    children: number;
    infants: number;
  }>;
  status: string;
  totalAmount: number;
  paymentType: 'full' | 'deposit';
  createdAt: string;
}

interface PaymentInfo {
  paymentType: 'full' | 'deposit';
  requiredAmount: number;
  vietQRLink: string;
  reservationTotal: number;
  depositAmount: number;
  paidAmount: number;
  remainingAmount: number;
}

const ReservationQRPayment: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reservationId = searchParams.get('reservation');
  const paymentType = searchParams.get('type') as 'full' | 'deposit';
  
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [hotelName, setHotelName] = useState<string>('—');
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const fetchPaymentInfoRef = async () => {
    if (!reservationId || !paymentType) return;
    
    try {
      setError(null);
      console.log('[QR_PAYMENT] Calling selectPaymentOption API...');
      const response = await reservationApi.selectPaymentOption(reservationId, paymentType);
      console.log('[QR_PAYMENT] Got payment info:', response);
      
      if (response?.paymentInfo) {
        setPaymentInfo(response.paymentInfo);
        // Store in sessionStorage for future use
        sessionStorage.setItem('paymentInfo', JSON.stringify(response.paymentInfo));
      }
    } catch (e: any) {
      console.error('[QR_PAYMENT] Failed to fetch payment info:', e);
      setError(e?.message || 'Không thể tải thông tin thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const fetchReservationRef = async () => {
    if (!reservationId) return;
    
    try {
      const res = await reservationApi.getReservationById(reservationId);
      setReservation(res.reservation);
      
      // Fetch hotel name
      const hotelId = res.reservation?.hotel?._id || res.reservation?.hotel || res.reservation?.hotelId;
      if (hotelId) {
        try {
          const hotel = await hotelApi.getHotelById(hotelId);
          setHotelName(hotel?.name || '—');
        } catch {
          setHotelName('—');
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Không thể tải thông tin đặt phòng');
    }
  };

  useEffect(() => {
    if (!reservationId || !paymentType) {
      navigate('/rooms');
      return;
    }
    
    // Load payment info from sessionStorage
    const storedPaymentInfo = sessionStorage.getItem('paymentInfo');
    if (storedPaymentInfo) {
      try {
        const parsed = JSON.parse(storedPaymentInfo);
        setPaymentInfo(parsed);
        setLoading(false);
        console.log('[QR_PAYMENT] Loaded payment info from sessionStorage:', parsed);
      } catch (e) {
        console.error('[QR_PAYMENT] Failed to parse payment info:', e);
      }
    } else {
      // If no payment info in sessionStorage, fetch it from API
      console.log('[QR_PAYMENT] No payment info in sessionStorage, fetching from API...');
      fetchPaymentInfoRef();
    }
    
    fetchReservationRef();
    
    // Setup polling to check payment status every 5 seconds
    const intervalId = setInterval(() => {
      handlePaymentCheck();
    }, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationId, paymentType, navigate]);


  const fetchPaymentInfo = async () => {
    if (!reservationId || !paymentType) return;
    
    try {
      setError(null);
      console.log('[QR_PAYMENT] Manually fetching payment info...');
      const response = await reservationApi.selectPaymentOption(reservationId, paymentType);
      console.log('[QR_PAYMENT] Got payment info:', response);
      
      if (response?.paymentInfo) {
        setPaymentInfo(response.paymentInfo);
        sessionStorage.setItem('paymentInfo', JSON.stringify(response.paymentInfo));
      }
    } catch (e: any) {
      console.error('[QR_PAYMENT] Failed to fetch payment info:', e);
      setError(e?.message || 'Không thể tải thông tin thanh toán');
    }
  };

  const handlePaymentCheck = async () => {
    if (!reservationId) return;
    
    try {
      // Call handlePayment API to check payment status via AppScript
      const res = await reservationApi.handlePayment(reservationId);
      
      // Check if payment is confirmed
      const paymentStatus = res?.reservation?.payment?.paymentStatus;
      
      console.log('[QR_PAYMENT] Payment check result:', {
        paymentStatus,
        message: res?.message
      });
      
      // If payment is completed (fully_paid or deposit_paid), navigate to confirmation page
      if (paymentStatus === 'fully_paid' || paymentStatus === 'deposit_paid') {
        // Clear interval and navigate
        navigate(`/reservation/payment-confirmation?reservation=${reservationId}`);
      }
    } catch (e: any) {
      // Silently fail for polling errors (payment not found yet is expected)
      console.log('[QR_PAYMENT] Payment not confirmed yet:', e?.message);
    }
  };

  const handleManualCheck = async () => {
    if (!reservationId) return;
    
    setConfirming(true);
    setError(null);
    
    try {
      // Manually trigger payment check via handlePayment API
      const res = await reservationApi.handlePayment(reservationId);
      
      const paymentStatus = res?.reservation?.payment?.paymentStatus;
      
      // If payment is confirmed, navigate to confirmation page
      if (paymentStatus === 'fully_paid' || paymentStatus === 'deposit_paid') {
        navigate(`/reservation/payment-confirmation?reservation=${reservationId}`);
      } else {
        // Payment not found yet
        setError('Chưa tìm thấy giao dịch thanh toán. Vui lòng đảm bảo bạn đã chuyển khoản với nội dung chính xác.');
      }
    } catch (e: any) {
      setError(e?.message || 'Không tìm thấy giao dịch thanh toán. Vui lòng kiểm tra lại.');
    } finally {
      setConfirming(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBack = () => {
    navigate(`/reservation/form?reservation=${reservationId}`);
  };

  const handleRefresh = () => {
    setError(null);
    fetchPaymentInfo();
  };

  if (loading) {
    return (
      <div className="qr-payment-page">
        <div className="loading-container">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Đang tải QR code thanh toán...</p>
        </div>
      </div>
    );
  }

  if (!reservation || !paymentInfo) {
    return (
      <div className="qr-payment-page">
        <Container>
          <Row className="justify-content-center">
            <Col lg={8}>
              <Card className="error-card">
                <Card.Body className="text-center p-5">
                  {loading ? (
                    <>
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-3">Đang tải thông tin thanh toán...</p>
                    </>
                  ) : (
                    <>
                      <Alert variant="danger" className="mb-4">
                        {error || 'Không thể tải thông tin thanh toán'}
                      </Alert>
                      <Button variant="primary" onClick={handleRefresh} className="me-3">
                        <Refresh className="me-2" />
                        Thử lại
                      </Button>
                      <Button variant="outline-primary" onClick={() => navigate('/rooms')}>
                        Quay lại chọn phòng
                      </Button>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  const amount = paymentInfo.requiredAmount;

  return (
    <div className="qr-payment-page">
      <div className="hero-wrap" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="overlay"></div>
        <Container>
          <Row className="justify-content-center">
            <Col lg={10}>
              <div className="qr-header">
                <h1>Thanh toán qua QR Code</h1>
                <p>Mã đặt phòng: <strong>{reservationId}</strong></p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <section className="qr-section">
        <Container>
          <Row className="justify-content-center">
            <Col lg={10}>
              <Row>
                {/* QR Code Section */}
                <Col lg={6}>
                  <Card className="qr-card">
                    <Card.Body className="p-4">
                      <h4 className="qr-title">
                        <QrCode className="me-2" />
                        Quét mã QR để thanh toán
                      </h4>
                      
                      <div className="qr-container">
                        <div className="qr-code-wrapper">
                          <img 
                            src={paymentInfo.vietQRLink} 
                            alt="VietQR Payment" 
                            style={{ width: '300px', height: '300px', objectFit: 'contain' }}
                          />
                        </div>
                        <p className="qr-instruction">
                          Mở ứng dụng ngân hàng và quét mã QR này để thanh toán
                        </p>
                      </div>

                      <div className="payment-info">
                        <div className="info-item">
                          <span className="info-label">Số tiền:</span>
                          <span className="info-value">{amount.toLocaleString()} VNĐ</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Mã đơn:</span>
                          <span className="info-value">{reservationId?.slice(-6).toUpperCase()}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Loại thanh toán:</span>
                          <span className="info-value">
                            {paymentInfo.paymentType === 'full' ? 'Thanh toán toàn bộ' : 'Thanh toán cọc 50%'}
                          </span>
                        </div>
                      </div>

                      <div className="qr-actions">
                        <Button 
                          variant="outline-secondary" 
                          onClick={handleRefresh}
                          className="me-3"
                        >
                          <Refresh className="me-2" />
                          Làm mới QR
                        </Button>
                        <Button 
                          variant="primary" 
                          onClick={handleManualCheck}
                          disabled={confirming}
                          className="btn-confirm"
                        >
                          {confirming ? (
                            <>
                              <Spinner size="sm" className="me-2" />
                              Đang kiểm tra...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="me-2" />
                              Tôi đã thanh toán
                            </>
                          )}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>

                {/* Payment Details Section */}
                <Col lg={6}>
                  <Card className="details-card">
                    <Card.Body className="p-4">
                      <h4 className="details-title">
                        <AccountBalance className="me-2" />
                        Thông tin thanh toán
                      </h4>
                      
                      <div className="bank-info">
                        <div className="bank-item">
                          <span className="bank-label">Số tiền thanh toán:</span>
                          <span className="bank-value amount">{amount.toLocaleString()} VNĐ</span>
                        </div>
                        <div className="bank-item">
                          <span className="bank-label">Tổng giá trị đơn:</span>
                          <span className="bank-value">{paymentInfo.reservationTotal.toLocaleString()} VNĐ</span>
                        </div>
                        {paymentInfo.paymentType === 'deposit' && (
                          <div className="bank-item">
                            <span className="bank-label">Số tiền còn lại:</span>
                            <span className="bank-value">{paymentInfo.remainingAmount.toLocaleString()} VNĐ</span>
                          </div>
                        )}
                        <div className="bank-item">
                          <span className="bank-label">Nội dung chuyển khoản:</span>
                          <span className="bank-value content">{reservationId?.slice(-6).toUpperCase()}</span>
                        </div>
                      </div>

                      <div className="reservation-summary">
                        <h5 className="summary-title">Tóm tắt đặt phòng</h5>
                        <div className="summary-item">
                          <span className="summary-label">Khách sạn:</span>
                          <span className="summary-value">{hotelName}</span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">Ngày nhận phòng:</span>
                          <span className="summary-value">{formatDate(reservation.checkInDate)}</span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">Ngày trả phòng:</span>
                          <span className="summary-value">{formatDate(reservation.checkOutDate)}</span>
                        </div>
                        <div className="summary-item">
                          <span className="summary-label">Phương thức:</span>
                          <span className="summary-value">
                            {paymentType === 'full' ? 'Thanh toán toàn bộ' : 'Thanh toán cọc 50%'}
                          </span>
                        </div>
                      </div>

                      <div className="payment-instructions">
                        <h6>Hướng dẫn thanh toán:</h6>
                        <ol>
                          <li>Mở ứng dụng ngân hàng trên điện thoại</li>
                          <li>Chọn chức năng "Quét mã QR"</li>
                          <li>Quét mã QR ở bên trái</li>
                          <li>Kiểm tra thông tin và xác nhận thanh toán</li>
                          <li>Nhấn "Tôi đã thanh toán" sau khi hoàn tất</li>
                        </ol>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Action Buttons */}
              <div className="action-buttons">
                <Button 
                  variant="outline-secondary" 
                  onClick={handleBack}
                  className="me-3"
                >
                  <ArrowBack className="me-2" />
                  Quay lại
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Error Alert */}
      {error && (
        <Container className="mt-3">
          <Row className="justify-content-center">
            <Col lg={10}>
              <Alert variant="warning" onClose={() => setError(null)} dismissible>
                {error}
              </Alert>
            </Col>
          </Row>
        </Container>
      )}
    </div>
  );
};

export default ReservationQRPayment;
