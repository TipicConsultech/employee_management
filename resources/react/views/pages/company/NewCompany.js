// import React, { useEffect, useRef, useState } from 'react';
// import {
//   CCard,
//   CCardBody,
//   CCardHeader,
//   CCol,
//   CForm,
//   CFormInput,
//   CFormLabel,
//   CRow,
//   CButton,
//   CFormSelect,
//   CAlert
// } from '@coreui/react';
// import { getAPICall, post, postFormData } from '../../../util/api';
// import { useToast } from '../../common/toast/ToastContext';
// import { getUserData } from '../../../util/session';
// import { useTranslation } from 'react-i18next';
// import { generateCompanyReceiptPDF } from './companyPdf';

// function NewCompany() {
//   const today = new Date();
//   const { showToast } = useToast();
//   const user = getUserData();
//   const userType = user.type;
//   const logedInUserId = user.id;
//   const [preparedData, setPreparedData] = useState(null);
//   const [productList, setProductList] = useState([]);
//   const [productListId, setProductListId] = useState({ productId: '' })

//   console.log(productList);

//   const [formData, setFormData] = useState({
//     companyName: '',
//     companyId: '',
//     land_mark: '',
//     Tal: '',
//     Dist: '',
//     Pincode: '',
//     phone_no: '',
//     email_id: '',
//     bank_name: '',
//     account_no: '',
//     IFSC: '',
//     logo: '',
//     sign: '',
//     paymentQRCode: '',
//     appMode: 'advance',
//     subscribed_plan: 1,
//     subscription_validity: new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().split('T')[0],
//     refer_by_id: logedInUserId,
//   });

//   const { t } = useTranslation("global");

//   const [refData, setRefData] = useState({
//     plans:[],
//     users: []
//   });

//   const [formErrors, setFormErrors] = useState({
//     phone_no: '',
//     email_id: '',
//   });

//   const getAmount = (subscribed_plan) => {
//     return refData.plans.find(p=> p.id == subscribed_plan)?.price;
//   }

//   const getGSTAmount = () => {
//     //Calculate 18 % of total
//     return Math.ceil(totalAmount() * 0.18);
//   }

//   const totalAmount = () => {
//     return getAmount(formData.subscribed_plan) * getNumberOfMonths();
//   }

//   const getNumberOfMonths = () => {
//     // Calculate no of month from today till validity date
//     const validityDate = new Date(formData.subscription_validity);
//     const todayDate = new Date();
//     const diffTime = Math.abs(validityDate - todayDate);
//     const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 *
//       24 * 30));
//     return diffMonths - 1;
//   }

//   useEffect(()=>{
//     const fetchRefData = async () => {
//       const response = await getAPICall('/api/detailsForCompany');
//       setRefData(response);
//     }
//     fetchRefData();
//   },[])

//   useEffect(() => {
//     if (!window.Razorpay) {
//       const script = document.createElement("script");
//       script.src = "https://checkout.razorpay.com/v1/checkout.js";
//       script.onload = () => console.log("Razorpay script loaded");
//       document.body.appendChild(script);
//     }
//   }, []);

//   // New function to handle the file uploads and prepare data
//   const prepareFormData = async () => {
//     try {
//       let finalData = {...formData,
//         logo: 'invoice/jalseva.jpg',
//         sign: 'invoice/empty.png',
//         paymentQRCode: 'invoice/empty.png',
//       };

//       if(formData.logo){
//         const logoData = new FormData();
//         logoData.append("file", formData.logo);
//         logoData.append("dest", "invoice");
//         const responseLogo = await postFormData('/api/fileUpload', logoData);
//         const logoPath = responseLogo.fileName;
//         if(logoPath){
//           finalData.logo = logoPath;
//         }
//       }

//       if(formData.sign){
//         const signData = new FormData();
//         signData.append("file", formData.sign);
//         signData.append("dest", "invoice");
//         const responseSign = await postFormData('/api/fileUpload', signData);
//         const signPath = responseSign.fileName;
//         if(signPath){
//           finalData.sign = signPath;
//         }
//       }

//       if(formData.paymentQRCode){
//         const paymentQRCodeData = new FormData();
//         paymentQRCodeData.append("file", formData.paymentQRCode);
//         paymentQRCodeData.append("dest", "invoice");
//         const responsePaymentQRCode = await postFormData('/api/fileUpload', paymentQRCodeData);
//         const paymentQRCodePath = responsePaymentQRCode.fileName;
//         if(paymentQRCodePath){
//           finalData.paymentQRCode = paymentQRCodePath;
//         }
//       }

//       return finalData;
//     } catch (error) {
//       showToast('danger', 'Error uploading files: ' + error);
//       console.error('Error uploading files:', error);
//       return null;
//     }
//   };

//   const handlePayment = async () => {
//     try {
//       // First prepare data by uploading files
//       const preparedFormData = await prepareFormData();
//       if (!preparedFormData) {
//         showToast('danger', 'Failed to prepare form data');
//         return;
//       }

//       setPreparedData(preparedFormData);

//       const paymentData = {
//         amount: totalAmount(),
//       };

//       const data = await post("/api/create-order", paymentData);

//       if (data) {
//         const options = {
//           key: data.key,
//           amount: data.order.amount,
//           currency: data.order.currency,
//           order_id: data.order.id,
//           name: "Milk Factory",
//           handler: async (response) => {
//             const verifyResponse = await post("/api/verify-payment", {
//               razorpay_order_id: response.razorpay_order_id,
//               razorpay_payment_id: response.razorpay_payment_id,
//               razorpay_signature: response.razorpay_signature,
//             });
//             console.log("Verify Response:", verifyResponse);

//             if (verifyResponse?.success) {
//               // Now register the company AFTER successful payment
//               try {
//                 const companyResponse = await post('/api/company', preparedFormData);

//                 if(companyResponse?.details?.company_id) {
//                   showToast('success', 'Company Registration Successful!');

//                   // Prepare receipt data
//                   const receiptData = {
//                     company_id: companyResponse.details.company_id,
//                     plan_id: preparedFormData.subscribed_plan,
//                     user_id: logedInUserId,
//                     total_amount: totalAmount(),
//                     valid_till: preparedFormData.subscription_validity,
//                     transaction_id: response.razorpay_payment_id,
//                     transaction_status: 'success',
//                   };

