import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store';
import type { Reservation, Hotel } from '../../types/entities';
import ProfileSidebar from './components/ProfileSidebar';
import { DEFAULT_AVATAR } from './constants/profile.constants';
import BookingDetailModal from './components/BookingDetailModal';
import * as reservationApi from '../../api/reservation';
import { formatVND } from '../../utils/formatCurrency';
import { toast } from 'react-toastify';

const GlobalFix: React.FC = () => (
  <style>{`
    :root { --grey:#6b7280; --border:#e7dfe4; --split:#f3f4f6; --text:#1f2937; }
    .ph::placeholder { color:#9ca3af; opacity:.9; }
  `}</style>
);

const BookingsHistory: React.FC = () => {
  const user = useSelector((s: RootState) => s.auth.user);
  const userId = useMemo(() => (user as any)?._id ?? (user as any)?.id ?? '', [user]);
  const avatarUrl = (user as any)?.avatar?.trim?.() || DEFAULT_AVATAR;
  const fullName = (user as any)?.fullname || (user as any)?.username || 'Your name';
  const role = (user as any)?.role || 'customer';

  const [bookings, setBookings] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Reservation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    stayStatus: 'all',
    dateFrom: '',
    dateTo: '',
    hotelName: '',
  });

  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Build filter object
        const filterParams: any = {};
        if (filters.stayStatus && filters.stayStatus !== 'all') {
          filterParams.stayStatus = filters.stayStatus;
        }
        if (filters.dateFrom) {
          filterParams.dateFrom = filters.dateFrom;
        }
        if (filters.dateTo) {
          filterParams.dateTo = filters.dateTo;
        }
        if (filters.hotelName) {
          filterParams.hotelName = filters.hotelName;
        }

        // Try to use getUserReservations first, fallback to getAllReservations if endpoint not ready
        let userReservations: Reservation[] = [];
        try {
          const res = await reservationApi.getUserReservations(filterParams);
          userReservations = (res.reservations || res.data || []) as Reservation[];
        } catch (apiError: any) {
          // If endpoint doesn't exist yet, use getAllReservations and filter client-side
          if (apiError?.response?.status === 404) {
            const res = await reservationApi.getAllReservations();
            const allReservations = (res.reservations || []) as Reservation[];
            // Filter reservations for current user
            userReservations = allReservations.filter(
              (r) => {
                const customerId = typeof r.customer === 'object' 
                  ? (r.customer as any)?._id ?? (r.customer as any)?.id
                  : r.customer;
                return customerId === userId;
              }
            );
          } else {
            throw apiError;
          }
        }
        if (mounted) {
          setBookings(userReservations);
        }
      } catch (e: any) {
        if (mounted) {
          setError(e?.response?.data?.message || e?.message || 'Không thể tải lịch sử đặt phòng');
          toast.error('Không thể tải lịch sử đặt phòng');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [userId, filters]);

  const handleViewDetails = (booking: Reservation) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return '#10b981'; // green
      case 'pending':
        return '#f59e0b'; // amber
      case 'rejected':
      case 'canceled':
        return '#ef4444'; // red
      case 'completed':
        return '#6b7280'; // gray
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

  return (
    <div className="profile-page" style={{ background: '#fff', minHeight: '100vh' }}>
      <GlobalFix />
      <div style={{ height: 80, background: '#000' }} />

      <div
        style={{
          width: '100%',
          padding: 24,
          display: 'grid',
          gridTemplateColumns: '25% 75%',
          gap: 24,
          boxSizing: 'border-box',
        }}
      >
        <ProfileSidebar avatarUrl={avatarUrl} name={fullName} role={role} />

        <section
          style={{
            background: '#fff',
            border: '1px solid #f1f5f9',
            borderRadius: 16,
            padding: 24,
          }}
        >
          <h2 style={{ marginBottom: 8, fontSize: 24, fontWeight: 700, color: '#111827' }}>
            Lịch sử đặt phòng
          </h2>
          <p style={{ marginBottom: 24, color: '#6b7280', fontSize: 14 }}>
            Xem tất cả các giao dịch đặt phòng của bạn
          </p>

          {!userId && (
            <p style={{ color: '#6b7280' }}>Vui lòng đăng nhập để xem lịch sử đặt phòng.</p>
          )}

          {userId && (
            <>
              {/* Filter Section */}
              <div
                style={{
                  padding: 20,
                  background: '#f9fafb',
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  marginBottom: 24,
                }}
              >
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
                  Bộ lọc
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 16,
                    marginBottom: 16,
                  }}
                >
                  {/* Stay Status Filter */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#374151',
                        marginBottom: 6,
                      }}
                    >
                      Trạng thái lưu trú
                    </label>
                    <select
                      value={filters.stayStatus}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, stayStatus: e.target.value }))
                      }
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 8,
                        fontSize: 14,
                        color: '#111827',
                        background: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="all">Tất cả</option>
                      <option value="not_checked_in">Chưa check-in</option>
                      <option value="checked_in">Đã check-in</option>
                      <option value="checked_out">Đã check-out</option>
                    </select>
                  </div>

                  {/* Date From Filter */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#374151',
                        marginBottom: 6,
                      }}
                    >
                      Từ ngày
                    </label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                      }
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 8,
                        fontSize: 14,
                        color: '#111827',
                        background: '#fff',
                      }}
                    />
                  </div>

                  {/* Date To Filter */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#374151',
                        marginBottom: 6,
                      }}
                    >
                      Đến ngày
                    </label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                      }
                      min={filters.dateFrom || undefined}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 8,
                        fontSize: 14,
                        color: '#111827',
                        background: '#fff',
                      }}
                    />
                  </div>

                  {/* Hotel Name Filter */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#374151',
                        marginBottom: 6,
                      }}
                    >
                      Tên khách sạn
                    </label>
                    <input
                      type="text"
                      value={filters.hotelName}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, hotelName: e.target.value }))
                      }
                      placeholder="Nhập tên khách sạn..."
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 8,
                        fontSize: 14,
                        color: '#111827',
                        background: '#fff',
                      }}
                    />
                  </div>
                </div>

                {/* Clear Filters Button */}
                {(filters.stayStatus !== 'all' ||
                  filters.dateFrom ||
                  filters.dateTo ||
                  filters.hotelName) && (
                  <button
                    onClick={() =>
                      setFilters({
                        stayStatus: 'all',
                        dateFrom: '',
                        dateTo: '',
                        hotelName: '',
                      })
                    }
                    style={{
                      padding: '8px 16px',
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#dc2626';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#ef4444';
                    }}
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>
              {loading && (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p style={{ color: '#6b7280' }}>Đang tải dữ liệu...</p>
                </div>
              )}

              {error && (
                <div
                  style={{
                    padding: 16,
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 8,
                    color: '#dc2626',
                    marginBottom: 16,
                  }}
                >
                  {error}
                </div>
              )}

              {!loading && !error && bookings.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      margin: '0 auto 16px',
                      borderRadius: '50%',
                      background: '#f3f4f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#9ca3af"
                      strokeWidth="1.5"
                    >
                      <path d="M6 8h12l-1 10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8Z" />
                      <path d="M9 8V7a3 3 0 0 1 6 0v1" />
                    </svg>
                  </div>
                  <p style={{ color: '#6b7280', fontSize: 16, marginBottom: 8 }}>
                    Chưa có đặt phòng nào
                  </p>
                  <p style={{ color: '#9ca3af', fontSize: 14 }}>
                    Bạn chưa có giao dịch đặt phòng nào trong lịch sử.
                  </p>
                </div>
              )}

              {!loading && !error && bookings.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {bookings.map((booking) => {
                    const hotel = typeof booking.hotel === 'object' 
                      ? (booking.hotel as Hotel)
                      : null;
                    const hotelName = hotel?.name || 'Khách sạn';
                    const hotelAddress = hotel?.address || '';
                    const totalPrice = booking.payment?.totalPrice || 0;
                    const paymentStatus = booking.payment?.paymentStatus;

                    return (
                      <div
                        key={booking._id || booking.id}
                        onClick={() => handleViewDetails(booking)}
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: 12,
                          padding: 20,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          background: '#fff',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#d1d5db';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: 12,
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <h3
                              style={{
                                fontSize: 18,
                                fontWeight: 600,
                                color: '#111827',
                                marginBottom: 4,
                              }}
                            >
                              {hotelName}
                            </h3>
                            {hotelAddress && (
                              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                                {hotelAddress}
                              </p>
                            )}
                            <div
                              style={{
                                display: 'flex',
                                gap: 16,
                                flexWrap: 'wrap',
                                marginTop: 8,
                              }}
                            >
                              <div>
                                <span style={{ fontSize: 12, color: '#9ca3af' }}>Check-in: </span>
                                <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
                                  {formatDate(booking.checkInDate)}
                                </span>
                              </div>
                              <div>
                                <span style={{ fontSize: 12, color: '#9ca3af' }}>Check-out: </span>
                                <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
                                  {formatDate(booking.checkOutDate)}
                                </span>
                              </div>
                              <div>
                                <span style={{ fontSize: 12, color: '#9ca3af' }}>Số khách: </span>
                                <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>
                                  {booking.numberOfGuests || '—'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div
                              style={{
                                display: 'inline-block',
                                padding: '4px 12px',
                                borderRadius: 6,
                                background: getStatusColor(booking.status),
                                color: '#fff',
                                fontSize: 12,
                                fontWeight: 600,
                                marginBottom: 8,
                              }}
                            >
                              {getStatusLabel(booking.status)}
                            </div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>
                              {formatVND(totalPrice)}
                            </div>
                            {paymentStatus && (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: '#6b7280',
                                  marginTop: 4,
                                }}
                              >
                                {getPaymentStatusLabel(paymentStatus)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            marginTop: 12,
                            paddingTop: 12,
                            borderTop: '1px solid #f3f4f6',
                          }}
                        >
                          <span
                            style={{
                              fontSize: 14,
                              color: '#3b82f6',
                              fontWeight: 500,
                            }}
                          >
                            Xem chi tiết →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default BookingsHistory;

