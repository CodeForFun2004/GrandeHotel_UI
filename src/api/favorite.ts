import instance from './axios';

// Favorites API client
// Backend expects userId either in body (POST) or as query (GET/DELETE)

export type FavoriteListResponse = {
  message: string;
  favorite: {
    _id: string;
    user: string | { _id: string };
    hotels: Array<string | { _id: string }>;
    createdAt?: string;
    updatedAt?: string;
  } | null;
  hotels: Array<{ _id: string; [k: string]: any }>;
};

export const getFavoritesByUser = async (userId: string) => {
  const res = await instance.get<FavoriteListResponse>(`/favorites`, { params: { userId } });
  return res.data;
};

export const checkFavorite = async (userId: string, hotelId: string) => {
  const res = await instance.get<{ isFavorited: boolean }>(`/favorites/check/${hotelId}`, { params: { userId } });
  return res.data;
};

export const addFavorite = async (userId: string, hotelId: string) => {
  const res = await instance.post(`/favorites`, { userId, hotelId });
  return res.data as { message: string };
};

export const removeFavorite = async (userId: string, hotelId: string) => {
  const res = await instance.delete(`/favorites/${hotelId}`, { params: { userId } });
  return res.data as { message: string };
};

export default { getFavoritesByUser, checkFavorite, addFavorite, removeFavorite };
