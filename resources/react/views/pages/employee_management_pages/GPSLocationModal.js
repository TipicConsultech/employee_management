import React, { useState, useEffect } from 'react';
import {
  CModal,
  CModalBody,
  CModalHeader,
  CModalTitle,
  CButton,
  CBadge,
  CSpinner,
  CAlert,
  CButtonGroup,
} from '@coreui/react';
import {
  cilLocationPin,
  cilLayers,
  cilAccountLogout,
  cilCheckCircle,
  cilWarning,
  cilZoomIn,
  cilZoomOut,
  cilFullscreen
} from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import { getAPICall } from '../../../util/api';

const GPSLocationModal = ({ 
  isOpen, 
  onClose, 
  gpsCoordinates, 
  attendanceType,
  isNoLimit 
}) => {
  const [mapType, setMapType] = useState('satellite');
  const [zoom, setZoom] = useState(15);
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [companyLocation, setCompanyLocation] = useState(null);
  const [isWithinPremises, setIsWithinPremises] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);


  // Parse GPS coordinates when props change
  useEffect(() => {
    if (gpsCoordinates && isOpen) {
      setLoading(true);
      const coords = parseGPSCoordinates(gpsCoordinates);
      
      setTimeout(() => {
        setCoordinates(coords);
        setLoading(false);
      }, 500);
        
    }
  }, [gpsCoordinates, isOpen,attendanceType]);

  // Fetch company location
  useEffect(() => {
    getCompanyLocation();
  }, []);

  async function getCompanyLocation() {
    try {
      const response = await getAPICall('/api/getCordinates');
      if (response && response[0]) {
        setCompanyLocation(response[0]);
      }
    } catch (error) {
      console.error('Error fetching company location:', error);
    }
  }

  // Check if user is within company premises
  useEffect(() => {
    if (coordinates && companyLocation) {
      const isWithin = checkLocationProximity(
        coordinates,
        {
          lat: parseFloat(companyLocation.required_lat),
          lng: parseFloat(companyLocation.required_lng)
        },
        parseFloat(companyLocation.location_tolerance)
      );
      setIsWithinPremises(isWithin);
    }
  }, [coordinates, companyLocation]);

  const parseGPSCoordinates = (gpsString) => {
    if (!gpsString) return null;
    const [lat, lng] = gpsString.split(',').map(coord => parseFloat(coord.trim()));
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return null;
    }
    return { lat, lng };
  };

  // Calculate distance between two coordinates using Haversine formula
  const checkLocationProximity = (userCoords, companyCoords, tolerance) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = userCoords.lat * Math.PI / 180;
    const φ2 = companyCoords.lat * Math.PI / 180;
    const Δφ = (companyCoords.lat - userCoords.lat) * Math.PI / 180;
    const Δλ = (companyCoords.lng - userCoords.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return distance <= tolerance;
  };

  const getMapUrl = () => {
    if (!coordinates) return '';
    const { lat, lng } = coordinates;
    if (mapType === 'satellite') {
      return `https://maps.google.com/maps?q=${lat},${lng}&t=h&z=${zoom}&output=embed`;
    } else {
      return `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`;
    }
  };

  const toggleMapType = () => {
    setMapType(mapType === 'satellite' ? 'roadmap' : 'satellite');
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 1, 20));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 1, 1));
  };

  const getAttendanceTypeInfo = () => {
    if (attendanceType === 'check_in') {
      return {
        label: 'Check-in',
        icon: cilAccountLogout,
        color: 'success',
        bgColor: '#d1e7dd',
        textColor: '#0f5132'
      };
    } else {
      return {
        label: 'Check-out',
        icon: cilAccountLogout,
        color: 'warning',
        bgColor: '#fff3cd',
        textColor: '#664d03'
      };
    }
  };

  const attendanceInfo = getAttendanceTypeInfo();

  return (
    <CModal
      visible={isOpen}
      onClose={onClose}
      size={isFullscreen ? "xl" : "lg"}
      backdrop="static"
      className="modern-gps-modal"
    >
      <CModalHeader className="border-0 pb-0">
        <CModalTitle className="d-flex align-items-center">
          <div 
            className="me-2 rounded-circle d-flex align-items-center justify-content-center"
            style={{ 
              width: '32px', 
              height: '32px', 
              backgroundColor: '#e3f2fd',
              color: '#1976d2'
            }}
          >
            <CIcon icon={cilLocationPin} size="sm" />
          </div>
          <div>
            <div className="fw-bold fs-6">GPS Location</div>
            <small className="text-muted">Location verification</small>
          </div>
        </CModalTitle>
      </CModalHeader>
      
      <CModalBody className="p-0">
        {/* Compact Header Section */}
        <div className="px-3 py-2" style={{ backgroundColor: '#f8f9fa' }}>
          {/* Status and Controls Row */}
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
            {/* Status Badges */}
            <div className="d-flex flex-wrap gap-2">
              {/* <div 
                className="d-flex align-items-center px-2 py-1 rounded-pill"
                style={{ 
                  backgroundColor: attendanceInfo.bgColor,
                  color: attendanceInfo.textColor,
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}
              >
                <CIcon icon={attendanceInfo.icon} size="sm" className="me-1" />
                {attendanceInfo.label} Location
              </div> */}
              
              {companyLocation && coordinates && (
                <div 
                  className="d-flex align-items-center px-2 py-1 rounded-pill"
                  style={{ 
                    backgroundColor: isWithinPremises ? '#d1e7dd' : '#f8d7da',
                    color: isWithinPremises ? '#0f5132' : '#721c24',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}
                >
                  <CIcon 
                    icon={isWithinPremises ? cilCheckCircle : cilWarning} 
                    size="sm" 
                    className="me-1" 
                  />
                 {isWithinPremises?"Within Premises":"Outside of Premises"}
                </div>
              )}
            </div>

            {/* Map Controls */}
            <div className="d-flex gap-1">
              <CButton
                color="light"
                size="sm"
                onClick={toggleMapType}
                className="shadow-sm d-flex align-items-center"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
              >
                <CIcon icon={cilLayers} size="sm" className="me-1" />
                {mapType === 'satellite' ? 'Sat' : 'Road'}
              </CButton>
              
              <CButtonGroup size="sm">
                <CButton
                  color="light"
                  onClick={handleZoomIn}
                  disabled={zoom >= 20}
                  className="shadow-sm"
                  style={{ padding: '0.25rem 0.5rem' }}
                >
                  <CIcon icon={cilZoomIn} size="sm" />
                </CButton>
                <CButton
                  color="light"
                  onClick={handleZoomOut}
                  disabled={zoom <= 1}
                  className="shadow-sm"
                  style={{ padding: '0.25rem 0.5rem' }}
                >
                  <CIcon icon={cilZoomOut} size="sm" />
                </CButton>
              </CButtonGroup>
              
              <CButton
                color="light"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="shadow-sm"
                style={{ padding: '0.25rem 0.5rem' }}
              >
                <CIcon icon={cilFullscreen} size="sm" />
              </CButton>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="position-relative">
          <div 
            style={{ 
              height: isFullscreen ? '450px' : '300px',
              backgroundColor: '#f8f9fa',
              overflow: 'hidden'
            }}
          >
            {/* Loading State */}
            {loading && (
              <div 
                className="d-flex flex-column align-items-center justify-content-center h-100"
                style={{ backgroundColor: 'rgba(248, 249, 250, 0.9)' }}
              >
                <CSpinner color="primary" size="sm" className="mb-2" />
                <div className="text-muted" style={{ fontSize: '0.875rem' }}>Loading location...</div>
              </div>
            )}

            {/* Error State */}
            {!coordinates && !loading && (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 text-danger">
                <div 
                  className="mb-2 rounded-circle d-flex align-items-center justify-content-center"
                  style={{ 
                    width: '48px', 
                    height: '48px', 
                    backgroundColor: '#f8d7da',
                    color: '#721c24'
                  }}
                >
                  <CIcon icon={cilLocationPin} size="lg" />
                </div>
                <div className="fw-bold" style={{ fontSize: '0.875rem' }}>Unable to load location</div>
                <small className="text-muted mt-1">
                  Please check GPS coordinates
                </small>
              </div>
            )}

            {/* Map */}
            {coordinates && !loading && (
              <>
                <iframe
                  key={`${coordinates.lat}-${coordinates.lng}-${mapType}-${zoom}`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={getMapUrl()}
                  allowFullScreen
                  title={`${attendanceInfo.label} Map`}
                />
                
                {/* Floating Location Info */}
                <div 
                  className="position-absolute shadow-sm"
                  style={{
                    top: '0.75rem',
                    left: '0.75rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    backdropFilter: 'blur(10px)',
                    zIndex: 1000,
                    maxWidth: '180px'
                  }}
                >
                  <div className="d-flex align-items-center">
                    <div 
                      className="me-2 rounded-circle"
                      style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: attendanceInfo.color === 'success' ? '#198754' : '#fd7e14',
                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                      }}
                    />
                    <div>
                      <div className="fw-bold" style={{ fontSize: '0.75rem' }}>
                        📍 {attendanceInfo.label}
                      </div>
                      <small className="text-muted d-block" style={{ fontSize: '0.6rem' }}>
                        {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                      </small>
                    </div>
                  </div>
                </div>

                {/* Floating Action Button */}
                <div 
                  className="position-absolute"
                  style={{
                    bottom: '0.75rem',
                    right: '0.75rem',
                    zIndex: 1000
                  }}
                >
                  <CButton
                    color="primary"
                    className="rounded-circle shadow"
                    style={{ width: '40px', height: '40px' }}
                    onClick={() => {
                      const url = `https://maps.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
                      window.open(url, '_blank');
                    }}
                  >
                    <CIcon icon={cilLocationPin} size="sm" />
                  </CButton>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Compact Footer */}
        <div className="px-3 py-2 d-flex justify-content-end" style={{ backgroundColor: '#f8f9fa' }}>
          <CButton
            color="secondary"
            variant="ghost"
            onClick={onClose}
            size="sm"
            className="px-3"
          >
            Close
          </CButton>
        </div>
      </CModalBody>

      <style jsx>{`
        .modern-gps-modal .modal-content {
          border-radius: 12px;
          border: none;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
          max-height: 85vh;
          overflow: hidden;
        }
        
        .modern-gps-modal .modal-header {
          border-radius: 12px 12px 0 0;
          padding: 1rem 1.5rem 0.5rem;
        }

        .modern-gps-modal .modal-body {
          padding: 0;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .5;
          }
        }

        @media (max-width: 768px) {
          .modern-gps-modal .modal-dialog {
            margin: 0.5rem;
            max-width: calc(100% - 1rem);
          }
          
          .modern-gps-modal .modal-content {
            border-radius: 8px;
            max-height: 90vh;
          }

          .modern-gps-modal .modal-header {
            padding: 0.75rem 1rem 0.25rem;
          }
          
          .modern-gps-modal .modal-header .modal-title {
            font-size: 1rem;
          }
        }

        @media (max-width: 576px) {
          .modern-gps-modal .modal-dialog {
            margin: 0.25rem;
            max-width: calc(100% - 0.5rem);
          }

          .modern-gps-modal .modal-content {
            max-height: 95vh;
          }

          /* Stack badges on mobile */
          .modern-gps-modal .d-flex.flex-wrap.gap-2 {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .modern-gps-modal .d-flex.flex-wrap.gap-2 > div:last-child {
            align-self: flex-end;
          }
        }
      `}</style>
    </CModal>
  );
};

export default GPSLocationModal;