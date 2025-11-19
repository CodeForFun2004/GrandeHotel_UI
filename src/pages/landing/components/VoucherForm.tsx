import React, { useEffect, useState, useMemo } from 'react';
import { Container, Row, Col, Form, Carousel } from 'react-bootstrap';
import { LocalOffer, ContentCopy } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { getAllVouchers } from '../../../api/voucher';
import { getAllHotels } from '../../../api/hotel';
import type { Voucher, Hotel } from '../../../types/entities';
import './VoucherForm.css';

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

const VoucherForm: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [scopeFilter, setScopeFilter] = useState<'all' | 'global' | 'multi-hotel'>('all');
  const [selectedHotelId, setSelectedHotelId] = useState<string>('all');

  // Fetch hotels for filter
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await getAllHotels();
        setHotels(response.results || []);
      } catch (err) {
        console.error('Error fetching hotels:', err);
      }
    };
    fetchHotels();
  }, []);

  // Fetch vouchers based on filters
  useEffect(() => {
    const fetchActiveVouchers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build API params based on filters
        const params: { status?: 'active' | 'inactive'; scope?: 'global' | 'multi-hotel' } = {
          status: 'active'
        };
        
        if (scopeFilter === 'global') {
          params.scope = 'global';
        } else if (scopeFilter === 'multi-hotel') {
          params.scope = 'multi-hotel';
        }
        // If scopeFilter is 'all', don't add scope param to get all vouchers
        
        console.log('📡 Fetching vouchers with params:', params);
        const response = await getAllVouchers(params);
        
        console.log('Voucher API response:', response);
        
        // Handle different response formats
        // getAllVouchers always returns { results: Voucher[], total, page, limit }
        let activeVouchers: Voucher[] = [];
        if (response && response.results && Array.isArray(response.results)) {
          activeVouchers = response.results;
        } else if (Array.isArray(response)) {
          // Fallback: if somehow response is array directly
          activeVouchers = response;
        } else if (response && (response as any).data && Array.isArray((response as any).data)) {
          // Fallback: if response has data property
          activeVouchers = (response as any).data;
        }

        console.log('Active vouchers before filter:', activeVouchers);

        // Filter by scope and hotel if needed
        let filteredByScope = activeVouchers;
        
        if (scopeFilter === 'global') {
          filteredByScope = activeVouchers.filter(v => v.scope === 'global');
          console.log('🔍 Filtered by scope=global:', filteredByScope.length);
        } else if (scopeFilter === 'multi-hotel') {
          filteredByScope = activeVouchers.filter(v => v.scope === 'multi-hotel');
          console.log('🔍 Filtered by scope=multi-hotel:', filteredByScope.length);
          
          // If specific hotel selected, filter by hotelId
          if (selectedHotelId && selectedHotelId !== 'all') {
            filteredByScope = filteredByScope.filter(v => {
              if (!v.hotelIds || !Array.isArray(v.hotelIds)) return false;
              return v.hotelIds.some(h => {
                const hotelId = typeof h === 'string' ? h : (h._id || h.id);
                return hotelId === selectedHotelId;
              });
            });
            console.log(`🔍 Filtered by hotelId=${selectedHotelId}:`, filteredByScope.length);
          }
        }
        // If scopeFilter is 'all', keep all vouchers

        // Filter only active vouchers that are not expired
        const now = new Date();
        console.log('🔍 Current date for filtering:', now.toISOString());
        console.log('📦 Total active vouchers from API:', activeVouchers.length);
        
        // Check GRAND2011 specifically before filtering
        const grand2011BeforeFilter = filteredByScope.find(v => v.code === 'GRAND2011');
        if (grand2011BeforeFilter) {
          console.log('🔍 GRAND2011 BEFORE filter:', {
            code: grand2011BeforeFilter.code,
            status: grand2011BeforeFilter.status,
            startDate: grand2011BeforeFilter.startDate,
            endDate: grand2011BeforeFilter.endDate,
            fullObject: grand2011BeforeFilter
          });
        } else {
          console.warn('⚠️ GRAND2011 not found in filtered vouchers!');
        }
        
        const validVouchers = filteredByScope.filter((voucher) => {
          const isGRAND2011 = voucher.code === 'GRAND2011';
          
          if (isGRAND2011) {
            console.log('🔍 === CHECKING GRAND2011 ===');
            console.log('Full voucher object:', JSON.stringify(voucher, null, 2));
          }
          
          if (voucher.status !== 'active') {
            if (isGRAND2011) {
              console.log(`❌ GRAND2011 filtered: status is "${voucher.status}", expected "active"`);
            }
            return false;
          }
          
          if (!voucher.startDate || !voucher.endDate) {
            if (isGRAND2011) {
              console.log(`❌ GRAND2011 filtered: missing dates`, {
                startDate: voucher.startDate,
                endDate: voucher.endDate
              });
            }
            return false;
          }
          
          const startDate = typeof voucher.startDate === 'string' 
            ? new Date(voucher.startDate) 
            : voucher.startDate;
          const endDate = typeof voucher.endDate === 'string' 
            ? new Date(voucher.endDate) 
            : voucher.endDate;
          
          if (isGRAND2011) {
            console.log('GRAND2011 date parsing:', {
              startDateRaw: voucher.startDate,
              endDateRaw: voucher.endDate,
              startDateParsed: startDate.toISOString(),
              endDateParsed: endDate.toISOString(),
              now: now.toISOString(),
              startDateValid: startDate <= now,
              endDateValid: endDate >= now,
              startDateType: typeof voucher.startDate,
              endDateType: typeof voucher.endDate
            });
          }
          
          const isStartValid = startDate <= now;
          const isEndValid = endDate >= now;
          
          if (isGRAND2011) {
            console.log(`GRAND2011 validation result:`, {
              isStartValid,
              isEndValid,
              willInclude: isStartValid && isEndValid
            });
          }
          
          if (!isStartValid) {
            if (isGRAND2011) {
              console.log(`❌ GRAND2011 filtered: startDate (${startDate.toISOString()}) > now (${now.toISOString()})`);
            }
            return false;
          }
          if (!isEndValid) {
            if (isGRAND2011) {
              console.log(`❌ GRAND2011 filtered: endDate (${endDate.toISOString()}) < now (${now.toISOString()})`);
            }
            return false;
          }
          
          if (isGRAND2011) {
            console.log('✅ GRAND2011 PASSED all filters!');
          }
          
          return true;
        });

        console.log('✅ Valid vouchers after filter:', validVouchers);
        console.log('📊 Total valid vouchers:', validVouchers.length);
        console.log('📋 Voucher codes:', validVouchers.map(v => v.code));
        
        // Check if GRAND2011 is in final list
        const grand2011AfterFilter = validVouchers.find(v => v.code === 'GRAND2011');
        if (!grand2011AfterFilter) {
          console.error('❌ GRAND2011 NOT in valid vouchers after filter!');
          console.log('All valid voucher codes:', validVouchers.map(v => v.code));
        } else {
          console.log('✅ GRAND2011 FOUND in valid vouchers:', grand2011AfterFilter);
        }
        
        setVouchers(validVouchers); // Show all valid vouchers
      } catch (err: any) {
        console.error('Error fetching vouchers:', err);
        setError(err?.response?.data?.message || err?.message || 'Không thể tải voucher');
        setVouchers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveVouchers();
  }, [scopeFilter, selectedHotelId]);

  const formatDiscount = (voucher: Voucher) => {
    if (voucher.discountType === 'percent') {
      return `${voucher.discountValue}%`;
    }
    return `${voucher.discountValue.toLocaleString('vi-VN')}₫`;
  };

  const formatDiscountInfo = (voucher: Voucher) => {
    if (voucher.discountType === 'percent') {
      let info = `Giảm ${voucher.discountValue}%`;
      if (voucher.maxDiscount) {
        info += ` (tối đa ${voucher.maxDiscount.toLocaleString('vi-VN')} ₫)`;
      }
      return info;
    } else {
      return `Giảm ${voucher.discountValue.toLocaleString('vi-VN')} ₫`;
    }
  };

  const getCardBackground = (index: number) => {
    const backgrounds = [
      'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)', // Dark gray
      '#ec4899', // Pink
      '#dc2626', // Red
      '#7c2d12' // Dark brown
    ];
    return backgrounds[index % backgrounds.length];
  };

  const handleCopyVoucher = async (voucher: Voucher, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    try {
      await navigator.clipboard.writeText(voucher.code);
      localStorage.setItem('selectedVoucherCode', voucher.code);
      toast.success(`Đã sao chép mã voucher: ${voucher.code}`, {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = voucher.code;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        localStorage.setItem('selectedVoucherCode', voucher.code);
        toast.success(`Đã sao chép mã voucher: ${voucher.code}`, {
          position: 'top-right',
          autoClose: 3000,
        });
      } catch (fallbackErr) {
        toast.error('Không thể sao chép mã voucher', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
      document.body.removeChild(textArea);
    }
  };

  // Group vouchers into chunks of 4 for carousel slides
  const voucherGroups = useMemo(() => {
    const groups: Voucher[][] = [];
    for (let i = 0; i < vouchers.length; i += 4) {
      groups.push(vouchers.slice(i, i + 4));
    }
    return groups;
  }, [vouchers]);

  // Always render the section, even if loading or empty
  return (
    <section className="voucher-section">
      <Container>
        <div className="voucher-header">
          <div className="voucher-title-wrapper">
            <LocalOffer className="voucher-icon" />
            <h2 className="voucher-title">KHUYẾN MÃI ĐẶC BIỆT</h2>
    </div>
          <div className="voucher-filter-wrapper">
            <Form.Select
              value={scopeFilter}
              onChange={(e) => {
                setScopeFilter(e.target.value as 'all' | 'global' | 'multi-hotel');
                if (e.target.value !== 'multi-hotel') {
                  setSelectedHotelId('all');
                }
              }}
              className="voucher-filter-select"
            >
              <option value="all">Toàn bộ hệ thống</option>
              <option value="global">Voucher toàn hệ thống</option>
              <option value="multi-hotel">Theo khách sạn</option>
            </Form.Select>
            {scopeFilter === 'multi-hotel' && (
              <Form.Select
                value={selectedHotelId}
                onChange={(e) => setSelectedHotelId(e.target.value)}
                className="voucher-filter-select voucher-hotel-select"
              >
                <option value="all">Tất cả khách sạn</option>
                {hotels.map((hotel) => (
                  <option key={hotel._id || hotel.id} value={hotel._id || hotel.id}>
                    {hotel.name}
                  </option>
                ))}
              </Form.Select>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <p>Đang tải voucher...</p>
          </div>
        ) : error ? (
          <div className="text-center py-5">
            <p style={{ color: '#dc2626' }}>{error}</p>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="text-center py-5">
            <p>Hiện tại không có voucher khuyến mãi</p>
          </div>
        ) : (
          <div className="voucher-carousel-wrapper">
            <Carousel
              indicators={voucherGroups.length > 1}
              controls={voucherGroups.length > 1}
              interval={3000}
              pause="hover"
              className="voucher-carousel"
            >
              {voucherGroups.map((group, groupIndex) => (
                <Carousel.Item key={groupIndex}>
                  <Row className="voucher-cards-row">
                    {group.map((voucher, index) => {
                      const globalIndex = groupIndex * 4 + index;
                      const cardBg = getCardBackground(globalIndex);
                      
                      return (
                        <Col key={voucher._id || voucher.id || globalIndex} xs={12} sm={6} md={3} className="mb-4">
                          <div 
                            className="voucher-card"
                            style={{ background: cardBg }}
                          >
                            <div className="voucher-card-content">
                              <div className="voucher-card-header">
                                <div className="voucher-brand">
                                  {voucher.name || voucher.code}
                                </div>
                              </div>
                              
                              <div className="voucher-gift-icon">
                                <GiftIcon fill="rgba(255, 255, 255, 0.9)" size={48} />
                              </div>
                              
                              <div className="voucher-card-body">
                                <div className="voucher-type-wrapper">
                                  <div className="voucher-type">
                                    {voucher.code}
                                  </div>
                                  <button
                                    className="voucher-copy-btn"
                                    onClick={(e) => handleCopyVoucher(voucher, e)}
                                    title="Sao chép mã voucher"
                                  >
                                    <ContentCopy sx={{ fontSize: 16 }} />
                                    <span className="voucher-copy-text">Copy</span>
                                  </button>
                                </div>
                                <div className="voucher-value">
                                  {formatDiscount(voucher)}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="voucher-info">
                            <div className="voucher-description">
                              {voucher.description || voucher.name}
                            </div>
                            <div className="voucher-discount-info">
                              <div className="voucher-discount-text">
                                {formatDiscountInfo(voucher)}
                              </div>
                              {voucher.minBookingValue > 0 && (
                                <div className="voucher-min-booking">
                                  Đơn tối thiểu: {voucher.minBookingValue.toLocaleString('vi-VN')} ₫
                                </div>
                              )}
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </Carousel.Item>
              ))}
            </Carousel>
          </div>
        )}
      </Container>
    </section>
  );
};

export default VoucherForm;
