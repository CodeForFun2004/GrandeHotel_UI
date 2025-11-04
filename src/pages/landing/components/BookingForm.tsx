import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Container, Row, Col, Form, Button, Alert } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { 
  LocationOn, 
  CalendarToday, 
  Home, 
  LocalOffer,
  Search 
} from "@mui/icons-material";
import "./BookingForm.css";

export default function BookingForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [destination, setDestination] = useState<string>("");
  const [checkin, setCheckin] = useState<Date | null>(null);
  const [checkout, setCheckout] = useState<Date | null>(null);
  const [roomCount, setRoomCount] = useState<number>(1);
  const [voucher, setVoucher] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const cities = [
    'Hanoi',
    'Ho Chi Minh',
    'Da Nang',
    'Nha Trang',
    'Can Tho',
    'Hai Phong',
  ];

  // Helpers for date-only handling (avoid timezone shifts)
  const ymd = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const parseYMD = (s: string): Date | null => {
    if (!s) return null;
    const str = s.includes('T') ? s.slice(0, 10) : s;
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

  // Sync state from URL query whenever it changes
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const city = q.get('city') || '';
    const ci = q.get('checkInDate');
    const co = q.get('checkOutDate');
    const rooms = q.get('rooms');
    setDestination(city);
    setCheckin(ci ? parseYMD(ci) : null);
    setCheckout(co ? parseYMD(co) : null);
    setRoomCount(rooms ? Math.max(1, Number(rooms)) : 1);
  }, [location.search]);

  // Keep city options inclusive of value from query if not in list
  const cityOptions = useMemo(() => {
    if (destination && !cities.includes(destination)) {
      return [destination, ...cities];
    }
    return cities;
  }, [destination]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic client-side validation to avoid backend 400
    setError(null);
    if (!destination) {
      setError('Vui lòng chọn thành phố/điểm đến.');
      return;
    }
    if (!checkin || !checkout) {
      setError('Vui lòng chọn ngày nhận và ngày trả phòng.');
      return;
    }
    // Navigate to Rooms page with query params
    const params = new URLSearchParams();
    if (destination) params.set('city', destination);
    if (checkin) params.set('checkInDate', ymd(checkin));
    if (checkout) params.set('checkOutDate', ymd(checkout));
    if (roomCount) params.set('rooms', String(roomCount));
    if (voucher) params.set('voucher', voucher);

    navigate(`/hotels?${params.toString()}`);
  };

  const handleRoomIncrement = () => {
    setRoomCount(prev => prev + 1);
  };

  const handleRoomDecrement = () => {
    if (roomCount > 1) {
      setRoomCount(prev => prev - 1);
    }
  };

  return (
    <section className="deluxe-booking">
      <Container>
        <Form className="booking-form" onSubmit={submit}>
          {error && <Alert variant="danger">{error}</Alert>}
          <Row className="g-3 g-lg-3 align-items-stretch booking-row-bottom">
            {/* Địa điểm khách sạn */}
            <Col xs={12} sm={6} md={3} lg={3}>
              <div className="booking-card p-2 h-100 d-flex align-items-end">
                <div className="wrap w-100">
                  <label className="label label-booking">Bạn muốn nghỉ dưỡng ở đâu ?</label>
                  <div className="input-with-icon">
                    <LocationOn className="input-icon" />
                    <Form.Select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="control-lg form-select destination-input"
                    >
                      <option value="">Nhập Khách sạn / Điểm đến</option>
                      {cityOptions.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </Form.Select>
                  </div>
                </div>
              </div>
            </Col>

            {/* Ngày nhận - trả phòng */}
            <Col xs={12} sm={6} md={3} lg={3}>
              <div className="booking-card p-2 h-100 d-flex align-items-end">
                <div className="wrap w-100">
                  <label className="label label-booking">Ngày nhận - trả phòng</label>
                  <div className="input-with-icon">
                    <CalendarToday className="input-icon" />
                    <DatePicker
                      selected={checkin}
                      onChange={(dates) => {
                        const [start, end] = dates as [Date | null, Date | null];
                        setCheckin(start);
                        setCheckout(end);
                      }}
                      startDate={checkin}
                      endDate={checkout}
                      selectsRange
                      placeholderText="14/10/2025 - 15/10/2025"
                      dateFormat="dd/MM/yyyy"
                      minDate={new Date()}
                      className="control-lg form-control date-input"
                      popperPlacement="bottom-start"
                      monthsShown={1}
                    />
                  </div>
                </div>
              </div>
            </Col>

            {/* Số phòng */}
            <Col xs={12} sm={6} md={3} lg={2}>
              <div className="booking-card p-2 h-100 d-flex align-items-end">
                <div className="wrap w-100">
                  <label className="label label-booking">Số phòng</label>
                  <div className="room-stepper">
                    <Home className="input-icon" />
                    <button 
                      type="button" 
                      className="stepper-btn" 
                      onClick={handleRoomDecrement}
                    >
                      -
                    </button>
                    <span className="room-count">{roomCount}</span>
                    <button 
                      type="button" 
                      className="stepper-btn" 
                      onClick={handleRoomIncrement}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </Col>

            {/* Mã khuyến mãi/Voucher */}
            <Col xs={12} sm={6} md={3} lg={2}>
              <div className="booking-card p-2 h-100 d-flex align-items-end">
                <div className="wrap w-100">
                  <label className="label label-booking">Mã khuyến mãi/Voucher</label>
                  <div className="input-with-icon">
                    <LocalOffer className="input-icon" />
                    <Form.Control
                      type="text"
                      value={voucher}
                      onChange={(e) => setVoucher(e.target.value)}
                      placeholder="Nhập mã khuyến mại/mã Vouc"
                      className="control-lg form-control promo-input"
                    />
                  </div>
                </div>
              </div>
            </Col>

            {/* Nút TÌM KIẾM */}
            <Col xs={12} sm={12} md={12} lg={2}>
              <div className="h-100 d-flex">
                <Button
                  type="submit"
                  className="btn-search px-3 py-2 align-self-stretch w-100"
                >
                  <Search className="search-icon" />
                  TÌM KIẾM
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Container>
    </section>
  );
}
