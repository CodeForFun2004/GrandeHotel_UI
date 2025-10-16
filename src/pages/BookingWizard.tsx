import React, { useMemo, useState } from "react";
import heroBg from "../assets/images/bg_1.jpg";
import room1 from "../assets/images/room-1.jpg";
import room2 from "../assets/images/room-2.jpg";
import room3 from "../assets/images/room-3.jpg";
import room4 from "../assets/images/room-4.jpg";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./Rooms.css";

type ServiceKey = "Breakfast" | "Lunch" | "Dinner" | "Pool" | "Spa";

const SERVICE_PRICES: Record<ServiceKey, number> = {
  Breakfast: 15,
  Lunch: 20,
  Dinner: 25,
  Pool: 10,
  Spa: 40,
};

const SERVICE_DESCRIPTIONS: Record<ServiceKey, string> = {
  Breakfast: "Buffet breakfast at the restaurant",
  Lunch: "Two-course lunch with soft drink",
  Dinner: "Three-course dinner, evening service",
  Pool: "Access to indoor heated pool",
  Spa: "60-minute spa session per guest",
};

const BookingWizard: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  // Step 2: per-room-type quantities
  const [roomTypes, setRoomTypes] = useState<{ [k: string]: number }>({
    classic: 0,
    suite: 0,
    deluxe: 0,
    family: 0,
  });
  // Step 3: guests
  const [adults, setAdults] = useState<number>(1);
  const [children, setChildren] = useState<number>(0);
  const [services, setServices] = useState<Record<ServiceKey, boolean>>({
    Breakfast: false,
    Lunch: false,
    Dinner: false,
    Pool: false,
    Spa: false,
  });

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const ms = checkOut.getTime() - checkIn.getTime();
    return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
  }, [checkIn, checkOut]);

  const RATE: Record<string, number> = { suite: 220, deluxe: 180, family: 200, classic: 150 };
  const totalRooms = Object.values(roomTypes).reduce((a, b) => a + b, 0);
  const base = nights * Object.entries(roomTypes).reduce((sum, [k, qty]) => sum + (RATE[k] || 0) * qty, 0);
  const serviceTotal = (Object.keys(services) as ServiceKey[])
    .filter((k) => services[k])
    .reduce((sum, k) => sum + SERVICE_PRICES[k] * nights * totalRooms, 0);
  const total = base + serviceTotal;

  const canNext = () => {
    if (step === 1) return !!checkIn && !!checkOut && nights > 0;
    if (step === 2) return totalRooms > 0;
    if (step === 3) return adults >= 0 && children >= 0;
    return true;
  };

  const toggleService = (k: ServiceKey) => {
    setServices((s) => ({ ...s, [k]: !s[k] }));
  };

  return (
    <>
      <div className="hero-wrap" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="overlay"></div>
        <div className="container">
          <div className="row no-gutters slider-text d-flex align-itemd-end justify-content-center">
            <div className="col-md-9 ftco-animate text-center d-flex align-items-end justify-content-center">
              <div className="text">
                <h1 className="mb-4 bread">Book a Room</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="ftco-section">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="sidebar-wrap bg-light p-4 wizard">
                <div className="topbar d-flex justify-content-between align-items-center mb-2">
                  <div className="small text-muted">Step {step} of 5</div>
                  <div className="small">Total: <strong>${total}</strong></div>
                </div>

                {step === 1 && (
                  <div className="fields">
                    <h3 className="heading mb-3">Choose Dates</h3>
                    <div className="form-group">
                      <label className="small text-muted mb-1">Check In</label>
                      <DatePicker
                        selected={checkIn}
                        onChange={(d) => setCheckIn(d)}
                        selectsStart
                        startDate={checkIn}
                        endDate={checkOut}
                        placeholderText="Select date"
                        className="form-control"
                      />
                    </div>
                    <div className="form-group">
                      <label className="small text-muted mb-1">Check Out</label>
                      <DatePicker
                        selected={checkOut}
                        onChange={(d) => setCheckOut(d)}
                        selectsEnd
                        startDate={checkIn}
                        endDate={checkOut}
                        minDate={checkIn || undefined}
                        placeholderText="Select date"
                        className="form-control"
                      />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="fields">
                    <h3 className="heading mb-3">Choose Room Types</h3>
                    <div className="roomtype-grid">
                      <div className="roomtype-card">
                        <div className="img" style={{ backgroundImage: `url(${room1})` }} />
                        <div className="body">
                          <div className="title">Suite</div>
                          <div className="meta">Max 3 • 1 Bed</div>
                          <div className="price">${RATE.suite}/night</div>
                          <input type="number" min={0} value={roomTypes.suite} onChange={(e) => setRoomTypes({ ...roomTypes, suite: Math.max(0, parseInt(e.target.value || "0")) })} className="form-control qty" />
                        </div>
                      </div>
                      <div className="roomtype-card">
                        <div className="img" style={{ backgroundImage: `url(${room2})` }} />
                        <div className="body">
                          <div className="title">Deluxe</div>
                          <div className="meta">Max 2 • 1 Bed</div>
                          <div className="price">${RATE.deluxe}/night</div>
                          <input type="number" min={0} value={roomTypes.deluxe} onChange={(e) => setRoomTypes({ ...roomTypes, deluxe: Math.max(0, parseInt(e.target.value || "0")) })} className="form-control qty" />
                        </div>
                      </div>
                      <div className="roomtype-card">
                        <div className="img" style={{ backgroundImage: `url(${room3})` }} />
                        <div className="body">
                          <div className="title">Family</div>
                          <div className="meta">Max 5 • 3 Beds</div>
                          <div className="price">${RATE.family}/night</div>
                          <input type="number" min={0} value={roomTypes.family} onChange={(e) => setRoomTypes({ ...roomTypes, family: Math.max(0, parseInt(e.target.value || "0")) })} className="form-control qty" />
                        </div>
                      </div>
                      <div className="roomtype-card">
                        <div className="img" style={{ backgroundImage: `url(${room4})` }} />
                        <div className="body">
                          <div className="title">Classic</div>
                          <div className="meta">Max 2 • 1 Bed</div>
                          <div className="price">${RATE.classic}/night</div>
                          <input type="number" min={0} value={roomTypes.classic} onChange={(e) => setRoomTypes({ ...roomTypes, classic: Math.max(0, parseInt(e.target.value || "0")) })} className="form-control qty" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="fields">
                    <h3 className="heading mb-3">Guest Information</h3>
                    <div className="form-group">
                      <label className="small text-muted mb-1">Adults</label>
                      <input type="number" min={0} value={adults} onChange={(e) => setAdults(Math.max(0, parseInt(e.target.value || "0")))} className="form-control" />
                    </div>
                    <div className="form-group">
                      <label className="small text-muted mb-1">Children</label>
                      <input type="number" min={0} value={children} onChange={(e) => setChildren(Math.max(0, parseInt(e.target.value || "0")))} className="form-control" />
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="fields">
                    <h3 className="heading mb-3">Select Services</h3>
                    <div className="services-grid">
                      {(Object.keys(SERVICE_PRICES) as ServiceKey[]).map((k) => (
                        <label className={`service-item ${services[k] ? "active" : ""}`} key={k} htmlFor={`svc-${k}`}>
                          <div className="left">
                            <input className="form-check-input me-2" type="checkbox" id={`svc-${k}`} checked={services[k]} onChange={() => toggleService(k)} />
                            <span className="name">{k.charAt(0).toUpperCase() + k.slice(1)}</span>
                          </div>
                          <div className="right">
                            <span className="desc">{SERVICE_DESCRIPTIONS[k]}</span>
                            <span className="price ms-2">+${SERVICE_PRICES[k]}/night/room</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="fields">
                    <h3 className="heading mb-3">Review & Confirm</h3>
                    <ul className="review-list">
                      <li><span>Check In</span><strong>{checkIn ? checkIn.toLocaleDateString() : "-"}</strong></li>
                      <li><span>Check Out</span><strong>{checkOut ? checkOut.toLocaleDateString() : "-"}</strong></li>
                      <li><span>Nights</span><strong>{nights}</strong></li>
                      <li><span>Rooms</span><strong>{totalRooms} (Suite {roomTypes.suite}, Deluxe {roomTypes.deluxe}, Family {roomTypes.family}, Classic {roomTypes.classic})</strong></li>
                      <li><span>Guests</span><strong>{adults} Adults, {children} Children</strong></li>
                      <li><span>Services</span><strong>{(Object.keys(services) as ServiceKey[]).filter((k) => services[k]).join(", ") || "None"}</strong></li>
                      <li><span>Total</span><strong>${total}</strong></li>
                    </ul>
                  </div>
                )}

                <div className="d-flex justify-content-between mt-3">
                  <button className="btn btn-outline-secondary" type="button" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))}>Back</button>
                  {step < 5 ? (
                    <button className="btn btn-primary" type="button" disabled={!canNext()} onClick={() => setStep((s) => Math.min(5, s + 1))}>Next</button>
                  ) : (
                    <button className="btn btn-primary" type="button" onClick={() => alert("Booking submitted (placeholder)")}>Confirm</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default BookingWizard;