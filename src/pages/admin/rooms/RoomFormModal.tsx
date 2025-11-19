import { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box, CircularProgress, FormControl, InputLabel, Select, Stepper, Step, StepLabel, Checkbox, ListItemText, FormHelperText } from "@mui/material";
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
  const authUser = useAppSelector((s: any) => s.auth?.user);

  const [form, setForm] = useState<Room>(initial || { code: '', type: '', status: 'Available', description: '', images: [], imagesFiles: [], services: [] });
  const [roomNumberError, setRoomNumberError] = useState<string | null>(null);
  const [roomTypeError, setRoomTypeError] = useState<string | null>(null);
  const [checkingRoomNumber, setCheckingRoomNumber] = useState(false);
  const [servicesList, setServicesList] = useState<Array<{ _id: string; name: string; basePrice: number }>>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => { if (open) dispatch(fetchRoomTypes()); }, [open]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        setLoadingServices(true);
        // Resolve hotelId in order: explicit prop, authenticated user's hotelId, fallback to rooms list
        const defaultHotelId = propHotelId
          || authUser?.hotelId
          || (authUser?.hotel && (authUser.hotel._id || authUser.hotel.id))
          || (rooms && rooms.length > 0 ? (rooms[0].hotel?._id || (rooms[0].hotel && (rooms[0].hotel as any).id) || rooms[0].hotel) : undefined);

        if (!defaultHotelId) {
          // As a last resort, try the server-resolved endpoint which uses req.user to determine hotel
          try {
            const srv = await api.get('/dashboard/hotels/services');
            setServicesList(srv.data?.services || []);
            setLoadingServices(false);
            return;
          } catch (e) {
            // give up silently; show empty list
            setServicesList([]);
            setLoadingServices(false);
            return;
          }
        }

        const res = await api.get(`/dashboard/hotels/${defaultHotelId}/services`);
        setServicesList(res.data?.services || []);
      } catch (err) {
        console.error('Failed to load hotel services', err);
        setServicesList([]);
      } finally { setLoadingServices(false); }
    })();
  }, [open, rooms, propHotelId, authUser]);

  useEffect(() => { if (initial) setForm(initial); }, [initial]);

  const change = (k: keyof Room) => (e: any) => setForm({ ...form, [k]: e.target.value } as any);

  const onSelectFiles = (files: FileList | null) => {
    const list = files ? Array.from(files) : [];
    setForm({ ...form, imagesFiles: list });
  };

  const changeServices = (e: any) => {
    const val = e?.target?.value as string[];
    setForm({ ...form, services: val });
  };

  const handleSubmit = () => { if (!form.code || !form.type) return; onSubmit(form); };
  const handleNext = async () => {
    // when on the first step, validate required fields and uniqueness of room number
    if (step === 0) {
      setRoomNumberError(null);
      setRoomTypeError(null);
      const codeVal = (form.code || '').toString().trim();
      if (!codeVal) {
        setRoomNumberError('Số phòng là bắt buộc');
        return;
      }
      if (!form.type) {
        setRoomTypeError('Loại phòng là bắt buộc');
        return;
      }
      try {
        setCheckingRoomNumber(true);
        // ask server if this room number/code exists in manager's hotel
        const res = await api.get('/rooms/check-number', { params: { roomNumber: codeVal } });
        if (res?.data?.exists) {
          setRoomNumberError('Số phòng này đã tồn tại trong khách sạn');
          return;
        }
      } catch (e) {
        // if server returns 403 (no hotel) or other error, we let user proceed but show a warning
        console.warn('Room number check failed', e);
      } finally {
        setCheckingRoomNumber(false);
      }
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };
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
                <TextField label="Số phòng" fullWidth value={form.code} onChange={change('code')} error={!!roomNumberError} helperText={roomNumberError || ''} />
                <FormControl fullWidth error={!!roomTypeError}>
                  <InputLabel>Loại phòng</InputLabel>
                  <Select label="Loại phòng" value={form.type} onChange={change('type')}>
                    {roomTypes.map((rt: any) => <MenuItem key={rt.id || rt._id} value={rt.name}>{rt.name}</MenuItem>)}
                  </Select>
                  <FormHelperText>{roomTypeError || ''}</FormHelperText>
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
              </Box>
            )}

            {step === 2 && (
              <FormControl fullWidth>
                <InputLabel>Dịch vụ</InputLabel>
                <Select
                  multiple
                  value={form.services || []}
                  label="Dịch vụ"
                  onChange={changeServices}
                  renderValue={(selected) =>
                    (selected as string[])
                      .map((id) => servicesList.find((s) => String(s._id) === String(id))?.name || String(id))
                      .join(', ')
                  }
                  MenuProps={{}}
                >
                  {loadingServices ? (
                    <MenuItem disabled>Đang tải...</MenuItem>
                  ) : (
                    servicesList.map((s) => (
                      <MenuItem key={s._id} value={String(s._id)}>
                        <Checkbox checked={(form.services || []).indexOf(String(s._id)) > -1} />
                        <ListItemText primary={s.name} />
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            )}

            {step === 3 && (
              <Box>
                <Box sx={{ mb: 1 }}><strong>Số phòng:</strong> {form.code}</Box>
                <Box sx={{ mb: 1 }}><strong>Loại:</strong> {form.type}</Box>
                <Box sx={{ mb: 1 }}><strong>Mô tả:</strong> {form.description}</Box>
                <Box sx={{ mb: 1 }}><strong>Trạng thái:</strong> {form.status}</Box>
                <Box sx={{ mb: 1 }}>
                  <strong>Hình ảnh:</strong>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    {(form.images || []).map((url, i) => (
                      <Box key={"url-" + i} component="img" src={url} sx={{ width: 100, height: 70, objectFit: 'cover', borderRadius: 1 }} />
                    ))}
                    {(form.imagesFiles || []).map((f, i) => {
                      try {
                        const src = URL.createObjectURL(f);
                        return <Box key={"file-" + i} component="img" src={src} sx={{ width: 100, height: 70, objectFit: 'cover', borderRadius: 1 }} onLoad={() => { URL.revokeObjectURL(src); }} />
                      } catch (e) {
                        return null;
                      }
                    })}
                    {((form.images || []).length === 0 && (form.imagesFiles || []).length === 0) && (
                      <Box sx={{ color: 'text.secondary' }}>Chưa có ảnh</Box>
                    )}
                  </Box>
                </Box>
                <Box sx={{ mb: 1 }}><strong>Tiện nghi:</strong>{' '}
                  {(form.services || [])
                    .map((id) => servicesList.find((s) => String(s._id) === String(id))?.name || String(id))
                    .join(', ')}
                </Box>
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
