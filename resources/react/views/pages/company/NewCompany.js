import React, { useEffect, useRef, useState } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CRow,
  CButton,
  CFormSelect,
  CAlert
} from '@coreui/react';
import { getAPICall, post, postFormData } from '../../../util/api';
import { useToast } from '../../common/toast/ToastContext';
import { getUserData } from '../../../util/session';
import { useTranslation } from 'react-i18next';
import { generateCompanyReceiptPDF } from './companyPdf';

function NewCompany() {
  const today = new Date();
  const { showToast } = useToast();
  const user = getUserData();
  const userType = user.type;
  const logedInUserId = user.id;
  const [preparedData, setPreparedData] = useState(null);
  const [formData, setFormData] = useState({
    companyName: '',
    companyId: '',
    land_mark: '',
    Tal: '',
    Dist: '',
    Pincode: '',
    phone_no: '',
    email_id: '',
    bank_name: '',
    account_no: '',
    IFSC: '',
    logo: '',
    sign: '',
    paymentQRCode: '',
    appMode: 'advance',
    subscribed_plan: 1,
    subscription_validity: new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().split('T')[0],
    refer_by_id: logedInUserId,
  });

  const { t } = useTranslation("global");

  const [refData, setRefData] = useState({
    plans:[],
    users: []
  });

  const [formErrors, setFormErrors] = useState({
    phone_no: '',
    email_id: '',
  });

  const getAmount = (subscribed_plan) => {
    return refData.plans.find(p=> p.id == subscribed_plan)?.price;
  }

  const getGSTAmount = () => {
    //Calculate 18 % of total
    return Math.ceil(totalAmount() * 0.18);
  }

  const totalAmount = () => {
    return getAmount(formData.subscribed_plan) * getNumberOfMonths();
  }

  const getNumberOfMonths = () => {
    // Calculate no of month from today till validity date
    const validityDate = new Date(formData.subscription_validity);
    const todayDate = new Date();
    const diffTime = Math.abs(validityDate - todayDate);
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 *
      24 * 30));
    return diffMonths - 1;
  }

  useEffect(()=>{
    const fetchRefData = async () => {
      const response = await getAPICall('/api/detailsForCompany');
      setRefData(response);
    }
    fetchRefData();
  },[])
  
  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => console.log("Razorpay script loaded");
      document.body.appendChild(script);
    }
  }, []);

  // New function to handle the file uploads and prepare data
  const prepareFormData = async () => {
    try {
      let finalData = {...formData,
        logo: 'invoice/jalseva.jpg',
        sign: 'invoice/empty.png',
        paymentQRCode: 'invoice/empty.png',
      };

      if(formData.logo){
        const logoData = new FormData();
        logoData.append("file", formData.logo);
        logoData.append("dest", "invoice");
        const responseLogo = await postFormData('/api/fileUpload', logoData);
        const logoPath = responseLogo.fileName;
        if(logoPath){
          finalData.logo = logoPath;
        }
      }
       
      if(formData.sign){
        const signData = new FormData();
        signData.append("file", formData.sign);
        signData.append("dest", "invoice");
        const responseSign = await postFormData('/api/fileUpload', signData);
        const signPath = responseSign.fileName;
        if(signPath){
          finalData.sign = signPath;
        }
      }

      if(formData.paymentQRCode){
        const paymentQRCodeData = new FormData();
        paymentQRCodeData.append("file", formData.paymentQRCode);
        paymentQRCodeData.append("dest", "invoice");
        const responsePaymentQRCode = await postFormData('/api/fileUpload', paymentQRCodeData);
        const paymentQRCodePath = responsePaymentQRCode.fileName;
        if(paymentQRCodePath){
          finalData.paymentQRCode = paymentQRCodePath;
        }
      }

      return finalData;
    } catch (error) {
      showToast('danger', 'Error uploading files: ' + error);
      console.error('Error uploading files:', error);
      return null;
    }
  };

  const handlePayment = async () => {
    try {
      // First prepare data by uploading files
      const preparedFormData = await prepareFormData();
      if (!preparedFormData) {
        showToast('danger', 'Failed to prepare form data');
        return;
      }
      
      setPreparedData(preparedFormData);
      
      const paymentData = {
        amount: totalAmount(),
      };
  
      const data = await post("/api/create-order", paymentData);
  
      if (data) {
        const options = {
          key: data.key,
          amount: data.order.amount,
          currency: data.order.currency,
          order_id: data.order.id,
          name: "Milk Factory",
          handler: async (response) => {
            const verifyResponse = await post("/api/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            console.log("Verify Response:", verifyResponse);
  
            if (verifyResponse?.success) {
              // Now register the company AFTER successful payment
              try {
                const companyResponse = await post('/api/company', preparedFormData);
                
                if(companyResponse?.details?.company_id) {
                  showToast('success', 'Company Registration Successful!');
                  
                  // Prepare receipt data
                  const receiptData = {
                    company_id: companyResponse.details.company_id,
                    plan_id: preparedFormData.subscribed_plan,
                    user_id: logedInUserId,
                    total_amount: totalAmount(),
                    valid_till: preparedFormData.subscription_validity,
                    transaction_id: response.razorpay_payment_id,
                    transaction_status: 'success',
                  };
                  
                  // Send receipt data to the backend
                  const receiptResponse = await post('/api/company-receipt', receiptData);
              
                  if (receiptResponse?.success) {
                    showToast('success', 'Payment Successful and Receipt Saved!');
                    let pdfData = receiptResponse.data[0];
                    if(pdfData){
                      pdfData.payable_amount = totalAmount();
                      pdfData.total_amount = totalAmount() - getGSTAmount();
                      pdfData.gst = getGSTAmount();
                      generateCompanyReceiptPDF(pdfData);
                    }
                  } else {
                    showToast('info', 'Company registered, payment successful, but there was an issue saving the receipt.');
                  }
                } else {
                  showToast('danger', 'Payment was successful but company registration failed.');
                  // Record in company_receipt table with failure status
                  const receiptData = {
                    plan_id: preparedFormData.subscribed_plan,
                    user_id: logedInUserId,
                    total_amount: totalAmount(),
                    valid_till: preparedFormData.subscription_validity,
                    transaction_id: response.razorpay_payment_id,
                    transaction_status: 'payment_success_registration_failed',
                  };
                  await post('/api/company-receipt', receiptData);
                }
              } catch (error) {
                showToast('danger', 'Payment was successful but company registration failed: ' + error);
                // Log the error in company_receipt table
                const receiptData = {
                  plan_id: preparedFormData.subscribed_plan,
                  user_id: logedInUserId,
                  total_amount: totalAmount(),
                  valid_till: preparedFormData.subscription_validity,
                  transaction_id: response.razorpay_payment_id,
                  transaction_status: 'payment_success_registration_error',
                };
                await post('/api/company-receipt', receiptData);
              }
            }
            else {
              showToast('info', 'Payment verification failed');
              const receiptData = {
                plan_id: preparedFormData.subscribed_plan,
                user_id: logedInUserId,
                total_amount: totalAmount(),
                valid_till: preparedFormData.subscription_validity,
                transaction_id: response.razorpay_payment_id || 'NA',
                transaction_status: 'Payment gateway verification failed',
              };
              // Record in company_receipt table
              await post('/api/company-receipt', receiptData);
            }
            resetForm();
          },
          prefill: {
            name: preparedFormData.companyName,
            email: preparedFormData.email_id,
            contact: preparedFormData.phone_no
          },
          theme: {
            color: "#3399cc",
          },
        };
  
        const razorpay = new window.Razorpay(options);
        razorpay.open();
  
        razorpay.on("payment.failed", async(response) => {
          console.error("Payment Failed:", response.error);
          // Record failed payment in company_receipt table
          const receiptData = {
            plan_id: preparedFormData.subscribed_plan,
            user_id: logedInUserId,
            total_amount: totalAmount(),
            valid_till: preparedFormData.subscription_validity,
            transaction_id: response.error?.metadata?.payment_id ?? 'txn_id_is_missing',
            transaction_status: response.error?.description ?? 'Failed',
          };
          // Record in company_receipt table
          await post('/api/company-receipt', receiptData);
          showToast('danger', 'Payment failed. Company registration canceled.');
        });
      } else {
        showToast('danger', 'Technical issue: Could not create payment order');
        // Record in company_receipt table
        const receiptData = {
          plan_id: preparedFormData.subscribed_plan,
          user_id: logedInUserId,
          total_amount: totalAmount(),
          valid_till: preparedFormData.subscription_validity,
          transaction_id: 'NA',
          transaction_status: 'Failed to create Razorpay order',
        };
        await post('/api/company-receipt', receiptData);
        resetForm();
      }
    } catch (error) {
      console.error("Error:", error);
      showToast('danger', 'Something went wrong with payment');
      // Record error in company_receipt table
      try {
        const receiptData = {
          plan_id: formData.subscribed_plan,
          user_id: logedInUserId,
          total_amount: totalAmount(),
          valid_till: formData.subscription_validity,
          transaction_id: 'NA',
          transaction_status: 'Payment system error: ' + error.message,
        };
        await post('/api/company-receipt', receiptData);
      } catch (e) {
        console.error("Failed to record payment error:", e);
      }
    }
  };
  
  const logoInputRef = useRef(null);
  const signInputRef = useRef(null);
  const paymentQRCodeInputRef = useRef(null);
  const [validated, setValidated] = useState(false);

  const appModes = [
    { label: 'Basic', value: 'basic' },
    // { label: 'Balance', value: 'balance' },
    { label: 'Advance', value: 'advance' },
  ];

  const durationOptions = [
    { label: 'Yearly', value: 12 },
    { label: 'Half Yearly', value: 6 }
  ];

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    if (files && files.length > 0) {
      setFormData({ ...formData, [name]: files[0] }); // Ensure the file is stored as a file object
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleDurationChange = (event) => {
    const { value } = event.target;
    event.preventDefault();
    event.stopPropagation();

    const newDate = new Date();
    const months = parseInt(value);
    newDate.setMonth(newDate.getMonth() + months);
    const formattedDate = newDate.toISOString().split('T')[0];
    setFormData({ ...formData,
      subscription_validity: formattedDate
    });
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      companyId: '',
      land_mark: '',
      Tal: '',
      Dist: '',
      Pincode: '',
      phone_no: '',
      email_id: '',
      bank_name: '',
      account_no: '',
      IFSC: '',
      logo: '',
      sign: '',
      paymentQRCode: '',
      appMode: 'advance',
      subscribed_plan: 1,
      subscription_validity: new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().split('T')[0],
      refer_by_id: logedInUserId,
    });

    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
    if (signInputRef.current) {
      signInputRef.current.value = '';
    }
    if (paymentQRCodeInputRef.current) {
      paymentQRCodeInputRef.current.value = '';
    }
    
    setPreparedData(null);
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
    
    // Now directly go to payment process
    handlePayment();
  };

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className='mb-3'>
          <CCardHeader>
            <strong>{t("LABELS.new_shop")}</strong>
          </CCardHeader>
          <CCardBody>
            <CForm noValidate validated={validated} onSubmit={handleSubmit} encType='multipart/form-data'>
              <div className='row'>
               <div className='col-sm-4'>
                  <div className='mb-3'>
                    <CFormLabel htmlFor="land_mark">{t("LABELS.company_name")}</CFormLabel>
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
                      feedbackInvalid={formErrors.phone_no != '' ? formErrors.phone_no : "Please provide valid 10 digit mobile." }
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
                      feedbackInvalid={formErrors.email_id != '' ? formErrors.email_id : "Please provide email address." }
                      required
                    />
                  </div>
                </div>
                {/* <div className='col-sm-4'>
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
                </div> */}
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
                    <CFormLabel htmlFor="IFSC">{t("LABELS.IFSC")}</CFormLabel>
                    <CFormInput
                      type='text'
                      name='IFSC'
                      id='IFSC'
                      value={formData.IFSC}
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
                      accept='image/png/jpeg'
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
                      accept='image/png/jpeg'
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
                        accept='image/png/jpeg'
                        onChange={handleChange}
                        ref={paymentQRCodeInputRef}
                      />
                  </div>
                </div>
              </div>
              <div className='row'>
                <div className='col-sm-3'>
                  <div className='mb-3'>
                  <CFormLabel htmlFor="subscribed_plan">{t("LABELS.plan")}</CFormLabel>
                    <CFormSelect
                      aria-label="Select Plan"
                      value={formData.subscribed_plan}
                      id="subscribed_plan"
                      name="subscribed_plan"
                      options={refData.plans.map(u=>({value: u.id, label: u.name}))}
                      onChange={handleChange}
                      required
                      feedbackInvalid="Select a plan."
                    />
                  </div>
                </div>
                {userType == 0 && <div className='col-sm-3'>
                  <div className='mb-3'>
                  <CFormLabel htmlFor="appMode">{t("LABELS.partner")}</CFormLabel>
                    <CFormSelect
                      aria-label="Select Partner"
                      value={formData.refer_by_id}
                      id="refer_by_id"
                      name="refer_by_id"
                      options={
                        user.type == 0 ? [
                          {value: logedInUserId, label: 'Direct Onboarding'},
                          ...refData.users.map(u=>({value: u.id, label: u.name}))
                        ] :
                        [
                          // {value: 7, label: 'Direct Onboarding'},
                          ...refData.users.filter(r=> r.id == logedInUserId).map(u=>({value: u.id, label: u.name}))
                        ]
                      }
                      onChange={handleChange}
                      required
                      feedbackInvalid="Select an application mode."
                    />
                  </div>
                </div>}
                <div className='col-sm-3'>
                  <div className='mb-3'>
                  <CFormLabel htmlFor="subscribed_plan">{t("LABELS.plan_duration")}</CFormLabel>
                    <CFormSelect
                      aria-label="Select duration"
                      options={durationOptions}
                      onChange={handleDurationChange}
                      required
                      feedbackInvalid="Select duration."
                    />
                  </div>
                </div>
                <div className='col-sm-3'>
                  <div className='mb-3'>
                  <CFormLabel htmlFor="subscription_validity">{t("LABELS.validity")}</CFormLabel>
                    <CFormInput
                        type="date"
                        id="subscription_validity"
                        name="subscription_validity"
                        value={formData.subscription_validity}
                        onChange={handleChange}
                        required
                        readOnly
                      />
                  </div>
                </div>
              </div>
              <div className="row">
                <div className='col-sm-12'>
                  <CAlert color="success">
                    <h4>Payment Details</h4>
                    Amount (Per Month): {getAmount(formData.subscribed_plan)}<br/>
                    Number of months: {getNumberOfMonths()}<br/>
                    Total Amount: {totalAmount() - getGSTAmount()}<br/>
                    GST (18%): {getGSTAmount()}<br/>
                    <b>Final Payable Amount:</b> {totalAmount()}
                  </CAlert>
                </div>
              </div>
              <CButton type="submit" color="primary">{t("LABELS.submit_pay")}</CButton>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default NewCompany;