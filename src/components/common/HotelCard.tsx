import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './HotelCard.css';
import type { Hotel } from '../../types/entities';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';

type Props = {
  hotel: Hotel;
  priceLabel?: string;
  isFavorited?: boolean;
  onToggleFavorite?: (hotelId: string, next: boolean) => void;
};

const HotelCard: React.FC<Props> = ({ hotel, priceLabel, isFavorited, onToggleFavorite }) => {
  const img = hotel.images && hotel.images.length ? hotel.images[0] : '/placeholder-hotel.jpg';

  // Normalize price value which might be Number, string, or BSON Decimal128-like object
  const rawPrice = (hotel as any).minPricePerNight ?? (hotel.roomTypes && hotel.roomTypes.length ? (hotel.roomTypes[0] as any).price : undefined);
  let priceNum: number | undefined;
  if (rawPrice != null) {
    if (typeof rawPrice === 'number') {
      priceNum = rawPrice;
    } else if (typeof rawPrice === 'string') {
      const n = Number(rawPrice);
      if (!isNaN(n)) priceNum = n;
    } else if (typeof rawPrice === 'object') {
      // Handle Decimal128-like objects and other BSON shapes
      // 1) { $numberDecimal: '12345.67' }
      if (rawPrice.$numberDecimal) {
        const n = Number(rawPrice.$numberDecimal);
        if (!isNaN(n)) priceNum = n;
      }
      // 2) Decimal128 instance may have toNumber() or toString()
      if (priceNum == null && typeof rawPrice.toNumber === 'function') {
        try {
          const n = rawPrice.toNumber();
          if (typeof n === 'number' && !isNaN(n)) priceNum = n;
        } catch (e) {
          // ignore
        }
      }
      if (priceNum == null && typeof rawPrice.toString === 'function') {
        const s = rawPrice.toString();
        // extract first numeric portion (handles strings like "Decimal128('1000000')")
        const m = s.match(/-?\d+(?:\.\d+)?/);
        if (m) {
          const n = Number(m[0]);
          if (!isNaN(n)) priceNum = n;
        }
      }
    }
  }

  const priceText = priceNum != null ? `${priceNum.toLocaleString()}₫` : '—';

  return (
    <div className="hotel-card-wrap">
      <div className="hotel-card-inner">
        <div className="hotel-image" style={{ backgroundImage: `url(${img})` }}>
          <button
            className={`favorite-btn ${isFavorited ? 'is-favorited' : ''}`}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            title={isFavorited ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const hotelId = (hotel._id as string) ?? '';
              if (!hotelId) return;
              onToggleFavorite?.(hotelId, !isFavorited);
            }}
          >
            <FontAwesomeIcon
              icon={faHeart}
              className="favorite-heart"
              style={{ color: isFavorited ? '#e0245e' : '#c4c7cc', width: 22, height: 22 }}
            />
          </button>
          <div className="hotel-image-overlay">Xem thêm ảnh</div>
        </div>
        <div className="hotel-info">
          <h4 className="hotel-name">{hotel.name}</h4>
          <p className="hotel-address">{hotel.address}</p>
          <div className="hotel-meta">
            <div className="hotel-rating">{hotel.rating ?? '4.9'}/5 (16 reviews)</div>
            <div className="hotel-price">{priceLabel ?? 'Chỉ từ'} <span className="price-num">{priceText}</span></div>
          </div>
        </div>
        <div className="hotel-action">
          {/* preserve existing query params (dates, rooms, voucher) when navigating to room page */}
          <HotelCardActionLink hotelId={(hotel._id as string) ?? ''} />
        </div>
      </div>
    </div>
  );
};

const HotelCardActionLink: React.FC<{ hotelId: string }> = ({ hotelId }) => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  params.set('hotel', hotelId);
  const href = `/rooms?${params.toString()}`;
  return <Link to={href} className="btn-book">ĐẶT NGAY</Link>;
};

export default HotelCard;
