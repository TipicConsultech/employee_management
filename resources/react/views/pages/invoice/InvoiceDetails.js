import './style.css';
import { CButton, CCard, CCardBody, CCardHeader, CContainer } from '@coreui/react';
import React, { useState, useEffect, useRef } from 'react';
import { generatePDF } from './InvoicePdf';
import { getAPICall } from '../../../util/api';
import { useParams } from 'react-router-dom';
import { getUserData } from '../../../util/session';
import { useToast } from '../../common/toast/ToastContext';

const InvoiceDetails = () => {
  const ci = getUserData()?.company_info;
  const param = useParams();
  const [remainingAmount, setRemainingAmount] = useState(0);
  const [totalAmountWords, setTotalAmountWords] = useState('');
  const [grandTotal, setGrandTotal] = useState(0);
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    customer: {},
    date: '',
    products: [],
    discount: '',
    amountPaid: 0,
    paymentMode: '',
    InvoiceStatus: '',
    finalAmount: 0,
    InvoiceNumber: '',
    status: '',
    DeliveryDate: '',
    InvoiceType: '',
  });

  const numberToWords = (number) => {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (number === 0) {
      return 'Zero';
    }

    let words = '';

    if (Math.floor(number / 10000000) > 0) {
      words += numberToWords(Math.floor(number / 10000000)) + ' Crore ';
      number %= 10000000;
    }

    if (Math.floor(number / 100000) > 0) {
      words += numberToWords(Math.floor(number / 100000)) + ' Lakh ';
      number %= 100000;
    }

    if (Math.floor(number / 1000) > 0) {
      words += numberToWords(Math.floor(number / 1000)) + ' Thousand ';
      number %= 1000;
    }

    if (Math.floor(number / 100) > 0) {
      words += numberToWords(Math.floor(number / 100)) + ' Hundred ';
      number %= 100;
    }

    if (number > 0) {
      if (words !== '') {
        words += 'and ';
      }

      if (number < 10) {
        words += units[number];
      } else if (number < 20) {
        words += teens[number - 10];
      } else {
        words += tens[Math.floor(number / 10)];
        if (number % 10 > 0) {
          words += '-' + units[number % 10];
        }
      }
    }

    return words.trim();
  };

  const handlePrint = () => {
    window.print();
  };

  const fetchOrder = async () => {
    try {
      const response = await getAPICall('/api/order/' + param.id);
      let paymentModeString = response.paymentMode === 1 ? 'Cash' : 'Online (UPI/Bank Transfer)';
      let orderStatusString = '';
      if (response.orderStatus === 0) {
        orderStatusString = 'Canceled Order';
      } else if (response.orderStatus === 1) {
        orderStatusString = 'Delivered Order';
      } else if (response.orderStatus === 2) {
        orderStatusString = 'Order Pending';
      }

      let discountValue = response.discount || -1;
      let finalAmount = Math.round(response.finalAmount);
      let remaining = finalAmount - response.paidAmount;
      setRemainingAmount(Math.max(0, remaining));

      setFormData({
        customer: response.customer,
        date: response.invoiceDate,
        products: response.items,
        discount: discountValue,
        amountPaid: response.paidAmount,
        paymentMode: paymentModeString,
        InvoiceStatus: orderStatusString,
        finalAmount: finalAmount,
        InvoiceNumber: response.id,
        status: response.orderStatus,
        DeliveryDate: response.deliveryDate,
        InvoiceType: response.invoiceType,
      });

      setGrandTotal(finalAmount);
      setTotalAmountWords(numberToWords(finalAmount));
    } catch (error) {
      showToast('danger', 'Error occurred ' + error);
      console.error('Error fetching product data:', error);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [param.id]);

  const handleDownload = () => {
    const invoiceNo = formData.InvoiceNumber;
    generatePDF(grandTotal, invoiceNo, formData.customer.name, formData, remainingAmount, totalAmountWords);
  };

  const handleShareWhatsApp = () => {
    const invoiceNo = formData.InvoiceNumber;

    // Generate PDF first
    generatePDF(
      grandTotal,
      invoiceNo,
      formData.customer.name,
      formData,
      remainingAmount,
      totalAmountWords,
      true, // isWhatsAppShare is true
      (pdfUrl) => {
        // Get the customer's phone number
        const customerPhone = formData.customer.mobile;
        // Remove any non-numeric characters from phone number
        const formattedPhone = customerPhone.replace(/\D/g, '');

        // Use the Web Share API if available
        if (navigator.share && navigator.canShare) {
          fetch(pdfUrl)
            .then(response => response.blob())
            .then(blob => {
              const file = new File([blob], `Invoice-${invoiceNo}.pdf`, { type: 'application/pdf' });

              const shareData = {
                title: `Invoice for ${formData.customer.name}`,
                text: `Here is your invoice #${invoiceNo}`,
                files: [file]
              };

              if (navigator.canShare(shareData)) {
                navigator.share(shareData)
                  .then(() => {
                    showToast('success', 'Invoice shared successfully');
                  })
                  .catch(error => {
                    console.error('Error sharing:', error);
                    // Fallback to opening WhatsApp without file
                    window.open(`https://wa.me/${formattedPhone}`, '_blank');
                  });
              } else {
                // If files can't be shared, fall back to just opening WhatsApp
                window.open(`https://wa.me/${formattedPhone}`, '_blank');
                showToast('info', 'Please attach the downloaded PDF file manually.');
              }
            });
        } else {
          // Fallback for browsers that don't support the Web Share API
          window.open(`https://wa.me/${formattedPhone}`, '_blank');
          showToast('info', 'Please attach the downloaded PDF file manually.');
        }
      }
    );
  };

  let invoiceName;
  if (formData.status === 0) {
    invoiceName = <h5 className='text-danger'>{formData.InvoiceStatus}</h5>;
  }
  if (formData.status === 1) {
    invoiceName = <h5 className='text-success'>{formData.InvoiceStatus}</h5>;
  }
  if (formData.status === 2) {
    invoiceName = <h5 className='text-warning'>{formData.InvoiceStatus}</h5>;
  }

  return (
        <CCard className="mb-4">
      <CCardHeader className='no-print'>
        <strong>Invoice</strong>
      </CCardHeader>
      <CCardBody>
        <CContainer className="container-md invoice-content">
          <div className='row'>
            <div className='col-4'></div>
            <div className='col-4 text-center'>{invoiceName}</div>
            <div className='col-4'></div>
          </div>
          <div className="d-flex flex-row mb-3">
            <div className="flex-fill">
              <img src={'img/'+ci.logo} width="150" height="150" alt="Logo" />
            </div>
            <div className="flex-fill">

            </div>
            <div className="ml-3">
              <p>{ci.company_name}</p>
              <p>{ci.land_mark}</p>
              <p>{ci.Tal}, {ci.Dist}, {ci.pincode}</p>
              <p>Phone: {ci.phone_no}</p>
            </div>
          </div>

          <div className="row mt-10">
            <div className="flex-fill col-6">
              <div className="col-md-6">
                <h6 style={{ fontWeight: 'bold' }}>Invoice To:</h6>
                <p style={{ fontWeight: 'bold' }}>Customer Name&nbsp;:&nbsp; <span style={{ fontWeight: 'bold' }}>{formData.customer?.name}</span></p>
                <p style={{ fontWeight: 'bold' }}>Customer Address&nbsp;:&nbsp; <span style={{ fontWeight: 'bold' }}>{formData.customer?.address}</span> </p>
                <p style={{ fontWeight: 'bold' }}>Mobile Number&nbsp;: &nbsp;<span style={{ fontWeight: 'bold' }}>{formData.customer?.mobile}</span></p>
              </div>
            </div>
            <div className='col-2'></div>
            <div className='col-4'>
              <div className="flex-fill col-md-8">
                <h6 style={{ fontWeight: 'bold' }}>Invoice No&nbsp;: {formData.InvoiceNumber}</h6>
                <p style={{ fontWeight: 'bold' }}>Invoice Date : &nbsp;<span style={{ fontWeight: 'bold' }}>{formData.date}</span></p>
                {formData.InvoiceType === 2 && <p style={{ fontWeight: 'bold' }}>Delivery Date :&nbsp;<span style={{ fontWeight: 'bold' }}>{formData.DeliveryDate}</span></p>}
              </div>
            </div>
          </div>

          <div className="row section">
            <div className="col-md-12">
              <table className="table table-bordered border-black">
                <thead className='table-success border-black'>
                  <tr>
                    <th className='text-center'>Sr No</th>
                    <th className='text-center'>Item Name</th>
                    <th className='text-center'>Price (Rs)</th>
                    <th className='text-center'>Quantity</th>
                    <th className='text-center'>Total (Rs)</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.products.map((product, index) => (
                    <tr key={index}>
                      <td className='text-center'>{index + 1}</td>
                      <td className='text-center'>{product.product_name}</td>
                      <td className='text-center'>{product.dPrice}&nbsp;₹</td>
                       <td className='text-center'>{product.dQty}</td>                     {/*  {product.product_unit ? `${product.product_unit}` : ''} */}
                      <td className='text-center'>{product.total_price}&nbsp;₹</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan="4">Grand Total</td>
                    <td className='text-center'>{formData.finalAmount}&nbsp;₹</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="row section">
            <div className="col-md-12 flex">
              <p>
                Total Amount (In Words): &nbsp;
                <span style={{ fontWeight: 'bold' }}>{totalAmountWords} Rupees Only </span>
              </p>
            </div>
          </div>

          <div className="row section">
            <div className="col-md-12">
              <table className="table table-bordered border-black">
                <tbody>
                  {formData.discount > 0 && (
                    <tr>
                      <td>Discount (%):</td>
                      <td>{formData.discount}&nbsp;%</td>
                    </tr>
                  )}
                  <tr>
                    <td>Amount Paid:</td>
                    <td>{formData.amountPaid}&nbsp;₹</td>
                  </tr>
             
                  <tr>
                    <td>Balance Amount:</td>
                    <td>{remainingAmount}&nbsp;₹</td>
                  </tr>
                  {/* <tr>
                    <td>Payment Mode:</td>
                    <td>{formData.paymentMode}</td>
                    <td>Cash</td>
                    
                  </tr> */}
                </tbody>
              </table>
            </div>
          </div>

          <div className="d-flex border p-3 border-black">
            <div className='flex-fill'>
              <div className="d-flex flex-column mb-3">
                <h6>Bank Details</h6>
                <p>{ci.bank_name}</p>
                <p>Account No: {ci.account_no}</p>
                <p>IFSC code: {ci.IFSC_code}</p>
              </div>
            </div>

            <div className='flex-fill'>
              <div className="d-flex flex-column align-items-center text-center">
                <h6>E-SIGNATURE</h6>
                <img height="100" width="200" src={'img/'+ci.sign} alt="signature" />
                <p>Authorized Signature</p>
              </div>
            </div>
          </div>

          <div className="row section mt-3">
            <div className="col-md-12 text-center">
              <p>This bill has been computer-generated and is authorized.</p>
            </div>
          </div>

          <div className='d-flex justify-content-center'>
            <CButton color="primary" variant="outline" onClick={handlePrint} className='d-print-none me-2'>Print</CButton>
            <CButton color="success" variant="outline" onClick={handleDownload} className='d-print-none me-2'>Download</CButton>
            <CButton color="success" variant="outline" style={{ backgroundColor: '#25D366', color: 'white', borderColor: '#25D366' }} onClick={handleShareWhatsApp} className='d-print-none'>Share on WhatsApp</CButton>
          </div>
        </CContainer>
      </CCardBody>
    </CCard>
  );
};

export default InvoiceDetails;
