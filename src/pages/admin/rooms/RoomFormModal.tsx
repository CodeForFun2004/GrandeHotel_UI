import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, CircularProgress, FormControl, InputLabel, Select, Stepper, Step, StepLabel } from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { fetchRoomTypes } from "../../../redux/slices/roomTypeSlice";
import type { RoomType } from "./RoomTypeFormModal";
import api from "../../../api/axios";
import RoomImageUpload from "../../../components/RoomImageUpload";

export type Room = {
  id?: string;
  code: string;
  type: string; // room type name
  status: string;
  description?: string;
  images?: string[]; // image URLs
  imagesFiles?: File[]; // image files selected for upload
  services?: string[]; // array of service ids
  hotelId?: any;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (r: Room) => void;
  initial?: Room | null;
  hotelId?: string | undefined;
};
export default function RoomFormModal({ open, onClose, onSubmit, initial, hotelId: propHotelId }: Props) {
  const dispatch = useAppDispatch();
  const { roomTypes, loading } = useAppSelector((state) => state.roomType);
  const { rooms } = useAppSelector((s) => s.room);
  const authUser = useAppSelector((s) => (s as any).auth?.user);

  const [form, setForm] = useState<Room>(initial || { code: '', type: '', status: 'Available', description: '', images: [], imagesFiles: [], services: [] });
  const [servicesList, setServicesList] = useState<Array<{ _id: string; name: string; basePrice: number }>>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => { if (open) dispatch(fetchRoomTypes()); }, [open]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setLoadingServices(true);
        const defaultHotelId = propHotelId
          || (rooms && rooms.length > 0 ? (rooms[0].hotel?._id || (rooms[0].hotel && (rooms[0].hotel as any).id) || rooms[0].hotel) : undefined)
          || authUser?.hotelId
          || (authUser?.hotel && (authUser.hotel._id || authUser.hotel.id));
        if (!defaultHotelId) {
          console.warn('RoomFormModal: no hotel id resolved; attempting server-resolved endpoint', { propHotelId, roomsLength: rooms?.length, authUser });
          try {
            // Try server-side resolved hotel (requires auth)
            console.log('RoomFormModal: fetching hotel services from /dashboard/hotels/services');
            const srv = await api.get('/dashboard/hotels/services');
            console.log('RoomFormModal: services response (server-resolved)', srv.data);
            setServicesList(srv.data?.services || []);
            setLoadingServices(false);
            return;
          } catch (e) {
            console.warn('RoomFormModal: server-resolved services fetch failed', e);
            // fall through to empty list
            setServicesList([]);
            setLoadingServices(false);
            return;
          }
        }

        console.log('RoomFormModal: fetching hotel services for hotelId=', defaultHotelId);
        const res = await api.get(`/dashboard/hotels/${defaultHotelId}/services`);
        console.log('RoomFormModal: services response', { hotelId: defaultHotelId, data: res.data });
        setServicesList(res.data?.services || []);
      } catch (err) {
        console.error('Failed to load hotel services', err);
        setServicesList([]);
      } finally { setLoadingServices(false); }
    })();
  }, [open, rooms, propHotelId, authUser]);

  useEffect(() => { if (initial) setForm(initial); }, [initial]);

  const change = (k: keyof Room) => (e: any) => setForm({ ...form, [k]: e.target.value } as any);

  const changeImages = (e: any) => {
    const raw = e.target.value as string;
    const arr = raw.split(',').map((s) => s.trim()).filter(Boolean);
    setForm({ ...form, images: arr });
  };

  const onSelectFiles = (files: FileList | null) => {
    const list = files ? Array.from(files) : [];
    setForm({ ...form, imagesFiles: list });
  };

  const changeServices = (e: any) => {
    const val = e?.target?.value as string[];
    setForm({ ...form, services: val });
  };

  const handleSubmit = () => { if (!form.code || !form.type) return; onSubmit(form); };
  const handleNext = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const steps = ['Thông tin phòng', 'Hình ảnh', 'Tiện nghi', 'Xem lại'];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial ? 'Chỉnh sửa phòng' : 'Thêm phòng'}</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : (
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Stepper activeStep={step} alternativeLabel sx={{ mb: 2 }}>
              {steps.map((label) => (
                <Step key={label}><StepLabel>{label}</StepLabel></Step>
              ))}
            </Stepper>

            {step === 0 && (
              <Box sx={{ display: 'grid', gap: 2 }}>
                <TextField label="Số phòng" fullWidth value={form.code} onChange={change('code')} />
                <FormControl fullWidth>
                  <InputLabel>Loại phòng</InputLabel>
                  <Select label="Loại phòng" value={form.type} onChange={change('type')}>
                    {roomTypes.map((rt: any) => <MenuItem key={rt.id || rt._id} value={rt.name}>{rt.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField multiline minRows={2} label="Mô tả" fullWidth value={form.description} onChange={change('description')} />
                <FormControl fullWidth>
                  <InputLabel>Trạng thái</InputLabel>
                  <Select label="Trạng thái" value={form.status} onChange={change('status')}>
                    <MenuItem value={'Available'}>Available</MenuItem>
                    <MenuItem value={'Reserved'}>Reserved</MenuItem>
                    <MenuItem value={'Maintenance'}>Maintenance</MenuItem>
                    <MenuItem value={'Cleaning'}>Cleaning</MenuItem>
                    <MenuItem value={'Occupied'}>Occupied</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}

            {step === 1 && (
              <Box>
                <RoomImageUpload onFilesSelected={(f) => setForm({ ...form, imagesFiles: f })} />
                <TextField sx={{ mt: 2 }} label="Hình ảnh (URLs, cách nhau bằng dấu phẩy)" fullWidth value={(form.images || []).join(', ')} onChange={changeImages} helperText="Thêm nhiều URL ảnh, phân tách bằng dấu phẩy" />
              </Box>
            )}

            {step === 2 && (
              <FormControl fullWidth>
                <InputLabel>Dịch vụ</InputLabel>
                <Select multiple value={form.services || []} label="Dịch vụ" onChange={changeServices} renderValue={(selected) => (selected as string[]).join(', ')}>
                  {loadingServices ? <MenuItem disabled>Đang tải...</MenuItem> : servicesList.map((s) => (<MenuItem key={s._id} value={String(s._id)}>{s.name}</MenuItem>))}
                </Select>
              </FormControl>
            )}

            {step === 3 && (
              <Box>
                <Box sx={{ mb: 1 }}><strong>Số phòng:</strong> {form.code}</Box>
                <Box sx={{ mb: 1 }}><strong>Loại:</strong> {form.type}</Box>
                <Box sx={{ mb: 1 }}><strong>Mô tả:</strong> {form.description}</Box>
                <Box sx={{ mb: 1 }}><strong>Trạng thái:</strong> {form.status}</Box>
                <Box sx={{ mb: 1 }}><strong>Hình (URLs):</strong> {(form.images || []).join(', ')}</Box>
                <Box sx={{ mb: 1 }}><strong>Số file chọn:</strong> {form.imagesFiles ? form.imagesFiles.length : 0}</Box>
                <Box sx={{ mb: 1 }}><strong>Tiện nghi:</strong> {(form.services || []).join(', ')}</Box>
              </Box>
            )}

          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        {step > 0 && <Button onClick={handleBack}>Quay lại</Button>}
        {step < steps.length - 1 && <Button variant="contained" onClick={handleNext}>Tiếp tục</Button>}
        {step === steps.length - 1 && <Button variant="contained" onClick={handleSubmit}>Xác nhận</Button>}
      </DialogActions>
    </Dialog>
  );
}
