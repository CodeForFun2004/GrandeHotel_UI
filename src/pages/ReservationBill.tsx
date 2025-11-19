import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  Spinner,
} from "react-bootstrap";
import { Print, Download, Home } from "@mui/icons-material";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import * as reservationApi from "../api/reservation";
import * as hotelApi from "../api/hotel";
import heroBg from "../assets/images/login.avif";
import "./ReservationBill.css";

interface Reservation {
  _id: string;
  hotelId: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfGuests: number;
  rooms?: Array<{
    roomTypeId: string;
    quantity: number;
    adults: number;
    children: number;
    infants: number;
    roomType?: {
      name: string;
      basePrice: number;
    };
  }>;
  details?: Array<{
    _id?: string;
    id?: string;
    quantity?: number;
    adults?: number;
    children?: number;
    infants?: number;
    roomType?:
      | {
          _id?: string;
          id?: string;
          name: string;
          basePrice: number;
          description?: string;
        }
      | string;
  }>;
  status: string;
  totalAmount: number;
  paymentType: "full" | "deposit";
  paymentStatus:
    | "pending"
    | "completed"
    | "refunded"
    | "fully_paid"
    | "deposit_paid";
  createdAt: string;
  paymentConfirmedAt?: string;
}

const ReservationBill: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reservationId = searchParams.get("reservation");
  const billCardRef = useRef<HTMLDivElement>(null);

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [hotelName, setHotelName] = useState<string>("—");
  const [hotelAddress, setHotelAddress] = useState<string>("—");
  const [hotelPhone, setHotelPhone] = useState<string>("—");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<any | null>(null);
  const [customerInfo, setCustomerInfo] = useState<any>({
    name: "Khách lẻ",
    phone: "—",
    email: "—",
  });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (!reservationId) {
      navigate("/rooms");
      return;
    }

    // Load draft data for room details
    try {
      const raw = sessionStorage.getItem("reservationDraft");
      if (raw) {
        const parsed = JSON.parse(raw);
        setDraft(parsed);
        console.log("[BILL] Loaded draft:", parsed);
      }
    } catch (e) {
      console.error("[BILL] Failed to load draft:", e);
    }

    fetchReservation();
  }, [reservationId, navigate]);

  const fetchReservation = async () => {
    if (!reservationId) return;

    try {
      setError(null);
      const res = await reservationApi.getReservationById(reservationId);
      const data = res?.reservation ?? res?.data ?? res;

      console.log("[BILL] Fetched reservation:", data);

      // Get payment info from nested payment object if exists
      const paymentData = data?.payment || {};

      // Ensure rooms is always an array
      setReservation({
        ...data,
        rooms: Array.isArray(data?.rooms) ? data.rooms : [],
        totalAmount: paymentData?.totalPrice || data?.totalAmount || 0,
        numberOfGuests:
          typeof data?.numberOfGuests === "number" ? data.numberOfGuests : 0,
        paymentType: paymentData?.paymentType || data?.paymentType || "full",
        paymentStatus:
          paymentData?.paymentStatus || data?.paymentStatus || "pending",
      });

      // Fetch customer info
      // First, try to get from API response data.customer (may be populated object)
      const customerData = data?.customer;
      if (customerData && typeof customerData === "object") {
        // Customer is already populated as an object
        setCustomerInfo({
          name:
            customerData?.fullname ||
            customerData?.fullName ||
            customerData?.username ||
            customerData?.name ||
            "Khách lẻ",
          phone: customerData?.phone || customerData?.phoneNumber || "—",
          email: customerData?.email || "—",
        });
      } else {
        // Customer is just an ID, try to get from localStorage
        const customerId = data?.customer?._id || data?.customer;
        if (customerId && customerId !== "guest") {
          try {
            const rawUser = localStorage.getItem("user");
            if (rawUser) {
              const user = JSON.parse(rawUser);
              if (user?._id === customerId || user?.id === customerId) {
                setCustomerInfo({
                  name:
                    user?.username ||
                    user?.fullname ||
                    user?.fullName ||
                    user?.name ||
                    "Khách lẻ",
                  phone: user?.phone || user?.phoneNumber || "—",
                  email: user?.email || "—",
                });
              }
            }
          } catch (err) {
            console.error("[BILL] Failed to get customer info:", err);
          }
        }
      }

      // Fetch hotel info - handle multiple formats
      const hotelId = data?.hotel?._id || data?.hotel || data?.hotelId;
      if (hotelId) {
        try {
          const hotel = await hotelApi.getHotelById(hotelId);
          setHotelName(hotel?.name || "—");
          setHotelAddress(hotel?.address || "—");
          setHotelPhone(hotel?.phone || "—");
          console.log("[BILL] Hotel info loaded:", {
            name: hotel?.name,
            address: hotel?.address,
            phone: hotel?.phone
          });
        } catch (err) {
          console.error("[BILL] Failed to fetch hotel:", err);
          setHotelName("—");
          setHotelAddress("—");
          setHotelPhone("—");
        }
      } else {
        // If hotel is already populated in reservation data
        const hotelData = data?.hotel;
        if (hotelData && typeof hotelData === 'object') {
          setHotelName(hotelData?.name || "—");
          setHotelAddress(hotelData?.address || "—");
          setHotelPhone(hotelData?.phone || "—");
        }
      }
    } catch (e: any) {
      console.error("[BILL] Failed to fetch reservation:", e);
      setError(e?.message || "Không thể tải thông tin hóa đơn");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!billCardRef.current || !reservation) return;

    try {
      setIsGeneratingPDF(true);

      // Store original styles
      const billCard = document.querySelector(".bill-card") as HTMLElement;
      const billCardBody = billCardRef.current;
      const billActions = document.querySelector(
        ".bill-actions"
      ) as HTMLElement;
      const heroWrap = document.querySelector(".hero-wrap") as HTMLElement;
      const container = document.querySelector(
        ".bill-section .container"
      ) as HTMLElement;
      const billSection = document.querySelector(
        ".bill-section"
      ) as HTMLElement;
      const billPage = document.querySelector(".bill-page") as HTMLElement;

      // Apply print styles temporarily
      if (billActions) {
        billActions.style.display = "none";
      }
      if (heroWrap) {
        heroWrap.style.display = "none";
      }
      if (billCard) {
        billCard.style.boxShadow = "none";
        billCard.style.border = "none";
        billCard.style.margin = "0";
      }
      if (billCardBody) {
        billCardBody.style.padding = "20px";
        billCardBody.style.margin = "0";
      }
      if (container) {
        container.style.maxWidth = "100%";
        container.style.padding = "0";
        container.style.margin = "0";
      }
      if (billSection) {
        billSection.style.padding = "0";
        billSection.style.margin = "0";
      }
      if (billPage) {
        billPage.style.backgroundColor = "white";
        billPage.style.padding = "0";
        billPage.style.margin = "0";
      }

      // Set fixed width for PDF generation (like print viewport)
      const pdfContentWidth = 800; // Fixed width in pixels for consistent PDF output
      if (billCardBody) {
        billCardBody.style.width = `${pdfContentWidth}px`;
        billCardBody.style.maxWidth = `${pdfContentWidth}px`;
      }
      if (billCard) {
        billCard.style.width = `${pdfContentWidth}px`;
        billCard.style.maxWidth = `${pdfContentWidth}px`;
      }

      // Wait a bit for styles to apply
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Force reflow to ensure all content is rendered
      void billCardRef.current.offsetHeight;

      // Scroll to top first
      window.scrollTo(0, 0);
      if (billCardBody) {
        billCardBody.scrollTop = 0;
      }

      // Wait for scroll to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Ensure we capture the full height including all sections
      // Force measurement by accessing offsetHeight multiple times
      const measureHeight = () => {
        const heights = [
          billCardRef.current?.scrollHeight || 0,
          billCardRef.current?.offsetHeight || 0,
          billCardRef.current?.clientHeight || 0,
        ];
        // Also check if there are payment sections
        const paymentSummary = document.querySelector(".payment-summary");
        const paymentStatus = document.querySelector(".payment-status");
        if (paymentSummary) {
          const rect = paymentSummary.getBoundingClientRect();
          heights.push(rect.bottom);
        }
        if (paymentStatus) {
          const rect = paymentStatus.getBoundingClientRect();
          heights.push(rect.bottom);
        }
        return Math.max(...heights);
      };

      // Measure multiple times to ensure accuracy
      let fullHeight = measureHeight();
      await new Promise((resolve) => setTimeout(resolve, 50));
      fullHeight = Math.max(fullHeight, measureHeight());

      // Add padding to ensure we capture everything
      fullHeight += 100; // Extra padding

      // Create canvas from HTML element with print-like settings
      const canvas = await html2canvas(billCardRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: pdfContentWidth,
        height: fullHeight,
        windowWidth: pdfContentWidth,
        windowHeight: fullHeight,
        scrollX: 0,
        scrollY: -window.scrollY, // Account for any scroll
        allowTaint: true,
        removeContainer: false,
      });

      // Restore original styles
      if (billActions) {
        billActions.style.display = "";
      }
      if (heroWrap) {
        heroWrap.style.display = "";
      }
      if (billCard) {
        billCard.style.boxShadow = "";
        billCard.style.border = "";
        billCard.style.margin = "";
        billCard.style.width = "";
        billCard.style.maxWidth = "";
      }
      if (billCardBody) {
        billCardBody.style.padding = "";
        billCardBody.style.margin = "";
        billCardBody.style.width = "";
        billCardBody.style.maxWidth = "";
      }
      if (container) {
        container.style.maxWidth = "";
        container.style.padding = "";
        container.style.margin = "";
      }
      if (billSection) {
        billSection.style.padding = "";
        billSection.style.margin = "";
      }
      if (billPage) {
        billPage.style.backgroundColor = "";
        billPage.style.padding = "";
        billPage.style.margin = "";
      }

      // Calculate PDF dimensions (A4 format with margins like print)
      const pdfMargin = 10; // 1cm margins on all sides
      const pageWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const usableWidth = pageWidth - pdfMargin * 2; // 190mm usable width

      // Calculate image dimensions maintaining aspect ratio
      // Convert canvas pixels to PDF mm: 1mm ≈ 3.779527559 pixels at 96 DPI
      // For better fit, use the usable width directly
      const imgWidth = usableWidth; // Use full usable width (190mm)
      const imgHeight = (canvas.height * imgWidth) / canvas.width; // Maintain aspect ratio

      // Create PDF with margins
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.setProperties({
        title: `Hóa đơn ${reservationId}`,
        subject: "Hóa đơn đặt phòng",
      });
      const imgData = canvas.toDataURL("image/png", 1.0);

      // Calculate usable page height (minus margins)
      const usablePageHeight = pageHeight - pdfMargin * 2; // 277mm usable height

      // If content fits in one page
      if (imgHeight <= usablePageHeight) {
        pdf.addImage(imgData, "PNG", pdfMargin, pdfMargin, imgWidth, imgHeight);
      } else {
        // Content spans multiple pages - split correctly to avoid duplication
        // Calculate pixels per mm for accurate cropping
        const pixelsPerMm = canvas.width / imgWidth;
        const totalHeightInPixels = canvas.height;
        const heightPerPageInPixels = usablePageHeight * pixelsPerMm;

        // Try to find section boundaries to avoid cutting sections
        const findSafeBreakPoint = (
          startY: number,
          maxHeight: number
        ): number => {
          // Check if we can fit the entire content in this page
          if (startY + maxHeight >= totalHeightInPixels) {
            return totalHeightInPixels - startY;
          }

          // Try to avoid breaking in the middle of sections
          // Look for a safe break point (some padding before next section)
          const safeBreakMargin = (50 * pixelsPerMm) / usablePageHeight; // ~50px buffer
          const adjustedMaxHeight = maxHeight - safeBreakMargin;

          // Check if we can fit more content
          if (startY + adjustedMaxHeight <= totalHeightInPixels) {
            return adjustedMaxHeight;
          }

          return maxHeight;
        };

        let currentY = 0; // Current position in pixels from top of canvas

        // Helper function to crop canvas and add to PDF
        const addCroppedPage = (sourceY: number, pageHeightPx: number) => {
          // Ensure we don't exceed canvas bounds
          const actualPageHeightPx = Math.min(
            pageHeightPx,
            totalHeightInPixels - sourceY
          );
          const actualPageHeightMm = actualPageHeightPx / pixelsPerMm;

          if (actualPageHeightPx <= 0) return;

          // Create temporary canvas for this page section
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = canvas.width;
          tempCanvas.height = actualPageHeightPx;
          const tempCtx = tempCanvas.getContext("2d");

          if (tempCtx) {
            // Draw the cropped section from source canvas
            // drawImage(source, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
            tempCtx.drawImage(
              canvas,
              0, // Source x
              sourceY, // Source y
              canvas.width, // Source width
              actualPageHeightPx, // Source height
              0, // Destination x
              0, // Destination y
              canvas.width, // Destination width
              actualPageHeightPx // Destination height
            );
            // Add to PDF
            pdf.addImage(
              tempCanvas.toDataURL("image/png", 1.0),
              "PNG",
              pdfMargin,
              pdfMargin,
              imgWidth,
              actualPageHeightMm
            );
          }
        };

        // First page - try to fit as much as possible while avoiding section breaks
        let remainingHeight = totalHeightInPixels;
        let sourceHeight = findSafeBreakPoint(currentY, heightPerPageInPixels);

        addCroppedPage(currentY, sourceHeight);

        currentY += sourceHeight;
        remainingHeight -= sourceHeight;

        // Additional pages
        while (remainingHeight > 0) {
          pdf.addPage();

          // Find safe break point for this page
          sourceHeight = findSafeBreakPoint(currentY, heightPerPageInPixels);

          addCroppedPage(currentY, sourceHeight);

          currentY += sourceHeight;
          remainingHeight -= sourceHeight;
        }
      }

      // Generate filename
      const filename = `Hoa_don_${reservationId}_${formatDate(
        reservation.createdAt
      ).replace(/\//g, "-")}.pdf`;

      // Download PDF
      pdf.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Có lỗi xảy ra khi tạo PDF. Vui lòng thử lại.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleNewBooking = () => {
    navigate("/rooms");
  };

  if (loading) {
    return (
      <div className="bill-page">
        <div className="loading-container">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Đang tải hóa đơn...</p>
        </div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="bill-page">
        <Container>
          <Row className="justify-content-center">
            <Col lg={8}>
              <Card className="error-card">
                <Card.Body className="text-center p-5">
                  <Alert variant="danger" className="mb-4">
                    {error || "Không tìm thấy thông tin hóa đơn"}
                  </Alert>
                  <Button variant="primary" onClick={() => navigate("/rooms")}>
                    Quay lại chọn phòng
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  const nights = Math.ceil(
    (new Date(reservation.checkOutDate).getTime() -
      new Date(reservation.checkInDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const totalAmount = draft?.total ?? reservation.totalAmount ?? 0;
  const depositAmount = Math.round(totalAmount * 0.5);
  const remainingAmount = totalAmount - depositAmount;

  return (
    <div className="bill-page">
      <div className="hero-wrap" style={{ backgroundImage: `url(${heroBg})` }}>
        <div className="overlay"></div>
        <Container>
          <Row className="justify-content-center">
            <Col lg={10}>
              <div className="bill-header">
                <h1>Hóa đơn đặt phòng</h1>
                <p>
                  Mã đặt phòng: <strong>{reservationId}</strong>
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <section className="bill-section">
        <Container>
          <Row className="justify-content-center">
            <Col lg={10}>
              <Card className="bill-card">
                <Card.Body className="p-4" ref={billCardRef}>
                  {/* Invoice Header */}
                  <div className="invoice-header">
                    <div className="hotel-info">
                      <h2 className="hotel-name">{hotelName}</h2>
                      <p className="hotel-address">
                        {hotelAddress}
                      </p>
                      <p className="hotel-phone">Hotline: {hotelPhone}</p>
                    </div>
                    <div className="invoice-info">
                      <h3 className="invoice-title">HÓA ĐƠN</h3>
                      <p className="invoice-number">Số: {reservationId}</p>
                      <p className="invoice-date">
                        Ngày: {formatDate(reservation.createdAt)}
                      </p>
                    </div>
                  </div>

                  <hr className="divider" />

                  {/* Customer Info */}
                  <div className="customer-info">
                    <h4 className="section-title">Thông tin khách hàng</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Họ tên:</span>
                        <span className="info-value">{customerInfo.name}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Số điện thoại:</span>
                        <span className="info-value">{customerInfo.phone}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Email:</span>
                        <span className="info-value">{customerInfo.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Reservation Details */}
                  <div className="reservation-details">
                    <h4 className="section-title">Chi tiết đặt phòng</h4>
                    <div className="details-grid">
                      <div className="detail-item">
                        <span className="detail-label">Ngày nhận phòng:</span>
                        <span className="detail-value">
                          {formatDate(reservation.checkInDate)}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Ngày trả phòng:</span>
                        <span className="detail-value">
                          {formatDate(reservation.checkOutDate)}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Số đêm:</span>
                        <span className="detail-value">{nights} đêm</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Số khách:</span>
                        <span className="detail-value">
                          {reservation.numberOfGuests} người
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Room Details */}
                  <div className="room-details">
                    <h4 className="section-title">Chi tiết phòng</h4>
                    {(() => {
                      // Priority 1: Use draft.selected if available
                      if (draft?.selected && draft.selected.length > 0) {
                        return (
                          <div className="room-table">
                            <div className="room-header">
                              <div className="room-col">Loại phòng</div>
                              <div className="room-col">Số lượng</div>
                              <div className="room-col">Số khách</div>
                              <div className="room-col">Giá/đêm</div>
                              <div className="room-col">Thành tiền</div>
                            </div>
                            {draft.selected.map((room: any, index: number) => (
                              <div
                                key={room.roomTypeId || index}
                                className="room-row"
                              >
                                <div className="room-col">{room.name}</div>
                                <div className="room-col">{room.quantity}</div>
                                <div className="room-col">
                                  {room.adults}NL, {room.children}TE,{" "}
                                  {room.infants}EB
                                </div>
                                <div className="room-col">
                                  {(room.unitPrice || 0).toLocaleString()} VNĐ
                                </div>
                                <div className="room-col">
                                  {(
                                    (room.unitPrice || 0) *
                                    (room.quantity || 1) *
                                    nights
                                  ).toLocaleString()}{" "}
                                  VNĐ
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }

                      // Priority 2: Use reservation.details array (from API)
                      const details = (reservation as any)?.details;
                      if (
                        details &&
                        Array.isArray(details) &&
                        details.length > 0
                      ) {
                        return (
                          <div className="room-table">
                            <div className="room-header">
                              <div className="room-col">Loại phòng</div>
                              <div className="room-col">Số lượng</div>
                              <div className="room-col">Số khách</div>
                              <div className="room-col">Giá/đêm</div>
                              <div className="room-col">Thành tiền</div>
                            </div>
                            {details.map((detail: any, index: number) => {
                              // Handle roomType - can be object or string ID
                              const roomType =
                                typeof detail?.roomType === "object"
                                  ? detail.roomType
                                  : null;
                              const roomTypeName =
                                roomType?.name || `Phòng ${index + 1}`;
                              const basePrice = roomType?.basePrice || 0;
                              const quantity = detail?.quantity || 0;
                              const adults = detail?.adults || 0;
                              const children = detail?.children || 0;
                              const infants = detail?.infants || 0;

                              return (
                                <div
                                  key={detail?._id || detail?.id || index}
                                  className="room-row"
                                >
                                  <div className="room-col">{roomTypeName}</div>
                                  <div className="room-col">{quantity}</div>
                                  <div className="room-col">
                                    {adults}NL, {children}TE, {infants}EB
                                  </div>
                                  <div className="room-col">
                                    {basePrice.toLocaleString()} VNĐ
                                  </div>
                                  <div className="room-col">
                                    {(
                                      basePrice *
                                      quantity *
                                      nights
                                    ).toLocaleString()}{" "}
                                    VNĐ
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }

                      // Priority 3: Fallback to reservation.rooms
                      return (
                        <div className="room-table">
                          <div className="room-header">
                            <div className="room-col">Loại phòng</div>
                            <div className="room-col">Số lượng</div>
                            <div className="room-col">Số khách</div>
                            <div className="room-col">Giá/đêm</div>
                            <div className="room-col">Thành tiền</div>
                          </div>
                          {(reservation.rooms || []).map((room, index) => (
                            <div
                              key={room.roomTypeId || index}
                              className="room-row"
                            >
                              <div className="room-col">
                                {room.roomType?.name || `Phòng ${index + 1}`}
                              </div>
                              <div className="room-col">
                                {room.quantity || 0}
                              </div>
                              <div className="room-col">
                                {room.adults || 0}NL, {room.children || 0}TE,{" "}
                                {room.infants || 0}EB
                              </div>
                              <div className="room-col">
                                {(
                                  room.roomType?.basePrice || 0
                                ).toLocaleString()}{" "}
                                VNĐ
                              </div>
                              <div className="room-col">
                                {(
                                  (room.roomType?.basePrice || 0) *
                                  (room.quantity || 0) *
                                  nights
                                ).toLocaleString()}{" "}
                                VNĐ
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Payment Summary */}
                  <div className="payment-summary">
                    <h4 className="section-title">Tóm tắt thanh toán</h4>
                    <div className="summary-table">
                      <div className="summary-row">
                        <span className="summary-label">Tổng tiền phòng:</span>
                        <span className="summary-value">
                          {totalAmount.toLocaleString()} VNĐ
                        </span>
                      </div>
                      {reservation.paymentType === "deposit" && (
                        <>
                          <div className="summary-row">
                            <span className="summary-label">
                              Đã thanh toán (50%):
                            </span>
                            <span className="summary-value">
                              {depositAmount.toLocaleString()} VNĐ
                            </span>
                          </div>
                          <div className="summary-row">
                            <span className="summary-label">Còn lại:</span>
                            <span className="summary-value">
                              {remainingAmount.toLocaleString()} VNĐ
                            </span>
                          </div>
                        </>
                      )}
                      <div className="summary-row total">
                        <span className="summary-label">
                          {reservation.paymentType === "full"
                            ? "Tổng cộng:"
                            : "Đã thanh toán:"}
                        </span>
                        <span className="summary-value">
                          {reservation.paymentType === "full"
                            ? totalAmount.toLocaleString()
                            : depositAmount.toLocaleString()}{" "}
                          VNĐ
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="payment-status">
                    <h4 className="section-title">Trạng thái thanh toán</h4>
                    <div className="status-info">
                      <div className="status-item">
                        <span className="status-label">Phương thức:</span>
                        <span className="status-value">
                          {reservation.paymentStatus === "fully_paid"
                            ? "Thanh toán toàn bộ"
                            : reservation.paymentStatus === "deposit_paid"
                            ? "Thanh toán cọc 50%"
                            : "Chưa xác định"}
                        </span>
                      </div>
                      <div className="status-item">
                        <span className="status-label">Trạng thái:</span>
                        <span
                          className={`status-value status-${reservation.paymentStatus}`}
                        >
                          {reservation.paymentStatus === "fully_paid"
                            ? "Đã thanh toán"
                            : reservation.paymentStatus === "deposit_paid"
                            ? "Đã thanh toán cọc"
                            : reservation.paymentStatus === "completed"
                            ? "Đã thanh toán"
                            : reservation.paymentStatus === "pending"
                            ? "Chờ thanh toán"
                            : reservation.paymentStatus === "refunded"
                            ? "Đã hoàn tiền"
                            : "Chưa thanh toán"}
                        </span>
                      </div>
                      {reservation.paymentConfirmedAt && (
                        <div className="status-item">
                          <span className="status-label">
                            Thời gian xác nhận:
                          </span>
                          <span className="status-value">
                            {formatDateTime(reservation.paymentConfirmedAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="bill-actions">
                    <Button
                      variant="outline-primary"
                      onClick={handlePrint}
                      className="me-3"
                    >
                      <Print className="me-2" />
                      In hóa đơn
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={handleDownload}
                      className="me-3"
                      disabled={isGeneratingPDF}
                    >
                      {isGeneratingPDF ? (
                        <>
                          <Spinner
                            animation="border"
                            size="sm"
                            className="me-2"
                          />
                          Đang tạo PDF...
                        </>
                      ) : (
                        <>
                          <Download className="me-2" />
                          Tải PDF
                        </>
                      )}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleNewBooking}
                      className="me-3"
                    >
                      Đặt phòng mới
                    </Button>
                    <Button
                      variant="outline-success"
                      onClick={handleBackToHome}
                    >
                      <Home className="me-2" />
                      Về trang chủ
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default ReservationBill;
