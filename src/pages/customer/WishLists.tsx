import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store';
import * as favoriteApi from '../../api/favorite';
import type { Hotel } from '../../types/entities';
import HotelCard from '../../components/common/HotelCard';
import ProfileSidebar from './components/ProfileSidebar';
import { DEFAULT_AVATAR } from './constants/profile.constants';

const GlobalFix: React.FC = () => (
  <style>{`
    :root { --grey:#6b7280; --border:#e7dfe4; --split:#f3f4f6; --text:#1f2937; }
    .ph::placeholder { color:#9ca3af; opacity:.9; }
  `}</style>
);

const WishLists: React.FC = () => {
  const user = useSelector((s: RootState) => s.auth.user);
  const userId = useMemo(() => (user as any)?._id ?? (user as any)?.id ?? '', [user]);
  const avatarUrl = (user as any)?.avatar?.trim?.() || DEFAULT_AVATAR;
  const fullName = (user as any)?.fullname || (user as any)?.username || 'Your name';
  const role = (user as any)?.role || 'customer';

  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    async function load() {
      setLoading(true); setError(null);
      try {
        const res = await favoriteApi.getFavoritesByUser(userId);
        const hotelsArr = (res.hotels || []) as any[];
        const ids = new Set<string>(hotelsArr.map(h => h._id ?? h.id).filter(Boolean));
        if (mounted) {
          setFavoriteIds(ids);
          setHotels(hotelsArr as Hotel[]);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load favorites');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [userId]);

  const handleToggleFavorite = async (hotelId: string, next: boolean) => {
    if (!userId) return;
    // Optimistic update: toggle local favorite state and optionally remove from list on unfavorite
    setFavoriteIds(prev => {
      const copy = new Set(prev);
      if (next) copy.add(hotelId); else copy.delete(hotelId);
      return copy;
    });
    if (!next) {
      // remove from visual list
      setHotels(prev => prev.filter(h => ((h._id as string) ?? '') !== hotelId));
    }
    try {
      if (next) await favoriteApi.addFavorite(userId, hotelId);
      else await favoriteApi.removeFavorite(userId, hotelId);
    } catch (e) {
      // rollback
      setFavoriteIds(prev => {
        const copy = new Set(prev);
        if (next) copy.delete(hotelId); else copy.add(hotelId);
        return copy;
      });
      if (!next) {
        // if we removed from list, restore it by refetching minimal
        try {
          const res = await favoriteApi.getFavoritesByUser(userId);
          setHotels((res.hotels || []) as Hotel[]);
        } catch {
          // ignore
        }
      }
      alert('Không thể cập nhật yêu thích. Vui lòng thử lại.');
    }
  };

  return (
    <div className="profile-page" style={{ background: '#fff', minHeight: '100vh' }}>
      <GlobalFix />
      <div style={{ height: 80, background: '#000' }} />

      <div
        style={{
          width: '100%',
          padding: 24,
          display: 'grid',
          gridTemplateColumns: '25% 75%',
          gap: 24,
          boxSizing: 'border-box',
        }}
      >
        <ProfileSidebar avatarUrl={avatarUrl} name={fullName} role={role} />

        <section
          style={{
            background: '#fff',
            border: '1px solid #f1f5f9',
            borderRadius: 16,
            padding: 24,
          }}
        >
          <h3 style={{ marginBottom: 16 }}>Danh sách yêu thích</h3>
          {!userId && <p>Vui lòng đăng nhập để xem danh sách yêu thích.</p>}
          {userId && (
            <>
              {loading && <p>Đang tải danh sách...</p>}
              {error && <p className="text-danger">{error}</p>}
              {!loading && !error && hotels.length === 0 && (
                <p>Hiện chưa có khách sạn yêu thích nào.</p>
              )}

              <div>
                {hotels.map((h) => (
                  <HotelCard
                    key={(h._id as string) ?? ''}
                    hotel={h}
                    isFavorited={favoriteIds.has((h._id as string) ?? '')}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default WishLists;
