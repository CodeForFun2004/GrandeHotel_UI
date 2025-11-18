import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import RoomFormModal, { type Room as FormRoom } from "./RoomFormModal";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { createRoom } from "../../../redux/slices/roomSlice";
import { getHotelPerformance } from "../../../api/dashboard";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";

export default function ManagerCreateRoom() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { roomTypes } = useAppSelector((s) => s.roomType);
  const { rooms } = useAppSelector((s) => s.room);

  const [open, setOpen] = useState(true);

  // Determine a default hotel id from existing rooms if available. If not available,
  // attempt to fetch manager hotel(s) via dashboard API as a fallback.
  const [defaultHotelId, setDefaultHotelId] = React.useState<string | undefined>(
    rooms.length > 0 ? ((rooms[0].hotel && ((rooms[0].hotel as any)._id || (rooms[0].hotel as any).id)) || (rooms[0].hotel as any) || undefined) : undefined
  );

  useEffect(() => {
    if (defaultHotelId) return;
    (async () => {
      try {
        const perf = await getHotelPerformance();
        if (Array.isArray(perf) && perf.length > 0) {
          const hid = (perf[0] as any).id || (perf[0] as any)._id;
          if (hid) setDefaultHotelId(hid);
        }
      } catch (e) {
        console.warn('ManagerCreateRoom: could not resolve hotelId from dashboard performance', e);
        // Try to recover hotelId from localStorage-stored user as a fallback (helps in dev/debug)
        try {
          const raw = localStorage.getItem('user');
          if (raw) {
            const u = JSON.parse(raw) as any;
            console.log('ManagerCreateRoom: parsed localStorage user', u);
            const hid = u?.hotelId || (u?.hotel && (u.hotel._id || u.hotel.id)) || u?.hotel;
            if (hid) {
              console.log('ManagerCreateRoom: recovered hotelId from localStorage user ->', hid);
              setDefaultHotelId(hid);
            } else {
              console.log('ManagerCreateRoom: localStorage user does not include hotelId/hotel');
            }
          } else {
            console.log('ManagerCreateRoom: no user in localStorage');
          }
        } catch (ex) {
          console.warn('ManagerCreateRoom: failed parsing localStorage user', ex);
        }
        // If the error is permission-related, notify the user
        try {
          const axiosErr = e as any;
          if (axiosErr?.response?.status === 403) {
            toast.warn('Không có quyền truy cập thông tin khách sạn — đăng nhập bằng tài khoản Manager hoặc set `user` trong localStorage.');
          }
        } catch (_) {}
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rooms]);

  useEffect(() => {
    // If modal closed (back button), navigate back to manager rooms
    if (!open) navigate('/manager/rooms');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const mapFormToBackendCreate = (formRoom: FormRoom) => {
    const roomType = roomTypes.find((rt: any) => rt.name === formRoom.type);
    if (!roomType) throw new Error('Room type not found');
    if (!defaultHotelId) return null;
    return {
      roomType: (roomType as any).id || (roomType as any)._id || roomType.id,
      hotel: defaultHotelId,
      roomNumber: formRoom.code,
      status: 'available',
      // Price is derived from room type base price
      pricePerNight: roomType.basePrice,
      description: formRoom.description,
      images: formRoom.images,
      services: formRoom.services,
    } as any;
  };

  const handleSubmit = async (form: FormRoom) => {
    try {
      if (!defaultHotelId) {
        toast.error('Không thể tạo phòng - Hotel ID không hợp lệ');
        return;
      }
      const payload = mapFormToBackendCreate(form);
      if (!payload) {
        toast.error('Không thể tạo phòng');
        return;
      }
      const created = await dispatch(createRoom(payload)).unwrap();
      toast.success('Thêm phòng thành công');
      setOpen(false);
      const cd = created as any;
      const id = cd?._id || cd?.id || (cd?.room && (cd.room._id || cd.room.id));
      if (id) {
        // if user selected files in the form, upload them now
        if (form.imagesFiles && form.imagesFiles.length > 0) {
          try {
            const fd = new FormData();
            form.imagesFiles.forEach((f) => fd.append('images', f));
            await api.put(`/rooms/${id}/images/batch`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
          } catch (e) {
            console.warn('Image upload after create failed', e);
            // don't block navigation; inform user
            toast.warn('Phòng đã tạo nhưng upload hình thất bại. Bạn có thể upload sau.');
          }
        }
        // navigate to manager room detail and open image upload step
        navigate(`/manager/rooms/${id}?openImg=true`);
      } else {
        navigate('/manager/rooms');
      }
    } catch (err: any) {
      console.error('Create room failed', err);
      toast.error(err?.message || 'Có lỗi xảy ra khi tạo phòng');
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Thêm phòng</Typography>
      <RoomFormModal open={open} onClose={() => setOpen(false)} onSubmit={handleSubmit} hotelId={defaultHotelId} />
      <Box sx={{ mt: 2 }}>
        <Button onClick={() => navigate('/manager/rooms')}>&larr; Quay lại danh sách phòng</Button>
      </Box>
    </Box>
  );
}
