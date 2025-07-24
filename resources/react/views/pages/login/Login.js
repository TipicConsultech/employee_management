import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CButtonGroup,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilArrowThickFromTop, cilLockLocked, cilUser, cilPhone, cilShieldAlt } from '@coreui/icons';
import { login, post } from '../../../util/api';
import { isLogIn, storeUserData } from '../../../util/session';

import logo from './../../../assets/brand/ems_new_image.png';
import { useToast } from '../../common/toast/ToastContext';

const Login = () => {
  const [validated, setValidated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [loginType, setLoginType] = useState('Employee');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const userNameRef = useRef();
  const userPwdRef = useRef();
  const { showToast } = useToast();

  useEffect(() => {
    // Simulate app loading
    setTimeout(() => setIsLoading(false), 1500);

    if (isLogIn()) {
      navigate('/');
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      setShowInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [navigate]);

  const onInstall = async () => {
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt();
      const { outcome } = await window.deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        window.deferredPrompt = null;
        setShowInstall(false);
      }
    }
  };

  const getEmployeePath = (type) => {
    switch (type) {
      case 'face_attendance':
      case 'both':
        return '/checkInWithSelfie';
      case 'location':
        return '/employee_tracker';
      default:
        return '/employee_tracker';
    }
  };

  const getRedirectPathByUserType = (userType, type = null) => {
    switch (userType) {
      case 0:
        return '/company/new';
      case 1:
        return '/dashboard';
      case 10:
        return type ? getEmployeePath(type) : '/employee_tracker';
      default:
        return '/employee_tracker';
    }
  };

  const validateMobileNumber = (mobile) => {
    const cleaned = mobile.replace(/\D/g, '');
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(cleaned);
  };

  const handleMobileInputChange = (e) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^0-9]/g, '');

    if (numericValue.length <= 10) {
      e.target.value = numericValue;
    } else {
      e.target.value = numericValue.substring(0, 10);
    }
  };

  const handleMobileKeyPress = (e) => {
    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true)) {
      return;
    }
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  const handleMobilePaste = (e) => {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData('text');
    const numericPaste = paste.replace(/[^0-9]/g, '');

    if (numericPaste.length <= 10) {
      e.target.value = numericPaste;
    } else {
      e.target.value = numericPaste.substring(0, 10);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (isSubmitting) return;

    const form = event.currentTarget;
    if (form.checkValidity() !== true) {
      setValidated(true);
      return;
    }

    setIsSubmitting(true);
    setValidated(true);

    const credential = userNameRef.current?.value?.trim();
    const password = userPwdRef.current?.value?.trim();

    if (!credential || !password) {
      const errorMessage = loginType === 'Employee'
        ? 'Please provide valid phone number and password'
        : 'Please provide valid email and password';
      showToast('danger', errorMessage);
      setIsSubmitting(false);
      return;
    }

    if (loginType === 'Employee' && !validateMobileNumber(credential)) {
      showToast('danger', 'Please provide a valid 10-digit mobile number');
      setIsSubmitting(false);
      return;
    }

    try {
      const loginData = loginType === 'Employee'
        ? { mobile: credential, password }
        : { email: credential, password };

      let resp = null;

      if (loginType === "Employee") {
        try {
          resp = await post('/api/mobileLogin', loginData);
        } catch (employeeError) {
          console.error('Employee login error:', employeeError);
          const errorMessage = 'Please provide valid phone number and password';
          showToast('danger', errorMessage);
          setIsSubmitting(false);
          return;
        }
      } else {
        try {
          resp = await login(loginData);
        } catch (managerError) {
          console.error('Manager login error:', managerError);
          const errorMessage = 'Please provide valid email and password';
          showToast('danger', errorMessage);
          setIsSubmitting(false);
          return;
        }
      }

      if (!resp) {
        const errorMessage = loginType === 'Employee'
          ? 'Please provide valid phone number and password'
          : 'Please provide valid email and password';
        showToast('danger', errorMessage);
        setIsSubmitting(false);
        return;
      }

      if (resp.blocked) {
        showToast('danger', resp.message || 'Account is blocked');
        setIsSubmitting(false);
        return;
      }

      if (resp.user) {
        storeUserData(resp);
        const redirectPath = getRedirectPathByUserType(resp.user.type, resp?.user?.attendance_type);
        navigate(redirectPath);
        return;
      }

      const errorMessage = loginType === 'Employee'
        ? 'Please provide valid phone number and password'
        : 'Please provide valid email and password';
      showToast('danger', errorMessage);
      setIsSubmitting(false);

    } catch (error) {
      console.error('General login error:', error);
      const errorMessage = loginType === 'Employee'
        ? 'Please provide valid phone number and password'
        : 'Please provide valid email and password';
      showToast('danger', errorMessage);
      setIsSubmitting(false);
    }
  };

  const handleLoginTypeChange = (type) => {
    if (isSubmitting) return;

    setLoginType(type);
    setValidated(false);
    setIsSubmitting(false);

    if (userNameRef.current) {
      userNameRef.current.value = '';
    }
    if (userPwdRef.current) {
      userPwdRef.current.value = '';
    }
  };

  const handleShowPasswordToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPassword(prev => !prev);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isSubmitting) {
      e.preventDefault();
      handleLogin(e);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleLogin(e);
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="position-fixed w-100 h-100 d-flex align-items-center justify-content-center"
           style={{
             background: 'linear-gradient(135deg, #1e3a5f 0%, #2c5aa0 50%, #0ea5e9 100%)',
             zIndex: 9999
           }}>
        <div className="text-center">
          <div className="mb-4">
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              animation: 'pulse 2s infinite'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #0ea5e9, #22d3ee)',
                animation: 'spin 1s linear infinite'
              }}></div>
            </div>
          </div>
          <h4 className="text-white mb-2">EmpPulse</h4>
          <p className="text-white-50">Employee Management System</p>
          <style jsx>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.1); opacity: 0.8; }
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 position-relative overflow-hidden">
      {/* Animated Background */}
      <div className="position-absolute w-100 h-100" style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2c5aa0 25%, #0ea5e9 50%, #22d3ee 75%, #0891b2 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite'
      }}>
        {/* Floating Elements */}
        <div className="position-absolute" style={{
          top: '10%',
          left: '10%',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        <div className="position-absolute" style={{
          top: '60%',
          right: '15%',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          animation: 'float 8s ease-in-out infinite reverse'
        }}></div>
        <div className="position-absolute" style={{
          bottom: '20%',
          left: '20%',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'rgba(34, 211, 238, 0.2)',
          animation: 'float 7s ease-in-out infinite'
        }}></div>
      </div>

      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-slide-up {
          animation: slideInUp 0.6s ease-out;
        }
        .animate-fade-scale {
          animation: fadeInScale 0.8s ease-out;
        }
      `}</style>

      <CContainer className="position-relative h-100" style={{ zIndex: 2 }}>
        <CRow className="min-vh-100 align-items-center justify-content-center py-3">
          <CCol xs={12} sm={10} md={8} lg={6} xl={5}>
            {/* Main Login Card */}
            <CCard className="border-0 shadow-lg animate-fade-scale" style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              overflow: 'hidden'
            }}>
              <CCardBody className="p-0">
                {/* Header Section */}
                <div className="text-center py-3 px-3" style={{
                  background: 'linear-gradient(135deg, rgba(30, 58, 95, 0.95) 0%, rgba(14, 165, 233, 0.9) 100%)',
                  position: 'relative'
                }}>
                  {/* Logo */}
                  <div className="mb-3">
                    <img
                      src={logo}
                      style={{
                        width: '120px',
                        height: 'auto',
                        maxHeight: '120px',
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
                      }}
                      className="object-fit-contain animate-slide-up"
                      alt="EmpPulse Logo"
                    />
                  </div>

                  {/* Welcome Text */}
                  <h2 className="text-white mb-1 fw-bold">Welcome Back</h2>
                  <h3 className="text-white-75 mb-2 small">Sign in to continue to EmpPulse</h3>

                  {/* Decorative Line */}
                  <div className="mx-auto" style={{
                    width: '150px',
                    height: '2px',
                    background: 'linear-gradient(90deg, #22d3ee, #0ea5e9)',
                    borderRadius: '2px'
                  }}></div>
                </div>

                {/* Form Section */}
                <div className="p-3">
                  <CForm
                    noValidate
                    validated={validated}
                    onSubmit={handleFormSubmit}
                    autoComplete="off"
                    onKeyDown={handleKeyDown}
                  >
                    {/* Login Type Toggle */}
                    <div className="mb-3">
                      <CButtonGroup role="group" className="w-100 shadow-sm" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                        <CButton
                          color={loginType === 'Employee' ? 'primary' : 'light'}
                          onClick={() => handleLoginTypeChange('Employee')}
                          className={`flex-grow-1 py-2 border-0 fw-semibold ${loginType === 'Employee' ? 'text-white' : 'text-muted'}`}
                          type="button"
                          style={{
                            background: loginType === 'Employee'
                              ? 'linear-gradient(135deg, #1e3a5f, #0ea5e9)'
                              : 'rgba(248, 249, 250, 0.8)',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <CIcon icon={cilUser} className="me-2" />
                          Employee
                        </CButton>
                        <CButton
                          color={loginType === 'Manager' ? 'warning' : 'light'}
                          onClick={() => handleLoginTypeChange('Manager')}
                          className={`flex-grow-1 py-2 border-0 fw-semibold ${loginType === 'Manager' ? 'text-white' : 'text-muted'}`}
                          type="button"
                          style={{
                            background: loginType === 'Manager'
                              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                              : 'rgba(248, 249, 250, 0.8)',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <CIcon icon={cilShieldAlt} className="me-2" />
                          Manager
                        </CButton>
                      </CButtonGroup>
                    </div>

                    {/* Access Info */}
                    <div className="text-center mb-3 p-2" style={{
                      background: loginType === 'Employee'
                        ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(34, 211, 238, 0.1))'
                        : 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1))',
                      borderRadius: '10px',
                      border: `1px solid ${loginType === 'Employee' ? 'rgba(14, 165, 233, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                    }}>
                      <div className="d-flex align-items-center justify-content-center mb-1">
                        <CIcon
                          icon={loginType === 'Employee' ? cilPhone : cilUser}
                          className="me-2"
                          style={{
                            color: loginType === 'Employee' ? '#0ea5e9' : '#f59e0b',
                            fontSize: '16px'
                          }}
                        />
                        <span className="fw-semibold small" style={{
                          color: loginType === 'Employee' ? '#1e3a5f' : '#92400e'
                        }}>
                          {loginType === 'Employee' ? 'Employee Portal' : 'Manager Portal'}
                        </span>
                      </div>
                      <small className="text-muted" style={{ fontSize: '12px' }}>
                        {loginType === 'Employee'
                          ? 'Access your work schedule and tasks'
                          : 'Manage your team and operations'
                        }
                      </small>
                    </div>

                    {/* Username/Phone Input */}
                    <div className="mb-3">
                      <CInputGroup className="shadow-sm" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                        <CInputGroupText className="border-0" style={{
                          background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
                          color: '#64748b'
                        }}>
                          <CIcon icon={loginType === 'Employee' ? cilPhone : cilUser} />
                        </CInputGroupText>
                        <CFormInput
                          ref={userNameRef}
                          id="username"
                          name="username"
                          placeholder={loginType === 'Employee' ? 'Enter your phone number' : 'Enter your email'}
                          autoComplete="off"
                          feedbackInvalid={`Please provide ${loginType === 'Employee' ? 'valid 10-digit mobile number' : 'email'}.`}
                          required
                          type={loginType === 'Employee' ? 'tel' : 'email'}
                          disabled={isSubmitting}
                          pattern={loginType === 'Employee' ? '[6-9][0-9]{9}' : undefined}
                          title={loginType === 'Employee' ? 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9' : undefined}
                          maxLength={loginType === 'Employee' ? '10' : undefined}
                          minLength={loginType === 'Employee' ? '10' : undefined}
                          inputMode={loginType === 'Employee' ? 'numeric' : 'email'}
                          onInput={loginType === 'Employee' ? handleMobileInputChange : undefined}
                          onKeyDown={loginType === 'Employee' ? handleMobileKeyPress : undefined}
                          onPaste={loginType === 'Employee' ? handleMobilePaste : undefined}
                          className="border-0 py-2"
                          style={{
                            background: 'rgba(248, 250, 252, 0.5)',
                            fontSize: '15px'
                          }}
                        />
                      </CInputGroup>
                    </div>

                    {/* Password Input */}
                    <div className="mb-3">
                      <CInputGroup className="shadow-sm position-relative" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                        <CInputGroupText className="border-0" style={{
                          background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)',
                          color: '#64748b'
                        }}>
                          <CIcon icon={cilLockLocked} />
                        </CInputGroupText>
                        <CFormInput
                          ref={userPwdRef}
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          autoComplete="off"
                          feedbackInvalid="Please provide password."
                          required
                          disabled={isSubmitting}
                          className="border-0 py-2"
                          style={{
                            background: 'rgba(248, 250, 252, 0.5)',
                            paddingRight: '3.5rem',
                            fontSize: '15px'
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleShowPasswordToggle}
                          disabled={isSubmitting}
                          className="position-absolute border-0 bg-transparent"
                          style={{
                            top: '50%',
                            right: '12px',
                            transform: 'translateY(-50%)',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            zIndex: 10,
                            opacity: isSubmitting ? 0.6 : 0.7,
                            fontSize: '16px',
                            transition: 'opacity 0.2s ease'
                          }}
                        >
                          {showPassword ? '🔒' : '👁️'}
                        </button>
                      </CInputGroup>
                    </div>

                    {/* Login Button */}
                    <div className="mb-3">
                      <CButton
                        type="submit"
                        className="w-100 py-2 border-0 fw-semibold shadow-sm"
                        disabled={isSubmitting}
                        style={{
                          background: loginType === 'Employee'
                            ? 'linear-gradient(135deg, #1e3a5f, #0ea5e9)'
                            : 'linear-gradient(135deg, #f59e0b, #d97706)',
                          borderRadius: '10px',
                          fontSize: '15px',
                          transition: 'all 0.3s ease',
                          transform: isSubmitting ? 'scale(0.98)' : 'scale(1)'
                        }}
                      >
                        {isSubmitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" />
                            Signing In...
                          </>
                        ) : (
                          <>
                            <CIcon icon={cilShieldAlt} className="me-2" />
                            Sign In
                          </>
                        )}
                      </CButton>
                    </div>

                    {/* Forgot Password */}
                    {loginType != 'Employee' && (<div className="text-center">
                      <CButton
                        color="link"
                        className="text-decoration-none fw-semibold p-1"
                        onClick={() => navigate('/sendEmailForResetLink')}
                        type="button"
                        disabled={isSubmitting}
                        style={{
                          color: loginType === 'Employee' ? '#0ea5e9' : '#f59e0b',
                          transition: 'color 0.2s ease',
                          fontSize: '14px'
                        }}
                      >
                        🔑 Forgot Password?
                      </CButton>
                    </div>)}
                  </CForm>
                </div>

                {/* Footer */}
                <div className="text-center py-2 px-3" style={{
                  background: 'rgba(248, 250, 252, 0.5)',
                  borderTop: '1px solid rgba(226, 232, 240, 0.5)'
                }}>
                  <small className="text-muted" style={{ fontSize: '12px' }}>
                    Powered by <span className="fw-semibold" style={{ color: '#0ea5e9' }}>EmpPulse</span> -
                    Employee Management System
                  </small>
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>

      {/* Simple PWA Install Button (from code 2) */}
      {showInstall && (
        <CButton
          onClick={onInstall}
          color="success"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
            zIndex: 3,
          }}
        >
          <CIcon icon={cilArrowThickFromTop} style={{ fontSize: '24px', color: 'white' }} />
        </CButton>
      )}
    </div>
  );
};

export default Login;
