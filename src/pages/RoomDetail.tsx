import React from "react";
import { useParams, Link } from "react-router-dom";
import heroBg from "../assets/images/bg_1.jpg";
import room1 from "../assets/images/room-1.jpg";
import room2 from "../assets/images/room-2.jpg";
import room3 from "../assets/images/room-3.jpg";
import "./Rooms.css";
// Booking controls are handled in the reservation wizard; no DatePicker here.

const imageById: Record<string, string> = {
  "1": room1,
  "2": room2,
  "3": room3,
};

const RoomDetail: React.FC = () => {
  const { id = "1" } = useParams();
  const image = imageById[id] || room1;

  // Static price info; booking is handled in the reservation wizard
  const nightlyRate = 180;

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
          {/* Detail card reusing .room styles */}
          <div className="room room-detail mb-4">
            <div className="row g-0 align-items-stretch">
              <div className="col-lg-5">
                <div
                  className="img d-flex align-items-center justify-content-center"
                  style={{ backgroundImage: `url(${image})` }}
                />
              </div>
              <div className="col-lg-7 d-flex">
                <div className="text p-3 w-100">
                  <h3 className="mb-2">Deluxe Room</h3>
                  <p className="mb-2">
                    <span className="price mr-2">${nightlyRate.toFixed(2)}</span>{" "}
                    <span className="per">per night</span>
                  </p>
                  <p>
                    A spacious and elegant room featuring a comfortable king-size bed, modern amenities, and a beautiful view. Perfect for couples or solo travelers seeking luxury and comfort.
                  </p>
                  <ul className="list">
                    <li><span>Max:</span> 2 Persons</li>
                    <li><span>Size:</span> 40 m2</li>
                    <li><span>View:</span> Sea View</li>
                    <li><span>Bed:</span> 1</li>
                  </ul>

                  <div className="d-flex gap-2 mt-2">
                    <Link to="/reservation" className="btn-reserve">Reserve</Link>
                    <Link to="/rooms" className="btn btn-outline-secondary">Back to Rooms</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews and ratings section */}
          <div className="mb-3">
            <h4 className="mb-2">Guest Reviews & Ratings</h4>
            <div className="d-flex align-items-center gap-3 mb-3">
              <div className="h3 mb-0">4.5</div>
              <div>
                <div className="small text-muted">Average rating</div>
                <div className="text-warning">★★★★★</div>
              </div>
            </div>

            <ul className="review-list">
              {[
                { name: "Alex Nguyen", rating: 5, text: "Beautiful room with a fantastic sea view. Staff were amazing!" },
                { name: "Linh Tran", rating: 4, text: "Very clean and comfortable. The bed was super cozy." },
                { name: "John Doe", rating: 4, text: "Good location and amenities. Check-in was smooth." },
              ].map((r, i) => (
                <li key={i}>
                  <div style={{ width: "100%" }}>
                    <div className="d-flex justify-content-between">
                      <strong>{r.name}</strong>
                      <span className="text-warning">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                    </div>
                    <div className="small text-muted">Stayed in Deluxe Room</div>
                    <p className="mb-0 mt-1">{r.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
};

export default RoomDetail;


