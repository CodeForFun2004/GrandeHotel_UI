import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import heroBg from "../assets/images/login.avif";
import "./Room.css";
import * as roomApi from "../api/room";
import BookingForm from "./landing/components/BookingForm";
// We'll navigate to a review page before creating a reservation
//Chon phong ne

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// Selection state per expanded card
interface TempSelection {
  roomTypeId: string;
  quantity: number; // 1..4 or available
  adults: number; // >=1
  children: number; // 0..3
  infants: number; // 0..3
}

interface SelectedRoom {
  roomTypeId: string;
  name: string;
  unitPrice: number;
  // capacity per room for this room type (used to validate headcount later)
  capacity?: number;
  quantity: number;
  adults: number;
  children: number;
  infants: number;
}

const RoomPage: React.FC = () => {
  const query = useQuery();
  const navigate = useNavigate();

  const hotelId = query.get("hotel") || "";
  const checkInDate = query.get("checkInDate") || "";
  const checkOutDate = query.get("checkOutDate") || "";
  const numberOfRoomsQuery = Number(query.get("rooms") || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomList, setRoomList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);

  const [expanded, setExpanded] = useState<string | null>(null);
  const [temp, setTemp] = useState<TempSelection>({
    roomTypeId: "",
    quantity: 1,
    adults: 2,
    children: 0,
    infants: 0,
  });
  const [selected, setSelected] = useState<SelectedRoom[]>([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  // Inline edit states for summary
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  // Helper to get date-only (YYYY-MM-DD) without timezone shifts
  const dateOnly = (s?: string) => {
    if (!s) return "";
    const idx = s.indexOf("T");
    return idx > 0 ? s.slice(0, 10) : s;
  };
  // Helpers for local YMD and parsing without timezone surprises
  const ymdLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const parseYMD = (s?: string): Date | null => {
    if (!s) return null;
    const str = s.includes("T") ? s.slice(0, 10) : s;
    const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(str);
    if (!m) {
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    }
    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);
    return new Date(year, month - 1, day);
  };
  const addDays = (d: Date, days: number) => {
    const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    copy.setDate(copy.getDate() + days);
    return copy;
  };
  const todayYMD = ymdLocal(new Date());
  const [tempIn, setTempIn] = useState<string>(dateOnly(checkInDate));
  const [tempOut, setTempOut] = useState<string>(dateOnly(checkOutDate));
  const [editingQty, setEditingQty] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!hotelId) return;
    const fetchRooms = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await roomApi.searchHotelRooms(hotelId, {
          checkInDate: checkInDate || undefined,
          checkOutDate: checkOutDate || undefined,
          numberOfRooms: numberOfRoomsQuery || undefined,
          page,
          limit,
        });
        setRoomList(res.results || []);
        setTotal(res.total || 0);
      } catch (e: any) {
        setError(e?.message || "Không thể tải phòng");
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [hotelId, checkInDate, checkOutDate, numberOfRoomsQuery, page, limit]);

  useEffect(() => {
    // keep temp date inputs in sync with query, preserving date-only strings
    setTempIn(dateOnly(checkInDate));
    setTempOut(dateOnly(checkOutDate));
  }, [checkInDate, checkOutDate]);

  const nights = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 1;
    const inD = new Date(checkInDate);
    const outD = new Date(checkOutDate);
    const diff = Math.max(
      1,
      Math.ceil((outD.getTime() - inD.getTime()) / (1000 * 60 * 60 * 24))
    );
    return diff;
  }, [checkInDate, checkOutDate]);

  const totalPrice = useMemo(
    () =>
      selected.reduce((acc, s) => acc + s.unitPrice * s.quantity * nights, 0),
    [selected, nights]
  );

  const removeSelected = (roomTypeId: string) =>
    setSelected((prev) => prev.filter((x) => x.roomTypeId !== roomTypeId));

  // Helpers for capacity rules: 2 children = 1 adult equivalent, infants do not count
  const effAdults = (adults: number, children: number) =>
    adults + Math.ceil((children || 0) / 2);
  const minRoomsNeeded = (
    adults: number,
    children: number,
    capacity?: number
  ) => {
    const cap = Number(capacity || 0);
    if (!cap) return 1;
    return Math.ceil(effAdults(adults, children) / cap);
  };

  const onAddToBooking = (item: any) => {
    const roomType = item.roomType;
    const capacity = Number(roomType?.capacity || 0);
    const sample =
      item.availableRooms && item.availableRooms.length
        ? item.availableRooms[0]
        : null;
    // Price normalize: prioritize basePrice from roomType, fallback to pricePerNight from sample
    const raw = roomType?.basePrice ?? sample?.pricePerNight;
    let unitPrice = 0;
    if (typeof raw === "number") {
      unitPrice = raw;
    } else if (typeof raw === "string") {
      const n = Number(raw);
      if (!isNaN(n)) unitPrice = n;
    } else if (raw && typeof raw === "object") {
      const d = (raw as any).$numberDecimal;
      if (d) {
        const n = Number(d);
        if (!isNaN(n)) unitPrice = n;
      }
    }
    // Validate capacity: adults + ceil(children/2) must be <= capacity * quantity
    const needed = minRoomsNeeded(temp.adults, temp.children, capacity);
    if (needed > temp.quantity) {
      setBookingError(
        `Vượt sức chứa. Cần ít nhất ${needed} phòng cho ${temp.adults} NL và ${temp.children} TE (2 TE = 1 NL).`
      );
      return;
    }
    const entry: SelectedRoom = {
      roomTypeId: roomType._id,
      name: roomType?.name || "Room",
      unitPrice,
      capacity,
      quantity: temp.quantity,
      adults: temp.adults,
      children: temp.children,
      infants: temp.infants,
    };
    setSelected((prev) => {
      const found = prev.find((p) => p.roomTypeId === entry.roomTypeId);
      if (found) {
        // Merge quantities but ensure capacity is respected
        return prev.map((p) => {
          if (p.roomTypeId !== entry.roomTypeId) return p;
          const mergedQty = Math.min(
            (p.quantity || 1) + (entry.quantity || 1),
            4
          );
          const cap = p.capacity ?? capacity;
          const neededRooms = minRoomsNeeded(entry.adults, entry.children, cap);
          const finalQty = Math.max(mergedQty, neededRooms);
          return {
            ...p,
            capacity: cap,
            quantity: finalQty,
            adults: entry.adults,
            children: entry.children,
            infants: entry.infants,
          };
        });
      }
      return [...prev, entry];
    });
    setExpanded(null);
  };

  const submitBooking = async () => {
    if (!hotelId) return setBookingError("Thiếu khách sạn");
    if (!checkInDate || !checkOutDate)
      return setBookingError("Vui lòng chọn ngày");
    if (selected.length === 0) return setBookingError("Chưa chọn phòng");

    setBookingLoading(true);
    setBookingError(null);
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
      sessionStorage.setItem("reservationDraft", JSON.stringify(draft));
      navigate("/reservation/review");
    } catch (e: any) {
      setBookingError(e?.message || "Không thể mở trang xác nhận");
    } finally {
      setBookingLoading(false);
    }
  };

  const displayDate = (value?: string) => {
    if (!value) return "—";
    const dstr = dateOnly(value);
    // Construct local time to avoid UTC shift
    const d = new Date(`${dstr}T00:00:00`);
    if (isNaN(d.getTime())) return dstr;
    return d.toLocaleDateString("vi-VN");
  };

  const saveDates = () => {
    const params = new URLSearchParams(window.location.search);
    setDateError(null);
    // Normalize and validate
    let inStr = tempIn;
    let outStr = tempOut;
    const inDate = parseYMD(inStr);
    const outDate = parseYMD(outStr);
    const today = parseYMD(todayYMD)!;

    // Ensure check-in is today or later
    let validIn = inDate ?? today;
    if (validIn < today) {
      validIn = today;
    }
    // Ensure check-out is after check-in (at least +1 day)
    let minOutDate = addDays(validIn, 1);
    let validOut = outDate ?? minOutDate;
    if (validOut <= validIn) {
      validOut = minOutDate;
    }
    inStr = ymdLocal(validIn);
    outStr = ymdLocal(validOut);

    if (inStr) params.set("checkInDate", inStr);
    else params.delete("checkInDate");
    if (outStr) params.set("checkOutDate", outStr);
    else params.delete("checkOutDate");
    navigate(`${window.location.pathname}?${params.toString()}`);
    setIsEditingDates(false);
  };

  // Restore draft (selected rooms and dates) when returning from review or after login
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("reservationDraft");
      if (!raw) return;
      const draft = JSON.parse(raw);
      // Only restore for same hotel
      if (draft?.hotelId && draft.hotelId === hotelId) {
        if (Array.isArray(draft.selected)) setSelected(draft.selected);
        if (draft.checkInDate && !checkInDate) {
          const params = new URLSearchParams(window.location.search);
          params.set("checkInDate", dateOnly(draft.checkInDate));
          if (draft.checkOutDate)
            params.set("checkOutDate", dateOnly(draft.checkOutDate));
          navigate(`${window.location.pathname}?${params.toString()}`);
        }
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save draft to sessionStorage on key changes
  useEffect(() => {
    try {
      const draft = {
        hotelId,
        checkInDate: dateOnly(checkInDate),
        checkOutDate: dateOnly(checkOutDate),
        nights,
        selected,
        total: totalPrice,
        queryString: window.location.search,
      };
      sessionStorage.setItem("reservationDraft", JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }, [hotelId, checkInDate, checkOutDate, nights, selected, totalPrice]);

  {
    dateError && (
      <div className="text-danger" style={{ fontSize: 12 }}>
        {dateError}
      </div>
    );
  }
  return (
    <>
      <div className="hero-wrap" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="overlay" />
        <div className="container">
          <div className="text-center">
            <h1 className="mb-4 bread">Chọn phòng</h1>
          </div>
        </div>
      </div>

      {/* Floating booking form below hero, same as landing */}
      <BookingForm />

      <section className="rooms-section">
        <div className="container">
          <div className="row">
            <div className="col-md-8">
              {loading && <p>Đang tải...</p>}
              {error && <p className="text-danger">{error}</p>}
              {!loading && !error && roomList.length === 0 && (
                <p>Không có phòng phù hợp.</p>
              )}

              {roomList.map((item: any) => {
                const rt = item.roomType;
                const available: number = item.available || 0;
                const sample =
                  item.availableRooms && item.availableRooms.length
                    ? item.availableRooms[0]
                    : null;
                const img = sample?.images?.[0] || heroBg;

                // price normalize
                //                const raw = sample?.pricePerNight ?? rt?.basePrice;
                const raw = rt?.basePrice ?? sample?.pricePerNight ;
                console.log("raw price", raw);
                let unitPrice: number | undefined;
                if (typeof raw === "number") unitPrice = raw;
                else if (typeof raw === "string") {
                  const n = Number(raw);
                  if (!isNaN(n)) unitPrice = n;
                } else if (raw && typeof raw === "object") {
                  const d = (raw as any).$numberDecimal;
                  if (d) {
                    const n = Number(d);
                    if (!isNaN(n)) unitPrice = n;
                  }
                }
                const priceText =
                  unitPrice != null ? `${unitPrice.toLocaleString()} VNĐ` : "—";
                const typeId = rt?._id as string;
                const isOpen = expanded === typeId;

                // Derived capacity calculations for UI enforcement
                const cap = Number(rt?.capacity || 0);
                // Max adults allowed given current children and quantity
                const maxAdults = cap
                  ? Math.max(
                      1,
                      temp.quantity * cap - Math.ceil((temp.children || 0) / 2)
                    )
                  : 4;
                // Max children allowed given current adults and quantity
                const maxChildren = cap
                  ? Math.max(
                      0,
                      2 * Math.max(0, temp.quantity * cap - (temp.adults || 0))
                    )
                  : 3;

                return (
                  <div className="room-card" key={typeId}>
                    <div className="room-card-inner">
                      <div
                        className="room-image"
                        style={{ backgroundImage: `url(${img})` }}
                      />
                      <div className="room-body">
                        <h4 className="room-title">{rt?.name || "Room"}</h4>
                        <p className="room-desc">
                          {rt?.description || sample?.description || ""}
                        </p>
                        <div className="room-meta">
                          <div>Sức chứa: {rt?.capacity ?? "—"} người</div>
                          <div>Số giường: {rt?.numberOfBeds ?? "—"}</div>
                          <div>Phòng trống: {available}</div>
                        </div>
                      </div>
                      <div className="room-action">
                        <div className="room-price">{priceText}</div>
                        <button
                          className="btn-choose"
                          onClick={() => {
                            if (isOpen) setExpanded(null);
                            else {
                              setExpanded(typeId);
                              setTemp({
                                roomTypeId: typeId,
                                quantity: 1,
                                adults: 1,
                                children: 0,
                                infants: 0,
                              });
                            }
                          }}
                        >
                          {isOpen ? "Đóng" : "Chọn phòng"}
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="room-detail">
                        <div className="detail-header">
                          <div className="detail-adults">
                            👥 {temp.adults} Người lớn
                          </div>
                          <div className="detail-price">
                            {priceText} <span className="per">/ đêm</span>
                          </div>
                          <div className="detail-rooms">
                            <select
                              className="select"
                              value={temp.quantity}
                              onChange={(e) => {
                                const nextQ = Math.max(
                                  1,
                                  Math.min(
                                    Number(e.target.value || 1),
                                    Math.min(available, 4)
                                  )
                                );
                                // Ensure quantity is at least the rooms needed for current headcount
                                const minQ = minRoomsNeeded(
                                  temp.adults,
                                  temp.children,
                                  cap
                                );
                                const adjustedQ = Math.max(nextQ, minQ);
                                setTemp((t) => ({ ...t, quantity: adjustedQ }));
                              }}
                            >
                              {Array.from(
                                { length: Math.max(1, Math.min(available, 4)) },
                                (_, i) => i + 1
                              ).map((n) => (
                                <option key={n} value={n}>
                                  {n} Phòng
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="detail-guests">
                          <div className="field">
                            <label>Người lớn</label>
                            <select
                              className="select"
                              value={Math.min(temp.adults, maxAdults)}
                              onChange={(e) => {
                                const val = Math.max(
                                  1,
                                  Number(e.target.value || 1)
                                );
                                // Clamp adults against capacity and recompute children clamp afterwards
                                const newAdults = cap
                                  ? Math.min(val, Math.max(1, maxAdults))
                                  : val;
                                // After adults change, children may exceed available child capacity
                                const newMaxChildren = cap
                                  ? Math.max(
                                      0,
                                      2 *
                                        Math.max(
                                          0,
                                          temp.quantity * cap - newAdults
                                        )
                                    )
                                  : 3;
                                const newChildren = Math.min(
                                  temp.children,
                                  newMaxChildren
                                );
                                setTemp((t) => ({
                                  ...t,
                                  adults: newAdults,
                                  children: newChildren,
                                }));
                              }}
                            >
                              {Array.from(
                                {
                                  length: Math.max(
                                    1,
                                    Math.min(Math.max(1, maxAdults), 10)
                                  ),
                                },
                                (_, i) => i + 1
                              ).map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="field">
                            <label>Trẻ em (6-11 tuổi)</label>
                            <select
                              className="select"
                              value={Math.min(temp.children, maxChildren)}
                              onChange={(e) => {
                                const val = Math.max(
                                  0,
                                  Number(e.target.value || 0)
                                );
                                // Clamp children to capacity left after adults
                                const clampedChildren = cap
                                  ? Math.min(val, maxChildren)
                                  : val;
                                // If children increased, adults might need clamping too
                                const newMaxAdults = cap
                                  ? Math.max(
                                      1,
                                      temp.quantity * cap -
                                        Math.ceil(clampedChildren / 2)
                                    )
                                  : 4;
                                const newAdults = Math.min(
                                  temp.adults,
                                  newMaxAdults
                                );
                                // Also ensure quantity still enough for the new headcount
                                const minQ = minRoomsNeeded(
                                  newAdults,
                                  clampedChildren,
                                  cap
                                );
                                const q = Math.max(temp.quantity, minQ);
                                setTemp((t) => ({
                                  ...t,
                                  adults: newAdults,
                                  children: clampedChildren,
                                  quantity: q,
                                }));
                              }}
                            >
                              {Array.from(
                                {
                                  length: Math.max(
                                    1,
                                    Math.min(Math.max(0, maxChildren) + 1, 8)
                                  ),
                                },
                                (_, i) => i
                              ).map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="field">
                            <label>Em bé (0-5 tuổi)</label>
                            <select
                              className="select"
                              value={temp.infants}
                              onChange={(e) =>
                                setTemp((t) => ({
                                  ...t,
                                  infants: Math.max(
                                    0,
                                    Number(e.target.value || 0)
                                  ),
                                }))
                              }
                            >
                              {[0, 1, 2, 3].map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div
                          style={{ fontSize: 12, color: "#555", marginTop: 6 }}
                        >
                          Tối đa {cap ? cap * temp.quantity : "—"} người lớn quy
                          đổi (2 trẻ em = 1 người lớn). Em bé không tính.
                          {cap ? (
                            effAdults(temp.adults, temp.children) >
                            cap * temp.quantity ? (
                              <div className="text-danger">
                                Vượt sức chứa. Hãy tăng số phòng hoặc giảm số
                                người.
                              </div>
                            ) : null
                          ) : null}
                        </div>
                        <div className="detail-total">
                          {(() => {
                            const unit = unitPrice || 0;
                            const qty = temp.quantity || 1;
                            return `${(
                              unit *
                              qty *
                              nights
                            ).toLocaleString()} VNĐ`;
                          })()}
                        </div>
                        <div className="detail-actions">
                          <button
                            className="small-btn"
                            disabled={
                              cap
                                ? effAdults(temp.adults, temp.children) >
                                  cap * temp.quantity
                                : false
                            }
                            onClick={() => onAddToBooking(item)}
                          >
                            Thêm vào đặt phòng
                          </button>
                          <button
                            className="small-btn grey"
                            onClick={() => setExpanded(null)}
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <div style={{ marginTop: 20 }}>
                {total > limit && (
                  <div className="pagination">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    <span style={{ margin: "0 8px" }}>{page}</span>
                    <button
                      disabled={page * limit >= total}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </button>
                    <span style={{ marginLeft: 12, color: "#666" }}>
                      Total: {total}
                    </span>
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
                      {displayDate(checkInDate)}{" "}
                      <span style={{ margin: "0 4px" }}>—</span>{" "}
                      {displayDate(checkOutDate)}
                    </span>
                  ) : (
                    <div className="editable-inputs">
                      <input
                        type="date"
                        value={tempIn}
                        min={todayYMD}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTempIn(val);
                          // If checkout is invalid, auto-adjust to next day
                          const inD = parseYMD(val) ?? parseYMD(todayYMD)!;
                          const minOut = ymdLocal(addDays(inD, 1));
                          if (!tempOut || tempOut <= val) {
                            setTempOut(minOut);
                          }
                          setDateError(null);
                        }}
                      />
                      <span>-</span>
                      <input
                        type="date"
                        value={tempOut}
                        min={(() => {
                          const inD = parseYMD(tempIn) ?? parseYMD(todayYMD)!;
                          return ymdLocal(addDays(inD, 1));
                        })()}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTempOut(val);
                          // Validate on the fly
                          const inD = parseYMD(tempIn) ?? parseYMD(todayYMD)!;
                          const outD = parseYMD(val);
                          if (!outD || outD <= inD) {
                            setDateError(
                              "Ngày trả phòng phải sau ngày nhận phòng."
                            );
                          } else {
                            setDateError(null);
                          }
                        }}
                      />
                      <button className="link-btn" onClick={saveDates}>
                        Lưu
                      </button>
                      <button
                        className="link-btn"
                        onClick={() => {
                          setIsEditingDates(false);
                          setTempIn(dateOnly(checkInDate));
                          setTempOut(dateOnly(checkOutDate));
                          setDateError(null);
                        }}
                      >
                        Hủy
                      </button>
                    </div>
                  )}
                </div>
                {dateError && (
                  <div className="text-danger" style={{ fontSize: 12 }}>
                    {dateError}
                  </div>
                )}
                <div>
                  {selected.length === 0 && <p>Chưa chọn phòng.</p>}
                  {selected.map((s) => (
                    <div className="item" key={s.roomTypeId}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          flexWrap: "wrap",
                        }}
                      >
                        <span>{s.name}</span>
                        {!editingQty[s.roomTypeId] ? (
                          <span
                            className="editable"
                            title="Nhấp để chỉnh số lượng"
                            onClick={() =>
                              setEditingQty((prev) => ({
                                ...prev,
                                [s.roomTypeId]: true,
                              }))
                            }
                          >
                            x{s.quantity}
                          </span>
                        ) : (
                          <select
                            autoFocus
                            value={s.quantity}
                            onBlur={() =>
                              setEditingQty((prev) => ({
                                ...prev,
                                [s.roomTypeId]: false,
                              }))
                            }
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              // Ensure new quantity respects min rooms needed for headcount if we have capacity info
                              setSelected((prev) =>
                                prev.map((p) => {
                                  if (p.roomTypeId !== s.roomTypeId) return p;
                                  const cap = p.capacity;
                                  if (!cap) return { ...p, quantity: val };
                                  const minQ = minRoomsNeeded(
                                    p.adults,
                                    p.children,
                                    cap
                                  );
                                  const finalQ = Math.max(val, minQ);
                                  return { ...p, quantity: finalQ };
                                })
                              );
                              setEditingQty((prev) => ({
                                ...prev,
                                [s.roomTypeId]: false,
                              }));
                            }}
                          >
                            {(() => {
                              const cap = s.capacity;
                              const minQ = cap
                                ? minRoomsNeeded(s.adults, s.children, cap)
                                : 1;
                              const start = Math.min(Math.max(1, minQ), 4);
                              return Array.from(
                                { length: 5 - start },
                                (_, i) => i + start
                              ).map((n) => (
                                <option key={n} value={n}>
                                  x{n}
                                </option>
                              ));
                            })()}
                          </select>
                        )}
                      </div>
                      <div className="controls">
                        <span>
                          {(s.unitPrice * s.quantity * nights).toLocaleString()}{" "}
                          VNĐ
                        </span>
                        <button
                          className="remove"
                          onClick={() => removeSelected(s.roomTypeId)}
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ))}
                  <hr />
                  <div style={{ fontWeight: 700 }}>
                    Tổng: {totalPrice.toLocaleString()} VNĐ
                  </div>
                </div>
                {bookingError && (
                  <div className="text-danger">{bookingError}</div>
                )}
                <button
                  className="btn-book-now"
                  disabled={bookingLoading}
                  onClick={submitBooking}
                >
                  {bookingLoading ? "Đang xử lý..." : "ĐẶT NGAY"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default RoomPage;