//                   // Send receipt data to the backend
//                   const receiptResponse = await post('/api/company-receipt', receiptData);

//                   if (receiptResponse?.success) {
//                     showToast('success', 'Payment Successful and Receipt Saved!');
//                     let pdfData = receiptResponse.data[0];
//                     if(pdfData){
//                       pdfData.payable_amount = totalAmount();
//                       pdfData.total_amount = totalAmount() - getGSTAmount();
//                       pdfData.gst = getGSTAmount();
//                       generateCompanyReceiptPDF(pdfData);
//                     }
//                   } else {
//                     showToast('info', 'Company registered, payment successful, but there was an issue saving the receipt.');
//                   }
//                 } else {
//                   showToast('danger', 'Payment was successful but company registration failed.');
//                   // Record in company_receipt table with failure status
//                   const receiptData = {
//                     plan_id: preparedFormData.subscribed_plan,
//                     user_id: logedInUserId,
//                     total_amount: totalAmount(),
//                     valid_till: preparedFormData.subscription_validity,
//                     transaction_id: response.razorpay_payment_id,
//                     transaction_status: 'payment_success_registration_failed',
//                   };
//                   await post('/api/company-receipt', receiptData);
//                 }
//               } catch (error) {
//                 showToast('danger', 'Payment was successful but company registration failed: ' + error);
//                 // Log the error in company_receipt table
//                 const receiptData = {
//                   plan_id: preparedFormData.subscribed_plan,
//                   user_id: logedInUserId,
//                   total_amount: totalAmount(),
//                   valid_till: preparedFormData.subscription_validity,
//                   transaction_id: response.razorpay_payment_id,
//                   transaction_status: 'payment_success_registration_error',
//                 };
//                 await post('/api/company-receipt', receiptData);
//               }
//             }
//             else {
//               showToast('info', 'Payment verification failed');
//               const receiptData = {
//                 plan_id: preparedFormData.subscribed_plan,
//                 user_id: logedInUserId,
//                 total_amount: totalAmount(),
//                 valid_till: preparedFormData.subscription_validity,
//                 transaction_id: response.razorpay_payment_id || 'NA',
//                 transaction_status: 'Payment gateway verification failed',
//               };
//               // Record in company_receipt table
//               await post('/api/company-receipt', receiptData);
//             }
//             resetForm();
//           },
//           prefill: {
//             name: preparedFormData.companyName,
//             email: preparedFormData.email_id,
//             contact: preparedFormData.phone_no
//           },
//           theme: {
//             color: "#3399cc",
//           },
//         };

//         const razorpay = new window.Razorpay(options);
//         razorpay.open();

//         razorpay.on("payment.failed", async(response) => {
//           console.error("Payment Failed:", response.error);
//           // Record failed payment in company_receipt table
//           const receiptData = {
//             plan_id: preparedFormData.subscribed_plan,
//             user_id: logedInUserId,
//             total_amount: totalAmount(),
//             valid_till: preparedFormData.subscription_validity,
//             transaction_id: response.error?.metadata?.payment_id ?? 'txn_id_is_missing',
//             transaction_status: response.error?.description ?? 'Failed',
//           };
//           // Record in company_receipt table
//           await post('/api/company-receipt', receiptData);
//           showToast('danger', 'Payment failed. Company registration canceled.');
//         });
//       } else {
//         showToast('danger', 'Technical issue: Could not create payment order');
//         // Record in company_receipt table
//         const receiptData = {
//           plan_id: preparedFormData.subscribed_plan,
//           user_id: logedInUserId,
//           total_amount: totalAmount(),
//           valid_till: preparedFormData.subscription_validity,
//           transaction_id: 'NA',
//           transaction_status: 'Failed to create Razorpay order',
//         };
//         await post('/api/company-receipt', receiptData);
//         resetForm();
//       }
//     } catch (error) {
//       console.error("Error:", error);
//       showToast('danger', 'Something went wrong with payment');
//       // Record error in company_receipt table
//       try {
//         const receiptData = {
//           plan_id: formData.subscribed_plan,
//           user_id: logedInUserId,
//           total_amount: totalAmount(),
//           valid_till: formData.subscription_validity,
//           transaction_id: 'NA',
//           transaction_status: 'Payment system error: ' + error.message,
//         };
//         await post('/api/company-receipt', receiptData);
//       } catch (e) {
//         console.error("Failed to record payment error:", e);
//       }
//     }
//   };

//   const logoInputRef = useRef(null);
//   const signInputRef = useRef(null);
//   const paymentQRCodeInputRef = useRef(null);
//   const [validated, setValidated] = useState(false);

//   const appModes = [
//     { label: 'Basic', value: 'basic' },
//     // { label: 'Balance', value: 'balance' },
//     { label: 'Advance', value: 'advance' },
//   ];

//   const durationOptions = [
//     { label: 'Yearly', value: 12 },
//     { label: 'Half Yearly', value: 6 }
//   ];

//   const handleChange = (event) => {
//     const { name, value, files } = event.target;
//     if (files && files.length > 0) {
//       setFormData({ ...formData, [name]: files[0] }); // Ensure the file is stored as a file object
//     } else {
//       setFormData({ ...formData, [name]: value });
//     }
//   };

//   const handleDurationChange = (event) => {
//     const { value } = event.target;
//     event.preventDefault();
//     event.stopPropagation();

//     const newDate = new Date();
//     const months = parseInt(value);
//     newDate.setMonth(newDate.getMonth() + months);
//     const formattedDate = newDate.toISOString().split('T')[0];
//     setFormData({ ...formData,
//       subscription_validity: formattedDate
//     });
//   };

//   const resetForm = () => {
//     setFormData({
//       companyName: '',
//       companyId: '',
//       land_mark: '',
//       Tal: '',
//       Dist: '',
//       Pincode: '',
//       phone_no: '',
//       email_id: '',
//       bank_name: '',
//       account_no: '',
//       IFSC: '',
//       logo: '',
//       sign: '',
//       paymentQRCode: '',
//       appMode: 'advance',
//       subscribed_plan: 1,
//       subscription_validity: new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().split('T')[0],
//       refer_by_id: logedInUserId,
//     });

//     if (logoInputRef.current) {
//       logoInputRef.current.value = '';
//     }
//     if (signInputRef.current) {
//       signInputRef.current.value = '';
//     }
//     if (paymentQRCodeInputRef.current) {
//       paymentQRCodeInputRef.current.value = '';
//     }

