import React, { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import RoomFormModal, { type Room as FormRoom } from "./RoomFormModal";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { createRoom } from "../../../redux/slices/roomSlice";
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
  const authUser = useAppSelector((s: any) => s.auth?.user);

  const [defaultHotelId] = React.useState<string | undefined>(
    authUser?.hotelId || (rooms.length > 0 ? ((rooms[0].hotel && ((rooms[0].hotel as any)._id || (rooms[0].hotel as any).id)) || (rooms[0].hotel as any) || undefined) : undefined)
  );

  useEffect(() => {
    // If modal closed (back button), navigate back to manager rooms
    if (!open) navigate('/manager/rooms');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const mapFormToBackendCreate = (formRoom: FormRoom) => {
    const roomType = roomTypes.find((rt: any) => rt.name === formRoom.type);
    if (!roomType) throw new Error('Room type not found');
    // ensure hotel id is a plain string when available
    const hotelIdString = defaultHotelId ? String(defaultHotelId) : undefined;
    return {
      code: formRoom.code,
      name: `${(roomType as any).name || ''} ${formRoom.code}`.trim(),
      roomType: (roomType as any).id || (roomType as any)._id || roomType.id,
      ...(hotelIdString ? { hotel: hotelIdString } : {}),
      roomNumber: formRoom.code,
      status: 'Available',
      // Price is derived from room type base price
      pricePerNight: (roomType as any).basePrice,
      capacity: (roomType as any).capacity || undefined,
      description: formRoom.description,
      images: formRoom.images,
      services: formRoom.services,
    } as any;
  };

  const handleSubmit = async (form: FormRoom) => {
    try {
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
      // thunk throws a string message when rejectWithValue is used
      if (typeof err === 'string') {
        toast.error(err);
      } else if (err && typeof err === 'object' && (err as any).message) {
        toast.error((err as any).message);
      } else {
        toast.error('Có lỗi xảy ra khi tạo phòng');
      }
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
