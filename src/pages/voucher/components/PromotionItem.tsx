import { toast } from 'sonner';
// src/components/promotion-item.tsx
import React, { useState, useCallback } from "react";

import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import LockIcon from '@mui/icons-material/Lock';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LockOpenIcon from '@mui/icons-material/LockOpen';

import { useAppDispatch } from 'src/store/hooks';
import { lockPromotion, unlockPromotion, updatePromotion, deletePromotion } from 'src/store/slices/promotionSlice';

import { Iconify } from 'src/components/iconify';

/** ==== Model khớp backend mongoose ==== */
export type IPromotionItem = {
  _id?: string;
  title: string;
  description?: string;
  promotionCode: string;           // unique
  discountPercent: number;         // 20 => 20%
  expiryDate: string | Date;
  minOrder?: number;               // default 0
  isLock?: boolean;                // default false
  image?: string;                  // url - KHÔNG DÙNG, chỉ để trong model
  requiredPoints?: number;         // default 0
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

type Props = {
  item: IPromotionItem;
  className?: string;
  onClick?: () => void;
  onLock?: (item: IPromotionItem) => void;
  onUnlock?: (item: IPromotionItem) => void;
  onUpdate?: (item: IPromotionItem) => void;
  onDelete?: (item: IPromotionItem) => void;
};

const fmtDate = (d: string | Date) => {
  const x = typeof d === "string" ? new Date(d) : d;
  if (isNaN(x.getTime())) return "";
  const dd = String(x.getDate()).padStart(2, "0");
  const mm = String(x.getMonth() + 1).padStart(2, "0");
  const yyyy = x.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const GiftIcon = ({ fill = "#FFFFFF", size = 48 }: { fill?: string; size?: number }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size}
    height={size}
    style={{ display: 'block' }}
    aria-hidden="true"
  >
    <path fill={fill} d="M20 7h-2.18A3 3 0 1 0 13 5h-2a3 3 0 1 0-4.82 2H4a1 1 0 0 0-1 1v3h18V8a1 1 0 0 0-1-1ZM9 4a1 1 0 0 1 0 2H7a1 1 0 0 1 0-2h2Zm8 2h-2a1 1 0 0 1 0-2h2a1 1 0 1 1 0 2ZM3 13v7a1 1 0 0 0 1 1h7v-8H3Zm10 0v8h7a1 1 0 0 0 1-1v-7h-8Z"/>
  </svg>
);

export default function PromotionItem({
  item,
  className,
  onClick,
  onLock,
  onUnlock,
  onUpdate,
  onDelete,
}: Props) {
  const {
    title,
    description,
    promotionCode,
    discountPercent,
    expiryDate,
    isLock = false,
    requiredPoints = 0,
  } = item;

  const dispatch = useAppDispatch();
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const openMenu = Boolean(menuAnchorEl);

  const itemId = item._id || (item as any).id || item.promotionCode;

  const handleOpenMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation(); // Prevent card onClick
    setMenuAnchorEl(event.currentTarget);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setMenuAnchorEl(null);
  }, []);

  const handleLock = useCallback(() => {
    handleCloseMenu();
    dispatch(lockPromotion(itemId));
    toast.info('Đã khóa khuyến mãi', { description: item.promotionCode });
    onLock?.(item);
  }, [item, itemId, dispatch, onLock, handleCloseMenu]);

  const handleUnlock = useCallback(() => {
    handleCloseMenu();
    dispatch(unlockPromotion(itemId));
    toast.info('Đã mở khóa khuyến mãi', { description: item.promotionCode });
    onUnlock?.(item);
  }, [item, itemId, dispatch, onUnlock, handleCloseMenu]);

  const handleUpdate = useCallback(() => {
    handleCloseMenu();
    if (onUpdate) {
      onUpdate(item);
    } else {
      dispatch(updatePromotion(item));
      toast.success('Cập nhật khuyến mãi thành công!', { description: item.promotionCode });
    }
  }, [item, dispatch, onUpdate, handleCloseMenu]);

  const handleDelete = useCallback(() => {
    handleCloseMenu();
    if (window.confirm(`Are you sure you want to delete promotion "${promotionCode}"?`)) {
      dispatch(deletePromotion(itemId));
      toast.success('Đã xóa khuyến mãi', { description: item.promotionCode });
      onDelete?.(item);
    }
  }, [item, itemId, promotionCode, dispatch, onDelete, handleCloseMenu]);

  const handleCardClick = useCallback(() => {
    if (isLock) return;
    onClick?.();
  }, [isLock, onClick]);

  const handleCardKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleCardClick();
      }
    },
    [handleCardClick]
  );

  // Determine background gradient/color for top section based on discount
  const getTopSectionBg = () => {
    if (discountPercent >= 20) return "linear-gradient(180deg, #d946ef 0%, #8b5cf6 100%)"; // purple gradient
    if (discountPercent >= 10) return "#14b8a6"; // teal solid
    if (discountPercent >= 6) return "#f59e0b"; // amber/orange solid
    if (discountPercent > 0) return "#3b82f6"; // blue solid
    return "#64748b"; // slate
  };

  const topBg = getTopSectionBg();
  const isGradient = topBg.includes("gradient");

  return (
    <>
      <Box
        component="div"
        role="button"
        tabIndex={isLock ? -1 : 0}
        aria-disabled={isLock}
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        className={className}
        sx={(theme) => ({
          p: 0,
          border: 'none',
          width: '100%',
          bgcolor: 'transparent',
          cursor: isLock ? 'default' : 'pointer',
          opacity: isLock ? 0.75 : 1,
          textAlign: 'left',
          overflow: 'hidden',
          position: 'relative',
          borderRadius: `${Number(theme.shape.borderRadius) * 2}px`,
          boxShadow: theme.vars.customShadows.card,
          fontFamily: 'inherit',
          transition: theme.transitions.create(['box-shadow', 'transform'], {
            duration: theme.transitions.duration.shorter,
          }),
          '&:hover': {
            boxShadow: theme.vars.customShadows.z8,
            transform: isLock ? 'none' : 'translateY(-4px)',
          },
          '&:focus': {
            outline: `2px solid ${theme.vars.palette.primary.main}`,
            outlineOffset: 2,
          },
          '&:focus-visible': {
            outline: `2px solid ${theme.vars.palette.primary.main}`,
            outlineOffset: 2,
          },
        })}
      >
      {/* Locked Badge */}
      {isLock && (
        <Box
          sx={(theme) => ({
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 18,
            bgcolor: alpha('#000', 0.7),
            color: 'common.white',
            fontSize: '10px',
            px: 1,
            py: 0.5,
            borderTopLeftRadius: `${Number(theme.shape.borderRadius) * 2}px`,
            borderBottomRightRadius: `${Number(theme.shape.borderRadius) * 2}px`,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontWeight: 600,
          })}
        >
            Locked
        </Box>
      )}

        {/* PART 1: Top Gradient Section (~65-70% of card) */}
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            aspectRatio: '4/2.8',
            minHeight: '200px',
            px: 3,
            pt: 3,
            pb: 4,
            color: 'common.white',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            ...(isGradient 
              ? { background: topBg }
              : { backgroundColor: topBg as string }
            ),
          }}
        >
          {/* Gift Icon - top right corner, white */}
          <Box
            sx={{
              position: 'absolute',
              top: 20,
              right: 20,
              zIndex: 10,
            }}
          >
            <GiftIcon fill="#FFFFFF" size={48} />
          </Box>

          {/* More Menu Button - top right, slightly above and to the left of gift icon */}
          {/* Always visible, even when locked */}
          <IconButton
            onClick={handleOpenMenu}
            disabled={false}
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 25, // Higher than locked badge
              color: 'common.white',
              bgcolor: alpha('#000', 0.25),
              width: 28,
              height: 28,
              '&:hover': {
                bgcolor: alpha('#000', 0.4),
              },
              '&:disabled': {
                opacity: 1, // Keep visible even if disabled
              },
            }}
            aria-label="More options"
          >
            <Iconify icon="eva:more-vertical-fill" width={18} />
          </IconButton>

          {/* Points badge - bottom right corner */}
      {requiredPoints > 0 && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                right: 16,
                zIndex: 15,
                bgcolor: alpha('#fff', 0.95),
                color: 'grey.700',
                fontSize: '12px',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                fontWeight: 600,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
            {requiredPoints} pts
            </Box>
          )}

          {/* Content container */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            {/* Top: "GIFT CARD" text - top left */}
            <Typography
              variant="caption"
              sx={{
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                lineHeight: 1.2,
                alignSelf: 'flex-start',
              }}
            >
              GIFT CARD
            </Typography>

            {/* Bottom: Discount and Description - left side */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 1,
              }}
            >
              {/* Discount: "20% OFF" - left side, large */}
              <Typography
                variant="h3"
                sx={{
                  fontSize: '36px',
                  fontWeight: 900,
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                }}
              >
                {Math.max(0, Math.floor(discountPercent))}% OFF
              </Typography>

              {/* Description: "Any Purchase" - left side, below discount */}
          {description && (
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '13px',
                    opacity: 0.95,
                    lineHeight: 1.4,
                  }}
                >
                  {description}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>

        {/* PART 2: Bottom White Section (~30-35% of card) */}
        <Box
          sx={{
            width: '100%',
            bgcolor: 'common.white',
            px: 3,
            py: 2.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {/* Top row: Title (left) and ExpiryDate (right) */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            {/* Title/Name - left side */}
            <Typography
              variant="subtitle1"
              sx={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'grey.800',
              }}
            >
              {title || 'Promotion'}
            </Typography>

            {/* ExpiryDate - right side */}
            <Typography
              variant="body2"
              sx={{
                fontSize: '14px',
                fontWeight: 400,
                color: 'grey.600',
              }}
            >
              {fmtDate(expiryDate)}
            </Typography>
          </Box>

          {/* Bottom row: PromotionCode - left side */}
          <Typography
            variant="body2"
            sx={{
              fontSize: '14px',
              fontWeight: 400,
              color: 'grey.700',
            }}
          >
            {promotionCode}
          </Typography>
        </Box>
      </Box>

      {/* More Menu Popover */}
      <Popover
        open={openMenu}
        anchorEl={menuAnchorEl}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { width: 180, mt: 1 },
          },
        }}
      >
        <MenuList disablePadding sx={{ p: 0.5 }}>
          {/* Lock/Unlock */}
          {isLock ? (
            <MenuItem onClick={handleUnlock}>
              <LockOpenIcon sx={{ width: 20, height: 20, mr: 1.5 }} />
              Unlock
            </MenuItem>
          ) : (
            <MenuItem onClick={handleLock}>
              <LockIcon sx={{ width: 20, height: 20, mr: 1.5 }} />
              Lock
            </MenuItem>
          )}

          <Divider sx={{ my: 0.5 }} />

          {/* Update */}
          <MenuItem onClick={handleUpdate}>
            <Iconify icon="solar:pen-bold" width={20} sx={{ mr: 1.5 }} />
            Update
          </MenuItem>

          {/* Delete */}
          <Divider sx={{ my: 0.5 }} />
          <MenuItem 
            onClick={handleDelete}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" width={20} sx={{ mr: 1.5 }} />
            Delete
          </MenuItem>
        </MenuList>
      </Popover>
    </>
  );
}
