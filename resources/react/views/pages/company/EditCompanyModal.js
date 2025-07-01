import React, { useState, useEffect, useRef } from 'react';
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CFormLabel,
  CButton,
  CFormSelect,
  CRow,
  CCol
} from '@coreui/react';
import { getAPICall, put, postFormData } from '../../../util/api';
import { useToast } from '../../common/toast/ToastContext';
import { useTranslation } from 'react-i18next';

const EditCompanyModal = ({ visible, setVisible, companyData, onSuccess }) => {
  const { showToast } = useToast();
  const [validated, setValidated] = useState(false);
  const { t } = useTranslation("global");
  const [formData, setFormData] = useState({
    companyName: '',
    land_mark: '',
    phone_no: '',
    email_id: '',
    bank_name: '',
    account_no: '',
    IFSC_code: '',
    logo: '',
    sign: '',
    paymentQRCode: '',
    appMode: 'advance',
    // Set default values for these fields
    Tal: 'Pune',
    Dist: 'Pune',
    pincode: '-1',
  });
  
  const [formErrors, setFormErrors] = useState({
    phone_no: '',
    email_id: '',
  });

  const logoInputRef = useRef(null);
  const signInputRef = useRef(null);
  const paymentQRCodeInputRef = useRef(null);

  const appModes = [
    { label: 'Basic', value: 'basic' },
    { label: 'Advance', value: 'advance' },
  ];

  useEffect(() => {
    if (companyData && visible) {
      setFormData({
        companyName: companyData.company_name || '',
        land_mark: companyData.land_mark || '',
        phone_no: companyData.phone_no || '',
        email_id: companyData.email_id || '',
        bank_name: companyData.bank_name || '',
        account_no: companyData.account_no || '',
        IFSC_code: companyData.IFSC_code || '',
        logo: companyData.logo || '',
        sign: companyData.sign || '',
        paymentQRCode: companyData.paymentQRCode || '',
        appMode: companyData.appMode || 'advance',
        // Set default values if not present in companyData
        Tal: companyData.Tal || 'Pune',
        Dist: companyData.Dist || 'Pune',
        pincode: companyData.pincode || '-1',
      });
      setValidated(false);
      setFormErrors({
        phone_no: '',
        email_id: '',
      });
    }
  }, [companyData, visible]);

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    if (files && files.length > 0) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (event) => {
    const form = event.currentTarget;
    event.preventDefault();
    event.stopPropagation();
    setValidated(true);
    
    if (form.checkValidity() !== true) {
      showToast('danger', 'Kindly provide data of all required fields');
      return;
    }

    try {
      // Handle file uploads for logo, sign, and paymentQRCode
      let updatedData = { ...formData };

      if (formData.logo instanceof File) {
        const logoData = new FormData();
        logoData.append('file', formData.logo);
        logoData.append('dest', 'invoice');
        const responseLogo = await postFormData('/api/fileUpload', logoData);
        updatedData.logo = responseLogo.fileName;
      }

      if (formData.sign instanceof File) {
        const signData = new FormData();
        signData.append('file', formData.sign);
        signData.append('dest', 'invoice');
        const responseSign = await postFormData('/api/fileUpload', signData);
        updatedData.sign = responseSign.fileName;
      }

      if (formData.paymentQRCode instanceof File) {
        const paymentQRCodeData = new FormData();
        paymentQRCodeData.append('file', formData.paymentQRCode);
        paymentQRCodeData.append('dest', 'invoice');
        const responseQRCode = await postFormData('/api/fileUpload', paymentQRCodeData);
        updatedData.paymentQRCode = responseQRCode.fileName;
      }

      // Submit the updated company data
      const response = await put(`/api/company/${companyData.company_id}`, {
        company_name: updatedData.companyName,
        land_mark: updatedData.land_mark,
        Tal: updatedData.Tal, // Include with default value
        Dist: updatedData.Dist, // Include with default value
        pincode: updatedData.pincode, // Include with default value
        phone_no: updatedData.phone_no,
        email_id: updatedData.email_id,
        bank_name: updatedData.bank_name,
        account_no: updatedData.account_no,
        IFSC_code: updatedData.IFSC_code,
        logo: updatedData.logo,
        sign: updatedData.sign,
        paymentQRCode: updatedData.paymentQRCode,
        appMode: updatedData.appMode,
      });

      showToast('success', 'Company details updated successfully.');
      setVisible(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error updating company:', error);
      showToast('danger', 'Error occurred: ' + error.message);
    }
  };

  return (
    <CModal
      visible={visible}
      onClose={() => setVisible(false)}
      size="xl"
      backdrop="static"
    >
      <CModalHeader>
        <CModalTitle>{t("LABELS.edit_company")}: {companyData?.company_name}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CForm noValidate validated={validated} onSubmit={handleSubmit} encType='multipart/form-data'>
          <div className='row'>
            <div className='col-sm-4'>
              <div className='mb-3'>
                <CFormLabel htmlFor="companyName">{t("LABELS.company_name")}</CFormLabel>
                <CFormInput
                  type='text'
                  name='companyName'
                  id='companyName'
                  maxLength="32"
                  value={formData.companyName}
                  onChange={handleChange}
                  feedbackInvalid="Please provide valid data."
                  required
                />
              </div>
            </div>
            <div className='col-sm-8'>
              <div className='mb-3'>
                <CFormLabel htmlFor="land_mark">{t("LABELS.address_label")}</CFormLabel>
                <CFormInput
                  type='text'
                  name='land_mark'
                  id='land_mark'
                  maxLength="32"
                  value={formData.land_mark}
                  onChange={handleChange}
                  feedbackInvalid="Please provide shop address."
                  required
                />
              </div>
            </div>
          </div>
          {/* Hidden fields with default values - not displayed in the form */}
          <input type="hidden" name="Tal" value={formData.Tal} />
          <input type="hidden" name="Dist" value={formData.Dist} />
          <input type="hidden" name="pincode" value={formData.pincode} />
          
          <div className='row'>
            <div className='col-sm-4'>
              <div className='mb-3'>
                <CFormLabel htmlFor="phone_no">{t("LABELS.mobile_number")}</CFormLabel>
                <CFormInput
                  type='text'
                  name='phone_no'
                  id='phone_no'
                  value={formData.phone_no}
                  onChange={handleChange}
                  invalid={!!formErrors.phone_no}
                  feedbackInvalid={formErrors.phone_no !== '' ? formErrors.phone_no : "Please provide valid 10 digit mobile."}
                  pattern="\d{10}"
                  required
                  minLength={10}
                  maxLength={10}
                />
              </div>
            </div>
            <div className='col-sm-4'>
              <div className='mb-3'>
                <CFormLabel htmlFor="email_id">{t("LABELS.email")}</CFormLabel>
                <CFormInput
                  type='email'
                  name='email_id'
                  id='email_id'
                  invalid={!!formErrors.email_id}
                  value={formData.email_id}
                  onChange={handleChange}
                  feedbackInvalid={formErrors.email_id !== '' ? formErrors.email_id : "Please provide email address."}
                  required
                />
              </div>
            </div>
            <div className='col-sm-4'>
              <div className='mb-3'>
                <CFormLabel htmlFor="appMode">{t("LABELS.app_mode")}</CFormLabel>
                <CFormSelect
                  aria-label="Select Application Mode"
                  value={formData.appMode}
                  id="appMode"
                  name="appMode"
                  options={appModes}
                  onChange={handleChange}
                  required
                  feedbackInvalid="Select an application mode."
                />
              </div>
            </div>
          </div>
          <div className='row'>
            <div className='col-sm-4'>
              <div className='mb-3'>
                <CFormLabel htmlFor="bank_name">{t("LABELS.bank_name")}</CFormLabel>
                <CFormInput
                  type='text'
                  name='bank_name'
                  id='bank_name'
                  value={formData.bank_name}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className='col-sm-4'>
              <div className='mb-3'>
                <CFormLabel htmlFor="account_no">{t("LABELS.account_number")}</CFormLabel>
                <CFormInput
                  type='number'
                  name='account_no'
                  id='account_no'
                  value={formData.account_no}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className='col-sm-4'>
              <div className='mb-3'>
                <CFormLabel htmlFor="IFSC_code">{t("LABELS.IFSC")}</CFormLabel>
                <CFormInput
                  type='text'
                  name='IFSC_code'
                  id='IFSC_code'
                  value={formData.IFSC_code}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          <div className='row'>
            <div className='col-sm-4'>
              <div className='mb-3'>
                <CFormLabel htmlFor="logo">{t("LABELS.logo")}</CFormLabel>
                <CFormInput
                  type='file'
                  name='logo'
                  id='logo'
                  accept='image/png, image/jpeg'
                  onChange={handleChange}
                  ref={logoInputRef}
                />
              </div>
            </div>
            <div className='col-sm-4'>
              <div className='mb-3'>
                <CFormLabel htmlFor="sign">{t("LABELS.sign")}</CFormLabel>
                <CFormInput
                  type='file'
                  name='sign'
                  id='sign'
                  accept='image/png, image/jpeg'
                  onChange={handleChange}
                  ref={signInputRef}
                />
              </div>
            </div>
            <div className='col-sm-4'>
              <div className='mb-3'>
                <CFormLabel htmlFor="paymentQRCode">{t("LABELS.qr_img")}</CFormLabel>
                <CFormInput
                  type='file'
                  name='paymentQRCode'
                  id='paymentQRCode'
                  accept='image/png, image/jpeg'
                  onChange={handleChange}
                  ref={paymentQRCodeInputRef}
                />
              </div>
            </div>
          </div>
          <CButton type="submit" color="primary">{t("LABELS.update")}</CButton>
          <CButton type="button" color="secondary" onClick={() => setVisible(false)} className="ms-2">{t("LABELS.cancel")}</CButton>
        </CForm>
      </CModalBody>
    </CModal>
  );
};

export default EditCompanyModal;