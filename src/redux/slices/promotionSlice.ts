import type { PayloadAction } from '@reduxjs/toolkit';
import type { IPromotionItem } from 'src/sections/promotion/promotion-item';

import { createSlice } from '@reduxjs/toolkit';

import { _promotions } from 'src/_mock';

// Initialize state from mock data
const initialState: IPromotionItem[] = (_promotions as unknown as IPromotionItem[]).map((p) => ({
  ...p,
  _id: (p as any).id || p.promotionCode,
}));

const promotionSlice = createSlice({
  name: 'promotions',
  initialState,
  reducers: {
    lockPromotion: (state, action: PayloadAction<string>) => {
      const promotion = state.find((p) => (p._id || (p as any).id || p.promotionCode) === action.payload);
      if (promotion) {
        promotion.isLock = true;
      }
    },
    unlockPromotion: (state, action: PayloadAction<string>) => {
      const promotion = state.find((p) => (p._id || (p as any).id || p.promotionCode) === action.payload);
      if (promotion) {
        promotion.isLock = false;
      }
    },
    updatePromotion: (state, action: PayloadAction<IPromotionItem>) => {
      const index = state.findIndex(
        (p) => (p._id || (p as any).id || p.promotionCode) === (action.payload._id || (action.payload as any).id || action.payload.promotionCode)
      );
      if (index !== -1) {
        state[index] = { ...state[index], ...action.payload };
      }
    },
    deletePromotion: (state, action: PayloadAction<string>) =>
      state.filter((p) => (p._id || (p as any).id || p.promotionCode) !== action.payload),
    addPromotion: (state, action: PayloadAction<IPromotionItem>) => {
      state.push(action.payload);
    },
  },
});

export const { lockPromotion, unlockPromotion, updatePromotion, deletePromotion, addPromotion } = promotionSlice.actions;
export default promotionSlice.reducer;
