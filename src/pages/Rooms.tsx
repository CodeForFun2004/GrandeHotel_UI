import React from "react";
import { Link } from "react-router-dom";
import RoomCard from "../components/common/RoomCard";
import heroBg from "../assets/images/bg_1.jpg";
import room1 from "../assets/images/room-1.jpg";
import room2 from "../assets/images/room-2.jpg";
import "./Rooms.css";

const Rooms: React.FC = () => {
  const roomData = [
    {
      id: 1,
      title: "Suite Room",
      price: 120,
      image: room1,
      size: "45 m2",
      view: "Sea View",
      max: 3,
      bed: 1,
    },
    {
      id: 2,
      title: "Family Room",
      price: 200,
      image: room2,
      size: "60 m2",
      view: "Garden View",
      max: 5,
      bed: 3,
    },
    {
      id: 3,
      title: "Classic Room",
      price: 150,
      image: room1,
      size: "35 m2",
      view: "City View",
      max: 2,
      bed: 1,
    },
    {
      id: 4,
      title: "Deluxe Room",
      price: 180,
      image: room2,
      size: "40 m2",
      view: "Sea View",
      max: 2,
      bed: 1,
    },
    // add more rooms here...
  ];

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
          <div className="mb-4">
            <Link to="/book" className="btn-reserve">Reserve your rooms now</Link>
          </div>
          <div className="row">
            {/* Rooms */}
            <div className="col-lg-9">
              <div className="row">
                {roomData.map((room, idx) => (
                  <RoomCard key={idx} {...room} />
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