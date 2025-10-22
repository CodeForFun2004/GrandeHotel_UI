import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "./Booking.css";
import Header from "../components/common/Header";

type BookingStatus = "pending" | "approved" | "paid" | "checkedin" | "checkout";

const statusLabels: Record<BookingStatus, string> = {
  pending: "Pending: Waiting for hotel's approval",
  approved: "Approved: Hotel approved, waiting for deposit",
  paid: "Paid: Deposited, can stay at the hotel when time comes",
  checkedin: "Checked in: Currently staying",
  checkout: "Checkout: Stay completed",
};

interface BookingDetailData {
  id: string;
  status: BookingStatus;
  guestName: string;
  roomDetails: { type: string; quantity: number }[];
  services: string[];
  numAdults: number;
  numChildren: number;
  checkIn: string;
  checkOut: string;
  createdAt: string;
}

const mockFetchBookingDetail = (id: string): Promise<BookingDetailData> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id,
        status: "paid",
        guestName: "John Doe",
        roomDetails: [
          { type: "Deluxe", quantity: 2 },
          { type: "Suite", quantity: 1 },
        ],
        services: ["Breakfast", "Airport Pickup"],
        numAdults: 3,
        numChildren: 1,
        checkIn: "2025-11-10",
        checkOut: "2025-11-15",
        createdAt: "2025-10-15",
      });
    }, 500);
  });
};

const BookingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<BookingDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      mockFetchBookingDetail(id).then((data) => {
        setBooking(data);
        setLoading(false);
      });
    }
  }, [id]);

  const handleCancel = () => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      if (booking) {
        setBooking({ ...booking, status: "pending" }); // UI only, for demo
      }
      // In real app, call API here
      setTimeout(() => {
        navigate("/reservation/list");
      }, 800);
    }
  };

  if (loading) {
    return <div>Loading booking details...</div>;
  }

  if (!booking) {
    return <div>Booking not found.</div>;
  }

  return (
    <div className="booking-detail-root">
      <Header />
      <section className="booking-detail-hero">
        <div className="booking-detail-hero-overlay" />
        <div className="booking-detail-hero-content">
          <h1>Reservation Detail</h1>
          <p>Booking ID: {booking.id}</p>
        </div>
      </section>
      <div className="booking-detail-table-container">
        <table className="booking-detail-table">
          <tbody>
            <tr>
              <td>Status</td>
              <td>
                <span
                  className={`booking-status booking-status-${booking.status}`}
                >
                  {statusLabels[booking.status]}
                </span>
              </td>
            </tr>
            <tr>
              <td>Guest Name</td>
              <td>{booking.guestName}</td>
            </tr>
            <tr>
              <td>Check-in</td>
              <td>{booking.checkIn}</td>
            </tr>
            <tr>
              <td>Check-out</td>
              <td>{booking.checkOut}</td>
            </tr>
            <tr>
              <td>Created At</td>
              <td>{booking.createdAt}</td>
            </tr>
            <tr>
              <td>Room Types</td>
              <td>
                {booking.roomDetails.map((room, idx) => (
                  <div key={idx}>
                    {room.type} x {room.quantity}
                  </div>
                ))}
              </td>
            </tr>
            <tr>
              <td>Services</td>
              <td>{booking.services.join(", ")}</td>
            </tr>
            <tr>
              <td>Adults</td>
              <td>{booking.numAdults}</td>
            </tr>
            <tr>
              <td>Children</td>
              <td>{booking.numChildren}</td>
            </tr>
          </tbody>
        </table>
        <div
          className="booking-detail-back-btn"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <Link to="/reservation/list">Back to My Reservations</Link>
          {["pending", "approved", "paid"].includes(booking.status) && (
            <button
              style={{
                background: "#e53e3e",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "10px 28px",
                fontWeight: 600,
                fontSize: 16,
                cursor: "pointer",
              }}
              onClick={handleCancel}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;