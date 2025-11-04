import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { 
  Print,
  Download,
  Home,
  CloudUpload,
  CheckCircle
} from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import * as reservationApi from '../api/reservation';
import * as hotelApi from '../api/hotel';
import * as userApi from '../api/user';
import heroBg from '../assets/images/login.avif';
import './ReservationBill.css';

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
    roomType?: {
      name: string;
      basePrice: number;
    };
  }>;
  status: string;
  totalAmount: number;
  paymentType: 'full' | 'deposit';
  paymentStatus: 'pending' | 'completed' | 'refunded';
  createdAt: string;
  paymentConfirmedAt?: string;
}

const ReservationBill: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reservationId = searchParams.get('reservation');
  
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [hotelName, setHotelName] = useState<string>('—');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<any | null>(null);
  const [customerInfo, setCustomerInfo] = useState<any>({
    name: 'Khách lẻ',
    phone: '—',
    email: '—'
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [hasPhotoFace, setHasPhotoFace] = useState<boolean>(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!reservationId) {
      navigate('/rooms');
      return;
    }
    
    // Load draft data for room details
    try {
      const raw = sessionStorage.getItem('reservationDraft');
      if (raw) {
        const parsed = JSON.parse(raw);
        setDraft(parsed);
        console.log('[BILL] Loaded draft:', parsed);
      }
    } catch (e) {
      console.error('[BILL] Failed to load draft:', e);
    }
    
    fetchReservation();
  }, [reservationId, navigate]);

  const fetchReservation = async () => {
    if (!reservationId) return;
    
    try {
      setError(null);
      const res = await reservationApi.getReservationById(reservationId);
      const data = res?.reservation ?? res?.data ?? res;
      
      console.log('[BILL] Fetched reservation:', data);
      
      // Get payment info from nested payment object if exists
      const paymentData = data?.payment || {};
      
      // Ensure rooms is always an array
      setReservation({
        ...data,
        rooms: Array.isArray(data?.rooms) ? data.rooms : [],
        totalAmount: paymentData?.totalPrice || data?.totalAmount || 0,
        numberOfGuests: typeof data?.numberOfGuests === 'number' ? data.numberOfGuests : 0,
        paymentType: paymentData?.paymentType || data?.paymentType || 'full',
        paymentStatus: paymentData?.paymentStatus || data?.paymentStatus || 'pending',
      });
      
      // Fetch customer info
      const customerId = data?.customer?._id || data?.customer;
      if (customerId && customerId !== 'guest') {
        try {
          // Get from localStorage first
          const rawUser = localStorage.getItem('user');
          if (rawUser) {
            const user = JSON.parse(rawUser);
            if (user?._id === customerId || user?.id === customerId) {
              setUserId(user?._id || user?.id);
              setCustomerInfo({
                name: user?.username || user?.fullname || user?.fullName || user?.name || 'Khách lẻ',
                phone: user?.phone || user?.phoneNumber || '—',
                email: user?.email || '—'
              });
              
              // Check if user has photoFace by fetching from API
              try {
                const userData = await userApi.getUserById(user?._id || user?.id);
                const userDataObj = userData?.user || userData?.data || userData;
                console.log('[BILL] User data:', userDataObj);
                if (userDataObj?.photoFace) {
                  setHasPhotoFace(true);
                  console.log('[BILL] User already has photoFace:', userDataObj.photoFace);
                } else {
                  setHasPhotoFace(false);
                  console.log('[BILL] User does not have photoFace');
                }
              } catch (err) {
                console.error('[BILL] Failed to check photoFace:', err);
                setHasPhotoFace(false);
              }
            }
          }
        } catch (err) {
          console.error('[BILL] Failed to get customer info:', err);
        }
      }
      
      // Fetch hotel name - handle multiple formats
      const hotelId = data?.hotel?._id || data?.hotel || data?.hotelId;
      if (hotelId) {
        try {
          const hotel = await hotelApi.getHotelById(hotelId);
          setHotelName(hotel?.name || '—');
        } catch (err) {
          console.error('[BILL] Failed to fetch hotel:', err);
          setHotelName('—');
        }
      }
    } catch (e: any) {
      console.error('[BILL] Failed to fetch reservation:', e);
      setError(e?.message || 'Không thể tải thông tin hóa đơn');
    } finally {
      setLoading(false);
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // In real app, this would generate and download PDF
    alert('Tính năng tải xuống PDF sẽ được triển khai');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const handleNewBooking = () => {
    navigate('/rooms');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadError('Vui lòng chọn file ảnh (JPG, PNG, v.v.)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('Kích thước file không được vượt quá 5MB');
        return;
      }

      setSelectedFile(file);
      setUploadError(null);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile || !userId) {
      setUploadError('Vui lòng chọn ảnh trước khi tải lên');
      return;
    }

    try {
      setUploadingPhoto(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append('photoFace', selectedFile);

      const response = await userApi.uploadPhotoFace(userId, formData);
      console.log('[BILL] Upload photoFace success:', response);

      setUploadSuccess(true);
      setHasPhotoFace(true);

      // Update localStorage
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        const user = JSON.parse(rawUser);
        const responseData = response?.user || response?.data || response;
        user.photoFace = responseData?.photoFace;
        localStorage.setItem('user', JSON.stringify(user));
      }

      // Clear the selected file and preview after successful upload
      setTimeout(() => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);
    } catch (err: any) {
      console.error('[BILL] Failed to upload photoFace:', err);
      setUploadError(err?.response?.data?.message || err?.message || 'Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="bill-page">
        <div className="loading-container">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Đang tải hóa đơn...</p>
        </div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="bill-page">
        <Container>
          <Row className="justify-content-center">
            <Col lg={8}>
              <Card className="error-card">
                <Card.Body className="text-center p-5">
                  <Alert variant="danger" className="mb-4">
                    {error || 'Không tìm thấy thông tin hóa đơn'}
                  </Alert>
                  <Button variant="primary" onClick={() => navigate('/rooms')}>
                    Quay lại chọn phòng
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  const nights = Math.ceil(
    (new Date(reservation.checkOutDate).getTime() - new Date(reservation.checkInDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  const totalAmount = draft?.total ?? reservation.totalAmount ?? 0;
  const depositAmount = Math.round(totalAmount * 0.5);
  const remainingAmount = totalAmount - depositAmount;

  return (
    <div className="bill-page">
      <div className="hero-wrap" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="overlay"></div>
        <Container>
          <Row className="justify-content-center">
            <Col lg={10}>
              <div className="bill-header">
                <h1>Hóa đơn đặt phòng</h1>
                <p>Mã đặt phòng: <strong>{reservationId}</strong></p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <section className="bill-section">
        <Container>
          <Row className="justify-content-center">
            <Col lg={10}>
              <Card className="bill-card">
                <Card.Body className="p-4">
                  {/* Invoice Header */}
                  <div className="invoice-header">
                    <div className="hotel-info">
                      <h2 className="hotel-name">{hotelName}</h2>
                      <p className="hotel-address">123 Đường ABC, Quận 1, TP.HCM</p>
                      <p className="hotel-phone">Hotline: 1900 1234</p>
                    </div>
                    <div className="invoice-info">
                      <h3 className="invoice-title">HÓA ĐƠN</h3>
                      <p className="invoice-number">Số: {reservationId}</p>
                      <p className="invoice-date">Ngày: {formatDate(reservation.createdAt)}</p>
                    </div>
                  </div>

                  <hr className="divider" />

                  {/* Customer Info */}
                  <div className="customer-info">
                    <h4 className="section-title">Thông tin khách hàng</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Họ tên:</span>
                        <span className="info-value">{customerInfo.name}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Số điện thoại:</span>
                        <span className="info-value">{customerInfo.phone}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Email:</span>
                        <span className="info-value">{customerInfo.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Reservation Details */}
                  <div className="reservation-details">
                    <h4 className="section-title">Chi tiết đặt phòng</h4>
                    <div className="details-grid">
                      <div className="detail-item">
                        <span className="detail-label">Ngày nhận phòng:</span>
                        <span className="detail-value">{formatDate(reservation.checkInDate)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Ngày trả phòng:</span>
                        <span className="detail-value">{formatDate(reservation.checkOutDate)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Số đêm:</span>
                        <span className="detail-value">{nights} đêm</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Số khách:</span>
                        <span className="detail-value">{reservation.numberOfGuests} người</span>
                      </div>
                    </div>
                  </div>

                  {/* Room Details */}
                  <div className="room-details">
                    <h4 className="section-title">Chi tiết phòng</h4>
                    {draft?.selected && draft.selected.length > 0 ? (
                      <div className="room-table">
                        <div className="room-header">
                          <div className="room-col">Loại phòng</div>
                          <div className="room-col">Số lượng</div>
                          <div className="room-col">Số khách</div>
                          <div className="room-col">Giá/đêm</div>
                          <div className="room-col">Thành tiền</div>
                        </div>
                        {draft.selected.map((room: any, index: number) => (
                          <div key={room.roomTypeId || index} className="room-row">
                            <div className="room-col">{room.name}</div>
                            <div className="room-col">{room.quantity}</div>
                            <div className="room-col">
                              {room.adults}NL, {room.children}TE, {room.infants}EB
                            </div>
                            <div className="room-col">
                              {(room.unitPrice || 0).toLocaleString()} VNĐ
                            </div>
                            <div className="room-col">
                              {((room.unitPrice || 0) * (room.quantity || 1) * nights).toLocaleString()} VNĐ
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="room-table">
                        <div className="room-header">
                          <div className="room-col">Loại phòng</div>
                          <div className="room-col">Số lượng</div>
                          <div className="room-col">Số khách</div>
                          <div className="room-col">Giá/đêm</div>
                          <div className="room-col">Thành tiền</div>
                        </div>
                        {(reservation.rooms || []).map((room, index) => (
                          <div key={room.roomTypeId || index} className="room-row">
                            <div className="room-col">
                              {room.roomType?.name || `Phòng ${index + 1}`}
                            </div>
                            <div className="room-col">{room.quantity || 0}</div>
                            <div className="room-col">
                              {room.adults || 0}NL, {room.children || 0}TE, {room.infants || 0}EB
                            </div>
                            <div className="room-col">
                              {(room.roomType?.basePrice || 0).toLocaleString()} VNĐ
                            </div>
                            <div className="room-col">
                              {((room.roomType?.basePrice || 0) * (room.quantity || 0) * nights).toLocaleString()} VNĐ
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Payment Summary */}
                  <div className="payment-summary">
                    <h4 className="section-title">Tóm tắt thanh toán</h4>
                    <div className="summary-table">
                      <div className="summary-row">
                        <span className="summary-label">Tổng tiền phòng:</span>
                        <span className="summary-value">{totalAmount.toLocaleString()} VNĐ</span>
                      </div>
                      {reservation.paymentType === 'deposit' && (
                        <>
                          <div className="summary-row">
                            <span className="summary-label">Đã thanh toán (50%):</span>
                            <span className="summary-value">{depositAmount.toLocaleString()} VNĐ</span>
                          </div>
                          <div className="summary-row">
                            <span className="summary-label">Còn lại:</span>
                            <span className="summary-value">{remainingAmount.toLocaleString()} VNĐ</span>
                          </div>
                        </>
                      )}
                      <div className="summary-row total">
                        <span className="summary-label">
                          {reservation.paymentType === 'full' ? 'Tổng cộng:' : 'Đã thanh toán:'}
                        </span>
                        <span className="summary-value">
                          {reservation.paymentType === 'full' 
                            ? totalAmount.toLocaleString() 
                            : depositAmount.toLocaleString()
                          } VNĐ
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="payment-status">
                    <h4 className="section-title">Trạng thái thanh toán</h4>
                    <div className="status-info">
                      <div className="status-item">
                        <span className="status-label">Phương thức:</span>
                        <span className="status-value">
                          {reservation.paymentStatus === 'fully_paid' ? 'Thanh toán toàn bộ' :
                           reservation.paymentStatus === 'deposit_paid' ? 'Thanh toán cọc 50%' : 
                           'Chưa xác định'}
                        </span>
                      </div>
                      <div className="status-item">
                        <span className="status-label">Trạng thái:</span>
                        <span className={`status-value status-${reservation.paymentStatus}`}>
                          {reservation.paymentStatus === 'fully_paid' ? 'Đã thanh toán' :
                           reservation.paymentStatus === 'deposit_paid' ? 'Đã thanh toán cọc' :
                           reservation.paymentStatus === 'completed' ? 'Đã thanh toán' : 
                           reservation.paymentStatus === 'pending' ? 'Chờ thanh toán' : 
                           reservation.paymentStatus === 'refunded' ? 'Đã hoàn tiền' : 'Chưa thanh toán'}
                        </span>
                      </div>
                      {reservation.paymentConfirmedAt && (
                        <div className="status-item">
                          <span className="status-label">Thời gian xác nhận:</span>
                          <span className="status-value">{formatDateTime(reservation.paymentConfirmedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload Photo Face for Check-in (only show if user doesn't have photoFace) */}
                  {userId && !hasPhotoFace && (
                    <div className="photoface-upload">
                      <h4 className="section-title">Upload Photo Face for Check-in</h4>
                      <p className="upload-description">
                        Để tăng tốc quá trình check-in bằng AI nhận diện khuôn mặt, vui lòng tải lên ảnh khuôn mặt của bạn.
                        <br />
                        <em>(Tùy chọn - Optional)</em>
                      </p>
                      
                      <div className="upload-container">
                        {uploadSuccess ? (
                          <div className="upload-success-message">
                            <CheckCircle className="success-icon" />
                            <p>Tải ảnh thành công! Bạn có thể sử dụng AI check-in khi đến khách sạn.</p>
                          </div>
                        ) : (
                          <>
                            <div className="upload-area">
                              <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept="image/*"
                                className="file-input"
                                id="photoFaceInput"
                                disabled={uploadingPhoto}
                              />
                              <label htmlFor="photoFaceInput" className="file-label">
                                <CloudUpload className="upload-icon" />
                                <span className="upload-text">
                                  {selectedFile ? selectedFile.name : 'Chọn ảnh khuôn mặt'}
                                </span>
                                <span className="upload-hint">
                                  JPG, PNG tối đa 5MB
                                </span>
                              </label>
                            </div>

                            {previewUrl && (
                              <div className="preview-container">
                                <img src={previewUrl} alt="Preview" className="preview-image" />
                                <Button 
                                  variant="outline-secondary" 
                                  size="sm" 
                                  onClick={handleClearFile}
                                  disabled={uploadingPhoto}
                                >
                                  Xóa
                                </Button>
                              </div>
                            )}

                            {uploadError && (
                              <Alert variant="danger" className="mt-3 mb-0">
                                {uploadError}
                              </Alert>
                            )}

                            {selectedFile && !uploadSuccess && (
                              <Button 
                                variant="primary" 
                                onClick={handleUploadPhoto}
                                disabled={uploadingPhoto}
                                className="mt-3 upload-btn"
                              >
                                {uploadingPhoto ? (
                                  <>
                                    <Spinner
                                      as="span"
                                      animation="border"
                                      size="sm"
                                      role="status"
                                      aria-hidden="true"
                                      className="me-2"
                                    />
                                    Đang tải lên...
                                  </>
                                ) : (
                                  <>
                                    <CloudUpload className="me-2" />
                                    Tải lên
                                  </>
                                )}
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="bill-actions">
                    <Button 
                      variant="outline-primary" 
                      onClick={handlePrint}
                      className="me-3"
                    >
                      <Print className="me-2" />
                      In hóa đơn
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      onClick={handleDownload}
                      className="me-3"
                    >
                      <Download className="me-2" />
                      Tải PDF
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={handleNewBooking}
                      className="me-3"
                    >
                      Đặt phòng mới
                    </Button>
                    <Button 
                      variant="outline-success" 
                      onClick={handleBackToHome}
                    >
                      <Home className="me-2" />
                      Về trang chủ
                    </Button>
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

export default ReservationBill;