//     setPreparedData(null);
//   };

//   const handleSubmit = async (event) => {

//     const form = event.currentTarget;
//     event.preventDefault();
//     event.stopPropagation();
//     setValidated(true);

//     if (form.checkValidity() !== true) {
//       showToast('danger', 'Kindly provide data of all required fields');
//       return;
//     }

//     // Now directly go to payment process
//     handlePayment();
//   };

//    useEffect(() => {
//     getAPICall('/api/productShow')
//       .then(response => {
//         setProductList(response);
//       })
//       .catch(error => {
//         console.error('Error fetching products:', error);
//       });
//   }, []);

//   const handleProductChange = (e) => {
//     const selectedProductId = e.target.value;
//    setProductListId(prev => ({
//       ...prev,
//       productId: selectedProductId, // store selected product ID
//     }));
//   };


//   return (
//     <CRow>
//       <CCol xs={12}>
//         <CCard className='mb-3'>
//           <CCardHeader>
//             <strong>{t("LABELS.new_shop")}</strong>
//           </CCardHeader>
//           <CCardBody>
//             <CForm noValidate validated={validated} onSubmit={handleSubmit} encType='multipart/form-data'>
//               <div className='row'>

//                 <div className='col-sm-4'>
//       <div className='mb-3'>
//         <CFormLabel htmlFor="productSelect">{t("LABELS.Product")}</CFormLabel>
//         <CFormSelect
//           id="productSelect"
//           name="productId"
//           value={productListId.productId || ''}
//           onChange={handleProductChange}
//           required
//         >
//           <option value="">-- Select Product --</option>
//           {Array.isArray(productList) && productList.map(product => (
//   <option key={product?.id} value={product?.id}>
//     {product?.name}
//   </option>
// ))}
//         </CFormSelect>
//       </div>
//     </div>

//                <div className='col-sm-4'>
//                   <div className='mb-3'>
//                     <CFormLabel htmlFor="land_mark">{t("LABELS.company_name")}</CFormLabel>
//                     <CFormInput
//                       type='text'
//                       name='companyName'
//                       id='companyName'
//                       maxLength="32"
//                       value={formData.companyName}
//                       onChange={handleChange}
//                       feedbackInvalid="Please provide valid data."
//                       required
//                     />
//                   </div>
//                 </div>
//                 <div className='col-sm-8'>
//                   <div className='mb-3'>
//                     <CFormLabel htmlFor="land_mark">{t("LABELS.address_label")}</CFormLabel>
//                     <CFormInput
//                       type='text'
//                       name='land_mark'
//                       id='land_mark'
//                       maxLength="32"
//                       value={formData.land_mark}
//                       onChange={handleChange}
//                       feedbackInvalid="Please provide shop address."
//                       required
//                     />
//                   </div>
//                 </div>
//                </div>
//               <div className='row'>
//                 <div className='col-sm-4'>
//                   <div className='mb-3'>
//                     <CFormLabel htmlFor="phone_no">{t("LABELS.mobile_number")}</CFormLabel>
//                     <CFormInput
//                       type='text'
//                       name='phone_no'
//                       id='phone_no'
//                       value={formData.phone_no}
//                       onChange={handleChange}
//                       invalid={!!formErrors.phone_no}
//                       feedbackInvalid={formErrors.phone_no != '' ? formErrors.phone_no : "Please provide valid 10 digit mobile." }
//                       pattern="\d{10}"
//                       required
//                       minLength={10}
//                       maxLength={10}
//                     />
//                   </div>
//                 </div>
//                 <div className='col-sm-4'>
//                   <div className='mb-3'>
//                     <CFormLabel htmlFor="email_id">{t("LABELS.email")}</CFormLabel>
//                     <CFormInput
//                       type='email'
//                       name='email_id'
//                       id='email_id'
//                       invalid={!!formErrors.email_id}
//                       value={formData.email_id}
//                       onChange={handleChange}
//                       feedbackInvalid={formErrors.email_id != '' ? formErrors.email_id : "Please provide email address." }
//                       required
//                     />
//                   </div>
//                 </div>
//                 {/* <div className='col-sm-4'>
//                   <div className='mb-3'>
//                   <CFormLabel htmlFor="appMode">{t("LABELS.app_mode")}</CFormLabel>
//                     <CFormSelect
//                       aria-label="Select Application Mode"
//                       value={formData.appMode}
//                       id="appMode"
//                       name="appMode"
//                       options={appModes}
//                       onChange={handleChange}
//                       required
//                       feedbackInvalid="Select an application mode."
//                     />
//                   </div>
//                 </div> */}
//                </div>
//               <div className='row'>
//                 <div className='col-sm-4'>
//                   <div className='mb-3'>
//                     <CFormLabel htmlFor="bank_name">{t("LABELS.bank_name")}</CFormLabel>
//                     <CFormInput
//                       type='text'
//                       name='bank_name'
//                       id='bank_name'
//                       value={formData.bank_name}
//                       onChange={handleChange}
//                     />
//                   </div>
//                 </div>
//                 <div className='col-sm-4'>
//                   <div className='mb-3'>
//                     <CFormLabel htmlFor="account_no">{t("LABELS.account_number")}</CFormLabel>
//                     <CFormInput
//                       type='number'
//                       name='account_no'
//                       id='account_no'
//                       value={formData.account_no}
//                       onChange={handleChange}
//                     />
//                   </div>
//                 </div>
//                 <div className='col-sm-4'>
//                   <div className='mb-3'>
//                     <CFormLabel htmlFor="IFSC">{t("LABELS.IFSC")}</CFormLabel>
//                     <CFormInput
//                       type='text'
//                       name='IFSC'
//                       id='IFSC'
//                       value={formData.IFSC}
//                       onChange={handleChange}
//                     />
//                   </div>
//                 </div>
//                </div>
//               <div className='row'>
//                 <div className='col-sm-4'>
//                   <div className='mb-3'>
//                     <CFormLabel htmlFor="logo">{t("LABELS.logo")}</CFormLabel>
//                     <CFormInput
//                       type='file'
//                       name='logo'
//                       id='logo'
//                       accept='image/png/jpeg'
//                       onChange={handleChange}
//                       ref={logoInputRef}
//                     />
//                   </div>
//                 </div>
//                 <div className='col-sm-4'>
//                   <div className='mb-3'>
//                     <CFormLabel htmlFor="sign">{t("LABELS.sign")}</CFormLabel>
//                     <CFormInput
//                       type='file'
//                       name='sign'
//                       id='sign'
//                       accept='image/png/jpeg'
//                       onChange={handleChange}
//                       ref={signInputRef}
//                     />
//                   </div>
//                 </div>
//                 <div className='col-sm-4'>
//                   <div className='mb-3'>
//                       <CFormLabel htmlFor="paymentQRCode">{t("LABELS.qr_img")}</CFormLabel>
//                       <CFormInput
//                         type='file'
//                         name='paymentQRCode'
//                         id='paymentQRCode'
//                         accept='image/png/jpeg'
//                         onChange={handleChange}
//                         ref={paymentQRCodeInputRef}
//                       />
//                   </div>
//                 </div>
//               </div>
//               <div className='row'>
//                 <div className='col-sm-3'>
//                   <div className='mb-3'>
//                   <CFormLabel htmlFor="subscribed_plan">{t("LABELS.plan")}</CFormLabel>
//                     <CFormSelect
//                       aria-label="Select Plan"
//                       value={formData.subscribed_plan}
//                       id="subscribed_plan"
//                       name="subscribed_plan"
//                       options={refData.plans.map(u=>({value: u.id, label: u.name}))}
//                       onChange={handleChange}
//                       required
//                       feedbackInvalid="Select a plan."
//                     />
//                   </div>
//                 </div>
//                 {userType == 0 && <div className='col-sm-3'>
//                   <div className='mb-3'>
//                   <CFormLabel htmlFor="appMode">{t("LABELS.partner")}</CFormLabel>
//                     <CFormSelect
//                       aria-label="Select Partner"
//                       value={formData.refer_by_id}
//                       id="refer_by_id"
//                       name="refer_by_id"
//                       options={
//                         user.type == 0 ? [
//                           {value: logedInUserId, label: 'Direct Onboarding'},
//                           ...refData.users.map(u=>({value: u.id, label: u.name}))
//                         ] :
//                         [
//                           // {value: 7, label: 'Direct Onboarding'},
//                           ...refData.users.filter(r=> r.id == logedInUserId).map(u=>({value: u.id, label: u.name}))
//                         ]
//                       }
//                       onChange={handleChange}
//                       required
//                       feedbackInvalid="Select an application mode."
//                     />
//                   </div>
//                 </div>}
//                 <div className='col-sm-3'>
//                   <div className='mb-3'>
//                   <CFormLabel htmlFor="subscribed_plan">{t("LABELS.plan_duration")}</CFormLabel>
//                     <CFormSelect
//                       aria-label="Select duration"
//                       options={durationOptions}
//                       onChange={handleDurationChange}
//                       required
//                       feedbackInvalid="Select duration."
//                     />
//                   </div>
//                 </div>
//                 <div className='col-sm-3'>
//                   <div className='mb-3'>
//                   <CFormLabel htmlFor="subscription_validity">{t("LABELS.validity")}</CFormLabel>
//                     <CFormInput
//                         type="date"
//                         id="subscription_validity"
//                         name="subscription_validity"
//                         value={formData.subscription_validity}
//                         onChange={handleChange}
//                         required
//                         readOnly
//                       />
//                   </div>
//                 </div>
//               </div>
//               <div className="row">
//                 <div className='col-sm-12'>
//                   <CAlert color="success">
//                     <h4>Payment Details</h4>
//                     Amount (Per Month): {getAmount(formData.subscribed_plan)}<br/>
//                     Number of months: {getNumberOfMonths()}<br/>
//                     Total Amount: {totalAmount() - getGSTAmount()}<br/>
//                     GST (18%): {getGSTAmount()}<br/>
//                     <b>Final Payable Amount:</b> {totalAmount()}
//                   </CAlert>
//                 </div>
//               </div>
//               <CButton type="submit" color="primary">{t("LABELS.submit_pay")}</CButton>
//             </CForm>
//           </CCardBody>
//         </CCard>
//       </CCol>
//     </CRow>
//   )
// }

