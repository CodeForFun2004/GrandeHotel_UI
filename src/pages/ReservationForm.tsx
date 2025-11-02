import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { 
  Hotel, 
  People,
  CreditCard,
  CheckCircle
} from '@mui/icons-material';
import * as reservationApi from '../api/reservation';
import * as hotelApi from '../api/hotel';
import heroBg from '../assets/images/login.avif';
import './ReservationForm.css';

interface RoomSelection {
  roomTypeId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  adults: number;
  children: number;
  infants: number;
}

interface ReservationFormData {
  hotelId: string;
  checkInDate: string;
  checkOutDate: string;
  selected: RoomSelection[];
  total: number;
  nights: number;
  queryString: string;
}

const ReservationForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reservationId = searchParams.get('reservation');
  
  const [draft, setDraft] = useState<ReservationFormData | null>(null);
  const [hotelName, setHotelName] = useState<string>('—');
  const [paymentType, setPaymentType] = useState<'full' | 'deposit'>('full');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('reservationDraft');
      if (!raw) {
        navigate('/rooms');
        return;
      }
      const parsed = JSON.parse(raw);
      setDraft(parsed);
    } catch (e: any) {
      setError('Không thể đọc dữ liệu đặt phòng');
    }
  }, [navigate]);

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

  const totalAmount = draft?.total ?? 0;
  const depositAmount = Math.round(totalAmount * 0.5);
  const finalAmount = paymentType === 'full' ? totalAmount : depositAmount;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || !reservationId) return;

    setLoading(true);
    setError(null);

    try {
      // Call selectPaymentOption API to get payment info and QR code
      const response = await reservationApi.selectPaymentOption(reservationId, paymentType);
      
      // Store payment info in sessionStorage to pass to QR payment page
      sessionStorage.setItem('paymentInfo', JSON.stringify(response.paymentInfo));
      sessionStorage.removeItem('reservationDraft');
      
      // Navigate to QR payment page
      navigate(`/reservation/qr-payment?reservation=${reservationId}&type=${paymentType}`);
    } catch (e: any) {
      setError(e?.message || 'Chọn phương thức thanh toán thất bại');
    } finally {
      setLoading(false);
    }
  };

  const onBack = () => {
    navigate(`/reservation/pending?reservation=${reservationId}`);
  };

  if (!draft) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <h3>Không có dữ liệu đặt phòng</h3>
        <Button variant="secondary" onClick={() => navigate('/rooms')}>
          Quay lại chọn phòng
        </Button>
      </div>
    );
  }

  return (
    <div className="reservation-form-page">
      <div className="hero-wrap" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="overlay"></div>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="reservation-form-header">
                <h1>Xác nhận đặt phòng</h1>
                <p>Vui lòng chọn phương thức thanh toán và xác nhận thông tin</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="reservation-form-section">
        <Container>
          <Row className="justify-content-center">
            <Col lg={10}>
              <Card className="reservation-form-card">
                <Card.Body className="p-4">
                  {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
                  
                  <Form onSubmit={handleSubmit}>
                    {/* Hotel Information */}
                    <div className="reservation-info-section mb-4">
                      <h4 className="section-title">
                        <Hotel className="me-2" />
                        Thông tin khách sạn
                      </h4>
                      <div className="info-item">
                        <span className="label">Khách sạn:</span>
                        <span className="value">{hotelName}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Ngày nhận phòng:</span>
                        <span className="value">{formatDate(draft.checkInDate)}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Ngày trả phòng:</span>
                        <span className="value">{formatDate(draft.checkOutDate)}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Số đêm:</span>
                        <span className="value">{draft.nights} đêm</span>
                      </div>
                    </div>

                    {/* Room Details */}
                    <div className="reservation-info-section mb-4">
                      <h4 className="section-title">
                        <People className="me-2" />
                        Chi tiết phòng
                      </h4>
                      {draft.selected.map((room) => (
                        <div key={room.roomTypeId} className="room-detail-item">
                          <div className="room-info">
                            <div className="room-name">{room.name} x{room.quantity}</div>
                            <div className="room-guests">
                              {room.adults} người lớn, {room.children} trẻ em, {room.infants} em bé
                            </div>
                          </div>
                          <div className="room-price">
                            {(room.unitPrice * room.quantity * draft.nights).toLocaleString()} VNĐ
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Payment Options */}
                    <div className="reservation-info-section mb-4">
                      <h4 className="section-title">
                        <CreditCard className="me-2" />
                        Phương thức thanh toán
                      </h4>
                      <div className="payment-options">
                        <Form.Check
                          type="radio"
                          id="full-payment"
                          name="paymentType"
                          value="full"
                          checked={paymentType === 'full'}
                          onChange={(e) => setPaymentType(e.target.value as 'full')}
                          label={
                            <div className="payment-option">
                              <div className="payment-title">Thanh toán toàn bộ</div>
                              <div className="payment-amount">{totalAmount.toLocaleString()} VNĐ</div>
                            </div>
                          }
                        />
                        <Form.Check
                          type="radio"
                          id="deposit-payment"
                          name="paymentType"
                          value="deposit"
                          checked={paymentType === 'deposit'}
                          onChange={(e) => setPaymentType(e.target.value as 'deposit')}
                          label={
                            <div className="payment-option">
                              <div className="payment-title">Thanh toán cọc 50%</div>
                              <div className="payment-amount">{depositAmount.toLocaleString()} VNĐ</div>
                              <div className="payment-note">Số tiền còn lại: {(totalAmount - depositAmount).toLocaleString()} VNĐ</div>
                            </div>
                          }
                        />
                      </div>
                    </div>

                    {/* Total Amount */}
                    <div className="total-section mb-4">
                      <div className="total-line">
                        <span className="total-label">Tổng cộng:</span>
                        <span className="total-amount">{finalAmount.toLocaleString()} VNĐ</span>
                      </div>
                      {paymentType === 'deposit' && (
                        <div className="total-note">
                          * Số tiền còn lại sẽ được thanh toán khi nhận phòng
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="form-actions">
                      <Button 
                        variant="outline-secondary" 
                        onClick={onBack}
                        className="me-3"
                      >
                        Quay lại
                      </Button>
                      <Button 
                        type="submit" 
                        variant="primary" 
                        disabled={loading}
                        className="btn-confirm"
                      >
                        {loading ? 'Đang xử lý...' : 'Tiếp tục thanh toán'}
                        {!loading && <CheckCircle className="ms-2" />}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default ReservationForm;
