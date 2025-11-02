import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import { AccessTime, Hotel, CheckCircle, Refresh } from "@mui/icons-material";
import * as reservationApi from "../api/reservation";
import * as hotelApi from "../api/hotel";
import heroBg from "../assets/images/login.avif";
import "./ReservationPending.css";

interface Reservation {
  _id: string;
  hotelId: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  rooms?: Array<{
    roomTypeId: string;
    quantity: number;
    adults: number;
    children: number;
    infants: number;
  }>;
  status: "pending" | "approved" | "rejected" | "cancelled";
  totalAmount?: number;
  paymentType: "full" | "deposit";
  createdAt: string;
}

const ReservationPending: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reservationId = searchParams.get("reservation");

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [hotelName, setHotelName] = useState<string>("—");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [draft, setDraft] = useState<any | null>(null);
  const [customerName, setCustomerName] = useState<string>("Khách lẻ");

  useEffect(() => {
    if (!reservationId) {
      navigate("/rooms");
      return;
    }
    
    // Load draft data from sessionStorage
    try {
      const raw = sessionStorage.getItem('reservationDraft');
      if (raw) {
        const parsed = JSON.parse(raw);
        setDraft(parsed);
      }
    } catch (e) {
      console.error('Failed to load draft:', e);
    }
    
    // Get customer name
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        const user = JSON.parse(rawUser);
        if (user?.username) setCustomerName(user.username);
        else if (user?.fullname) setCustomerName(user.fullname);
        else if (user?.fullName) setCustomerName(user.fullName);
        else if (user?.name) setCustomerName(user.name);
        else if (user?.email) setCustomerName(user.email);
      }
    } catch { /* ignore */ }
    
    fetchReservation();
    
    // Setup polling every 5 seconds
    const intervalId = setInterval(() => {
      fetchReservation();
    }, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [reservationId, navigate]);

  const fetchReservation = async () => {
    if (!reservationId) return;

    try {
      setError(null);
      const res = await reservationApi.getReservationById(reservationId);
      const data = res?.reservation ?? res?.data ?? res;
      const currentStatus = data?.status ?? "pending";
      
      console.log('[PENDING] Fetched reservation:', {
        reservationId,
        status: currentStatus,
        hotelId: data?.hotel || data?.hotelId,
        fullData: data
      });
      
      setReservation({
        ...data,
        rooms: Array.isArray(data?.rooms) ? data.rooms : [],
        totalAmount:
          typeof data?.totalAmount === "number"
            ? data.totalAmount
            : Number(data?.totalAmount) || 0,
        numberOfGuests:
          typeof data?.numberOfGuests === "number"
            ? data.numberOfGuests
            : Number(data?.numberOfGuests) || 0,
        status: currentStatus,
      });

      // Fetch hotel name - check both hotel and hotelId fields
      const hotelId = data?.hotel?._id || data?.hotel || data?.hotelId;
      console.log('[PENDING] Hotel ID:', hotelId);
      
      if (hotelId) {
        try {
          const hotel = await hotelApi.getHotelById(hotelId);
          console.log('[PENDING] Fetched hotel:', hotel);
          setHotelName(hotel?.name || "—");
        } catch (err) {
          console.error('[PENDING] Failed to fetch hotel:', err);
          setHotelName("—");
        }
      }

      // Auto-navigate when status changes to approved
      if (currentStatus === "approved") {
        console.log('[PENDING] Status is approved, navigating to form page...');
        navigate(`/reservation/form?reservation=${reservationId}`);
      }
    } catch (e: any) {
      console.error('[PENDING] Failed to fetch reservation:', e);
      setError(e?.message || "Không thể tải thông tin đặt phòng");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchReservation();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          text: "Đang chờ xác nhận",
          color: "#ff9800",
          icon: <AccessTime />,
        };
      case "approved":
        return {
          text: "Đã được xác nhận",
          color: "#4caf50",
          icon: <CheckCircle />,
        };
      case "rejected":
        return {
          text: "Đã bị từ chối",
          color: "#f44336",
          icon: <CheckCircle />,
        };
      case "cancelled":
        return {
          text: "Đã hủy",
          color: "#9e9e9e",
          icon: <CheckCircle />,
        };
      default:
        return {
          text: "Không xác định",
          color: "#9e9e9e",
          icon: <AccessTime />,
        };
    }
  };

  const handlePayment = () => {
    if (reservation?.status === "approved") {
      navigate(`/reservation/form?reservation=${reservationId}`);
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div className="reservation-pending-page">
        <div className="loading-container">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Đang tải thông tin đặt phòng...</p>
        </div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="reservation-pending-page">
        <Container>
          <Row className="justify-content-center">
            <Col lg={8}>
              <Card className="error-card">
                <Card.Body className="text-center p-5">
                  <Alert variant="danger" className="mb-4">
                    {error || "Không tìm thấy thông tin đặt phòng"}
                  </Alert>
                  <Button variant="primary" onClick={handleBackToHome}>
                    Về trang chủ
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  const statusInfo = getStatusInfo(reservation.status);
  const nights = Math.ceil(
    (new Date(reservation.checkOutDate).getTime() -
      new Date(reservation.checkInDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  
  // Calculate total from draft if available
  const totalAmount = draft?.total ?? reservation.totalAmount ?? 0;

  return (
    <div className="reservation-pending-page">
      <div className="hero-wrap" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="overlay"></div>
        <Container>
          <Row className="justify-content-center">
            <Col lg={10}>
              <div className="pending-header">
                <h1>Trạng thái đặt phòng</h1>
                <p>
                  Mã đặt phòng: <strong>{reservationId}</strong>
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <section className="pending-section">
        <Container>
          <Row className="justify-content-center">
            <Col lg={8}>
              <Card className="status-card">
                <Card.Body className="p-4">
                  {/* Status Display */}
                  <div className="status-display">
                    <div
                      className="status-icon"
                      style={{ color: statusInfo.color }}
                    >
                      {statusInfo.icon}
                    </div>
                    <h3
                      className="status-text"
                      style={{ color: statusInfo.color }}
                    >
                      {statusInfo.text}
                    </h3>
                    <p className="status-description">
                      {reservation.status === "pending" &&
                        "Đặt phòng của bạn đang được xem xét. Chúng tôi sẽ thông báo kết quả trong vòng 24 giờ."}
                      {reservation.status === "approved" &&
                        "Đặt phòng đã được xác nhận! Bạn có thể tiến hành thanh toán."}
                      {reservation.status === "rejected" &&
                        "Rất tiếc, đặt phòng của bạn đã bị từ chối. Vui lòng liên hệ để biết thêm chi tiết."}
                      {reservation.status === "cancelled" &&
                        "Đặt phòng đã được hủy."}
                    </p>
                  </div>

                  {/* Reservation Details */}
                  <div className="reservation-details">
                    <h4 className="details-title">
                      <Hotel className="me-2" />
                      Chi tiết đặt phòng
                    </h4>

                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Khách hàng:</span>
                        <span className="detail-value">{customerName}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Khách sạn:</span>
                        <span className="detail-value">{hotelName}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Ngày nhận phòng:</span>
                        <span className="detail-value">
                          {formatDate(reservation.checkInDate)}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Ngày trả phòng:</span>
                        <span className="detail-value">
                          {formatDate(reservation.checkOutDate)}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Số đêm:</span>
                        <span className="detail-value">{nights} đêm</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Số khách:</span>
                        <span className="detail-value">
                          {reservation.numberOfGuests} người
                        </span>
                      </div>
                    </div>
                    
                    {/* Room List from draft */}
                    {draft?.selected && draft.selected.length > 0 && (
                      <div className="room-list-section mt-4">
                        <h5 className="mb-3">Danh sách phòng:</h5>
                        {draft.selected.map((room: any) => (
                          <div key={room.roomTypeId} className="room-item-card mb-2 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <div className="d-flex justify-content-between align-items-center">
                              <div>
                                <strong>{room.name}</strong> x{room.quantity}
                                <div className="text-muted small">
                                  {room.adults} người lớn, {room.children} trẻ em, {room.infants} em bé
                                </div>
                              </div>
                              <div className="text-end">
                                <strong>{(room.unitPrice * room.quantity * nights).toLocaleString()} VNĐ</strong>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="total-section mt-4 p-3" style={{ backgroundColor: '#e7f3ff', borderRadius: '8px' }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Tổng cộng:</h5>
                        <h4 className="mb-0 text-primary">
                          {totalAmount.toLocaleString("vi-VN")} VNĐ
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="action-buttons">
                    <Button
                      variant="outline-secondary"
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="me-3"
                    >
                      {refreshing ? (
                        <>
                          <Spinner size="sm" className="me-2" />
                          Đang cập nhật...
                        </>
                      ) : (
                        <>
                          <Refresh className="me-2" />
                          Làm mới
                        </>
                      )}
                    </Button>

                    {(reservation.status === "rejected" || reservation.status === "cancelled") && (
                      <Button
                        variant="primary"
                        onClick={handleBackToHome}
                        className="btn-payment"
                      >
                        Về trang chủ
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default ReservationPending;