// export default NewCompany;



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
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter
} from '@coreui/react';
import { getAPICall, post, postFormData } from '../../../util/api';
import { useToast } from '../../common/toast/ToastContext';
import { getUserData } from '../../../util/session';
import { useTranslation } from 'react-i18next';
import { generateCompanyReceiptPDF } from './companyPdf';
import { register } from '../../../util/api';

function NewCompany() {
  const today = new Date();
  const { showToast } = useToast();
  const user = getUserData();

  const defaultDuration = 1; // Monthly by default
  const validTill = new Date(today);
  validTill.setMonth(validTill.getMonth() + defaultDuration);
  const userType = user.type;
  const logedInUserId = user.id;
  const [preparedData, setPreparedData] = useState(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [receiptPdfData, setReceiptPdfData] = useState(null);
  const [partners, setPartners] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  // Detect device type
  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent;
      const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkDevice();

    window.addEventListener('resize', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

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
    payment_mode: 'online',
    subscribed_plan: 1,
    duration: defaultDuration,
    subscription_validity: validTill.toISOString().split('T')[0],
    refer_by_id: logedInUserId,
    user_name: '',
    password: '',
    confirm_password: '',
    product_id: '', // Use product_id to match backend field name
  });

  const { t } = useTranslation("global");
  const [refData, setRefData] = useState({
    plans: [],
    users: []
  });
  const [formErrors, setFormErrors] = useState({
    phone_no: '',
    email_id: '',
    product_id: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getAmount = (subscribed_plan) => {
    return refData.plans.find(p => p.id == subscribed_plan)?.price || 0;
  };

  const getGSTAmount = () => {
    return Math.ceil(totalAmount() * 0.18);
  };

  const totalAmount = () => {
    return getAmount(formData.subscribed_plan) * getNumberOfMonths();
  };

  const getNumberOfMonths = () => {
    const validityDate = new Date(formData.subscription_validity);
    const todayDate = new Date();
    const yearDiff = validityDate.getFullYear() - todayDate.getFullYear();
    const monthDiff = validityDate.getMonth() - todayDate.getMonth();
    let totalMonths = yearDiff * 12 + monthDiff;
    if (validityDate.getDate() < todayDate.getDate()) {
      totalMonths--;
    }
    return Math.max(totalMonths, 1);
  };

  const handleDurationChange = (event) => {
    const { value } = event.target;
    event.preventDefault();
    event.stopPropagation();

    const newDate = new Date();
    const months = parseInt(value);
    newDate.setMonth(newDate.getMonth() + months);
    const formattedDate = newDate.toISOString().split('T')[0];
    setFormData({
      ...formData,
      duration: parseInt(value),
      subscription_validity: formattedDate
    });
  };

  useEffect(() => {
    const fetchRefData = async () => {
      try {
        const response = await getAPICall('/api/detailsForCompany');
        const partnerResponse = await getAPICall('/api/partnersCompany');
        setRefData(response || { plans: [], users: [] });
        setPartners(partnerResponse || []);
      } catch (error) {
        console.error('Error fetching reference data:', error);
        showToast('danger', 'Failed to load reference data');
      }
    };
    fetchRefData();
  }, []);

  useEffect(() => {
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => console.log("Razorpay script loaded");
      document.body.appendChild(script);
    }
  }, []);

  const prepareFormData = async () => {
    try {
      let finalData = {
        ...formData,
        logo: 'invoice/jalseva.jpg',
        sign: 'invoice/empty.png',
        paymentQRCode: 'invoice/empty.png',
      };

      if (formData.logo && typeof formData.logo === 'object') {
        const logoData = new FormData();
        logoData.append("file", formData.logo);
        logoData.append("dest", "invoice");
        const responseLogo = await postFormData('/api/fileUpload', logoData);
        const logoPath = responseLogo?.fileName;
        if (logoPath) {
          finalData.logo = logoPath;
        }
      }

      if (formData.sign && typeof formData.sign === 'object') {
        const signData = new FormData();
        signData.append("file", formData.sign);
        signData.append("dest", "invoice");
        const responseSign = await postFormData('/api/fileUpload', signData);
        const signPath = responseSign?.fileName;
        if (signPath) {
          finalData.sign = signPath;
        }
      }

      if (formData.paymentQRCode && typeof formData.paymentQRCode === 'object') {
        const paymentQRCodeData = new FormData();
        paymentQRCodeData.append("file", formData.paymentQRCode);
        paymentQRCodeData.append("dest", "invoice");
        const responsePaymentQRCode = await postFormData('/api/fileUpload', paymentQRCodeData);
        const paymentQRCodePath = responsePaymentQRCode?.fileName;
        if (paymentQRCodePath) {
          finalData.paymentQRCode = paymentQRCodePath;
        }
      }

      console.log('Prepared Form Data:', finalData); // Debug payload
      return finalData;
    } catch (error) {
      showToast('danger', 'Error uploading files: ' + error.message);
      console.error('Error uploading files:', error);
      return null;
    }
  };

  useEffect(() => {
    const selectedPlan = refData.plans.find(p => p.id == formData.subscribed_plan);
    const planName = selectedPlan?.name?.toLowerCase() || '';
    let monthsToAdd = 1;

    if (planName.includes('annually')) {
      monthsToAdd = 12;
    } else if (planName.includes('monthly') || planName.includes('free trial')) {
      monthsToAdd = 1;
    }

    const newDate = new Date();
    newDate.setMonth(newDate.getMonth() + monthsToAdd);
    const formattedDate = newDate.toISOString().split('T')[0];

    setFormData(prev => ({
      ...prev,
      duration: monthsToAdd,
      subscription_validity: formattedDate
    }));
  }, [formData.subscribed_plan, refData.plans]);

  const registerCompanyDirectly = async () => {
    try {
      const preparedFormData = await prepareFormData();
      if (!preparedFormData) {
        showToast('danger', 'Failed to prepare form data');
        return;
      }

      if (!preparedFormData.product_id) {
        showToast('danger', 'Please select a product.');
        setFormErrors(prev => ({ ...prev, product_id: 'Please select a product.' }));
        return;
      }

      setPreparedData(preparedFormData);

      try {
        await post('/api/company/check-duplicate', {
          email_id: preparedFormData.email_id,
          phone_no: preparedFormData.phone_no,
        });
      } catch (error) {
        if (error.response && error.response.status === 422 && error.response.data.errors) {
          const errors = error.response.data.errors;
          const messages = Object.values(errors).join(' ');
          showToast('danger', messages);
        } else if (error.response && error.response.data && error.response.data.message) {
          showToast('danger', error.response.data.message);
        } else {
          showToast('danger', 'Email id or Mobile number is already taken');
        }
        return;
      }

      console.log('Sending to /api/company:', preparedFormData); // Debug API payload
      const companyResponse = await post('/api/company', preparedFormData);

      if (companyResponse?.details?.company_id) {
        showToast('success', 'Company Registration Successful!');

        const userData = {
          name: formData.user_name || 'Shop Owner',
          email: preparedFormData.email_id,
          mobile: preparedFormData.phone_no,
          password: formData.password,
          password_confirmation: formData.confirm_password,
          type: '1',
          company_id: companyResponse.details.company_id,
          product_id: preparedFormData.product_id
        };

        try {
          const userResp = await register(userData);
          if (userResp) {
            showToast('success', 'Default user created successfully.');
          } else {
            showToast('danger', 'Company created but failed to create default user.');
          }
        } catch (err) {
          console.error('Error creating user:', err);
          showToast('danger', 'Company created but error while creating user.');
        }

        const currentPlan = refData.plans.find(p => p.id == preparedFormData.subscribed_plan);
        const startDate = new Date().toISOString().split('T')[0];
        const durationMonths = getNumberOfMonths();
        const totalPlanAmount = currentPlan?.price || 0;
        const amountPerMonth = durationMonths > 0 ? (totalPlanAmount / durationMonths) : 0;

        const receiptData = {
          company_id: companyResponse.details.company_id,
          plan_id: preparedFormData.subscribed_plan,
          user_id: logedInUserId,
          total_amount: totalAmount(),
          start_date: startDate,
          valid_till: preparedFormData.subscription_validity,
          transaction_id: formData.payment_mode === 'cash' ? 'CASH_PAYMENT' : 'FREE_PLAN',
          transaction_status: formData.payment_mode === 'cash' ? 'cash_received' : 'success',
          payment_mode: formData.payment_mode,
          renewal_type: 'new_registration',
          product_id: preparedFormData.product_id, // Include product_id
        };

        try {
          await post('/api/company-receipt', receiptData);
        } catch (e) {
          console.error('Receipt API error:', e);
        }

        setShowWhatsAppModal(true);
        resetForm();
      } else {
        showToast('danger', 'Company registration failed.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showToast('danger', 'Company registration failed: ' + error.message);
    }
  };

  const handlePayment = async () => {
    try {
      const preparedFormData = await prepareFormData();
      if (!preparedFormData) {
        showToast('danger', 'Failed to prepare form data');
        return;
      }

      if (!preparedFormData.product_id) {
        showToast('danger', 'Please select a product.');
        setFormErrors(prev => ({ ...prev, product_id: 'Please select a product.' }));
        return;
      }

      setPreparedData(preparedFormData);

      try {
        await post('/api/company/check-duplicate', {
          email_id: preparedFormData.email_id,
          phone_no: preparedFormData.phone_no,
        });
      } catch (error) {
        if (error.response && error.response.status === 422 && error.response.data.errors) {
          const errors = error.response.data.errors;
          const messages = Object.values(errors).join(' ');
          showToast('danger', messages);
        } else if (error.response && error.response.data && error.response.data.message) {
          showToast('danger', error.response.data.message);
        } else {
          showToast('danger', 'Email id or Mobile number is already taken');
        }
        return;
      }

      const currentPlan = refData.plans.find(p => p.id == preparedFormData.subscribed_plan);
      const paymentAmount = totalAmount();
      const startDate = new Date().toISOString().split('T')[0];
      const durationMonths = getNumberOfMonths();
      const totalPlanAmount = currentPlan?.price || 0;
      const amountPerMonth = durationMonths > 0 ? (totalPlanAmount / durationMonths) : 0;

      const paymentData = {
        amount: paymentAmount,
      };

      const data = await post("/api/create-order", paymentData);

      if (!data) {
        showToast('danger', 'Technical issue: Could not create payment order');
        return;
      }

      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        order_id: data.order.id,
        name: "Nursery Seva",
        handler: async (response) => {
          const verifyResponse = await post("/api/verify-payment", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          if (verifyResponse?.success) {
            try {
              console.log('Sending to /api/company:', preparedFormData); // Debug API payload
              const companyResponse = await post('/api/company', preparedFormData);

              if (companyResponse?.details?.company_id) {
                showToast('success', 'Company Registration Successful!');

                const userData = {
                  name: formData.user_name || 'Shop Owner',
                  email: preparedFormData.email_id,
                  mobile: preparedFormData.phone_no,
                  password: formData.password,
                  password_confirmation: formData.confirm_password,
                  type: '1',
                  company_id: companyResponse.details.company_id
                };

                try {
                  const userResp = await register(userData);
                  if (userResp) {
                    showToast('success', 'Default user created successfully.');
                  } else {
                    showToast('danger', 'Company created but failed to create default user.');
                  }
                } catch (err) {
                  console.error('User creation error:', err);
                  showToast('danger', 'Company created but error while creating user.');
                }

                const receiptData = {
                  company_id: companyResponse.details.company_id,
                  plan_id: preparedFormData.subscribed_plan,
                  user_id: logedInUserId,
                  total_amount: paymentAmount,
                  start_date: startDate,
                  price: amountPerMonth,
                  valid_till: preparedFormData.subscription_validity,
                  transaction_id: response.razorpay_payment_id,
                  transaction_status: 'success',
                  payment_mode: 'online',
                  renewal_type: 'new_registration',
                  product_id: preparedFormData.product_id, // Include product_id
                };

                try {
                  await post('/api/company-receipt', receiptData);
                } catch (e) {
                  console.error('Receipt save error:', e);
                }

                setShowWhatsAppModal(true);
                resetForm();
              } else {
                showToast('danger', 'Payment succeeded but company registration failed.');
              }
            } catch (error) {
              console.error('Company registration error:', error);
              showToast('danger', 'Payment was successful but company registration failed: ' + error.message);
            }
          } else {
            showToast('info', 'Payment verification failed');
          }
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

      razorpay.on("payment.failed", async (response) => {
        console.error("Payment Failed:", response.error);
        showToast('danger', 'Payment failed. Company registration canceled.');
      });
    } catch (error) {
      console.error("Payment process error:", error);
      showToast('danger', 'Something went wrong with payment: ' + error.message);
    }
  };

  useEffect(() => {
    if (!formData.duration) return;

    const currentDate = new Date();
    const validTill = new Date(currentDate);
    validTill.setMonth(validTill.getMonth() + parseInt(formData.duration));

    const formattedDate = validTill.toISOString().split("T")[0];
    setFormData(prev => ({
      ...prev,
      subscription_validity: formattedDate,
    }));
  }, [formData.duration]);

  const logoInputRef = useRef(null);
  const signInputRef = useRef(null);
  const paymentQRCodeInputRef = useRef(null);
  const [validated, setValidated] = useState(false);

  const appModes = [
    { label: 'Basic', value: 'basic' },
    { label: 'Advance', value: 'advance' },
  ];

  const getDurationOptions = () => {
    const selectedPlan = refData.plans.find(p => p.id == formData.subscribed_plan);
    const name = selectedPlan?.name?.toLowerCase() || '';

    if (name.includes('free trial')) {
      return [{ label: '1 Month', value: 1 }];
    } else if (name.includes('monthly')) {
      return [{ label: '1 Month', value: 1 }];
    } else if (name.includes('annually')) {
      return [{ label: '12 Months', value: 12 }];
    }

    return [
      { label: '1 Month', value: 1 },
      { label: '12 Months', value: 12 }
    ];
  };

  const handleShareWhatsApp = async () => {
    try {
      if (!receiptPdfData) {
        showToast('danger', 'Receipt data not available');
        return;
      }

      const pdfBlob = await generateCompanyReceiptPDFBlob(receiptPdfData);

      if (!pdfBlob) {
        throw new Error('Failed to generate PDF blob');
      }

      const file = new File([pdfBlob], `Company-Receipt-${formData.companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, {
        type: 'application/pdf',
      });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Company Registration Receipt - ${formData.companyName}`,
            text: `Company registration completed successfully for ${formData.companyName}!`,
            files: [file],
          });
          showToast('success', 'Receipt shared successfully');
          return;
        } catch (shareError) {
          console.log('Native share failed, falling back to manual method:', shareError);
        }
      }

      fallbackToWhatsAppWithContactSelector(file);
    } catch (error) {
      console.error('Error in handleShareWhatsApp:', error);
      showToast('danger', 'Failed to share receipt: ' + error.message);
    }
  };

  const fallbackToWhatsAppWithContactSelector = (file) => {
    try {
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const message = encodeURIComponent(
        `Hello! Company registration for ${formData.companyName} is completed successfully. Please find the receipt PDF attached.`
      );

      const whatsappUrl = `https://web.whatsapp.com/send?text=${message}`;
      const whatsappWindow = window.open(whatsappUrl, '_blank', 'width=800,height=600');

      showToast('info', 'PDF downloaded! WhatsApp Web opened - select a contact and attach the downloaded PDF file.');

      setTimeout(() => {
        if (whatsappWindow && !whatsappWindow.closed) {
          showToast('info', 'Instructions: 1) Select contact in WhatsApp 2) Click attachment icon 3) Choose "Document" 4) Select the downloaded PDF file');
        }
      }, 3000);
    } catch (error) {
      console.error('Error in fallbackToWhatsAppWithContactSelector:', error);
      showToast('danger', 'Failed to open WhatsApp: ' + error.message);
    }
  };

  const handleShareWhatsAppMobile = async () => {
    try {
      if (!receiptPdfData) {
        showToast('danger', 'Receipt data not available');
        return;
      }

      const pdfBlob = await generateCompanyReceiptPDFBlob(receiptPdfData);
      if (!pdfBlob) {
        throw new Error('Failed to generate PDF blob');
      }

      const file = new File([pdfBlob], `Company-Receipt-${formData.companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, {
        type: 'application/pdf',
      });

      if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        if (navigator.share) {
          try {
            await navigator.share({
              title: `Company Registration Receipt - ${formData.companyName}`,
              text: `Company registration completed successfully for ${formData.companyName}!`,
              files: [file],
            });
            showToast('success', 'Receipt shared successfully');
            return;
          } catch (shareError) {
            console.log('Mobile share failed:', shareError);
          }
        }

        const message = encodeURIComponent(
          `Company registration for ${formData.companyName} completed successfully! Receipt attached.`
        );

        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        window.location.href = `whatsapp://send?text=${message}`;
        showToast('info', 'PDF downloaded! WhatsApp opened - select contact and attach the PDF.');
      } else {
        fallbackToWhatsAppWithContactSelector(file);
      }
    } catch (error) {
      console.error('Error in handleShareWhatsAppMobile:', error);
      showToast('danger', 'Failed to share receipt: ' + error.message);
    }
  };

  const generateCompanyReceiptPDFBlob = async (pdfData) => {
    return new Promise((resolve, reject) => {
      try {
        generateCompanyReceiptPDF(pdfData, 'blob', (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to generate PDF blob'));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  };

  const handleChange = (event) => {
    const { name, value, files } = event.target;
    if (files && files.length > 0) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
      if (name === 'product_id') {
        setFormErrors(prev => ({ ...prev, product_id: '' }));
      }
    }
  };

  const resetForm = () => {
    const newValidTill = new Date(today);
    newValidTill.setMonth(newValidTill.getMonth() + defaultDuration);

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
      duration: defaultDuration,
      subscription_validity: newValidTill.toISOString().split('T')[0],
      refer_by_id: logedInUserId,
      user_name: '',
      password: '',
      confirm_password: '',
      product_id: '',
    });

    setFormErrors({
      phone_no: '',
      email_id: '',
      product_id: '',
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
    setValidated(false);
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

    if (!formData.user_name || !formData.password || !formData.confirm_password) {
      showToast('danger', 'Please fill all user fields.');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      showToast('danger', 'Passwords do not match.');
      return;
    }

    if (!formData.product_id) {
      showToast('danger', 'Please select a product.');
      setFormErrors(prev => ({ ...prev, product_id: 'Please select a product.' }));
      return;
    }

    if (totalAmount() === 0 || formData.payment_mode === 'cash') {
      registerCompanyDirectly();
    } else {
      handlePayment();
    }
  };

  const [productList, setProductList] = useState([]);

  useEffect(() => {
    getAPICall('/api/productShow')
      .then(response => {
        setProductList(response);
      })
      .catch(error => {
        console.error('Error fetching products:', error);
        showToast('danger', 'Failed to load products');
      });
  }, []);

  const handleProductChange = (e) => {
    const selectedProductId = e.target.value;
    setFormData(prev => ({
      ...prev,
      product_id: selectedProductId
    }));
    setFormErrors(prev => ({ ...prev, product_id: '' }));
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
                    <CFormLabel htmlFor="productSelect">{t("LABELS.product")}</CFormLabel>
                    <CFormSelect
                      id="productSelect"
                      name="product_id"
                      value={formData.product_id || ''}
                      onChange={handleProductChange}
                      required
                      invalid={!!formErrors.product_id}
                      feedbackInvalid={formErrors.product_id || "Please select a product."}
                    >
                      <option value="">-- Select Product --</option>
                      {Array.isArray(productList) && productList.map(product => (
                        <option key={product?.id} value={product?.id}>
                          {product?.product_name}
                        </option>
                      ))}
                    </CFormSelect>
                  </div>
                </div>
                <div className='col-sm-4'>
                  <div className='mb-3'>
                    <CFormLabel htmlFor="companyName">{t("LABELS.company_name")}</CFormLabel>
                    <CFormInput
                      type='text'
                      name='companyName'
                      id='companyName'
                      maxLength="100"
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
                      maxLength="100"
                      value={formData.land_mark}
                      onChange={handleChange}
                      feedbackInvalid="Please provide shop address."
                      required
                    />
                  </div>
                </div>
                <div className='row'>
                  <div className='col-sm-4'>
                    <div className='mb-3'>
                      <CFormLabel htmlFor="Tal">{t("LABELS.taluka") || "Taluka"}</CFormLabel>
                      <CFormInput
                        type='text'
                        name='Tal'
                        id='Tal'
                        maxLength="50"
                        value={formData.Tal}
                        onChange={handleChange}
                        feedbackInvalid="Please provide taluka."
                        required
                      />
                    </div>
                  </div>
                  <div className='col-sm-4'>
                    <div className='mb-3'>
                      <CFormLabel htmlFor="Dist">{t("LABELS.district") || "District"}</CFormLabel>
                      <CFormInput
                        type='text'
                        name='Dist'
                        id='Dist'
                        maxLength="50"
                        value={formData.Dist}
                        onChange={handleChange}
                        feedbackInvalid="Please provide district."
                        required
                      />
                    </div>
                  </div>
                  <div className='col-sm-4'>
                    <div className='mb-3'>
                      <CFormLabel htmlFor="Pincode">{t("LABELS.pincode") || "Pincode"}</CFormLabel>
                      <CFormInput
                        type='text'
                        name='Pincode'
                        id='Pincode'
                        maxLength="6"
                        minLength="6"
                        pattern="[0-9]{6}"
                        value={formData.Pincode}
                        onChange={handleChange}
                        feedbackInvalid="Please provide valid 6-digit pincode."
                        required
                      />
                    </div>
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
                      feedbackInvalid={formErrors.phone_no || "Please provide valid 10 digit mobile."}
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
                      feedbackInvalid={formErrors.email_id || "Please provide email address."}
                      required
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
                      accept='image/png,image/jpeg'
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
                      accept='image/png,image/jpeg'
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
                      accept='image/png,image/jpeg'
                      onChange={handleChange}
                      ref={paymentQRCodeInputRef}
                    />
                  </div>
                </div>
              </div>
              <div className='row'>
                <div className='col-sm-4'>
                  <div className='mb-3'>
                    <CFormLabel htmlFor="payment_mode">{t("LABELS.payment_mode") || "Payment Mode"}</CFormLabel>
                    <CFormSelect
                      id="payment_mode"
                      name="payment_mode"
                      value={formData.payment_mode}
                      onChange={handleChange}
                      required
                    >
                      <option value="online">Online</option>
                      <option value="cash">Cash</option>
                    </CFormSelect>
                  </div>
                </div>
                <div className='col-sm-3'>
                  <div className='mb-3'>
                    <CFormLabel htmlFor="subscribed_plan">{t("LABELS.plan")}</CFormLabel>
                    <CFormSelect
                      aria-label="Select Plan"
                      value={formData.subscribed_plan}
                      id="subscribed_plan"
                      name="subscribed_plan"
                      options={refData.plans.map(u => ({ value: u.id, label: u.name }))}
                      onChange={handleChange}
                      required
                      feedbackInvalid="Select a plan."
                    />
                  </div>
                </div>
                {(userType == 0 || userType == 3) && (
                  <div className='col-sm-3'>
                    <div className='mb-3'>
                      <CFormLabel htmlFor="refer_by_id">{t("LABELS.partner")}</CFormLabel>
                      <CFormSelect
                        aria-label="Select Partner"
                        value={formData.refer_by_id}
                        id="refer_by_id"
                        name="refer_by_id"
                        onChange={handleChange}
                        required
                        feedbackInvalid="Select a partner."
                      >
                        <option value="">-- Select Partner --</option>
                        {partners.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </CFormSelect>
                    </div>
                  </div>
                )}
                <div className='col-sm-3'>
                  <div className='mb-3'>
                    <CFormLabel htmlFor="duration">{t("LABELS.plan_duration")}</CFormLabel>
                    <CFormSelect
                      aria-label="Select duration"
                      id="duration"
                      name="duration"
                      value={formData.duration}
                      options={getDurationOptions()}
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
                <div className="col-sm-12">
                  <h5 className="mt-3 mb-2">User Creation</h5>
                </div>
                <div className="col-sm-4">
                  <div className="mb-3">
                    <CFormLabel htmlFor="user_name">User Name</CFormLabel>
                    <CFormInput
                      type="text"
                      name="user_name"
                      id="user_name"
                      value={formData.user_name}
                      onChange={handleChange}
                      required
                      feedbackInvalid="Please enter user name."
                    />
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="mb-3 position-relative">
                    <CFormLabel htmlFor="password">Password</CFormLabel>
                    <CFormInput
                      type={showPassword ? "text" : "password"}
                      name="password"
                      id="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      feedbackInvalid="Please enter password."
                    />
                    <span
                      style={{
                        position: "absolute",
                        top: "38px",
                        right: "10px",
                        cursor: "pointer",
                        fontSize: "1.2rem",
                      }}
                      title={showPassword ? "Hide Password" : "Show Password"}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? "🔒" : "👁️"}
                    </span>
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="mb-3 position-relative">
                    <CFormLabel htmlFor="confirm_password">Confirm Password</CFormLabel>
                    <CFormInput
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirm_password"
                      id="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      required
                      feedbackInvalid="Please confirm password."
                    />
                    <span
                      style={{
                        position: "absolute",
                        top: "38px",
                        right: "10px",
                        cursor: "pointer",
                        fontSize: "1.2rem",
                      }}
                      title={showConfirmPassword ? "Hide Password" : "Show Password"}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? "🔒" : "👁️"}
                    </span>
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
              <CButton type="submit" color="primary">
                {totalAmount() === 0 ? t("LABELS.submit") || "Submit" : t("LABELS.submit_pay")}
              </CButton>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
      <CModal visible={showWhatsAppModal} onClose={() => setShowWhatsAppModal(false)}>
        <CModalHeader>
          <CModalTitle>Company Registered Successfully!</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>Your company <strong>{formData.companyName}</strong> has been registered successfully.</p>
          <p>Choose how you'd like to save and share the receipt:</p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowWhatsAppModal(false)}>
            Close
          </CButton>
          <CButton
            color="success"
            onClick={() => {
              generateCompanyReceiptPDF(receiptPdfData);
              setShowWhatsAppModal(false);
            }}
          >
            Save PDF Only
          </CButton>
          {isMobile ? (
            <CButton
              color="primary"
              onClick={() => {
                handleShareWhatsAppMobile();
                setShowWhatsAppModal(false);
              }}
            >
              Share on WhatsApp
            </CButton>
          ) : (
            <CButton
              color="primary"
              onClick={() => {
                handleShareWhatsApp();
                setShowWhatsAppModal(false);
              }}
            >
              Share via WhatsApp Web
            </CButton>
          )}
        </CModalFooter>
      </CModal>
    </CRow>
  );
}

export default NewCompany;
