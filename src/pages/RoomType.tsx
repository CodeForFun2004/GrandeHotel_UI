import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import RoomCard from "../components/common/RoomCard";
import heroBg from "../assets/images/bg_1.jpg";
import room1 from "../assets/images/room-1.jpg";
import room2 from "../assets/images/room-2.jpg";
import "./Rooms.css";

const Rooms: React.FC = () => {
  // Mock hotel list (same set as BookingForm)
  const hotels = [
    "Mường Thanh Luxury Hạ Long Centre",
    "Mường Thanh Grand Hà Nội",
    "Mường Thanh Grand Hà Nội Centre",
    "Mường Thanh Holiday Suối Mơ",
    "Mường Thanh Grand Xa La",
    "Mường Thanh Cửa Đông",
  ];

  // Each hotel has a different number of rooms; types below are repeated to match
  const hotelRoomsCount: Record<string, number> = {
    "Mường Thanh Luxury Hạ Long Centre": 9,
    "Mường Thanh Grand Hà Nội": 6,
    "Mường Thanh Grand Hà Nội Centre": 12,
    "Mường Thanh Holiday Suối Mơ": 5,
    "Mường Thanh Grand Xa La": 8,
    "Mường Thanh Cửa Đông": 4,
  };

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const hotelParam = searchParams.get("hotel");
  const checkinParam = searchParams.get("checkin");
  const checkoutParam = searchParams.get("checkout");
  const roomsParam = searchParams.get("rooms");

  const [selectedHotel, setSelectedHotel] = useState<string>(hotelParam && hotels.includes(hotelParam) ? hotelParam : hotels[0]);
  const requestedRooms: number = (() => {
    const n = roomsParam ? parseInt(roomsParam, 10) : NaN;
    return Number.isFinite(n) && n > 0 ? n : NaN;
  })();
  const searchDates: { checkin?: string; checkout?: string } = {
    checkin: checkinParam || undefined,
    checkout: checkoutParam || undefined,
  };
  const [filters, setFilters] = useState<Record<keyof typeof roomTypesByCode, boolean>>({
    suite: true,
    family: true,
    classic: true,
    deluxe: true,
  });

  // Base room types (reused across hotels)
  const roomTypesByCode = {
    suite: {
      code: "suite",
      title: "Suite Room",
      price: 120,
      image: room1,
      size: "45 m2",
      view: "Sea View",
      max: 3,
      bed: 1,
    },
    family: {
      code: "family",
      title: "Family Room",
      price: 200,
      image: room2,
      size: "60 m2",
      view: "Garden View",
      max: 5,
      bed: 3,
    },
    classic: {
      code: "classic",
      title: "Classic Room",
      price: 150,
      image: room1,
      size: "35 m2",
      view: "City View",
      max: 2,
      bed: 1,
    },
    deluxe: {
      code: "deluxe",
      title: "Deluxe Room",
      price: 180,
      image: room2,
      size: "40 m2",
      view: "Sea View",
      max: 2,
      bed: 1,
    },
  } as const;

  // Per-hotel room-type mix (counts for each type)
  const hotelRoomMix: Record<string, Partial<Record<keyof typeof roomTypesByCode, number>>> = {
    "Mường Thanh Luxury Hạ Long Centre": { suite: 3, family: 2, classic: 2, deluxe: 2 },
    "Mường Thanh Grand Hà Nội": { suite: 1, family: 2, classic: 2, deluxe: 1 },
    "Mường Thanh Grand Hà Nội Centre": { suite: 4, family: 3, classic: 3, deluxe: 2 },
    "Mường Thanh Holiday Suối Mơ": { suite: 1, family: 1, classic: 2, deluxe: 1 },
    "Mường Thanh Grand Xa La": { suite: 2, family: 2, classic: 3, deluxe: 1 },
    "Mường Thanh Cửa Đông": { suite: 1, family: 1, classic: 1, deluxe: 1 },
  };

  // Compute displayed rooms from per-hotel room-type mix
  const displayedRooms = useMemo(() => {
    const mix = hotelRoomMix[selectedHotel];
    // fallback: if no mix defined, use hotelRoomsCount repeating base order: suite, family, classic, deluxe
    if (!mix) {
      const order: (keyof typeof roomTypesByCode)[] = ["suite", "family", "classic", "deluxe"];
      const count = hotelRoomsCount[selectedHotel] ?? order.length;
      const list = Array.from({ length: count }, (_, i) => {
        const code = order[i % order.length];
        const base = roomTypesByCode[code];
        return { ...base, id: i + 1 };
      });
      const filtered = list.filter((r) => filters[r.code as keyof typeof filters]);
      return Number.isFinite(requestedRooms) ? filtered.slice(0, requestedRooms) : filtered;
    }

    const rooms: Array<ReturnType<typeof buildRoom>> = [];
    let idSeq = 1;
    const order: (keyof typeof roomTypesByCode)[] = ["suite", "family", "classic", "deluxe"];
    for (const code of order) {
      const cnt = mix[code] ?? 0;
      for (let i = 0; i < cnt; i++) {
        rooms.push(buildRoom(code, idSeq++));
      }
    }
    const filtered = rooms.filter((r) => filters[r.code as keyof typeof filters]);
    return Number.isFinite(requestedRooms) ? filtered.slice(0, requestedRooms) : filtered;
  }, [selectedHotel, filters, requestedRooms]);

  function buildRoom(code: keyof typeof roomTypesByCode, id: number) {
    const base = roomTypesByCode[code];
    // Optionally tweak price lightly per hotel/type to reflect variety (kept minimal here)
    return {
      ...base,
      id,
    };
  }

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
                    <a href="/">Home</a>
                  </span>{" "}
                  <span>Rooms</span>
                </p>
                <h1 className="mb-4 bread">Rooms</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rooms Section */}
      <section className="ftco-section bg-light">
        <div className="container">
          {/* Search summary */}
          {(hotelParam || searchDates.checkin || searchDates.checkout || Number.isFinite(requestedRooms)) && (
            <div className="alert alert-light border mb-4" role="status">
              <strong>Search:</strong>
              <span> {hotelParam || selectedHotel}</span>
              {searchDates.checkin && <span> • Check-in: {searchDates.checkin}</span>}
              {searchDates.checkout && <span> • Check-out: {searchDates.checkout}</span>}
              {Number.isFinite(requestedRooms) && <span> • Rooms: {requestedRooms}</span>}
            </div>
          )}
          {/* Centered hotel dropdown */}
          <div className="rooms-controls mb-4 d-flex justify-content-center">
            <div className="d-flex align-items-center gap-2">
              <label htmlFor="hotelSelect" className="mb-0 fw-semibold">Choose hotel:</label>
              <select
                id="hotelSelect"
                className="form-select hotel-select"
                value={selectedHotel}
                onChange={(e) => setSelectedHotel(e.target.value)}
              >
                {hotels.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="row">
            {/* Left sidebar: reserve button outside filter panel */}
            <aside className="col-lg-3 sidebar">
              {/* Reserve button outside the filter box */}
              <div className="mb-3">
                <Link to="/book" className="btn-reserve w-100">Reserve your rooms now</Link>
              </div>
              <div className="sidebar-wrap">
                <div className="fields">
                  <div className="form-group">
                    <div className="heading">Filter by room types</div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="filter-suite"
                        checked={filters.suite}
                        onChange={(e) => setFilters((f) => ({ ...f, suite: e.target.checked }))}
                      />
                      <label className="form-check-label" htmlFor="filter-suite">Suite</label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="filter-family"
                        checked={filters.family}
                        onChange={(e) => setFilters((f) => ({ ...f, family: e.target.checked }))}
                      />
                      <label className="form-check-label" htmlFor="filter-family">Family</label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="filter-classic"
                        checked={filters.classic}
                        onChange={(e) => setFilters((f) => ({ ...f, classic: e.target.checked }))}
                      />
                      <label className="form-check-label" htmlFor="filter-classic">Classic</label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="filter-deluxe"
                        checked={filters.deluxe}
                        onChange={(e) => setFilters((f) => ({ ...f, deluxe: e.target.checked }))}
                      />
                      <label className="form-check-label" htmlFor="filter-deluxe">Deluxe</label>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Rooms */}
            <div className="col-lg-9">
              <div className="row">
                {displayedRooms.map((room, idx) => (
                  <RoomCard key={`${selectedHotel}-${idx}`} {...room} />
                ))}
              </div>
            </div> 
          </div>
        </div>
      </section>
    </>
  );
};

export default Rooms;