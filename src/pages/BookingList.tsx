import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

interface Booking {
  id: string;
  status: BookingStatus;
  guestName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  createdAt: string;
}

const mockFetchBookings = (): Promise<Booking[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: "R001",
          status: "pending",
          guestName: "John Doe",
          roomNumber: "101",
          checkIn: "2025-10-01",
          checkOut: "2025-10-05",
          createdAt: "2025-09-20",
        },
        {
          id: "R002",
          status: "paid",
          guestName: "John Doe",
          roomNumber: "202",
          checkIn: "2025-11-10",
          checkOut: "2025-11-15",
          createdAt: "2025-10-15",
        },
        {
          id: "R003",
          status: "checkedin",
          guestName: "John Doe",
          roomNumber: "303",
          checkIn: "2025-09-20",
          checkOut: "2025-09-25",
          createdAt: "2025-09-10",
        },
        {
          id: "R004",
          status: "checkout",
          guestName: "John Doe",
          roomNumber: "404",
          checkIn: "2025-08-01",
          checkOut: "2025-08-05",
          createdAt: "2025-07-20",
        },
      ]);
    }, 500);
  });
};

function getStayDays(checkIn: string, checkOut: string) {
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  return Math.max(1, Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60 * 24)));
}

const BookingList: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mockFetchBookings().then((data) => {
      setBookings(data);
      setLoading(false);
    });
  }, []);

  const handleCancel = (id: string) => {
    if (window.confirm("Are you sure you want to cancel this booking?")) {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id ? { ...b, status: "pending" } : b // You may want to set to a "cancelled" status in real app
        )
      );
      // Add API call here in real app
    }
  };

  if (loading) {
    return <div>Loading booking details...</div>;
  }

  return (
    <div className="booking-detail-root">
      <Header />
      <section className="booking-detail-hero">
        <div className="booking-detail-hero-overlay" />
        <div className="booking-detail-hero-content">
          <h1>My Reservations</h1>
          <p>View all your current and past reservations</p>
        </div>
      </section>
      <div className="booking-detail-table-container">
        <table className="booking-detail-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Check-in</th>
              <th>Days</th>
              <th>Created At</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.id}</td>
                <td>{booking.checkIn}</td>
                <td>{getStayDays(booking.checkIn, booking.checkOut)}</td>
                <td>{booking.createdAt}</td>
                <td>
                  <span className={`booking-status booking-status-${booking.status}`}>
                    {statusLabels[booking.status]}
                  </span>
                </td>
                <td>
                  <Link to={`/reservation/${booking.id}`}>View Details</Link>
                  {["pending", "approved", "paid"].includes(booking.status) && (
                    <button
                      style={{
                        marginLeft: 12,
                        background: "#e53e3e",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        padding: "6px 14px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                      onClick={() => handleCancel(booking.id)}
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="booking-detail-back-btn">
          <Link to="/reservation">Back to Reservations</Link>
        </div>
      </div>
    </div>
  );
};

export default BookingList;