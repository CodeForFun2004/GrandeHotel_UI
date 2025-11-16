import React from 'react';
import type { Reservation, Hotel, RoomType, Service, Payment } from '../../../types/entities';
import { formatVND } from '../../../utils/formatCurrency';

interface BookingDetailModalProps {
  booking: Reservation;
  isOpen: boolean;
  onClose: () => void;
}

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({ booking, isOpen, onClose }) => {
  if (!isOpen) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'rejected':
      case 'canceled':
        return '#ef4444';
      case 'completed':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'Đã duyệt';
      case 'pending':
        return 'Chờ duyệt';
      case 'rejected':
        return 'Từ chối';
      case 'canceled':
        return 'Đã hủy';
      case 'completed':
        return 'Hoàn thành';
      default:
        return status || '—';
    }
  };

  const getPaymentStatusLabel = (paymentStatus?: string) => {
    switch (paymentStatus) {
      case 'unpaid':
        return 'Chưa thanh toán';
      case 'deposit_paid':
        return 'Đã đặt cọc';
      case 'fully_paid':
        return 'Đã thanh toán đủ';
      case 'partially_paid':
        return 'Thanh toán một phần';
      case 'refunded':
        return 'Đã hoàn tiền';
      default:
        return paymentStatus || '—';
    }
  };

  const getPaymentMethodLabel = (method?: string) => {
    switch (method) {
      case 'bank_transfer':
        return 'Chuyển khoản ngân hàng';
      case 'cash':
        return 'Tiền mặt';
      case 'card':
        return 'Thẻ';
      case 'other':
        return 'Khác';
      default:
        return method || '—';
    }
  };

  const hotel = typeof booking.hotel === 'object' ? (booking.hotel as Hotel) : null;
  const payment = booking.payment as Payment | undefined;

  const calculateNights = () => {
    if (!booking.checkInDate || !booking.checkOutDate) return 0;
    try {
      const checkIn = new Date(booking.checkInDate);
      const checkOut = new Date(booking.checkOutDate);
      const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return 0;
    }
  };

  const nights = calculateNights();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '120px 20px 20px 20px', // Tăng top padding để tách khỏi header
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          maxWidth: 700,
          width: '100%',
          maxHeight: 'calc(100vh - 160px)', // Điều chỉnh để modal nằm giữa và có khoảng cách với header
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          margin: 'auto', // Đảm bảo center
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            background: '#fff',
            zIndex: 10,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>
            Chi tiết đặt phòng
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {/* Booking ID */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
              Mã đặt phòng
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
              {booking._id || booking.id || '—'}
            </div>
          </div>

          {/* Status Badge */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: 'inline-block',
                padding: '6px 16px',
                borderRadius: 8,
                background: getStatusColor(booking.status),
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {getStatusLabel(booking.status)}
            </div>
          </div>

          {/* Hotel Information */}
          {hotel && (
            <div
              style={{
                padding: 16,
                background: '#f9fafb',
                borderRadius: 10,
                marginBottom: 16,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 10 }}>
                Thông tin khách sạn
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>Tên khách sạn: </span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                    {hotel.name || '—'}
                  </span>
                </div>
                {hotel.address && (
                  <div>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>Địa chỉ: </span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                      {hotel.address}
                    </span>
                  </div>
                )}
                {hotel.phone && (
                  <div>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>Điện thoại: </span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                      {hotel.phone}
                    </span>
                  </div>
                )}
                {hotel.email && (
                  <div>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>Email: </span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                      {hotel.email}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Booking Dates */}
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 10 }}>
              Thông tin đặt phòng
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Check-in</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                  {formatDate(booking.checkInDate)}
                </div>
                {booking.checkedInAt && (
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                    Đã check-in: {formatDateTime(booking.checkedInAt)}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Check-out</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                  {formatDate(booking.checkOutDate)}
                </div>
                {booking.checkedOutAt && (
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                    Đã check-out: {formatDateTime(booking.checkedOutAt)}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Số đêm</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{nights} đêm</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Số khách</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                  {booking.numberOfGuests || '—'} người
                </div>
              </div>
            </div>
          </div>

          {/* Room Details */}
          {booking.details && booking.details.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 10 }}>
                Chi tiết phòng
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {booking.details.map((detail, index) => {
                  const roomType =
                    typeof detail.roomType === 'object'
                      ? (detail.roomType as RoomType)
                      : null;
                  const roomTypeName = roomType?.name || 'Loại phòng';
                  const roomTypePrice = roomType?.price || 0;

                  return (
                    <div
                      key={detail._id || index}
                      style={{
                        padding: 12,
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                          {roomTypeName}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                          {formatVND(roomTypePrice * nights * (detail.quantity || 1))}
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>
                        Số lượng: {detail.quantity || 1} phòng
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>
                        Người lớn: {detail.adults || 1} • Trẻ em: {detail.children || 0} • Em bé:{' '}
                        {detail.infants || 0}
                      </div>
                      {detail.services && detail.services.length > 0 && (
                        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #f3f4f6' }}>
                          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 3 }}>
                            Dịch vụ kèm theo:
                          </div>
                          {detail.services.map((svc, svcIndex) => {
                            const service =
                              typeof svc.service === 'object' ? (svc.service as Service) : null;
                            const serviceName = service?.name || 'Dịch vụ';
                            const servicePrice = service?.basePrice || 0;
                            const quantity = svc.quantity || 1;
                            return (
                              <div
                                key={svcIndex}
                                style={{
                                  fontSize: 12,
                                  color: '#374151',
                                  marginBottom: 3,
                                }}
                              >
                                • {serviceName} (x{quantity}) - {formatVND(servicePrice * quantity)}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Information */}
          {payment && (
            <div
              style={{
                padding: 16,
                background: '#f9fafb',
                borderRadius: 10,
                marginBottom: 16,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 10 }}>
                Thông tin thanh toán
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>Tổng tiền:</span>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>
                    {formatVND(payment.totalPrice || 0)}
                  </span>
                </div>
                {payment.depositAmount && payment.depositAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>Tiền cọc:</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                      {formatVND(payment.depositAmount)}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>Đã thanh toán:</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>
                    {formatVND(payment.paidAmount || 0)}
                  </span>
                </div>
                {payment.remainingAmount !== undefined && payment.remainingAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>Còn lại:</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#ef4444' }}>
                      {formatVND(payment.remainingAmount)}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>Trạng thái:</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>
                    {getPaymentStatusLabel(payment.paymentStatus)}
                  </span>
                </div>
                {payment.paymentMethod && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>Phương thức:</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>
                      {getPaymentMethodLabel(payment.paymentMethod)}
                    </span>
                  </div>
                )}
                {payment.paymentNotes && (
                  <div>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>Ghi chú: </span>
                    <span style={{ fontSize: 13, color: '#111827' }}>{payment.paymentNotes}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 10 }}>
              Thông tin bổ sung
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div>
                <span style={{ fontSize: 13, color: '#6b7280' }}>Trạng thái lưu trú: </span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>
                  {booking.stayStatus === 'checked_in'
                    ? 'Đã check-in'
                    : booking.stayStatus === 'checked_out'
                    ? 'Đã check-out'
                    : 'Chưa check-in'}
                </span>
              </div>
              {booking.reason && (
                <div>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>Lý do: </span>
                  <span style={{ fontSize: 13, color: '#111827' }}>{booking.reason}</span>
                </div>
              )}
              {booking.createdAt && (
                <div>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>Ngày đặt: </span>
                  <span style={{ fontSize: 13, color: '#111827' }}>
                    {formatDateTime(booking.createdAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Close Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 24px',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#3b82f6';
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailModal;

