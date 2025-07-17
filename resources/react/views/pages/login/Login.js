import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
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
import { cilArrowThickFromTop, cilLockLocked, cilUser, cilPhone } from '@coreui/icons';
import { login, post } from '../../../util/api';
import { isLogIn, storeUserData } from '../../../util/session';

import logo from './../../../assets/brand/ems_new_image.png';
import image from './../../../assets/images/ems_background.png';
import { useToast } from '../../common/toast/ToastContext';

const Login = () => {
  const [validated, setValidated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [loginType, setLoginType] = useState('Employee'); // Default to Employee
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const userNameRef = useRef();
  const userPwdRef = useRef();
  const { showToast } = useToast();

  useEffect(() => {
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
      return '/employee_tracker'; // fallback if type is unknown or undefined
  }
};

  const getRedirectPathByUserType = (userType,type=null) => {
    switch (userType) {
      case 0:
        return '/company/new';
      case 1:
         return '/dashboard';
      case 10:
        return  type ? getEmployeePath(type) : '/employee_tracker';
      default:
        return '/employee_tracker';
    }
  };

  // Mobile number validation function
  const validateMobileNumber = (mobile) => {
    // Remove all non-numeric characters
    const cleaned = mobile.replace(/\D/g, '');

    // Check if it's a valid mobile number (10 digits, starting with 6, 7, 8, or 9)
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(cleaned);
  };

  // Handle numeric input only for mobile number
  const handleMobileInputChange = (e) => {
    const value = e.target.value;
    // Only allow numeric characters
    const numericValue = value.replace(/[^0-9]/g, '');

    // Limit to 10 digits
    if (numericValue.length <= 10) {
      e.target.value = numericValue;
    } else {
      e.target.value = numericValue.substring(0, 10);
    }
  };

  // Prevent non-numeric key presses for mobile input
  const handleMobileKeyPress = (e) => {
    // Allow: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true)) {
      return;
    }
    // Ensure that it is a number and stop the keypress
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  // Handle paste event for mobile input
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
    // Always prevent default form submission
    event.preventDefault();
    event.stopPropagation();

    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    const form = event.currentTarget;

    // Check form validity
    if (form.checkValidity() !== true) {
      setValidated(true);
      return;
    }

    setIsSubmitting(true);
    setValidated(true);

    const credential = userNameRef.current?.value?.trim();
    const password = userPwdRef.current?.value?.trim();

    // Additional validation
    if (!credential || !password) {
      const errorMessage = loginType === 'Employee'
        ? 'Please provide valid phone number and password'
        : 'Please provide valid email and password';
      showToast('danger', errorMessage);
      setIsSubmitting(false);
      return;
    }

    // Mobile number validation for Employee login
    if (loginType === 'Employee' && !validateMobileNumber(credential)) {
      showToast('danger', 'Please provide a valid 10-digit mobile number');
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare login data based on login type
      const loginData = loginType === 'Employee'
        ? { mobile: credential, password }
        : { email: credential, password };

      let resp = null;

      if (loginType === "Employee") {
        try {
          resp = await post('/api/mobileLogin', loginData);
          console.log(resp);

        } catch (employeeError) {
          console.error('Employee login error:', employeeError);
          // Handle employee login specific errors
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
          // Handle manager login specific errors
          const errorMessage = 'Please provide valid email and password';
          showToast('danger', errorMessage);
          setIsSubmitting(false);
          return;
        }
      }

      // Check if response exists and process it
      if (!resp) {
        const errorMessage = loginType === 'Employee'
          ? 'Please provide valid phone number and password'
          : 'Please provide valid email and password';
        showToast('danger', errorMessage);
        setIsSubmitting(false);
        return;
      }

      // Check if user is blocked
      if (resp.blocked) {
        showToast('danger', resp.message || 'Account is blocked');
        setIsSubmitting(false);
        return;
      }

      // Check if login was successful
      if (resp.user) {
        storeUserData(resp);
        const redirectPath = getRedirectPathByUserType(resp.user.type,resp?.user?.attendance_type);
        navigate(redirectPath);
        return;
      }

      // If we reach here, login failed
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
    if (isSubmitting) return; // Prevent change during submission

    setLoginType(type);
    setValidated(false);
    setIsSubmitting(false); // Reset submitting state

    // Clear form when switching login types
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

  // Handle Enter key press to prevent form submission issues
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isSubmitting) {
      e.preventDefault();
      handleLogin(e);
    }
  };

  // Handle form submission more explicitly
  const handleFormSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleLogin(e);
  };

  return (
    <div
      className="min-vh-100 d-flex flex-row align-items-center"
      style={{
        backgroundImage: `url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: '#f8f9fa', // Fallback color
      }}
    >
      {/* Optional overlay for better readability */}
      <div
        className="position-absolute w-100 h-100"
        style={{
          background: 'rgba(0, 0, 0, 0.3)', // Semi-transparent overlay
          zIndex: 1,
        }}
      ></div>

      <CContainer style={{ position: 'relative', zIndex: 2 }}>
        <CRow className="justify-content-center">
          <CCol md={6}>
            <CCardGroup>
              <CCard
                className="p-4"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', // Semi-transparent white
                  backdropFilter: 'blur(10px)', // Glass effect
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <CCardBody>
                  <CForm
                    noValidate
                    validated={validated}
                    onSubmit={handleFormSubmit}
                    autoComplete="off"
                    onKeyDown={handleKeyDown}
                  >
                    {/* Logo Section */}
                    <div className="text-center mb-4">
                      <img
                        src={logo}
                        style={{ width: '100%', height: 'auto', maxHeight: '150px' }}
                        className="object-fit-contain mb-3"
                        alt="Logo"
                      />
                      <h4 className="text-body-emphasis mb-2">Welcome Back</h4>
                      <p className="text-body-secondary mb-0">Please sign in to continue</p>
                    </div>

                    {/* Login Type Toggle Buttons */}
                    <div className="mb-4">
                      <CButtonGroup
                        role="group"
                        aria-label="Login type selection"
                        className="w-100"
                      >
                        <CButton
                          color={loginType === 'Employee' ? 'primary' : 'outline-primary'}
                          onClick={() => handleLoginTypeChange('Employee')}
                          className="flex-grow-1"
                          type="button"
                        >
                          👤 Employee
                        </CButton>
                        <CButton
                          color={loginType === 'Manager' ? 'warning' : 'outline-warning'}
                          onClick={() => handleLoginTypeChange('Manager')}
                          className="flex-grow-1"
                          type="button"
                        >
                          🏢 Manager
                        </CButton>
                      </CButtonGroup>
                    </div>

                    {/* Access Type Info */}
                    <div className="text-center mb-4">
                      <div className="d-flex align-items-center justify-content-center mb-2">
                        <CIcon
                          icon={loginType === 'Employee' ? cilPhone : cilUser}
                          className="me-2"
                          style={{ color: loginType === 'Employee' ? '#0d6efd' : '#fd7e14' }}
                        />
                        <span className="text-body-secondary">
                          {loginType === 'Employee' ? 'Employee Portal Access' : 'Manager Portal Access'}
                        </span>
                      </div>
                      <small className="text-body-secondary">
                        {loginType === 'Employee'
                          ? 'Access your work schedule and tasks'
                          : 'Manage your team and operations'
                        }
                      </small>
                    </div>

                    {/* Username/Phone Input */}
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
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
                      />
                    </CInputGroup>

                    {/* Password Input */}
                    <CInputGroup className="mb-4 position-relative">
                      <CInputGroupText>
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
                        style={{ paddingRight: '4.5rem' }} //eye
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={handleShowPasswordToggle}
                        disabled={isSubmitting}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          right: '20px',  //gave some padding to eye
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: isSubmitting ? 'not-allowed' : 'pointer',
                          zIndex: 10,
                          opacity: isSubmitting ? 0.6 : 1,
                          fontSize: '16px',
                        }}
                      >
                        {showPassword ? '🔒' : '👁️'}
                      </button>
                    </CInputGroup>

                    {/* Login Button and Forgot Password */}
                    <CRow className="justify-content-center">
                      <CCol xs={12} className="text-center mb-2">
                        <CButton
                          color={loginType === 'Employee' ? 'primary' : 'warning'}
                          type="submit"
                          className="px-4"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? '🔄 Logging in...' : '🔐 Login'}
                        </CButton>
                      </CCol>
                      <CCol xs={12} className="text-center">
                        <CButton
                          color="link"
                          className="px-0"
                          onClick={() => navigate('/sendEmailForResetLink')}
                          type="button"
                          disabled={isSubmitting}
                        >
                          🔑 Forgot Password?
                        </CButton>
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>

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
