import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import heroBg from '../assets/images/login.avif';
import './Room.css';
import * as roomApi from '../api/room';
import BookingForm from './landing/components/BookingForm';
// We'll navigate to a review page before creating a reservation
//Chon phong ne

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// Selection state per expanded card
interface TempSelection {
  roomTypeId: string;
  quantity: number; // 1..4 or available
  adults: number;   // >=1
  children: number; // 0..3
  infants: number;  // 0..3
}


interface SelectedRoom {
  roomTypeId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  adults: number;
  children: number;
  infants: number;
}

const RoomPage: React.FC = () => {
  const query = useQuery();
  const navigate = useNavigate();

  const hotelId = query.get('hotel') || '';
  const checkInDate = query.get('checkInDate') || '';
  const checkOutDate = query.get('checkOutDate') || '';
  const numberOfRoomsQuery = Number(query.get('rooms') || '');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomList, setRoomList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [temp, setTemp] = useState<TempSelection>({ roomTypeId: '', quantity: 1, adults: 2, children: 0, infants: 0 });
  const [selected, setSelected] = useState<SelectedRoom[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  // Inline edit states for summary
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [tempIn, setTempIn] = useState<string>(checkInDate ? new Date(checkInDate).toISOString().slice(0,10) : '');
  const [tempOut, setTempOut] = useState<string>(checkOutDate ? new Date(checkOutDate).toISOString().slice(0,10) : '');
  const [editingQty, setEditingQty] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!hotelId) return;
    const fetchRooms = async () => {
      setLoading(true); setError(null);
      try {
        const res = await roomApi.searchHotelRooms(hotelId, {
          checkInDate: checkInDate || undefined,
          checkOutDate: checkOutDate || undefined,
          numberOfRooms: numberOfRoomsQuery || undefined,
          page, limit,
        });
        setRoomList(res.results || []);
        setTotal(res.total || 0);
      } catch (e: any) {
        setError(e?.message || 'Không thể tải phòng');
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [hotelId, checkInDate, checkOutDate, numberOfRoomsQuery, page, limit]);

  useEffect(() => {
    // keep temp date inputs in sync with query
    setTempIn(checkInDate ? new Date(checkInDate).toISOString().slice(0,10) : '');
    setTempOut(checkOutDate ? new Date(checkOutDate).toISOString().slice(0,10) : '');
  }, [checkInDate, checkOutDate]);

  const nights = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 1;
    const inD = new Date(checkInDate); const outD = new Date(checkOutDate);
    const diff = Math.max(1, Math.ceil((outD.getTime() - inD.getTime()) / (1000*60*60*24)));
    return diff;
  }, [checkInDate, checkOutDate]);

  const totalPrice = useMemo(() => selected.reduce((acc, s) => acc + (s.unitPrice * s.quantity * nights), 0), [selected, nights]);

  const removeSelected = (roomTypeId: string) => setSelected((prev) => prev.filter(x => x.roomTypeId !== roomTypeId));

  const onAddToBooking = (item: any) => {
    const roomType = item.roomType;
    const sample = (item.availableRooms && item.availableRooms.length) ? item.availableRooms[0] : null;
    const unitPrice = typeof sample?.pricePerNight === 'number' ? sample.pricePerNight : (roomType?.basePrice || 0);
    const entry: SelectedRoom = {
      roomTypeId: roomType._id,
      name: roomType?.name || 'Room',
      unitPrice,
      quantity: temp.quantity,
      adults: temp.adults,
      children: temp.children,
      infants: temp.infants,
    };
    setSelected((prev) => {
      const found = prev.find(p => p.roomTypeId === entry.roomTypeId);
      if (found) {
        return prev.map(p => p.roomTypeId === entry.roomTypeId ? { ...p, quantity: Math.min(p.quantity + entry.quantity, 4), adults: entry.adults, children: entry.children, infants: entry.infants } : p);
      }
      return [...prev, entry];
    });
    setExpanded(null);
  };

  const submitBooking = async () => {
    if (!hotelId) return setBookingError('Thiếu khách sạn');
    if (!checkInDate || !checkOutDate) return setBookingError('Vui lòng chọn ngày');
    if (selected.length === 0) return setBookingError('Chưa chọn phòng');

    setBookingLoading(true); setBookingError(null);
    try {
      const draft = {
        hotelId,
        checkInDate,
        checkOutDate,
        nights,
        selected,
        total: totalPrice,
        queryString: window.location.search,
      };
      sessionStorage.setItem('reservationDraft', JSON.stringify(draft));
      navigate('/reservation/review');
    } catch (e: any) {
      setBookingError(e?.message || 'Không thể mở trang xác nhận');
    } finally {
      setBookingLoading(false);
    }
  };

  const displayDate = (isoString?: string) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('vi-VN');
  };

  const saveDates = () => {
    const params = new URLSearchParams(window.location.search);
    if (tempIn) params.set('checkInDate', new Date(tempIn).toISOString()); else params.delete('checkInDate');
    if (tempOut) params.set('checkOutDate', new Date(tempOut).toISOString()); else params.delete('checkOutDate');
    navigate(`${window.location.pathname}?${params.toString()}`);
    setIsEditingDates(false);
  };

  return (
    <>
      <div className="hero-wrap" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="overlay" />
        <div className="container"><div className="text-center"><h1 className="mb-4 bread">Chọn phòng</h1></div></div>
      </div>

      {/* Floating booking form below hero, same as landing */}
      <BookingForm />

      <section className="rooms-section">
        <div className="container">
          <div className="row">
            <div className="col-md-8">
              {loading && <p>Đang tải...</p>}
              {error && <p className="text-danger">{error}</p>}
              {!loading && !error && roomList.length === 0 && <p>Không có phòng phù hợp.</p>}

              {roomList.map((item: any) => {
                const rt = item.roomType;
                const available: number = item.available || 0;
                const sample = (item.availableRooms && item.availableRooms.length) ? item.availableRooms[0] : null;
                const img = sample?.images?.[0] || heroBg;

                // price normalize
                const raw = sample?.pricePerNight ?? rt?.basePrice;
                let unitPrice: number | undefined;
                if (typeof raw === 'number') unitPrice = raw; else if (typeof raw === 'string') { const n = Number(raw); if (!isNaN(n)) unitPrice = n; }
                else if (raw && typeof raw === 'object') {
                  const d = (raw as any).$numberDecimal; if (d) { const n = Number(d); if (!isNaN(n)) unitPrice = n; }
                }
                const priceText = unitPrice != null ? `${unitPrice.toLocaleString()} VNĐ` : '—';
                const typeId = rt?._id as string;
                const isOpen = expanded === typeId;

                return (
                  <div className="room-card" key={typeId}>
                    <div className="room-card-inner">
                      <div className="room-image" style={{ backgroundImage: `url(${img})` }} />
                      <div className="room-body">
                        <h4 className="room-title">{rt?.name || 'Room'}</h4>
                        <p className="room-desc">{rt?.description || sample?.description || ''}</p>
                        <div className="room-meta">
                          <div>Sức chứa: {rt?.capacity ?? '—'} người</div>
                          <div>Số giường: {rt?.numberOfBeds ?? '—'}</div>
                          <div>Phòng trống: {available}</div>
                        </div>
                      </div>
                      <div className="room-action">
                        <div className="room-price">{priceText}</div>
                        <button className="btn-choose" onClick={() => {
                          if (isOpen) setExpanded(null);
                          else { setExpanded(typeId); setTemp({ roomTypeId: typeId, quantity: 1, adults: 2, children: 0, infants: 0 }); }
                        }}>{isOpen ? 'Đóng' : 'Chọn phòng'}</button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="room-detail">
                        <div className="detail-header">
                          <div className="detail-adults">👥 {temp.adults} Người lớn</div>
                          <div className="detail-price">{priceText} <span className="per">/ đêm</span></div>
                          <div className="detail-rooms">
                            <select className="select" value={temp.quantity} onChange={(e) => setTemp(t => ({ ...t, quantity: Math.max(1, Math.min(Number(e.target.value||1), Math.min(available, 4))) }))}>
                              {Array.from({ length: Math.max(1, Math.min(available, 4)) }, (_, i) => i + 1).map(n => (
                                <option key={n} value={n}>{n} Phòng</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="detail-guests">
                          <div className="field">
                            <label>Người lớn</label>
                            <select className="select" value={temp.adults} onChange={(e)=> setTemp(t => ({...t, adults: Math.max(1, Number(e.target.value||1))}))}>
                              {[1,2,3,4].map(n=> <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                          <div className="field">
                            <label>Trẻ em (6-11 tuổi)</label>
                            <select className="select" value={temp.children} onChange={(e)=> setTemp(t => ({...t, children: Math.max(0, Number(e.target.value||0))}))}>
                              {[0,1,2,3].map(n=> <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                          <div className="field">
                            <label>Em bé (0-5 tuổi)</label>
                            <select className="select" value={temp.infants} onChange={(e)=> setTemp(t => ({...t, infants: Math.max(0, Number(e.target.value||0))}))}>
                              {[0,1,2,3].map(n=> <option key={n} value={n}>{n}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="detail-total">{(() => {
                          const unit = unitPrice || 0; const qty = temp.quantity || 1;
                          return `${(unit * qty * nights).toLocaleString()} VNĐ`;
                        })()}</div>
                        <div className="detail-actions">
                          <button className="small-btn" onClick={() => onAddToBooking(item)}>Thêm vào đặt phòng</button>
                          <button className="small-btn grey" onClick={() => setExpanded(null)}>Hủy</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <div style={{ marginTop: 20 }}>
                {total > limit && (
                  <div className="pagination">
                    <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p-1))}>Previous</button>
                    <span style={{ margin: '0 8px' }}>{page}</span>
                    <button disabled={page*limit >= total} onClick={() => setPage(p => p+1)}>Next</button>
                    <span style={{ marginLeft: 12, color: '#666' }}>Total: {total}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="col-md-4">
              <div className="booking-summary">
                <h5>Thông tin đặt phòng</h5>
                <div className="summary-row">
                  <span className="label">Ngày:</span>
                  {!isEditingDates ? (
                    <span
                      className="editable"
                      title="Nhấp để chỉnh sửa"
                      onClick={() => setIsEditingDates(true)}
                    >
                      {displayDate(checkInDate)} <span style={{margin: '0 4px'}}>—</span> {displayDate(checkOutDate)}
                    </span>
                  ) : (
                    <div className="editable-inputs">
                      <input
                        type="date"
                        value={tempIn}
                        onChange={(e)=> setTempIn(e.target.value)}
                      />
                      <span>-</span>
                      <input
                        type="date"
                        value={tempOut}
                        onChange={(e)=> setTempOut(e.target.value)}
                      />
                      <button className="link-btn" onClick={saveDates}>Lưu</button>
                      <button className="link-btn" onClick={()=>{ setIsEditingDates(false); setTempIn(checkInDate ? new Date(checkInDate).toISOString().slice(0,10) : ''); setTempOut(checkOutDate ? new Date(checkOutDate).toISOString().slice(0,10) : ''); }}>Hủy</button>
                    </div>
                  )}
                </div>
                <div>
                  {selected.length === 0 && <p>Chưa chọn phòng.</p>}
                  {selected.map(s => (
                    <div className="item" key={s.roomTypeId}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span>{s.name}</span>
                        {!editingQty[s.roomTypeId] ? (
                          <span
                            className="editable"
                            title="Nhấp để chỉnh số lượng"
                            onClick={() => setEditingQty(prev => ({ ...prev, [s.roomTypeId]: true }))}
                          >
                            x{s.quantity}
                          </span>
                        ) : (
                          <select
                            autoFocus
                            value={s.quantity}
                            onBlur={() => setEditingQty(prev => ({ ...prev, [s.roomTypeId]: false }))}
                            onChange={(e)=> {
                              const val = Number(e.target.value);
                              setSelected(prev => prev.map(p => p.roomTypeId===s.roomTypeId ? { ...p, quantity: val } : p));
                              setEditingQty(prev => ({ ...prev, [s.roomTypeId]: false }));
                            }}
                          >
                            {[1,2,3,4].map(n=> <option key={n} value={n}>x{n}</option>)}
                          </select>
                        )}
                      </div>
                      <div className="controls">
                        <span>{(s.unitPrice * s.quantity * nights).toLocaleString()} VNĐ</span>
                        <button className="remove" onClick={() => removeSelected(s.roomTypeId)}>Hủy</button>
                      </div>
                    </div>
                  ))}
                  <hr />
                  <div style={{ fontWeight: 700 }}>Tổng: {totalPrice.toLocaleString()} VNĐ</div>
                </div>
                {bookingError && <div className="text-danger">{bookingError}</div>}
                <button className="btn-book-now" disabled={bookingLoading} onClick={submitBooking}>{bookingLoading ? 'Đang xử lý...' : 'ĐẶT NGAY'}</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default RoomPage;
