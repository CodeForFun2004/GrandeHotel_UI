import { useState } from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./BookingForm.css";

export default function BookingForm() {
  const [checkin, setCheckin] = useState<Date | null>(null);
  const [checkout, setCheckout] = useState<Date | null>(null);
  const [room, setRoom] = useState<string>("Suite");
  const [adults, setAdults] = useState<number>(1);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: call API
    // console.log({ checkin, checkout, room, adults });
  };

  return (
    <section className="deluxe-booking">
      <Container>
        <Form className="booking-form" onSubmit={submit}>
          <Row className="g-4 g-lg-4 align-items-stretch booking-row-bottom">
            {/* Check-in */}
            <Col md={6} lg={3}>
              <div className="booking-card p-4 h-100 d-flex align-items-end">
                <div className="wrap w-100">
                  <label className="label label-booking">Check-in Date</label>
                  <DatePicker
                    selected={checkin}
                    onChange={(d) => setCheckin(d)}
                    placeholderText="Check-in date"
                    dateFormat="MM/dd/yyyy"
                    minDate={new Date()}
                    className="control-lg form-control date-input"
                    popperPlacement="bottom-start"
                  />
                </div>
              </div>
            </Col>

            {/* Check-out */}
            <Col md={6} lg={3}>
              <div className="booking-card p-4 h-100 d-flex align-items-end">
                <div className="wrap w-100">
                  <label className="label label-booking">Check-out Date</label>
                  <DatePicker
                    selected={checkout}
                    onChange={(d) => setCheckout(d)}
                    placeholderText="Check-out date"
                    dateFormat="MM/dd/yyyy"
                    minDate={checkin || new Date()}
                    className="control-lg form-control date-input"
                    popperPlacement="bottom-start"
                  />
                </div>
              </div>
            </Col>

            {/* Room */}
            <Col md={6} lg>
              <div className="booking-card p-4 h-100 d-flex align-items-end">
                <div className="wrap w-100">
                  <label className="label label-booking">Room</label>
                  <div className="select-wrap">
                    <Form.Select
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      className="control-lg form-select"
                    >
                      <option>Suite</option>
                      <option>Family Room</option>
                      <option>Deluxe Room</option>
                      <option>Classic Room</option>
                      <option>Superior Room</option>
                      <option>Luxury Room</option>
                    </Form.Select>
                  </div>
                </div>
              </div>
            </Col>

            {/* Customer */}
            <Col md={6} lg>
              <div className="booking-card p-4 h-100 d-flex align-items-end">
                <div className="wrap w-100">
                  <label className="label label-booking">Customer</label>
                  <div className="select-wrap">
                    <Form.Select
                      value={adults}
                      onChange={(e) => setAdults(Number(e.target.value))}
                      className="control-lg form-select"
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n} Adult
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </div>
              </div>
            </Col>

            {/* Button */}
            <Col lg="auto">
              <div className="h-100 d-flex">
                <Button
                  type="submit"
                  className="btn-availability px-4 py-3 align-self-stretch"
                >
                  Check Availability
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </Container>
    </section>
  );
}
