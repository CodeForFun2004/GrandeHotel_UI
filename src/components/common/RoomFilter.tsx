import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays, faUserGroup } from "@fortawesome/free-solid-svg-icons";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const Sidebar: React.FC = () => {
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [adults, setAdults] = useState<number>(0);
  const [children, setChildren] = useState<number>(0);
  const [minPrice, setMinPrice] = useState<number>(25000);
  const [maxPrice, setMaxPrice] = useState<number>(50000);

  return (
    <div className="col-lg-3 sidebar">
      <div className="sidebar-wrap bg-light ftco-animate">
        <h3 className="heading mb-4">Advanced Search</h3>
        <form>
          <div className="fields">
            <div className="form-group position-relative">
              <span className="icon"><FontAwesomeIcon icon={faCalendarDays} /></span>
              <DatePicker
                selected={checkIn}
                onChange={(date) => setCheckIn(date)}
                selectsStart
                startDate={checkIn}
                endDate={checkOut}
                placeholderText="Check In Date"
                className="form-control checkin_date ps-5"
              />
            </div>
            <div className="form-group position-relative">
              <span className="icon"><FontAwesomeIcon icon={faCalendarDays} /></span>
              <DatePicker
                selected={checkOut}
                onChange={(date) => setCheckOut(date)}
                selectsEnd
                startDate={checkIn}
                endDate={checkOut}
                minDate={checkIn || undefined}
                placeholderText="Check Out Date"
                className="form-control checkout_date ps-5"
              />
            </div>
            <div className="form-group">
              <div className="select-wrap one-third">
                <select className="form-control" defaultValue="">
                  <option value="" disabled>
                    Select Room
                  </option>
                  <option value="Suite">Suite</option>
                  <option value="Deluxe">Deluxe</option>
                  <option value="Family">Family</option>
                  <option value="Classic">Classic</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <div className="select-wrap one-third">
                <span className="icon left"><FontAwesomeIcon icon={faUserGroup} /></span>
                <select className="form-control ps-5" value={adults} onChange={(e) => setAdults(parseInt(e.target.value))}>
                  <option value={0}>0 Adult</option>
                  <option value={1}>1 Adult</option>
                  <option value={2}>2 Adults</option>
                  <option value={3}>3 Adults</option>
                  <option value={4}>4 Adults</option>
                  <option value={5}>5+ Adults</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <div className="select-wrap one-third">
                <span className="icon left"><FontAwesomeIcon icon={faUserGroup} /></span>
                <select className="form-control ps-5" value={children} onChange={(e) => setChildren(parseInt(e.target.value))}>
                  <option value={0}>0 Children</option>
                  <option value={1}>1 Child</option>
                  <option value={2}>2 Children</option>
                  <option value={3}>3 Children</option>
                  <option value={4}>4 Children</option>
                  <option value={5}>5+ Children</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <div className="d-flex justify-content-between text-muted small mb-2">
                <span>{minPrice}</span>
                <span>-</span>
                <span>{maxPrice}</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={100000}
                  step={500}
                  value={minPrice}
                  onChange={(e) => setMinPrice(Math.min(parseInt(e.target.value), maxPrice))}
                  className="form-range flex-fill"
                />
                <input
                  type="range"
                  min={0}
                  max={100000}
                  step={500}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Math.max(parseInt(e.target.value), minPrice))}
                  className="form-range flex-fill"
                />
              </div>
            </div>
            <div className="form-group">
              <input
                type="submit"
                value="Search"
                className="btn btn-primary py-3 px-5 w-100"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Sidebar;
