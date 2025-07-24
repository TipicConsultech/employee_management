import React, { useEffect, useRef, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { 
  cilLockLocked, 
  cilUser, 
  cilMobile, 
  cilPeople, 
  cilEnvelopeClosed,
  cilBank,
  cilCreditCard,
  cilCode
} from '@coreui/icons'
// import { getAPICall, postAPICall } from '../../../util/api'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../common/toast/ToastContext'
import { getAPICall, post } from '../../../util/api'

const NewOnboardingPartner = () => {
  const [validated, setValidated] = useState(false)
  const [partnerTypes, setPartnerTypes] = useState([])
  const [isTypeInvalid, setTypeIsInvalid] = useState(false)
  const [validationErrors, setValidationErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()
  
  // Form refs
  const nameRef = useRef()
  const emailRef = useRef()
  const mobileRef = useRef()
  const pwdRef = useRef()
  const cPwdRef = useRef()
  const typeRef = useRef()
  const bankNameRef = useRef()
  const accountNumberRef = useRef()
  const ifscCodeRef = useRef()
  
  const { showToast } = useToast()

  useEffect(() => {
    // Fetch partner types
    try {
      getAPICall('/api/partner-types').then((resp) => {
        if (resp?.length) {
          const mappedTypes = resp.map(type => ({ 
            label: type.partner_type, 
            value: type.id 
          }))
          setPartnerTypes([
            { label: 'Select Partner Type', value: '' },
            ...mappedTypes
          ])
        }
      }).catch(error => {
        console.error('Error fetching partner types:', error)
        // Fallback types if API fails
        setPartnerTypes([
          { label: 'Select Partner Type', value: '' },
          { label: 'Sales Partner', value: '1' },
          { label: 'Service Partner', value: '2' },
          { label: 'Distribution Partner', value: '3' }
        ])
      })
    } catch (error) {
      showToast('danger', 'Error loading partner types: ' + error)
    }
  }, [])

  const handleTypeSelect = () => {
    const value = parseInt(typeRef.current.value, 10)
    setTypeIsInvalid(!(value > 0))
    if (value > 0) {
      setValidationErrors(prev => ({ ...prev, type_id: '' }))
    }
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateMobile = (mobile) => {
    const mobileRegex = /^[0-9]{10}$/
    return mobileRegex.test(mobile)
  }

  const validateIFSC = (ifsc) => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/
    return ifscRegex.test(ifsc.toUpperCase())
  }

  const handleInputChange = (field, value) => {
    let error = ''
    
    switch (field) {
      case 'email':
        if (value && !validateEmail(value)) {
          error = 'Please enter a valid email address'
        }
        break
      case 'mobile':
        if (value && !validateMobile(value)) {
          error = 'Mobile number must be exactly 10 digits'
        }
        break
      case 'ifsc_code':
        if (value && !validateIFSC(value)) {
          error = 'Please enter a valid IFSC code (e.g., SBIN0000123)'
        }
        break
      default:
        break
    }
    
    setValidationErrors(prev => ({ ...prev, [field]: error }))
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    event.stopPropagation()

    const form = event.currentTarget
    let hasErrors = false

    // Validate email
    const email = emailRef.current?.value
    if (!email || !validateEmail(email)) {
      setValidationErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }))
      hasErrors = true
    }

    // Validate mobile
    const mobile = mobileRef.current?.value
    if (!mobile || !validateMobile(mobile)) {
      setValidationErrors(prev => ({ ...prev, mobile: 'Mobile number must be exactly 10 digits' }))
      hasErrors = true
    }

    // Validate IFSC
    const ifsc = ifscCodeRef.current?.value
    if (!ifsc || !validateIFSC(ifsc)) {
      setValidationErrors(prev => ({ ...prev, ifsc_code: 'Please enter a valid IFSC code' }))
      hasErrors = true
    }

    // Check form validity
    if (form.checkValidity() === false || hasErrors) {
      setValidated(true)
      return
    }

    // Check if passwords match
    const password = pwdRef.current?.value
    const confirmPassword = cPwdRef.current?.value
    if (password !== confirmPassword) {
      showToast('danger', 'Passwords do not match')
      setValidationErrors(prev => ({ ...prev, password_confirmation: 'Passwords do not match' }))
      return
    }

    // Check type selection
    if (!typeRef.current?.value) {
      setTypeIsInvalid(true)
      showToast('danger', 'Please select a partner type')
      return
    }

    const partnerData = {
      name: nameRef.current?.value,
      email: email,
      mobile: mobile,
      password: password,
      password_confirmation: confirmPassword,
      type_id: parseInt(typeRef.current?.value),
      bank_name: bankNameRef.current?.value,
      account_number: accountNumberRef.current?.value,
      ifsc_code: ifsc.toUpperCase(),
    }

    try {
      const resp = await post('/api/partners/register', partnerData)
      if (resp) {
        showToast('success', 'Onboarding partner registered successfully')
        // Reset form
        form.reset()
        setValidated(false)
        setTypeIsInvalid(false)
        setValidationErrors({})
        setShowPassword(false)
        setShowConfirmPassword(false)
        // Optionally navigate to partners list
        // navigate('/partners')
      } else {
        showToast('danger', 'Error occurred, please try again later.')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message
      showToast('danger', 'Error occurred: ' + errorMessage)
      
      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors)
      }
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={9} lg={12} xl={12}>
            <CCard className="mx-6">
              <CCardHeader>
                <strong>Register New Onboarding Partner</strong>
              </CCardHeader>
              <CCardBody className="p-4">
                <CForm noValidate validated={validated} onSubmit={handleSubmit}>
                  
                  {/* Partner Type Selection */}
                  <CInputGroup className="mb-4">
                    <CInputGroupText>
                      <CIcon icon={cilPeople} />
                    </CInputGroupText>
                    <CFormSelect
                      onChange={handleTypeSelect}
                      aria-label="Select Partner Type"
                      ref={typeRef}
                      invalid={isTypeInvalid}
                      options={partnerTypes}
                      feedbackInvalid="Please select a partner type."
                    />
                  </CInputGroup>

                  {/* Name */}
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilUser} />
                    </CInputGroupText>
                    <CFormInput
                      ref={nameRef}
                      type="text"
                      placeholder="Partner Name"
                      autoComplete="name"
                      required
                      feedbackInvalid="Please provide partner name."
                    />
                  </CInputGroup>

                  {/* Email */}
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilEnvelopeClosed} />
                    </CInputGroupText>
                    <CFormInput
                      ref={emailRef}
                      placeholder="Email Address"
                      autoComplete="email"
                      type="email"
                      required
                      invalid={!!validationErrors.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      feedbackInvalid={validationErrors.email || "Please provide a valid email address."}
                    />
                  </CInputGroup>

                  {/* Mobile */}
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilMobile} />
                    </CInputGroupText>
                    <CFormInput
                      ref={mobileRef}
                      placeholder="Mobile Number (10 digits)"
                      autoComplete="tel"
                      type="tel"
                      maxLength={10}
                      pattern="[0-9]{10}"
                      required
                      invalid={!!validationErrors.mobile}
                      onChange={(e) => {
                        // Only allow numbers
                        const value = e.target.value.replace(/\D/g, '')
                        e.target.value = value
                        handleInputChange('mobile', value)
                      }}
                      feedbackInvalid={validationErrors.mobile || "Please provide a valid 10-digit mobile number."}
                    />
                  </CInputGroup>

                  {/* Password */}
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      type={showPassword ? "text" : "password"}
                      ref={pwdRef}
                      placeholder="Password (min 6 characters)"
                      autoComplete="new-password"
                      minLength={6}
                      required
                      feedbackInvalid="Please provide password (minimum 6 characters)."
                    />
                    <CInputGroupText 
                      onClick={togglePasswordVisibility}
                      style={{ cursor: 'pointer' }}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? '🔒' : '👁️'}
                    </CInputGroupText>
                  </CInputGroup>

                  {/* Confirm Password */}
                  <CInputGroup className="mb-4">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      ref={cPwdRef}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm Password"
                      autoComplete="new-password"
                      minLength={6}
                      required
                      invalid={!!validationErrors.password_confirmation}
                      feedbackInvalid={validationErrors.password_confirmation || "Please confirm your password."}
                    />
                    <CInputGroupText 
                      onClick={toggleConfirmPasswordVisibility}
                      style={{ cursor: 'pointer' }}
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? '🔒' : '👁️'}
                    </CInputGroupText>
                  </CInputGroup>

                  {/* Banking Details Section */}
                  <hr className="my-4" />
                  <h5 className="mb-3">Banking Details</h5>

                  {/* Bank Name */}
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilBank} />
                    </CInputGroupText>
                    <CFormInput
                      ref={bankNameRef}
                      type="text"
                      placeholder="Bank Name"
                      required
                      feedbackInvalid="Please provide bank name."
                    />
                  </CInputGroup>

                  {/* Account Number */}
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilCreditCard} />
                    </CInputGroupText>
                    <CFormInput
                      ref={accountNumberRef}
                      type="text"
                      placeholder="Account Number"
                      maxLength={50}
                      required
                      onChange={(e) => {
                        // Only allow numbers
                        const value = e.target.value.replace(/\D/g, '')
                        e.target.value = value
                      }}
                      feedbackInvalid="Please provide account number."
                    />
                  </CInputGroup>

                  {/* IFSC Code */}
                  <CInputGroup className="mb-4">
                    <CInputGroupText>
                      <CIcon icon={cilCode} />
                    </CInputGroupText>
                    <CFormInput
                      ref={ifscCodeRef}
                      type="text"
                      placeholder="IFSC Code (e.g., SBIN0000123)"
                      maxLength={11}
                      required
                      invalid={!!validationErrors.ifsc_code}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase()
                        e.target.value = value
                        handleInputChange('ifsc_code', value)
                      }}
                      feedbackInvalid={validationErrors.ifsc_code || "Please provide a valid IFSC code."}
                    />
                  </CInputGroup>

                  <div className="d-grid col-sm-3">
                    <CButton color="success" type="submit">
                      Register Partner
                    </CButton>
                  </div>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default NewOnboardingPartner