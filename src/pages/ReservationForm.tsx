import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Alert,
  Spinner,
} from "react-bootstrap";
import {
  Hotel,
  People,
  CreditCard,
  CheckCircle,
  CloudUpload,
  Badge,
} from "@mui/icons-material";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as reservationApi from "../api/reservation";
import * as hotelApi from "../api/hotel";
import * as userApi from "../api/user";
import heroBg from "../assets/images/login.avif";
import "./ReservationForm.css";

interface RoomSelection {
  roomTypeId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  adults: number;
  children: number;
  infants: number;
}

interface ReservationFormData {
  hotelId: string;
  checkInDate: string;
  checkOutDate: string;
  selected: RoomSelection[];
  total: number;
  nights: number;
  queryString: string;
}

const ReservationForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reservationId = searchParams.get("reservation");

  const [draft, setDraft] = useState<ReservationFormData | null>(null);
  const [hotelName, setHotelName] = useState<string>("—");
  const [paymentType, setPaymentType] = useState<"full" | "deposit">("full");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);



  const [userId, setUserId] = useState<string | null>(null);
  const [hasPhotoFace, setHasPhotoFace] = useState<boolean>(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Citizen ID upload states
  const [hasCitizenId, setHasCitizenId] = useState<boolean>(false);
  const [citizenIdType, setCitizenIdType] = useState<"cccd" | "cmnd">("cccd");
  const [citizenIdValue, setCitizenIdValue] = useState<string>("");
  const [uploadingCitizenId, setUploadingCitizenId] = useState(false);
  const [citizenIdSuccess, setCitizenIdSuccess] = useState(false);
  const [citizenIdError, setCitizenIdError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setUploadError("Vui lòng chọn file ảnh (JPG, PNG, v.v.)");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("Kích thước file không được vượt quá 5MB");
        return;
      }

      setSelectedFile(file);
      setUploadError(null);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile || !userId) {
      setUploadError("Vui lòng chọn ảnh trước khi tải lên");
      return;
    }

    try {
      setUploadingPhoto(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append("photoFace", selectedFile);

      const response = await userApi.uploadPhotoFace(userId, formData);
      console.log("[FORM] Upload photoFace success:", response);

      setUploadSuccess(true);
      setHasPhotoFace(true);

      // Show success toast
      toast.success("Tải ảnh khuôn mặt thành công! 🎉", {
        position: "top-right",
        autoClose: 3000,
      });

      // Update localStorage
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const user = JSON.parse(rawUser);
        const responseData = response?.user || response?.data || response;
        user.photoFace = responseData?.photoFace;
        localStorage.setItem("user", JSON.stringify(user));
      }

      // Clear the selected file and preview after successful upload
      setTimeout(() => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 2000);
    } catch (err: any) {
      console.error("[FORM] Failed to upload photoFace:", err);
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể tải ảnh lên. Vui lòng thử lại.";
      setUploadError(errorMsg);
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateCitizenId = (type: "cccd" | "cmnd", value: string): string | null => {
    if (!value) {
      return "Vui lòng nhập số giấy tờ";
    }

    const patterns = {
      cccd: /^[0-9]{12}$/,
      cmnd: /^[0-9]{9}$/,
    };

    if (!patterns[type].test(value)) {
      if (type === "cccd") {
        return "CCCD phải đúng 12 số";
      } else {
        return "CMND phải đúng 9 số";
      }
    }

    return null;
  };

  const handleUploadCitizenId = async () => {
    if (!userId) {
      setCitizenIdError("Không tìm thấy thông tin người dùng");
      return;
    }

    // Validate
    const validationError = validateCitizenId(citizenIdType, citizenIdValue);
    if (validationError) {
      setCitizenIdError(validationError);
      toast.error(validationError, {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      setUploadingCitizenId(true);
      setCitizenIdError(null);

      const payload = {
        type: citizenIdType,
        value: citizenIdValue,
      };

      const response = await userApi.uploadCitizenIdentification(userId, payload);
      console.log("[FORM] Upload citizen ID success:", response);

      setCitizenIdSuccess(true);
      setHasCitizenId(true);

      // Show success toast
      toast.success(`Cập nhật ${citizenIdType.toUpperCase()} thành công! ✅`, {
        position: "top-right",
        autoClose: 3000,
      });

      // Update localStorage
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const user = JSON.parse(rawUser);
        const responseData = response?.data || response;
        if (citizenIdType === "cccd") {
          user.cccd = responseData?.value || citizenIdValue;
          user.cmnd = null;
        } else {
          user.cmnd = responseData?.value || citizenIdValue;
          user.cccd = null;
        }
        localStorage.setItem("user", JSON.stringify(user));
      }

      // Clear the form after successful upload
      setTimeout(() => {
        setCitizenIdValue("");
      }, 2000);
    } catch (err: any) {
      console.error("[FORM] Failed to upload citizen ID:", err);
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể cập nhật giấy tờ. Vui lòng thử lại.";
      setCitizenIdError(errorMsg);
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setUploadingCitizenId(false);
    }
  };

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("reservationDraft");
      if (!raw) {
        navigate("/rooms");
        return;
      }
      const parsed = JSON.parse(raw);
      setDraft(parsed);
    } catch (e: any) {
      setError("Không thể đọc dữ liệu đặt phòng");
    }
  }, [navigate]);

  useEffect(() => {
    const fetchHotel = async () => {
      if (!draft?.hotelId) return;
      try {
        const hotel = await hotelApi.getHotelById(draft.hotelId);
        setHotelName(hotel?.name || "—");
      } catch {
        setHotelName("—");
      }
    };
    fetchHotel();
  }, [draft?.hotelId]);

  // Check if user has photoFace and citizen ID on mount
  useEffect(() => {
    const checkUserData = async () => {
      try {
        const rawUser = localStorage.getItem("user");
        if (rawUser) {
          const user = JSON.parse(rawUser);
          const currentUserId = user?._id || user?.id;
          if (currentUserId) {
            setUserId(currentUserId);
            
            // Fetch latest user data to check photoFace and citizen ID
            try {
              const userData = await userApi.getUserById(currentUserId);
              const userDataObj = userData?.user || userData?.data || userData;
              console.log("[FORM] User data:", userDataObj);
              
              // Check photoFace
              if (userDataObj?.photoFace) {
                setHasPhotoFace(true);
                console.log("[FORM] User already has photoFace:", userDataObj.photoFace);
              } else {
                setHasPhotoFace(false);
                console.log("[FORM] User does not have photoFace");
              }

              // Check citizen ID (cccd or cmnd)
              if (userDataObj?.cccd || userDataObj?.cmnd) {
                setHasCitizenId(true);
                console.log("[FORM] User already has citizen ID:", {
                  cccd: userDataObj?.cccd,
                  cmnd: userDataObj?.cmnd
                });
              } else {
                setHasCitizenId(false);
                console.log("[FORM] User does not have citizen ID");
              }
            } catch (err) {
              console.error("[FORM] Failed to check user data:", err);
              setHasPhotoFace(false);
              setHasCitizenId(false);
            }
          }
        }
      } catch (err) {
        console.error("[FORM] Failed to get user info:", err);
      }
    };

    checkUserData();
  }, []);

  const totalAmount = draft?.total ?? 0;
  const depositAmount = Math.round(totalAmount * 0.5);
  const finalAmount = paymentType === "full" ? totalAmount : depositAmount;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || !reservationId) return;

    setLoading(true);
    setError(null);

    try {
      // Call selectPaymentOption API to get payment info and QR code
      const response = await reservationApi.selectPaymentOption(
        reservationId,
        paymentType
      );

      // Store payment info in sessionStorage to pass to QR payment page
      sessionStorage.setItem(
        "paymentInfo",
        JSON.stringify(response.paymentInfo)
      );
      sessionStorage.removeItem("reservationDraft");

      // Navigate to QR payment page
      navigate(
        `/reservation/qr-payment?reservation=${reservationId}&type=${paymentType}`
      );
    } catch (e: any) {
      setError(e?.message || "Chọn phương thức thanh toán thất bại");
    } finally {
      setLoading(false);
    }
  };

  const onBack = () => {
    navigate(`/reservation/pending?reservation=${reservationId}`);
  };

  if (!draft) {
    return (
      <div className="container" style={{ padding: "40px 0" }}>
        <h3>Không có dữ liệu đặt phòng</h3>
        <Button variant="secondary" onClick={() => navigate("/rooms")}>
          Quay lại chọn phòng
        </Button>
      </div>
    );
  }

  return (
    <div className="reservation-form-page">
      <ToastContainer />
      <div className="hero-wrap" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="overlay"></div>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="reservation-form-header">
                <h1>Xác nhận đặt phòng</h1>
                <p>
                  Vui lòng chọn phương thức thanh toán và xác nhận thông tin
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="reservation-form-section">
        <Container>
          <Row className="justify-content-center">
            <Col lg={10}>
              <Card className="reservation-form-card">
                <Card.Body className="p-4">
                  {error && (
                    <Alert variant="danger" className="mb-4">
                      {error}
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit}>
                    {/* Hotel Information */}
                    <div className="reservation-info-section mb-4">
                      <h4 className="section-title">
                        <Hotel className="me-2" />
                        Thông tin khách sạn
                      </h4>
                      <div className="info-item">
                        <span className="label">Khách sạn:</span>
                        <span className="value">{hotelName}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">Ngày nhận phòng:</span>
                        <span className="value">
                          {formatDate(draft.checkInDate)}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="label">Ngày trả phòng:</span>
                        <span className="value">
                          {formatDate(draft.checkOutDate)}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="label">Số đêm:</span>
                        <span className="value">{draft.nights} đêm</span>
                      </div>
                    </div>

                    {/* Room Details */}
                    <div className="reservation-info-section mb-4">
                      <h4 className="section-title">
                        <People className="me-2" />
                        Chi tiết phòng
                      </h4>
                      {draft.selected.map((room) => (
                        <div key={room.roomTypeId} className="room-detail-item">
                          <div className="room-info">
                            <div className="room-name">
                              {room.name} x{room.quantity}
                            </div>
                            <div className="room-guests">
                              {room.adults} người lớn, {room.children} trẻ em,{" "}
                              {room.infants} em bé
                            </div>
                          </div>
                          <div className="room-price">
                            {(
                              room.unitPrice *
                              room.quantity *
                              draft.nights
                            ).toLocaleString()}{" "}
                            VNĐ
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* User upload uploadCitizenIdentification(mandatory) */}
                    {userId && !hasCitizenId && (
                      <div className="photoface-upload mb-4">
                        <h4 className="section-title">
                          <Badge className="me-2" />
                          Thông tin giấy tờ tùy thân (Bắt buộc)
                        </h4>
                        <p className="upload-description">
                          Vui lòng cung cấp thông tin CCCD hoặc CMND để hoàn tất
                          đặt phòng.
                          <br />
                          <em className="text-danger">(Bắt buộc - Mandatory)</em>
                        </p>

                        <div className="upload-container">
                          {citizenIdSuccess ? (
                            <div className="upload-success-message">
                              <CheckCircle className="success-icon" />
                              <p>
                                Cập nhật giấy tờ thành công! Thông tin của bạn đã
                                được lưu.
                              </p>
                            </div>
                          ) : (
                            <>
                              <Form.Group className="mb-3">
                                <Form.Label>Loại giấy tờ</Form.Label>
                                <Form.Select
                                  value={citizenIdType}
                                  onChange={(e) =>
                                    setCitizenIdType(
                                      e.target.value as "cccd" | "cmnd"
                                    )
                                  }
                                  disabled={uploadingCitizenId}
                                >
                                  <option value="cccd">CCCD (12 số)</option>
                                  <option value="cmnd">CMND (9 số)</option>
                                </Form.Select>
                              </Form.Group>

                              <Form.Group className="mb-3">
                                <Form.Label>
                                  Số {citizenIdType.toUpperCase()}
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  placeholder={`Nhập số ${citizenIdType.toUpperCase()}`}
                                  value={citizenIdValue}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(
                                      /[^0-9]/g,
                                      ""
                                    );
                                    setCitizenIdValue(value);
                                    setCitizenIdError(null);
                                  }}
                                  maxLength={citizenIdType === "cccd" ? 12 : 9}
                                  disabled={uploadingCitizenId}
                                  isInvalid={!!citizenIdError}
                                />
                                <Form.Control.Feedback type="invalid">
                                  {citizenIdError}
                                </Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                  {citizenIdType === "cccd"
                                    ? "CCCD gồm 12 chữ số"
                                    : "CMND gồm 9 chữ số"}
                                </Form.Text>
                              </Form.Group>

                              {citizenIdError && (
                                <Alert variant="danger" className="mb-3">
                                  {citizenIdError}
                                </Alert>
                              )}

                              <Button
                                variant="primary"
                                onClick={handleUploadCitizenId}
                                disabled={
                                  uploadingCitizenId || !citizenIdValue
                                }
                                className="w-100"
                              >
                                {uploadingCitizenId ? (
                                  <>
                                    <Spinner
                                      as="span"
                                      animation="border"
                                      size="sm"
                                      role="status"
                                      aria-hidden="true"
                                      className="me-2"
                                    />
                                    Đang xử lý...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="me-2" />
                                    Xác nhận giấy tờ
                                  </>
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Upload Photo Face for Check-in (only show if user doesn't have photoFace) */}
                    {userId && !hasPhotoFace && (
                      <div className="photoface-upload">
                        <h4 className="section-title">
                          Upload Photo Face for Check-in
                        </h4>
                        <p className="upload-description">
                          Để tăng tốc quá trình check-in bằng AI nhận diện khuôn
                          mặt, vui lòng tải lên ảnh khuôn mặt của bạn.
                          <br />
                          <em>(Tùy chọn - Optional)</em>
                        </p>

                        <div className="upload-container">
                          {uploadSuccess ? (
                            <div className="upload-success-message">
                              <CheckCircle className="success-icon" />
                              <p>
                                Tải ảnh thành công! Bạn có thể sử dụng AI
                                check-in khi đến khách sạn.
                              </p>
                            </div>
                          ) : (
                            <>
                              <div className="upload-area">
                                <input
                                  type="file"
                                  ref={fileInputRef}
                                  onChange={handleFileSelect}
                                  accept="image/*"
                                  className="file-input"
                                  id="photoFaceInput"
                                  disabled={uploadingPhoto}
                                />
                                <label
                                  htmlFor="photoFaceInput"
                                  className="file-label"
                                >
                                  <CloudUpload className="upload-icon" />
                                  <span className="upload-text">
                                    {selectedFile
                                      ? selectedFile.name
                                      : "Chọn ảnh khuôn mặt"}
                                  </span>
                                  <span className="upload-hint">
                                    JPG, PNG tối đa 5MB
                                  </span>
                                </label>
                              </div>

                              {previewUrl && (
                                <div className="preview-container">
                                  <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="preview-image"
                                  />
                                  <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={handleClearFile}
                                    disabled={uploadingPhoto}
                                  >
                                    Xóa
                                  </Button>
                                </div>
                              )}

                              {uploadError && (
                                <Alert variant="danger" className="mt-3 mb-0">
                                  {uploadError}
                                </Alert>
                              )}

                              {selectedFile && !uploadSuccess && (
                                <Button
                                  variant="primary"
                                  onClick={handleUploadPhoto}
                                  disabled={uploadingPhoto}
                                  className="mt-3 upload-btn"
                                >
                                  {uploadingPhoto ? (
                                    <>
                                      <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                        className="me-2"
                                      />
                                      Đang tải lên...
                                    </>
                                  ) : (
                                    <>
                                      <CloudUpload className="me-2" />
                                      Tải lên
                                    </>
                                  )}
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Payment Options */}
                    <div className="reservation-info-section mb-4">
                      <h4 className="section-title">
                        <CreditCard className="me-2" />
                        Phương thức thanh toán
                      </h4>
                      <div className="payment-options">
                        <Form.Check
                          type="radio"
                          id="full-payment"
                          name="paymentType"
                          value="full"
                          checked={paymentType === "full"}
                          onChange={(e) =>
                            setPaymentType(e.target.value as "full")
                          }
                          label={
                            <div className="payment-option">
                              <div className="payment-title">
                                Thanh toán toàn bộ
                              </div>
                              <div className="payment-amount">
                                {totalAmount.toLocaleString()} VNĐ
                              </div>
                            </div>
                          }
                        />
                        <Form.Check
                          type="radio"
                          id="deposit-payment"
                          name="paymentType"
                          value="deposit"
                          checked={paymentType === "deposit"}
                          onChange={(e) =>
                            setPaymentType(e.target.value as "deposit")
                          }
                          label={
                            <div className="payment-option">
                              <div className="payment-title">
                                Thanh toán cọc 50%
                              </div>
                              <div className="payment-amount">
                                {depositAmount.toLocaleString()} VNĐ
                              </div>
                              <div className="payment-note">
                                Số tiền còn lại:{" "}
                                {(totalAmount - depositAmount).toLocaleString()}{" "}
                                VNĐ
                              </div>
                            </div>
                          }
                        />
                      </div>
                    </div>

                    {/* Total Amount */}
                    <div className="total-section mb-4">
                      <div className="total-line">
                        <span className="total-label">Tổng cộng:</span>
                        <span className="total-amount">
                          {finalAmount.toLocaleString()} VNĐ
                        </span>
                      </div>
                      {paymentType === "deposit" && (
                        <div className="total-note">
                          * Số tiền còn lại sẽ được thanh toán khi nhận phòng
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="form-actions">
                      <Button
                        variant="outline-secondary"
                        onClick={onBack}
                        className="me-3"
                      >
                        Quay lại
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={loading}
                        className="btn-confirm"
                      >
                        {loading ? "Đang xử lý..." : "Tiếp tục thanh toán"}
                        {!loading && <CheckCircle className="ms-2" />}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default ReservationForm;
