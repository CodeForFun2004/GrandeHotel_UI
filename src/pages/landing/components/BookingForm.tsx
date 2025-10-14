import { useState } from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
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
  const [destination, setDestination] = useState<string>("");
  const [checkin, setCheckin] = useState<Date | null>(null);
  const [checkout, setCheckout] = useState<Date | null>(null);
  const [roomCount, setRoomCount] = useState<number>(1);
  const [voucher, setVoucher] = useState<string>("");

  // Danh sách khách sạn Mường Thanh
  const hotels = [
    "Mường Thanh Luxury Hạ Long Centre",
    "Mường Thanh Grand Hà Nội",
    "Mường Thanh Grand Hà Nội Centre", 
    "Mường Thanh Holiday Suối Mơ",
    "Mường Thanh Grand Xa La",
    "Mường Thanh Cửa Đông"
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ destination, checkin, checkout, roomCount, voucher });
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
                      {hotels.map((hotel, index) => (
                        <option key={index} value={hotel}>
                          {hotel}
                        </option>
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
                      monthsShown={2}
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
