import React, { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import heroBg from "../assets/images/bg_1.jpg";
import room1 from "../assets/images/room-1.jpg";
import room2 from "../assets/images/room-2.jpg";
import room3 from "../assets/images/room-3.jpg";
import "./Rooms.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const imageById: Record<string, string> = {
  "1": room1,
  "2": room2,
  "3": room3,
};

const RoomDetail: React.FC = () => {
  const { id = "1" } = useParams();
  const image = imageById[id] || room1;

  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [nights, setNights] = useState<number>(1);
  const [rooms, setRooms] = useState<number>(1);
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);

  const nightlyRate = 180;

  const total = useMemo(() => {
    return Math.max(1, nights) * Math.max(1, rooms) * nightlyRate;
  }, [nights, rooms]);

  const deposit = useMemo(() => Math.round(total * 0.3), [total]);

  const checkoutDate = useMemo(() => {
    if (!checkIn) return null;
    const msPerDay = 24 * 60 * 60 * 1000;
    return new Date(checkIn.getTime() + Math.max(1, nights) * msPerDay);
  }, [checkIn, nights]);

  return (
    <>
      <div className="hero-wrap" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="overlay"></div>
        <div className="container">
          <div className="row no-gutters slider-text d-flex align-itemd-end justify-content-center">
            <div className="col-md-9 ftco-animate text-center d-flex align-items-end justify-content-center">
              <div className="text">
                <p className="breadcrumbs mb-2">
                  <span className="mr-2">
                    <Link to="/">Home</Link>
                  </span>{" "}
                  <span className="mr-2">
                    <Link to="/rooms">Rooms</Link>
                  </span>{" "}
                  <span>Room Detail</span>
                </p>
                <h1 className="mb-4 bread">Room Detail</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="ftco-section">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 mb-4">
              <div className="room">
                <div className="img" style={{ backgroundImage: `url(${image})` }} />
                <div className="text p-3">
                  <h3 className="mb-3">Deluxe Room</h3>
                  <p>
                    A spacious and elegant room featuring a comfortable king-size bed,
                    modern amenities, and a beautiful view. Perfect for couples or
                    solo travelers seeking luxury and comfort.
                  </p>
                  <ul className="list">
                    <li><span>Max:</span> 2 Persons</li>
                    <li><span>Size:</span> 40 m2</li>
                    <li><span>View:</span> Sea View</li>
                    <li><span>Bed:</span> 1</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="sidebar-wrap bg-light p-4">
                <h3 className="heading mb-4">Reserve This Room</h3>
                <form>
                  <div className="fields">
                    <div className="form-group">
                      <label className="small text-muted mb-1">Check In</label>
                      <DatePicker
                        selected={checkIn}
                        onChange={(d) => setCheckIn(d)}
                        placeholderText="Select date"
                        className="form-control"
                      />
                    </div>
                    <div className="form-group">
                      <label className="small text-muted mb-1">Nights</label>
                      <input
                        type="number"
                        min={1}
                        value={nights}
                        onChange={(e) => setNights(Math.max(1, parseInt(e.target.value || "1")))}
                        className="form-control"
                      />
                    </div>
                    <div className="form-group">
                      <label className="small text-muted mb-1">Rooms</label>
                      <input
                        type="number"
                        min={1}
                        value={rooms}
                        onChange={(e) => setRooms(Math.max(1, parseInt(e.target.value || "1")))}
                        className="form-control"
                      />
                    </div>
                    <div className="form-group">
                      <label className="small text-muted mb-1">Adults</label>
                      <input
                        type="number"
                        min={0}
                        value={adults}
                        onChange={(e) => setAdults(Math.max(0, parseInt(e.target.value || "0")))}
                        className="form-control"
                      />
                    </div>
                    <div className="form-group">
                      <label className="small text-muted mb-1">Children</label>
                      <input
                        type="number"
                        min={0}
                        value={children}
                        onChange={(e) => setChildren(Math.max(0, parseInt(e.target.value || "0")))}
                        className="form-control"
                      />
                    </div>

                    <div className="bg-white border p-3 mb-3">
                      <div className="d-flex justify-content-between mb-2"><span>Nightly rate</span><strong className="text-muted">${nightlyRate}</strong></div>
                      <div className="d-flex justify-content-between mb-2"><span>Nights</span><strong className="text-muted">{nights}</strong></div>
                      <div className="d-flex justify-content-between mb-2"><span>Rooms</span><strong className="text-muted">{rooms}</strong></div>
                      <div className="d-flex justify-content-between mb-2"><span>Subtotal</span><strong className="text-muted">${total}</strong></div>
                      <div className="d-flex justify-content-between"><span>Deposit (30%)</span><strong>${deposit}</strong></div>
                      {checkIn && (
                        <div className="small text-muted mt-2">Checkout: {checkoutDate?.toLocaleDateString()}</div>
                      )}
                    </div>

                    <button type="button" className="btn btn-primary w-100 mb-2">Reserve</button>
                    <Link to="/rooms" className="btn btn-outline-secondary w-100">Back to Rooms</Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default RoomDetail;


