import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import heroBg from "../assets/images/login.avif";
import "./Hotels.css";
import type { Hotel } from "../types/entities";
import * as hotelApi from "../api/hotel";
import HotelCard from "../components/common/HotelCard";
import BookingForm from "./landing/components/BookingForm";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const Rooms: React.FC = () => {
  const query = useQuery();
  const city = query.get("city") || "";
  const checkInDate = query.get("checkInDate") || "";
  const checkOutDate = query.get("checkOutDate") || "";
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(12);
  const [total, setTotal] = useState<number>(0);

  const location = useLocation();

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (city) {
          // Search hotels by location
          const res = await hotelApi.searchHotelsByLocation({
            city,
            checkInDate,
            checkOutDate,
            page,
            limit,
          });
          const results = Array.isArray(res.results) ? res.results : [];
          setTotal(res.total || 0);
          setHotels(
            results.map(
              (r: any) =>
                ({
                  _id: r.hotelId ?? r._id,
                  name: r.name ?? r.hotelName ?? r.title,
                  address: r.address ?? r.address,
                  city: r.city ?? city,
                  images: r.images ?? [],
                  minPricePerNight: r.minPricePerNight ?? undefined,
                } as Hotel)
            )
          );
        } else {
          // No query — load all
          const res = await hotelApi.getAllHotels({ page, limit });
          setTotal(res.total || 0);
          setHotels(res.results || []);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load hotels");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, location.search, page]);

  return (
    <>
      {/* ---------- HERO ---------- */}
      <div className="hero-wrap" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="overlay"></div>
        <div className="container">
          <div className="row no-gutters slider-text d-flex align-itemd-end justify-content-center">
            <div className="col-md-9 ftco-animate text-center d-flex align-items-end justify-content-center">
              <div className="text">
                <p className="breadcrumbs mb-2">
                  <span className="mr-2">
                    <a href="/">Home</a>
                  </span>
                  <span>›</span>
                  <span>Hotels</span>
                </p>
                <h1 className="mb-4 bread">Hotels</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- BODY ---------- */}
      <section className="ftco-section bg-light">
        <div className="container">
          <div className="mb-4">
            <BookingForm />
          </div>

          <div>
            {loading && <p>Loading hotels...</p>}
            {error && <p className="text-danger">{error}</p>}
            {!loading && !error && hotels.length === 0 && <p>No hotels found.</p>}

            <div className="row">
              {/* ---------- FILTER ---------- */}
              <div className="col-md-3">
                <div className="filter-box p-3">
                  <h5>Kết quả</h5>
                  <hr />
                  <h6>Thương hiệu</h6>
                  <ul>
                    <li>
                      <label>
                        <input type="checkbox" /> Luxury
                      </label>
                    </li>
                    <li>
                      <label>
                        <input type="checkbox" /> Grand
                      </label>
                    </li>
                    <li>
                      <label>
                        <input type="checkbox" /> Holiday
                      </label>
                    </li>
                    <li>
                      <label>
                        <input type="checkbox" /> Mường Thanh
                      </label>
                    </li>
                  </ul>
                </div>
              </div>

              {/* ---------- HOTEL LIST ---------- */}
              <div className="col-md-9">
                {hotels.map((h) => (
                  <HotelCard key={h._id} hotel={h} />
                ))}

                {/* ---------- PAGINATION ---------- */}
                {total > limit && (
                  <div className="pagination-container">
                    <button
                      className="page-btn"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      ‹ Previous
                    </button>
                    <span className="page-info">{page}</span>
                    <button
                      className="page-btn"
                      disabled={page * limit >= total}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next ›
                    </button>
                    <span className="page-total">Total: {total}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Rooms;
