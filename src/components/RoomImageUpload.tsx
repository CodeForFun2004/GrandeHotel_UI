import React, { useEffect, useState } from 'react';
import { Box, Button, IconButton, CircularProgress } from '@mui/material';
import { DeleteOutline, UploadFile } from '@mui/icons-material';
import api from '../api/axios';

type Props = {
  roomId?: string; // if provided, component can upload directly
  initialFiles?: File[];
  onFilesSelected?: (files: File[]) => void;
  onUploaded?: (images: string[]) => void;
  disabled?: boolean;
};

export default function RoomImageUpload({ roomId, initialFiles = [], onFilesSelected, onUploaded, disabled }: Props) {
  const [files, setFiles] = useState<File[]>(initialFiles || []);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!files || files.length === 0) {
      setPreviews([]);
      return;
    }
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  useEffect(() => {
    if (onFilesSelected) onFilesSelected(files);
  }, [files]);

  const handleSelect = (fList: FileList | null) => {
    const list = fList ? Array.from(fList) : [];
    setFiles((prev) => [...prev, ...list]);
  };

  const removeAt = (idx: number) => setFiles((arr) => arr.filter((_, i) => i !== idx));

  const upload = async () => {
    if (!roomId) return;
    if (!files || files.length === 0) return;
    try {
      setUploading(true);
      const fd = new FormData();
      files.forEach((f) => fd.append('images', f));
      const res = await api.put(`/rooms/${roomId}/images/batch`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const payload = res.data?.data || res.data || {};
      const imgs: string[] = Array.isArray(payload.images) ? payload.images : [];
      setFiles([]);
      if (onUploaded) onUploaded(imgs);
    } catch (err) {
      console.error('Upload images failed', err);
      alert('Upload hình thất bại. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
        <Button variant="outlined" component="label" disabled={disabled} startIcon={<UploadFile />}>
          Chọn file
          <input hidden multiple type="file" accept="image/*" onChange={(e) => handleSelect(e.target.files)} />
        </Button>
        {roomId && (
          <Button variant="contained" onClick={upload} disabled={uploading || files.length === 0 || disabled}>
            {uploading ? <CircularProgress size={18} color="inherit" /> : 'Upload'}
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {previews.map((src, i) => (
          <Box key={i} sx={{ width: 110, height: 80, position: 'relative', borderRadius: 1, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            <img src={src} alt={`preview-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <IconButton size="small" sx={{ position: 'absolute', top: 4, right: 4, bgcolor: '#fff' }} onClick={() => removeAt(i)}>
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
