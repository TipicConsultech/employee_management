import React, { useState } from 'react';
import {
  CRow,
  CCol,
  CFormInput,
  CButton,
  CFormSelect,
  CCard,
  CCardHeader,
  CCardBody,
} from '@coreui/react';
import { useTranslation } from 'react-i18next';

const WorkSummaryPayment = ({
  workSummary,
  setWorkSummary,
  employee,
  onSubmit,
  title = "LABELS.workSummaryPayment"
}) => {
  const { t } = useTranslation('global');
  const [paymentTypeError, setPaymentTypeError] = useState('');

  if (!workSummary) return null;

  // Calculate totals
  const regularHours = workSummary.regular_hours || 0;
  const overtimeHours = workSummary.overtime_hours || 0;
  const totalWorkedHours = regularHours + overtimeHours;

  const regularWage = workSummary.custom_regular_wage || 0;
  const overtimeWage = workSummary.custom_overtime_wage || 0;
  const halfDayWage = workSummary.custom_half_day_wage || employee.half_day_rate || 0;
  const holidayWage = workSummary.custom_holiday_wage || employee.holiday_rate || 0;
  const paidLeaveWage = workSummary.custom_paid_leave_wage || employee.wage_hour || 0;

  const regularPayment = workSummary.regular_day * regularWage;

  let overtimePayment;
  if (employee.overtime_type === "hourly") {
    overtimePayment = (workSummary.overtime_hours || 0) * overtimeWage;
  } else {
    overtimePayment = (workSummary.over_time_day || 0) * overtimeWage;
  }

  const halfDayPayment = (workSummary.half_day || 0) * halfDayWage;
  const holidayPayment = (workSummary.holiday || 0) * holidayWage;
  const paidLeavePayment = (workSummary.paid_leaves || 0) * paidLeaveWage;

  const totalCalculatedPayment = regularPayment + overtimePayment + halfDayPayment + holidayPayment + paidLeavePayment;

  // Helper function to handle positive number input
  const handlePositiveNumberInput = (value, fieldName) => {
    const numValue = parseFloat(value) || 0;
    const positiveValue = numValue < 0 ? 0 : numValue;

    if (fieldName === 'payed_amount') {
      const pending = totalCalculatedPayment - positiveValue;
      setWorkSummary((prev) => ({
        ...prev,
        payed_amount: positiveValue,
        pending_payment: pending >= 0 ? pending : 0,
      }));
    } else {
      setWorkSummary((prev) => ({
        ...prev,
        [fieldName]: positiveValue,
      }));
    }
  };

  // Handle payment type change with validation
  const handlePaymentTypeChange = (value) => {
    setWorkSummary((prev) => ({
      ...prev,
      payment_type: value,
    }));
    if (!value) {
      setPaymentTypeError(t('LABELS.paymentMethodRequired'));
    } else {
      setPaymentTypeError('');
    }
  };

  // Handle submit with validation
  const handleSubmit = async () => {
    if (!workSummary.payment_type) {
      setPaymentTypeError(t('LABELS.paymentMethodRequired'));
      return;
    }
    try {
      await onSubmit();
      window.scrollTo(0, 0);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Submission failed:', error);
    }
  };

  return (
    <div className="modern-work-summary">
      <style jsx>{`
        .modern-work-summary {
          max-width: 1200px;
          margin: 0 auto;
          padding: 6px;
        }

        .card-body-custom {
          padding: 16px;
        }

        .section {
          background: white;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
          border: 1px solid #e8ecf4;
        }

        .section:last-child {
          margin-bottom: 0;
        }

        .section-title {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 12px;
          color: #1f2937;
          display: flex;
          align-items: center;
          gap: 6px;
          padding-bottom: 6px;
          border-bottom: 1px solid #f1f5f9;
        }

        .hours-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 12px;
        }

        .hour-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 10px;
          padding: 12px;
          border: 1px solid #e2e8f0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.1);
        }

        .hour-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.15);
        }

        .hour-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(135deg, #059669, #10b981);
        }

        .hour-card.overtime::before {
          background: linear-gradient(135deg, #f59e0b, #f97316);
        }

        .hour-card.half-day::before {
          background: linear-gradient(135deg, #8b5cf6, #a855f7);
        }

        .hour-card.holiday::before {
          background: linear-gradient(135deg, #ef4444, #f87171);
        }

        .hour-card.paid-leave::before {
          background: linear-gradient(135deg, #06b6d4, #0ea5e9);
        }

        .hour-card.total::before {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
        }

        .hour-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .hour-label {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          line-height: 1.2;
          text-align: left;
        }

        .hour-value {
          font-size: 1.75rem;
          font-weight: 700;
          line-height: 1;
          background: linear-gradient(135deg, #1e293b, #475569);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-align: left;
        }

        .hour-value.regular { color: #059669; }
        .hour-value.overtime { color: #d97706; }
        .hour-value.total { color: #2563eb; }
        .hour-value.half-day { color: #7c3aed; }
        .hour-value.holiday { color: #dc2626; }
        .hour-value.paid-leave { color: #0891b2; }

        .wage-input-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-grow: 1;
        }

        .wage-label {
          font-size: 0.75rem;
          color: #475569;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          text-align: left;
          white-space: nowrap;
          overflow: hidden;
          display: inline-block;
          max-width: 100%;
        }

        .wage-input {
          width: 100%;
          max-width: 120px;
          padding: 6px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s ease;
          background: rgba(255, 255, 255, 0.9);
        }

        .wage-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }

        .payment-display {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.1) 100%);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 6px;
          padding: 8px 12px;
          margin-top: 8px;
          text-align: left;
        }

        .payment-display:hover {
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
        }

        .payment-amount {
          font-size: 1rem;
          font-weight: 600;
          color: #1e40af;
          background: linear-gradient(135deg, #1e40af, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .payment-label {
          font-size: 0.7rem;
          color: #64748b;
          margin-bottom: 4px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .form-grid-three {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-label {
          font-size: 0.8rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 4px;
          text-align: left;
        }

        .form-input {
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.9rem;
          transition: border-color 0.2s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
        }

        .form-input[readonly] {
          background-color: #f9fafb;
          color: #6b7280;
        }

        .form-input.error {
          border-color: #dc2626;
        }

        .error-message {
          color: #dc2626;
          font-size: 0.75rem;
          margin-top: 4px;
        }

        .payment-details-grid {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid #bae6fd;
          border-radius: 6px;
          padding: 12px;
        }

        .submit-section {
          text-align: center;
          margin-top: 16px;
        }

        .submit-btn {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          border: none;
          color: white;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.2);
        }

        .submit-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
        }

        .pending-amount {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        }

        /* Mobile Responsiveness */
        @media (max-width: 992px) {
          .hours-overview {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .modern-work-summary {
            padding: 4px;
          }

          .card-body-custom {
            padding: 12px;
          }

          .section {
            padding: 10px;
            margin-bottom: 10px;
          }

          .section-title {
            font-size: 0.9rem;
            margin-bottom: 10px;
          }

          .hours-overview {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          .hour-card {
            padding: 10px;
          }

          .hour-value {
            font-size: 1.5rem;
          }

          .hour-label {
            font-size: 0.75rem;
            line-height: 1.2;
          }

          .wage-input-group {
            flex-direction: column;
            align-items: flex-start;
          }

          .wage-label {
            font-size: 0.7rem;
            margin-bottom: 4px;
          }

          .wage-input {
            padding: 6px 10px;
            font-size: 0.85rem;
            max-width: 100%;
            width: 100%;
          }

          .payment-display {
            padding: 6px 10px;
            text-align: left;
          }

          .payment-amount {
            font-size: 0.9rem;
          }

          .payment-label {
            font-size: 0.65rem;
          }

          .form-grid-three {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .submit-btn {
            width: 100%;
            padding: 10px;
          }

          .form-input {
            font-size: 0.85rem;
          }

          .form-label {
            font-size: 0.75rem;
          }
        }

        @media (max-width: 480px) {
          .section {
            padding: 8px;
            margin-bottom: 8px;
          }

          .hour-card {
            padding: 8px;
          }

          .hour-value {
            font-size: 1.25rem;
            line-height: 1.2;
          }

          .hour-label {
            font-size: 0.7rem;
            line-height: 1.2;
          }

          .wage-input {
            padding: 5px 8px;
            font-size: 0.8rem;
            max-width: 100%;
            width: 100%;
          }

          .wage-label {
            font-size: 0.65rem;
            line-height: 1.2;
            margin-bottom: 4px;
          }

          .hours-overview {
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
          }

          .payment-display {
            padding: 6px 8px;
          }

          .payment-amount {
            font-size: 0.85rem;
            line-height: 1.2;
          }

          .payment-label {
            font-size: 0.6rem;
            line-height: 1.2;
          }

          .form-input {
            padding: 6px;
            font-size: 0.8rem;
          }

          .form-label {
            font-size: 0.7rem;
            line-height: 1.2;
          }
        }
      `}</style>

      <CRow>
        <CCol xs={12}>
          <CCard className="mb-3 shadow-sm">
            <CCardHeader style={{ backgroundColor: "#E6E6FA" }}>
              <div className="d-flex justify-content-between align-items-center flex-wrap">
                <strong>{t(title)}</strong>
              </div>
            </CCardHeader>
            <CCardBody className="card-body-custom">
              {/* Work Hours Overview with Wage Configuration */}
              <div className="hours-overview">
                {(workSummary?.regular_day || 0) > 0 && (
                  <div className="hour-card regular">
                    <label className="wage-label">{t('LABELS.regularDays')}</label>
                    <div className="hour-header">
                      <div className="hour-value regular">{workSummary?.regular_day || 0}</div>
                      <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>*</span>
                      <div className="wage-input-group">
                        <label className="wage-label">{t('LABELS.regularDayRate')}</label>
                        <input
                          type="number"
                          min="0"
                          className="wage-input"
                          value={regularWage || ''}
                          onChange={(e) => handlePositiveNumberInput(e.target.value, 'custom_regular_wage')}
                          placeholder={t('LABELS.enterRegularWage')}
                        />
                      </div>
                    </div>
                    <div className="payment-display">
                      <div className="payment-label">{t('LABELS.regularPayment')}</div>
                      <div className="payment-amount">₹{regularPayment.toLocaleString()}</div>
                    </div>
                  </div>
                )}

                {((employee.overtime_type==="hourly" ? workSummary?.overtime_hours : workSummary?.over_time_day) || 0) > 0 && (
                  <div className="hour-card overtime">
                    <label className="wage-label">{t('LABELS.overtimeHours')}</label>
                    <div className="hour-header">
                      <div className="hour-value overtime">{employee.overtime_type==="hourly" ? workSummary?.overtime_hours || 0 : workSummary?.over_time_day || 0}</div>
                      <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>*</span>
                      <div className="wage-input-group">
                        <label className="wage-label">{t('LABELS.overtimeRate')}/{employee.overtime_type==="hourly" ? t('LABELS.hour') : t('LABELS.day')}</label>
                        <input
                          type="number"
                          min="0"
                          className="wage-input"
                          value={overtimeWage || ''}
                          onChange={(e) => handlePositiveNumberInput(e.target.value, 'custom_overtime_wage')}
                          placeholder={t('LABELS.enterOvertimeWage')}
                        />
                      </div>
                    </div>
                    <div className="payment-display">
                      <div className="payment-label">{t('LABELS.overtimePayment')}</div>
                      <div className="payment-amount">₹{overtimePayment.toLocaleString()}</div>
                    </div>
                  </div>
                )}

                {(workSummary?.half_day || 0) > 0 && (
                  <div className="hour-card half-day">
                    <label className="wage-label">{t('LABELS.halfDays')}</label>
                    <div className="hour-header">
                      <div className="hour-value half-day">{workSummary?.half_day || 0}</div>
                      <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>*</span>
                      <div className="wage-input-group">
                        <label className="wage-label">{t('LABELS.halfDayRate')}</label>
                        <input
                          type="number"
                          min="0"
                          className="wage-input"
                          value={halfDayWage || ''}
                          onChange={(e) => handlePositiveNumberInput(e.target.value, 'custom_half_day_wage')}
                          placeholder={t('LABELS.enterHalfDayWage')}
                        />
                      </div>
                    </div>
                    <div className="payment-display">
                      <div className="payment-label">{t('LABELS.halfDayPayment')}</div>
                      <div className="payment-amount">₹{halfDayPayment.toLocaleString()}</div>
                    </div>
                  </div>
                )}

                {(workSummary?.holiday || 0) > 0 && (
                  <div className="hour-card holiday">
                    <label className="wage-label">{t('LABELS.holidays')}</label>
                    <div className="hour-header">
                      <div className="hour-value holiday">{workSummary?.holiday || 0}</div>
                      <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>*</span>
                      <div className="wage-input-group">
                        <label className="wage-label">{t('LABELS.holidayRate')}</label>
                        <input
                          type="number"
                          min="0"
                          className="wage-input"
                          value={holidayWage || ''}
                          onChange={(e) => handlePositiveNumberInput(e.target.value, 'custom_holiday_wage')}
                          placeholder={t('LABELS.enterHolidayWage')}
                        />
                      </div>
                    </div>
                    <div className="payment-display">
                      <div className="payment-label">{t('LABELS.holidayPayment')}</div>
                      <div className="payment-amount">₹{holidayPayment.toLocaleString()}</div>
                    </div>
                  </div>
                )}

                {(workSummary?.paid_leaves || 0) > 0 && (
                  <div className="hour-card paid-leave">
                    <label className="wage-label">{t('LABELS.paidLeaves')}</label>
                    <div className="hour-header">
                      <div className="hour-value paid-leave">{workSummary?.paid_leaves || 0}</div>
                      <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>*</span>
                      <div className="wage-input-group">
                        <label className="wage-label">{t('LABELS.paidLeaveRate')}</label>
                        <input
                          type="number"
                          min="0"
                          className="wage-input"
                          value={paidLeaveWage || ''}
                          onChange={(e) => handlePositiveNumberInput(e.target.value, 'custom_paid_leave_wage')}
                          placeholder={t('LABELS.enterPaidLeaveWage')}
                        />
                      </div>
                    </div>
                    <div className="payment-display">
                      <div className="payment-label">{t('LABELS.paidLeavePayment')}</div>
                      <div className="payment-amount">₹{paidLeavePayment.toLocaleString()}</div>
                    </div>
                  </div>
                )}

                {totalWorkedHours > 0 && (
                  <div className="hour-card total">
                    <label className="wage-label">{t('LABELS.totalHours')}</label>
                    <div className="hour-header">
                      <div className="hour-value total">{totalWorkedHours}h</div>
                    </div>
                    <div className="payment-display">
                      <div className="payment-label">{t('LABELS.totalPayment')}</div>
                      <div className="payment-amount">₹{totalCalculatedPayment.toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Details Section */}
              <div className="section" style={{ marginTop: '24px' }}>
                <h3 className="section-title">
                  <span>💳</span> {t('LABELS.paymentDetails')}
                </h3>
                <div className="payment-details-grid">
                  <div className="form-grid-three">
                    <div className="form-group">
                      <label className="form-label">{t('LABELS.paymentMethod')} <span style={{ color: '#dc2626' }}>*</span></label>
                      <CFormSelect
                        className={`form-input ${paymentTypeError ? 'error' : ''}`}
                        value={workSummary.payment_type || ''}
                        onChange={(e) => handlePaymentTypeChange(e.target.value)}
                        required
                      >
                        <option value="">{t('LABELS.selectPaymentMethod')}</option>
                        <option value="cash">{t('LABELS.cash')}</option>
                        <option value="upi">{t('LABELS.upi')}</option>
                        <option value="bank_transfer">{t('LABELS.bankTransfer')}</option>
                      </CFormSelect>
                      {paymentTypeError && <div className="error-message">{paymentTypeError}</div>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">{t('LABELS.actualPaymentAmount')}</label>
                      <CFormInput
                        type="number"
                        min="0"
                        className="form-input"
                        value={workSummary.payed_amount || ''}
                        onChange={(e) => handlePositiveNumberInput(e.target.value, 'payed_amount')}
                        placeholder={t('LABELS.enterPaidAmount')}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">{t('LABELS.pendingAmount')}</label>
                      <CFormInput
                        type="number"
                        className="form-input pending-amount"
                        value={workSummary.pending_payment || 0}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="submit-section">
                <CButton className="submit-btn" onClick={handleSubmit}>
                  {t('LABELS.submitSavePayment')}
                </CButton>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </div>
  );
};

export default WorkSummaryPayment;
//-----------------------------------------------------------------------


// import React from 'react';
// import {
//   CRow,
//   CCol,
//   CFormInput,
//   CButton,
//   CFormSelect,
//   CCard,
//   CCardBody,
//   CCardHeader,
// } from '@coreui/react';
// import { useTranslation } from 'react-i18next';

// const WorkSummaryPayment = ({
//   workSummary,
//   setWorkSummary,
//   employee,
//   onSubmit,
//   title = "LABELS.workSummaryPayment"
// }) => {
//   const { t } = useTranslation('global');

//   if (!workSummary) return null;

//   // Calculate totals
//   const regularHours = workSummary.regular_hours || 0;
//   const overtimeHours = workSummary.overtime_hours || 0;
//   const totalWorkedHours = regularHours + overtimeHours;

//   const regularWage = workSummary.custom_regular_wage || 0;
//   const overtimeWage = workSummary.custom_overtime_wage || 0;
//   const halfDayWage = workSummary.custom_half_day_wage || employee.half_day_rate || 0;
//   const holidayWage = workSummary.custom_holiday_wage || employee.holiday_rate || 0;
//   const paidLeaveWage = workSummary.custom_paid_leave_wage || employee.wage_hour || 0;

//   const regularPayment = workSummary.regular_day * regularWage;

//   let overtimePayment;
//   if (employee.overtime_type === "hourly") {
//     overtimePayment = (workSummary.overtime_hours || 0) * overtimeWage;
//   } else {
//     overtimePayment = (workSummary.over_time_day || 0) * overtimeWage;
//   }

//   const halfDayPayment = (workSummary.half_day || 0) * halfDayWage;
//   const holidayPayment = (workSummary.holiday || 0) * holidayWage;
//   const paidLeavePayment = (workSummary.paid_leaves || 0) * paidLeaveWage;

//   const totalCalculatedPayment = regularPayment + overtimePayment + halfDayPayment + holidayPayment + paidLeavePayment;

//   // Helper function to handle positive number input
//   const handlePositiveNumberInput = (value, fieldName) => {
//     const numValue = parseFloat(value) || 0;
//     const positiveValue = numValue < 0 ? 0 : numValue;

//     if (fieldName === 'payed_amount') {
//       const pending = totalCalculatedPayment - positiveValue;
//       setWorkSummary((prev) => ({
//         ...prev,
//         payed_amount: positiveValue,
//         pending_payment: pending >= 0 ? pending : 0,
//       }));
//     } else {
//       setWorkSummary((prev) => ({
//         ...prev,
//         [fieldName]: positiveValue,
//       }));
//     }
//   };

//   return (
//     <div className="modern-work-summary">
//       <style jsx>{`
//         .modern-work-summary {
//           max-width: 1200px;
//           margin: 0 auto;
//           padding: 8px;
//         }

//         .card-body-custom {
//           padding: 24px;
//         }

//         .section {
//           background: white;
//           border-radius: 12px;
//           padding: 20px;
//           margin-bottom: 20px;
//           border: 1px solid #e8ecf4;
//         }

//         .section:last-child {
//           margin-bottom: 0;
//         }

//         .section-title {
//           font-size: 1.125rem;
//           font-weight: 600;
//           margin-bottom: 16px;
//           color: #1f2937;
//           display: flex;
//           align-items: center;
//           gap: 8px;
//           padding-bottom: 8px;
//           border-bottom: 2px solid #f1f5f9;
//         }

//         .hours-overview {
//           display: grid;
//           grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
//           gap: 16px;
//         }

//         .hour-card {
//           background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
//           border-radius: 8px;
//           padding: 16px;
//           text-align: center;
//           border: 1px solid #e2e8f0;
//           transition: transform 0.2s ease;
//         }

//         .hour-card:hover {
//           transform: translateY(-2px);
//           box-shadow: 0 4px 12px rgba(0,0,0,0.1);
//         }

//         .hour-label {
//           font-size: 0.75rem;
//           color: #6b7280;
//           margin-bottom: 8px;
//           line-height: 1.2;
//         }

//         .hour-value {
//           font-size: 1.5rem;
//           font-weight: 700;
//           margin: 0;
//         }

//         .hour-value.regular { color: #059669; }
//         .hour-value.overtime { color: #d97706; }
//         .hour-value.total { color: #2563eb; }
//         .hour-value.half-day { color: #7c3aed; }
//         .hour-value.holiday { color: #dc2626; }
//         .hour-value.paid-leave { color: #0891b2; }

//         .form-grid {
//           display: grid;
//           grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
//           gap: 16px;
//         }

//         .form-grid-two {
//           display: grid;
//           grid-template-columns: repeat(2, 1fr);
//           gap: 16px;
//         }

//         .form-grid-three {
//           display: grid;
//           grid-template-columns: repeat(3, 1fr);
//           gap: 16px;
//         }

//         .wage-form-grid {
//           display: grid;
//           grid-template-columns: repeat(5, 1fr);
//           gap: 16px;
//         }

//         .form-group {
//           display: flex;
//           flex-direction: column;
//         }

//         .form-label {
//           font-size: 0.875rem;
//           font-weight: 500;
//           color: #374151;
//           margin-bottom: 6px;
//         }

//         .form-input {
//           padding: 12px;
//           border: 1px solid #d1d5db;
//           border-radius: 8px;
//           font-size: 0.875rem;
//           transition: border-color 0.2s ease;
//         }

//         .form-input:focus {
//           outline: none;
//           border-color: #2563eb;
//           box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
//         }

//         .form-input[readonly] {
//           background-color: #f9fafb;
//           color: #6b7280;
//         }

//         .payment-breakdown {
//           display: grid;
//           grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
//           gap: 12px;
//         }

//         .breakdown-item {
//           background: #f8fafc;
//           border: 1px solid #e2e8f0;
//           border-radius: 8px;
//           padding: 12px;
//           text-align: center;
//         }

//         .breakdown-label {
//           font-size: 0.7rem;
//           color: #64748b;
//           margin-bottom: 4px;
//           line-height: 1.2;
//         }

//         .breakdown-value {
//           font-size: 1.125rem;
//           font-weight: 600;
//           color: #1e293b;
//         }

//         .payment-details-grid {
//           background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
//           border: 1px solid #bae6fd;
//           border-radius: 8px;
//           padding: 16px;
//         }

//         .submit-section {
//           text-align: center;
//           margin-top: 20px;
//         }

//         .submit-btn {
//           background: linear-gradient(135deg, #059669 0%, #047857 100%);
//           border: none;
//           color: white;
//           padding: 16px 32px;
//           border-radius: 8px;
//           font-size: 1rem;
//           font-weight: 600;
//           cursor: pointer;
//           transition: all 0.2s ease;
//           box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
//         }

//         .submit-btn:hover {
//           transform: translateY(-2px);
//           box-shadow: 0 6px 20px rgba(5, 150, 105, 0.4);
//         }

//         .pending-amount {
//           background: #fef2f2;
//           border: 1px solid #fecaca;
//           color: #dc2626;
//         }

//         /* Mobile Responsiveness */
//         @media (max-width: 768px) {
//           .modern-work-summary {
//             padding: 0px;
//           }

//           .card-body-custom {
//             padding: 16px;
//           }

//           .section {
//             padding: 16px;
//             margin-bottom: 16px;
//           }

//           .section-title {
//             font-size: 1rem;
//             margin-bottom: 12px;
//           }

//           .hours-overview {
//             grid-template-columns: repeat(2, 1fr);
//             gap: 8px;
//           }

//           .hour-card {
//             padding: 12px;
//           }

//           .hour-label {
//             font-size: 0.7rem;
//           }

//           .hour-value {
//             font-size: 1.125rem;
//           }

//           .wage-form-grid {
//             grid-template-columns: repeat(2, 1fr);
//             gap: 12px;
//           }

//           .form-grid-two {
//             grid-template-columns: 1fr;
//             gap: 12px;
//           }

//           .form-grid-three {
//             grid-template-columns: 1fr;
//             gap: 12px;
//           }

//           .payment-breakdown {
//             grid-template-columns: repeat(2, 1fr);
//             gap: 8px;
//           }

//           .breakdown-item {
//             padding: 8px;
//           }

//           .breakdown-label {
//             font-size: 0.65rem;
//           }

//           .breakdown-value {
//             font-size: 1rem;
//           }

//           .payment-details-grid {
//             padding: 12px;
//           }

//           .submit-btn {
//             width: 100%;
//             padding: 14px;
//           }
//         }

//         @media (max-width: 480px) {
//           .hours-overview {
//             grid-template-columns: repeat(3, 1fr);
//             gap: 6px;
//           }

//           .hour-card {
//             padding: 8px;
//           }

//           .hour-label {
//             font-size: 0.65rem;
//           }

//           .hour-value {
//             font-size: 1rem;
//           }

//           .section {
//             padding: 12px;
//             margin-bottom: 12px;
//           }

//           .wage-form-grid {
//             grid-template-columns: 1fr;
//             gap: 8px;
//           }

//           .form-grid {
//             grid-template-columns: 1fr;
//             gap: 12px;
//           }

//           .payment-breakdown {
//             grid-template-columns: repeat(3, 1fr);
//             gap: 6px;
//           }

//           .breakdown-item {
//             padding: 6px;
//           }

//           .breakdown-label {
//             font-size: 0.6rem;
//           }

//           .breakdown-value {
//             font-size: 0.875rem;
//           }

//           .form-input {
//             padding: 10px;
//             font-size: 0.8rem;
//           }

//           .form-label {
//             font-size: 0.8rem;
//           }
//         }
//       `}</style>

//       <CRow>
//         <CCol xs={12}>
//           <CCard className="mb-4 shadow-sm">
//             <CCardHeader style={{ backgroundColor: "#E6E6FA" }}>
//               <div className="d-flex justify-content-between align-items-center flex-wrap">
//                 <strong>{t(title)}</strong>
//               </div>
//             </CCardHeader>
//             <CCardBody>

//               {/* Work Hours Overview Section */}
//               <div className="section">
//                 <h3 className="section-title">
//                   <span>⏰</span> {t('LABELS.workHoursOverview')}
//                 </h3>
//                 <div className="hours-overview">
//                   {(workSummary?.regular_day || 0) > 0 && (
//                     <div className="hour-card">
//                       <div className="hour-label">{t('LABELS.regularDays')}</div>
//                       <div className="hour-value regular">{workSummary?.regular_day || 0}</div>
//                     </div>
//                   )}
//                   {((employee.overtime_type==="hourly" ? workSummary?.overtime_hours : workSummary?.over_time_day) || 0) > 0 && (
//                     <div className="hour-card">
//                       <div className="hour-label">{t('LABELS.overtime')} {employee.overtime_type==="hourly" ? t('LABELS.hours') : t('LABELS.days')}</div>
//                       <div className="hour-value overtime">{employee.overtime_type==="hourly" ? workSummary?.overtime_hours || 0 : workSummary?.over_time_day || 0}</div>
//                     </div>
//                   )}
//                   {(workSummary?.half_day || 0) > 0 && (
//                     <div className="hour-card">
//                       <div className="hour-label">{t('LABELS.halfDays')}</div>
//                       <div className="hour-value half-day">{workSummary?.half_day || 0}</div>
//                     </div>
//                   )}
//                   {(workSummary?.holiday || 0) > 0 && (
//                     <div className="hour-card">
//                       <div className="hour-label">{t('LABELS.holidays')}</div>
//                       <div className="hour-value holiday">{workSummary?.holiday || 0}</div>
//                     </div>
//                   )}
//                   {(workSummary?.paid_leaves || 0) > 0 && (
//                     <div className="hour-card">
//                       <div className="hour-label">{t('LABELS.paidLeaves')}</div>
//                       <div className="hour-value paid-leave">{workSummary?.paid_leaves || 0}</div>
//                     </div>
//                   )}
//                   {totalWorkedHours > 0 && (
//                     <div className="hour-card">
//                       <div className="hour-label">{t('LABELS.totalHours')}</div>
//                       <div className="hour-value total">{totalWorkedHours}h</div>
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Wage Configuration Section */}
//               <div className="section">
//                 <h3 className="section-title">
//                   <span>⚙️</span> {t('LABELS.wageConfiguration')}
//                 </h3>
//                 <div className="wage-form-grid">
//                   {(workSummary?.regular_day || 0) > 0 && (
//                     <div className="form-group">
//                       <label className="form-label">{t('LABELS.regularDayRate')}</label>
//                       <CFormInput
//                         type="number"
//                         min="0"
//                         className="form-input"
//                         value={regularWage || ''}
//                         onChange={(e) => handlePositiveNumberInput(e.target.value, 'custom_regular_wage')}
//                         placeholder={t('LABELS.enterRegularWage')}
//                       />
//                     </div>
//                   )}
//                   {((employee.overtime_type==="hourly" ? workSummary?.overtime_hours : workSummary?.over_time_day) || 0) > 0 && (
//                     <div className="form-group">
//                       <label className="form-label">{t('LABELS.overtimeRate')} /{employee.overtime_type==="hourly" ? t('LABELS.hour') : t('LABELS.day')}</label>
//                       <CFormInput
//                         type="number"
//                         min="0"
//                         className="form-input"
//                         value={overtimeWage || ''}
//                         onChange={(e) => handlePositiveNumberInput(e.target.value, 'custom_overtime_wage')}
//                         placeholder={t('LABELS.enterOvertimeWage')}
//                       />
//                     </div>
//                   )}
//                   {(workSummary?.half_day || 0) > 0 && (
//                     <div className="form-group">
//                       <label className="form-label">{t('LABELS.halfDayRate')}</label>
//                       <CFormInput
//                         type="number"
//                         min="0"
//                         className="form-input"
//                         value={halfDayWage || ''}
//                         onChange={(e) => handlePositiveNumberInput(e.target.value, 'custom_half_day_wage')}
//                         placeholder={t('LABELS.enterHalfDayWage')}
//                       />
//                     </div>
//                   )}
//                   {(workSummary?.holiday || 0) > 0 && (
//                     <div className="form-group">
//                       <label className="form-label">{t('LABELS.holidayRate')}</label>
//                       <CFormInput
//                         type="number"
//                         min="0"
//                         className="form-input"
//                         value={holidayWage || ''}
//                         onChange={(e) => handlePositiveNumberInput(e.target.value, 'custom_holiday_wage')}
//                         placeholder={t('LABELS.enterHolidayWage')}
//                       />
//                     </div>
//                   )}
//                   {(workSummary?.paid_leaves || 0) > 0 && (
//                     <div className="form-group">
//                       <label className="form-label">{t('LABELS.paidLeaveRate')}</label>
//                       <CFormInput
//                         type="number"
//                         min="0"
//                         className="form-input"
//                         value={paidLeaveWage || ''}
//                         onChange={(e) => handlePositiveNumberInput(e.target.value, 'custom_paid_leave_wage')}
//                         placeholder={t('LABELS.enterPaidLeaveWage')}
//                       />
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Payment Breakdown Section */}
//               <div className="section">
//                 <h3 className="section-title">
//                   <span>💰</span> {t('LABELS.paymentBreakdown')}
//                 </h3>
//                 <div className="payment-breakdown">
//                   {(workSummary?.regular_day || 0) > 0 && (
//                     <div className="breakdown-item">
//                       <div className="breakdown-label">{t('LABELS.regularPayment')}</div>
//                       <div className="breakdown-value">₹{regularPayment.toLocaleString()}</div>
//                     </div>
//                   )}
//                   {((employee.overtime_type==="hourly" ? workSummary?.overtime_hours : workSummary?.over_time_day) || 0) > 0 && (
//                     <div className="breakdown-item">
//                       <div className="breakdown-label">{t('LABELS.overtimePayment')}</div>
//                       <div className="breakdown-value">₹{overtimePayment.toLocaleString()}</div>
//                     </div>
//                   )}
//                   {(workSummary?.half_day || 0) > 0 && (
//                     <div className="breakdown-item">
//                       <div className="breakdown-label">{t('LABELS.halfDayPayment')}</div>
//                       <div className="breakdown-value">₹{halfDayPayment.toLocaleString()}</div>
//                     </div>
//                   )}
//                   {(workSummary?.holiday || 0) > 0 && (
//                     <div className="breakdown-item">
//                       <div className="breakdown-label">{t('LABELS.holidayPayment')}</div>
//                       <div className="breakdown-value">₹{holidayPayment.toLocaleString()}</div>
//                     </div>
//                   )}
//                   {(workSummary?.paid_leaves || 0) > 0 && (
//                     <div className="breakdown-item">
//                       <div className="breakdown-label">{t('LABELS.paidLeavePayment')}</div>
//                       <div className="breakdown-value">₹{paidLeavePayment.toLocaleString()}</div>
//                     </div>
//                   )}
//                   <div className="breakdown-item">
//                     <div className="breakdown-label">{t('LABELS.totalPayment')}</div>
//                     <div className="breakdown-value">₹{totalCalculatedPayment.toLocaleString()}</div>
//                   </div>
//                 </div>
//               </div>

//               {/* Payment Details Section */}
//               <div className="section">
//                 <h3 className="section-title">
//                   <span>💳</span> {t('LABELS.paymentDetails')}
//                 </h3>
//                 <div className="payment-details-grid">
//                   <div className="form-grid-three">
//                     <div className="form-group">
//                       <label className="form-label">{t('LABELS.paymentMethod')}</label>
//                       <CFormSelect
//                         className="form-input"
//                         value={workSummary.payment_type || ''}
//                         onChange={(e) =>
//                           setWorkSummary((prev) => ({
//                             ...prev,
//                             payment_type: e.target.value,
//                           }))
//                         }
//                       >
//                         <option value="">{t('LABELS.selectPaymentMethod')}</option>
//                         <option value="cash">{t('LABELS.cash')}</option>
//                         <option value="upi">{t('LABELS.upi')}</option>
//                         <option value="bank_transfer">{t('LABELS.bankTransfer')}</option>
//                       </CFormSelect>
//                     </div>

//                     <div className="form-group">
//                       <label className="form-label">{t('LABELS.actualPaymentAmount')}</label>
//                       <CFormInput
//                         type="number"
//                         min="0"
//                         className="form-input"
//                         value={workSummary.payed_amount || ''}
//                         onChange={(e) => handlePositiveNumberInput(e.target.value, 'payed_amount')}
//                         placeholder={t('LABELS.enterPaidAmount')}
//                       />
//                     </div>

//                     <div className="form-group">
//                       <label className="form-label">{t('LABELS.pendingAmount')}</label>
//                       <CFormInput
//                         type="number"
//                         className="form-input pending-amount"
//                         value={workSummary.pending_payment || 0}
//                         readOnly
//                       />
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* Submit Button */}
//               <div className="submit-section">
//                 <CButton className="submit-btn" onClick={onSubmit}>
//                   {t('LABELS.submitSavePayment')}
//                 </CButton>
//               </div>

//             </CCardBody>
//           </CCard>
//         </CCol>
//       </CRow>
//     </div>
//   );
// };

// export default WorkSummaryPayment;
//------------------------------------------------------------------------------------

// import React from 'react';
// import {
//   CRow,
//   CCol,
//   CFormInput,
//   CButton,
//   CFormSelect,
//   CCard,
//   CCardBody,
// } from '@coreui/react';
// import { useTranslation } from 'react-i18next';

// const WorkSummaryPayment = ({
//   workSummary,
//   setWorkSummary,
//   employee,
//   onSubmit,
//   title = "Work Summary & Payment"
// }) => {
//   const { t } = useTranslation('global');

//   if (!workSummary) return null;

//   // Calculate totals
//   const regularHours = workSummary.regular_hours || 0;
//   const overtimeHours = workSummary.overtime_hours || 0;
//   const totalWorkedHours = regularHours + overtimeHours;

//   const regularWage = workSummary.custom_regular_wage || 0;
//   const overtimeWage = workSummary.custom_overtime_wage || 0;
//   const halfDayWage = workSummary.custom_half_day_wage || employee.half_day_rate || 0;
//   const holidayWage = workSummary.custom_holiday_wage || employee.holiday_rate || 0;
//   const paidLeaveWage = workSummary.custom_paid_leave_wage || employee.wage_hour || 0;

//   const regularPayment = workSummary.regular_day * regularWage;

//   let overtimePayment;
//   if (employee.overtime_type === "hourly") {
//     overtimePayment = (workSummary.overtime_hours || 0) * overtimeWage;
//   } else {
//     overtimePayment = (workSummary.over_time_day || 0) * overtimeWage;
//   }

//   const halfDayPayment = (workSummary.half_day || 0) * halfDayWage;
//   const holidayPayment = (workSummary.holiday || 0) * holidayWage;
//   const paidLeavePayment = (workSummary.paid_leaves || 0) * paidLeaveWage;

//   const totalCalculatedPayment = regularPayment + overtimePayment + halfDayPayment + holidayPayment + paidLeavePayment;

//   // Helper function to handle positive number input
//   const handlePositiveNumberInput = (value, fieldName) => {
//     const numValue = parseFloat(value) || 0;
//     const positiveValue = numValue < 0 ? 0 : numValue;

//     if (fieldName === 'payed_amount') {
//       const pending = totalCalculatedPayment - positiveValue;
//       setWorkSummary((prev) => ({
//         ...prev,
//         payed_amount: positiveValue,
//         pending_payment: pending >= 0 ? pending : 0,
//       }));
//     } else {
//       setWorkSummary((prev) => ({
//         ...prev,
//         [fieldName]: positiveValue,
//       }));
//     }
//   };

//   return (
//     <div className="modern-work-summary">
//       <style jsx>{`
//         .modern-work-summary {
//           max-width: 1200px;
//           margin: 0 auto;
//           padding: 16px;
//         }

//         .summary-header {
//           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//           color: white;
//           padding: 20px;
//           border-radius: 12px;
//           text-align: center;
//           margin-bottom: 24px;
//           box-shadow: 0 4px 20px rgba(0,0,0,0.1);
//         }

//         .summary-title {
//           font-size: 1.5rem;
//           font-weight: 600;
//           margin: 0;
//         }

//         .hours-overview {
//           display: grid;
//           grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
//           gap: 16px;
//           margin-bottom: 24px;
//         }

//         .hour-card {
//           background: white;
//           border-radius: 12px;
//           padding: 16px;
//           text-align: center;
//           box-shadow: 0 2px 12px rgba(0,0,0,0.08);
//           border: 1px solid #e8ecf4;
//           transition: transform 0.2s ease;
//         }

//         .hour-card:hover {
//           transform: translateY(-2px);
//           box-shadow: 0 4px 20px rgba(0,0,0,0.12);
//         }

//         .hour-label {
//           font-size: 0.75rem;
//           color: #6b7280;
//           margin-bottom: 8px;
//           line-height: 1.2;
//         }

//         .hour-value {
//           font-size: 1.5rem;
//           font-weight: 700;
//           margin: 0;
//         }

//         .hour-value.regular { color: #059669; }
//         .hour-value.overtime { color: #d97706; }
//         .hour-value.total { color: #2563eb; }
//         .hour-value.half-day { color: #7c3aed; }
//         .hour-value.holiday { color: #dc2626; }
//         .hour-value.paid-leave { color: #0891b2; }

//         .section-card {
//           background: white;
//           border-radius: 12px;
//           padding: 20px;
//           margin-bottom: 16px;
//           box-shadow: 0 2px 12px rgba(0,0,0,0.08);
//           border: 1px solid #e8ecf4;
//         }

//         .section-title {
//           font-size: 1.125rem;
//           font-weight: 600;
//           margin-bottom: 16px;
//           color: #1f2937;
//           display: flex;
//           align-items: center;
//           gap: 8px;
//         }

//         .form-grid {
//           display: grid;
//           grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
//           gap: 16px;
//         }

//         .form-grid-two {
//           display: grid;
//           grid-template-columns: repeat(2, 1fr);
//           gap: 16px;
//         }

//         .form-grid-three {
//           display: grid;
//           grid-template-columns: repeat(3, 1fr);
//           gap: 16px;
//         }

//         .wage-form-grid {
//           display: grid;
//           grid-template-columns: repeat(5, 1fr);
//           gap: 16px;
//         }

//         .form-group {
//           display: flex;
//           flex-direction: column;
//         }

//         .form-label {
//           font-size: 0.875rem;
//           font-weight: 500;
//           color: #374151;
//           margin-bottom: 6px;
//         }

//         .form-input {
//           padding: 12px;
//           border: 1px solid #d1d5db;
//           border-radius: 8px;
//           font-size: 0.875rem;
//           transition: border-color 0.2s ease;
//         }

//         .form-input:focus {
//           outline: none;
//           border-color: #2563eb;
//           box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
//         }

//         .form-input[readonly] {
//           background-color: #f9fafb;
//           color: #6b7280;
//         }

//         .payment-breakdown {
//           display: grid;
//           grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
//           gap: 12px;
//           margin-bottom: 16px;
//         }

//         .breakdown-item {
//           background: #f8fafc;
//           border: 1px solid #e2e8f0;
//           border-radius: 8px;
//           padding: 12px;
//           text-align: center;
//         }

//         .breakdown-label {
//           font-size: 0.7rem;
//           color: #64748b;
//           margin-bottom: 4px;
//           line-height: 1.2;
//         }

//         .breakdown-value {
//           font-size: 1.125rem;
//           font-weight: 600;
//           color: #1e293b;
//         }

//         .payment-status {
//           background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
//           border: 1px solid #bae6fd;
//           border-radius: 8px;
//           padding: 16px;
//           margin-bottom: 16px;
//         }

//         .submit-section {
//           text-align: center;
//           margin-top: 24px;
//         }

//         .submit-btn {
//           background: linear-gradient(135deg, #059669 0%, #047857 100%);
//           border: none;
//           color: white;
//           padding: 16px 32px;
//           border-radius: 8px;
//           font-size: 1rem;
//           font-weight: 600;
//           cursor: pointer;
//           transition: all 0.2s ease;
//           box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
//         }

//         .submit-btn:hover {
//           transform: translateY(-2px);
//           box-shadow: 0 6px 20px rgba(5, 150, 105, 0.4);
//         }

//         .pending-amount {
//           background: #fef2f2;
//           border: 1px solid #fecaca;
//           color: #dc2626;
//         }

//         @media (max-width: 768px) {
//           .modern-work-summary {
//             padding: 12px;
//           }

//           .summary-header {
//             padding: 16px;
//             margin-bottom: 16px;
//           }

//           .summary-title {
//             font-size: 1.25rem;
//           }

//           .hours-overview {
//             grid-template-columns: repeat(2, 1fr);
//             gap: 8px;
//             margin-bottom: 16px;
//           }

//           .hour-card {
//             padding: 12px;
//           }

//           .hour-label {
//             font-size: 0.7rem;
//           }

//           .hour-value {
//             font-size: 1.125rem;
//           }

//           .section-card {
//             padding: 16px;
//             margin-bottom: 12px;
//           }

//           .section-title {
//             font-size: 1rem;
//             margin-bottom: 12px;
//           }

//           .wage-form-grid {
//             grid-template-columns: repeat(2, 1fr);
//             gap: 12px;
//           }

//           .form-grid-two {
//             grid-template-columns: 1fr;
//             gap: 12px;
//           }

//           .form-grid-three {
//             grid-template-columns: 1fr;
//             gap: 12px;
//           }

//           .form-grid-three {
//             grid-template-columns: 1fr;
//             gap: 12px;
//           }

//           .payment-breakdown {
//             grid-template-columns: repeat(2, 1fr);
//             gap: 8px;
//           }

//           .breakdown-item {
//             padding: 8px;
//           }

//           .breakdown-label {
//             font-size: 0.65rem;
//           }

//           .breakdown-value {
//             font-size: 1rem;
//           }

//           .submit-btn {
//             width: 100%;
//             padding: 14px;
//           }

//           .payment-status {
//             padding: 12px;
//           }
//         }

//         @media (max-width: 480px) {
//           .hours-overview {
//             grid-template-columns: repeat(3, 1fr);
//             gap: 6px;
//           }

//           .hour-card {
//             padding: 8px;
//           }

//           .hour-label {
//             font-size: 0.65rem;
//           }

//           .hour-value {
//             font-size: 1rem;
//           }

//           .payment-breakdown {
//             grid-template-columns: repeat(3, 1fr);
//             gap: 6px;
//           }

//           .breakdown-item {
//             padding: 6px;
//           }

//           .breakdown-label {
//             font-size: 0.6rem;
//           }

//           .breakdown-value {
//             font-size: 0.875rem;
//           }

//           .section-card {
//             padding: 12px;
//           }

//           .wage-form-grid {
//             grid-template-columns: 1fr;
//             gap: 8px;
//           }

//           .form-grid {
//             grid-template-columns: 1fr;
//             gap: 12px;
//           }

//           .form-grid-two {
//             grid-template-columns: 1fr;
//             gap: 12px;
//           }

//           .form-input {
//             padding: 10px;
//             font-size: 0.8rem;
//           }

//           .form-label {
//             font-size: 0.8rem;
//           }
//         }
//       `}</style>

//       <div className="summary-header">
//         <h1 className="summary-title">{t('LABELS.workSummaryPayment')}</h1>
//       </div>

//       {/* Work Hours Overview */}
//       <div className="hours-overview">
//         {(workSummary?.regular_day || 0) > 0 && (
//           <div className="hour-card">
//             <div className="hour-label">{t('LABELS.regularDays')}</div>
//             <div className="hour-value regular">{workSummary?.regular_day || 0}</div>
//           </div>
//         )}
//         {((employee.overtime_type==="hourly" ? workSummary?.overtime_hours : workSummary?.over_time_day) || 0) > 0 && (
//           <div className="hour-card">
//             <div className="hour-label">{t('LABELS.overtime')} {employee.overtime_type==="hourly" ? t('LABELS.hours') : t('LABELS.days')}</div>
//             <div className="hour-value overtime">{employee.overtime_type==="hourly" ? workSummary?.overtime_hours || 0 : workSummary?.over_time_day || 0}</div>
//           </div>
//         )}
//         {(workSummary?.half_day || 0) > 0 && (
//           <div className="hour-card">
//             <div className="hour-label">{t('LABELS.halfDays')}</div>
//             <div className="hour-value half-day">{workSummary?.half_day || 0}</div>
//           </div>
//         )}
//         {(workSummary?.holiday || 0) > 0 && (
//           <div className="hour-card">
//             <div className="hour-label">{t('LABELS.holidays')}</div>
//             <div className="hour-value holiday">{workSummary?.holiday || 0}</div>
//           </div>
//         )}
//         {(workSummary?.paid_leaves || 0) > 0 && (
//           <div className="hour-card">
//             <div className="hour-label">{t('LABELS.paidLeaves')}</div>
//             <div className="hour-value paid-leave">{workSummary?.paid_leaves || 0}</div>
//           </div>
//         )}
//         {totalWorkedHours > 0 && (
//           <div className="hour-card">
//             <div className="hour-label">{t('LABELS.totalHours')}</div>
//             <div className="hour-value total">{totalWorkedHours}h</div>
//           </div>
//         )}
//       </div>

//       {/* Wage Configuration */}
//       <div className="section-card">
//         <h3 className="section-title">
//           <span>⚙️</span> {t('LABELS.wageConfiguration')}
//         </h3>
//         <div className="wage-form-grid">
//           {(workSummary?.regular_day || 0) > 0 && (
//             <div className="form-group">
//               <label className="form-label">{t('LABELS.regularDayRate')}</label>
//               <input
//                 type="number"
//                 min="0"
//                 className="form-input"
//                 value={regularWage || ''}
//                 onChange={(e) => handlePositiveNumberInput(e.target.value, 'custom_regular_wage')}
//                 placeholder={t('LABELS.enterRegularWage')}
//               />
//             </div>
//           )}
//           {((employee.overtime_type==="hourly" ? workSummary?.overtime_hours : workSummary?.over_time_day) || 0) > 0 && (
//             <div className="form-group">
//               <label className="form-label">{t('LABELS.overtimeRate')} /{employee.overtime_type=="hourly" ? t('LABELS.hour') : t('LABELS.day')}</label>
//               <input
//                 type="number"
//                 min="0"
//                 className="form-input"
//                 value={overtimeWage || ''}
//                 onChange={(e) => handlePositiveNumberInput(e.target.value, 'custom_overtime_wage')}
//                 placeholder={t('LABELS.enterOvertimeWage')}
//               />
//             </div>
//           )}
//           {(workSummary?.half_day || 0) > 0 && (
//             <div className="form-group">
//               <label className="form-label">{t('LABELS.halfDayRate')}</label>
//               <input
//                 type="number"
//                 min="0"
//                 className="form-input"
//                 value={halfDayWage || ''}
//                 onChange={(e) => handlePositiveNumberInput(e.target.value, 'custom_half_day_wage')}
//                 placeholder={t('LABELS.enterHalfDayWage')}
//               />
//             </div>
//           )}
//           {(workSummary?.holiday || 0) > 0 && (
//             <div className="form-group">
//               <label className="form-label">{t('LABELS.holidayRate')}</label>
//               <input
//                 type="number"
//                 min="0"
//                 className="form-input"
//                 value={holidayWage || ''}
//                 onChange={(e) => handlePositiveNumberInput(e.target.value, 'custom_holiday_wage')}
//                 placeholder={t('LABELS.enterHolidayWage')}
//               />
//             </div>
//           )}
//           {(workSummary?.paid_leaves || 0) > 0 && (
//             <div className="form-group">
//               <label className="form-label">{t('LABELS.paidLeaveRate')}</label>
//               <input
//                 type="number"
//                 min="0"
//                 className="form-input"
//                 value={paidLeaveWage || ''}
//                 onChange={(e) => handlePositiveNumberInput(e.target.value, 'custom_paid_leave_wage')}
//                 placeholder={t('LABELS.enterPaidLeaveWage')}
//               />
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Payment Breakdown */}
//       <div className="section-card">
//         <h3 className="section-title">
//           <span>💰</span> {t('LABELS.paymentBreakdown')}
//         </h3>
//         <div className="payment-breakdown">
//           {(workSummary?.regular_day || 0) > 0 && (
//             <div className="breakdown-item">
//               <div className="breakdown-label">{t('LABELS.regularPayment')}</div>
//               <div className="breakdown-value">₹{regularPayment.toLocaleString()}</div>
//             </div>
//           )}
//           {((employee.overtime_type==="hourly" ? workSummary?.overtime_hours : workSummary?.over_time_day) || 0) > 0 && (
//             <div className="breakdown-item">
//               <div className="breakdown-label">{t('LABELS.overtimePayment')}</div>
//               <div className="breakdown-value">₹{overtimePayment.toLocaleString()}</div>
//             </div>
//           )}
//           {(workSummary?.half_day || 0) > 0 && (
//             <div className="breakdown-item">
//               <div className="breakdown-label">{t('LABELS.halfDayPayment')}</div>
//               <div className="breakdown-value">₹{halfDayPayment.toLocaleString()}</div>
//             </div>
//           )}
//           {(workSummary?.holiday || 0) > 0 && (
//             <div className="breakdown-item">
//               <div className="breakdown-label">{t('LABELS.holidayPayment')}</div>
//               <div className="breakdown-value">₹{holidayPayment.toLocaleString()}</div>
//             </div>
//           )}
//           {(workSummary?.paid_leaves || 0) > 0 && (
//             <div className="breakdown-item">
//               <div className="breakdown-label">{t('LABELS.paidLeavePayment')}</div>
//               <div className="breakdown-value">₹{paidLeavePayment.toLocaleString()}</div>
//             </div>
//           )}
//           <div className="breakdown-item">
//             <div className="breakdown-label">{t('LABELS.totalPayment')}</div>
//             <div className="breakdown-value">₹{totalCalculatedPayment.toLocaleString()}</div>
//           </div>
//         </div>
//       </div>

//       {/* Payment Status */}
//       <div className="section-card">
//         <h3 className="section-title">
//           <span>💳</span> {t('LABELS.paymentDetails')}
//         </h3>
//         <div className="payment-status">
//           <div className="form-grid-three">
//             <div className="form-group">
//               <label className="form-label">{t('LABELS.paymentMethod')}</label>
//               <select
//                 className="form-input"
//                 value={workSummary.payment_type || ''}
//                 onChange={(e) =>
//                   setWorkSummary((prev) => ({
//                     ...prev,
//                     payment_type: e.target.value,
//                   }))
//                 }
//               >
//                 <option value="">{t('LABELS.selectPaymentMethod')}</option>
//                 <option value="cash">💵 {t('LABELS.cash')}</option>
//                 <option value="upi">📱 {t('LABELS.upi')}</option>
//                 <option value="bank_transfer">🏦 {t('LABELS.bankTransfer')}</option>
//               </select>
//             </div>

//             <div className="form-group">
//               <label className="form-label">{t('LABELS.actualPaymentAmount')}</label>
//               <input
//                 type="number"
//                 min="0"
//                 className="form-input"
//                 value={workSummary.payed_amount || ''}
//                 onChange={(e) => handlePositiveNumberInput(e.target.value, 'payed_amount')}
//                 placeholder={t('LABELS.enterPaidAmount')}
//               />
//             </div>

//             <div className="form-group">
//               <label className="form-label">{t('LABELS.pendingAmount')}</label>
//               <input
//                 type="number"
//                 className="form-input pending-amount"
//                 value={workSummary.pending_payment || 0}
//                 readOnly
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Submit Button */}
//       <div className="submit-section">
//         <button className="submit-btn" onClick={onSubmit}>
//           ✅ {t('LABELS.submitSavePayment')}
//         </button>
//       </div>
//     </div>
//   );
// };

// export default WorkSummaryPayment;
//--------------------------------------------------------------------------------------------

// import React from 'react';
// import {
//   CRow,
//   CCol,
//   CFormInput,
//   CButton,
//   CFormSelect,
//   CCard,
//   CCardBody,
// } from '@coreui/react';
// import { useTranslation } from 'react-i18next';

// const WorkSummaryPayment = ({
//   workSummary,
//   setWorkSummary,
//   employee,
//   onSubmit,
//   title = "Work Summary & Payment"
// }) => {
//   const { t } = useTranslation('global');

//   if (!workSummary) return null;

//   // Calculate totals
//   const regularHours = workSummary.regular_hours || 0;
//   const overtimeHours = workSummary.overtime_hours || 0;
//   const totalWorkedHours = regularHours + overtimeHours;

//   const regularWage = workSummary.custom_regular_wage || 0;
//   const overtimeWage = workSummary.custom_overtime_wage || 0;
//   const halfDayWage = workSummary.custom_half_day_wage || employee.half_day_rate || 0;
//   const holidayWage = workSummary.custom_holiday_wage || employee.holiday_rate || 0;
//   const paidLeaveWage = workSummary.custom_paid_leave_wage || employee.wage_hour || 0;

//   const regularPayment = workSummary.regular_day * regularWage;

//   let overtimePayment;
//   if (employee.overtime_type === "hourly") {
//     overtimePayment = (workSummary.overtime_hours || 0) * overtimeWage;
//   } else {
//     overtimePayment = (workSummary.over_time_day || 0) * overtimeWage;
//   }

//   const halfDayPayment = (workSummary.half_day || 0) * halfDayWage;
//   const holidayPayment = (workSummary.holiday || 0) * holidayWage;
//   const paidLeavePayment = (workSummary.paid_leaves || 0) * paidLeaveWage;

//   const totalCalculatedPayment = regularPayment + overtimePayment + halfDayPayment + holidayPayment + paidLeavePayment;

//   // Helper function to handle positive number input
//   const handlePositiveNumberInput = (value, fieldName) => {
//     const numValue = parseFloat(value) || 0;
//     const positiveValue = numValue < 0 ? 0 : numValue;

//     if (fieldName === 'payed_amount') {
//       const pending = totalCalculatedPayment - positiveValue;
//       setWorkSummary((prev) => ({
//         ...prev,
//         payed_amount: positiveValue,
//         pending_payment: pending >= 0 ? pending : 0,
//       }));
//     } else {
//       setWorkSummary((prev) => ({
//         ...prev,
//         [fieldName]: positiveValue,
//       }));
//     }
//   };

//   return (
//     <div className="modern-work-summary">
//       <style jsx>{`
//         .modern-work-summary {
//           max-width: 1200px;
//           margin: 0 auto;
//           padding: 16px;
//         }

//         .summary-header {
//           background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//           color: white;
//           padding: 20px;
//           border-radius: 12px;
//           text-align: center;
//           margin-bottom: 24px;
//           box-shadow: 0 4px 20px rgba(0,0,0,0.1);
//         }

//         .summary-title {
//           font-size: 1.5rem;
//           font-weight: 600;
//           margin: 0;
//         }

//         .hours-overview {
//           display: grid;
//           grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
//           gap: 16px;
//           margin-bottom: 24px;
//         }

//         .hour-card {
//           background: white;
//           border-radius: 12px;
//           padding: 16px;
//           text-align: center;
//           box-shadow: 0 2px 12px rgba(0,0,0,0.08);
//           border: 1px solid #e8ecf4;
//           transition: transform 0.2s ease;
//         }

//         .hour-card:hover {
//           transform: translateY(-2px);
//           box-shadow: 0 4px 20px rgba(0,0,0,0.12);
//         }

//         .hour-label {
//           font-size: 0.75rem;
//           color: #6b7280;
//           margin-bottom: 8px;
//           line-height: 1.2;
//         }

//         .hour-value {
//           font-size: 1.5rem;
//           font-weight: 700;
//           margin: 0;
//         }

//         .hour-value.regular { color: #059669; }
//         .hour-value.overtime { color: #d97706; }
//         .hour-value.total { color: #2563eb; }
//         .hour-value.half-day { color: #7c3aed; }
//         .hour-value.holiday { color: #dc2626; }
//         .hour-value.paid-leave { color: #0891b2; }

//         .section-card {
//           background: white;
//           border-radius: 12px;
//           padding: 20px;
//           margin-bottom: 16px;
//           box-shadow: 0 2px 12px rgba(0,0,0,0.08);
//           border: 1px solid #e8ecf4;
//         }

//         .section-title {
//           font-size: 1.125rem;
//           font-weight: 600;
//           margin-bottom: 16px;
//           color: #1f2937;
//           display: flex;
//           align-items: center;
//           gap: 8px;
//         }

//         .form-grid {
//           display: grid;
//           grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
//           gap: 16px;
//         }

//         .form-grid-two {
//           display: grid;
//           grid-template-columns: repeat(2, 1fr);
//           gap: 16px;
//         }

//         .form-grid-three {
//           display: grid;
//           grid-template-columns: repeat(3, 1fr);
//           gap: 16px;
//         }

//         .wage-form-grid {
//           display: grid;
//           grid-template-columns: repeat(5, 1fr);
//           gap: 16px;
//         }

//         .form-group {
//           display: flex;
//           flex-direction: column;
//         }

//         .form-label {
//           font-size: 0.875rem;
//           font-weight: 500;
//           color: #374151;
//           margin-bottom: 6px;
//         }

//         .form-input {
//           padding: 12px;
//           border: 1px solid #d1d5db;
//           border-radius: 8px;
//           font-size: 0.875rem;
//           transition: border-color 0.2s ease;
//         }

//         .form-input:focus {
//           outline: none;
//           border-color: #2563eb;
//           box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
//         }

//         .form-input[readonly] {
//           background-color: #f9fafb;
//           color: #6b7280;
//         }

//         .payment-breakdown {
//           display: grid;
//           grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
//           gap: 12px;
//           margin-bottom: 16px;
//         }

//         .breakdown-item {
//           background: #f8fafc;
//           border: 1px solid #e2e8f0;
//           border-radius: 8px;
//           padding: 12px;
//           text-align: center;
//         }

//         .breakdown-label {
//           font-size: 0.7rem;
//           color: #64748b;
//           margin-bottom: 4px;
//           line-height: 1.2;
//         }

//         .breakdown-value {
//           font-size: 1.125rem;
//           font-weight: 600;
//           color: #1e293b;
//         }

//         .payment-status {
//           background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
//           border: 1px solid #bae6fd;
//           border-radius: 8px;
//           padding: 16px;
//           margin-bottom: 16px;
//         }

//         .submit-section {
//           text-align: center;
//           margin-top: 24px;
//         }

//         .submit-btn {
//           background: linear-gradient(135deg, #059669 0%, #047857 100%);
//           border: none;
//           color: white;
//           padding: 16px 32px;
//           border-radius: 8px;
//           font-size: 1rem;
//           font-weight: 600;
//           cursor: pointer;
//           transition: all 0.2s ease;
//           box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
//         }

//         .submit-btn:hover {
//           transform: translateY(-2px);
//           box-shadow: 0 6px 20px rgba(5, 150, 105, 0.4);
//         }

//         .pending-amount {
//           background: #fef2f2;
//           border: 1px solid #fecaca;
//           color: #dc2626;
//         }

//         @media (max-width: 768px) {
//           .modern-work-summary {
//             padding: 12px;
//           }

//           .summary-header {
//             padding: 16px;
//             margin-bottom: 16px;
//           }

//           .summary-title {
//             font-size: 1.25rem;
//           }

//           .hours-overview {
//             grid-template-columns: repeat(2, 1fr);
//             gap: 8px;
//             margin-bottom: 16px;
//           }

//           .hour-card {
//             padding: 12px;
//           }

//           .hour-label {
//             font-size: 0.7rem;
//           }

//           .hour-value {
//             font-size: 1.125rem;
//           }

//           .section-card {
//             padding: 16px;
//             margin-bottom: 12px;
//           }

//           .section-title {
//             font-size: 1rem;
//             margin-bottom: 12px;
//           }

//           .wage-form-grid {
//             grid-template-columns: repeat(2, 1fr);
//             gap: 12px;
//           }

//           .form-grid-two {
//             grid-template-columns: 1fr;
//             gap: 12px;
//           }

//           .form-grid-three {
//             grid-template-columns: 1fr;
//             gap: 12px;
//           }

//           .form-grid-three {
//             grid-template-columns: 1fr;
//             gap: 12px;
//           }

//           .payment-breakdown {
//             grid-template-columns: repeat(2, 1fr);
//             gap: 8px;
//           }

//           .breakdown-item {
//             padding: 8px;
//           }

//           .breakdown-label {
//             font-size: 0.65rem;
//           }

//           .breakdown-value {
//             font-size: 1rem;
//           }

//           .submit-btn {
//             width: 100%;
//             padding: 14px;
//           }

//           .payment-status {
//             padding: 12px;
//           }
//         }

//         @media (max-width: 480px) {
//           .hours-overview {
//             grid-template-columns: repeat(3, 1fr);
//             gap: 6px;
//           }

//           .hour-card {
//             padding: 8px;
//           }

//           .hour-label {
//             font-size: 0.65rem;
//           }

//           .hour-value {
//             font-size: 1rem;
//           }

//           .payment-breakdown {
//             grid-template-columns: repeat(3, 1fr);
//             gap: 6px;
//           }

//           .breakdown-item {
//             padding: 6px;
//           }

//           .breakdown-label {
//             font-size: 0.6rem;
//           }

//           .breakdown-value {
//             font-size: 0.875rem;
//           }

//           .section-card {
//             padding: 12px;
//           }

//           .wage-form-grid {
//             grid-template-columns: 1fr;
//             gap: 8px;
//           }

//           .form-grid {
//             grid-template-columns: 1fr;
//             gap: 12px;
//           }

//           .form-grid-two {
//             grid-template-columns: 1fr;
//             gap: 12px;
//           }

//           .form-input {
//             padding: 10px;
//             font-size: 0.8rem;
//           }

//           .form-label {
//             font-size: 0.8rem;
//           }
//         }
//       `}</style>

//       <div className="summary-header">
//         <h1 className="summary-title">{title}</h1>
//       </div>

//       {/* Work Hours Overview */}
//       <div className="hours-overview">
//         {(workSummary?.regular_day || 0) > 0 && (
//           <div className="hour-card">
//             <div className="hour-label">Regular Days</div>
//             <div className="hour-value regular">{workSummary?.regular_day || 0}</div>
//           </div>
//         )}
//         {((employee.overtime_type==="hourly" ? workSummary?.overtime_hours : workSummary?.over_time_day) || 0) > 0 && (
//           <div className="hour-card">
//             <div className="hour-label">Overtime {employee.overtime_type==="hourly" ?"Hours":"Days"}</div>
//             <div className="hour-value overtime">{employee.overtime_type==="hourly" ? workSummary?.overtime_hours || 0 : workSummary?.over_time_day || 0}</div>
//           </div>
//         )}
//         {(workSummary?.half_day || 0) > 0 && (
//           <div className="hour-card">
//             <div className="hour-label">Half Days</div>
//             <div className="hour-value half-day">{workSummary?.half_day || 0}</div>
//           </div>
//         )}
//         {(workSummary?.holiday || 0) > 0 && (
//           <div className="hour-card">
//             <div className="hour-label">Holidays</div>
//             <div className="hour-value holiday">{workSummary?.holiday || 0}</div>
//           </div>
//         )}
//         {(workSummary?.paid_leaves || 0) > 0 && (
//           <div className="hour-card">
//             <div className="hour-label">Paid Leaves</div>
//             <div className="hour-value paid-leave">{workSummary?.paid_leaves || 0}</div>
//           </div>
//         )}
//         {totalWorkedHours > 0 && (
//           <div className="hour-card">
//             <div className="hour-label">Total Hours</div>
//             <div className="hour-value total">{totalWorkedHours}h</div>
//           </div>
//         )}
//       </div>

//       {/* Wage Configuration */}
//       <div className="section-card">
//         <h3 className="section-title">
//           <span>⚙️</span> Wage Configuration
//         </h3>
//         <div className="wage-form-grid">
//           {(workSummary?.regular_day || 0) > 0 && (
//             <div className="form-group">
//               <label className="form-label">Regular Day Rate</label>
//               <input
//                 type="number"
//                 min="0"
//                 className="form-input"
//                 value={regularWage || ''}
//                 onChange={(e) => handlePositiveNumberInput(e.target.value, 'custom_regular_wage')}
//                 placeholder="Enter regular wage"
//               />
//             </div>
//           )}
//           {((employee.overtime_type==="hourly" ? workSummary?.overtime_hours : workSummary?.over_time_day) || 0) > 0 && (
//             <div className="form-group">
//               <label className="form-label">Overtime Rate /{employee.overtime_type=="hourly"?"Hour":"Day"}</label>
//               <input
//                 type="number"
//                 min="0"
//                 className="form-input"
//                 value={overtimeWage || ''}
//                 onChange={(e) => handlePositiveNumberInput(e.target.value, 'custom_overtime_wage')}
//                 placeholder="Enter overtime wage"
//               />
//             </div>
//           )}
//           {(workSummary?.half_day || 0) > 0 && (
//             <div className="form-group">
//               <label className="form-label">Half Day Rate</label>
//               <input
//                 type="number"
//                 min="0"
//                 className="form-input"
//                 value={halfDayWage || ''}
//                 onChange={(e) => handlePositiveNumberInput(e.target.value, 'custom_half_day_wage')}
//                 placeholder="Enter half day wage"
//               />
//             </div>
//           )}
//           {(workSummary?.holiday || 0) > 0 && (
//             <div className="form-group">
//               <label className="form-label">Holiday Rate</label>
//               <input
//                 type="number"
//                 min="0"
//                 className="form-input"
//                 value={holidayWage || ''}
//                 onChange={(e) => handlePositiveNumberInput(e.target.value, 'custom_holiday_wage')}
//                 placeholder="Enter holiday wage"
//               />
//             </div>
//           )}
//           {(workSummary?.paid_leaves || 0) > 0 && (
//             <div className="form-group">
//               <label className="form-label">Paid Leave Rate</label>
//               <input
//                 type="number"
//                 min="0"
//                 className="form-input"
//                 value={paidLeaveWage || ''}
//                 onChange={(e) => handlePositiveNumberInput(e.target.value, 'custom_paid_leave_wage')}
//                 placeholder="Enter paid leave wage"
//               />
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Payment Breakdown */}
//       <div className="section-card">
//         <h3 className="section-title">
//           <span>💰</span> Payment Breakdown
//         </h3>
//         <div className="payment-breakdown">
//           {(workSummary?.regular_day || 0) > 0 && (
//             <div className="breakdown-item">
//               <div className="breakdown-label">Regular Payment</div>
//               <div className="breakdown-value">₹{regularPayment.toLocaleString()}</div>
//             </div>
//           )}
//           {((employee.overtime_type==="hourly" ? workSummary?.overtime_hours : workSummary?.over_time_day) || 0) > 0 && (
//             <div className="breakdown-item">
//               <div className="breakdown-label">Overtime Payment</div>
//               <div className="breakdown-value">₹{overtimePayment.toLocaleString()}</div>
//             </div>
//           )}
//           {(workSummary?.half_day || 0) > 0 && (
//             <div className="breakdown-item">
//               <div className="breakdown-label">Half Day Payment</div>
//               <div className="breakdown-value">₹{halfDayPayment.toLocaleString()}</div>
//             </div>
//           )}
//           {(workSummary?.holiday || 0) > 0 && (
//             <div className="breakdown-item">
//               <div className="breakdown-label">Holiday Payment</div>
//               <div className="breakdown-value">₹{holidayPayment.toLocaleString()}</div>
//             </div>
//           )}
//           {(workSummary?.paid_leaves || 0) > 0 && (
//             <div className="breakdown-item">
//               <div className="breakdown-label">Paid Leave Payment</div>
//               <div className="breakdown-value">₹{paidLeavePayment.toLocaleString()}</div>
//             </div>
//           )}
//           <div className="breakdown-item">
//             <div className="breakdown-label">Total Payment</div>
//             <div className="breakdown-value">₹{totalCalculatedPayment.toLocaleString()}</div>
//           </div>
//         </div>
//       </div>

//       {/* Payment Status */}
//       <div className="section-card">
//         <h3 className="section-title">
//           <span>💳</span> Payment Details
//         </h3>
//         <div className="payment-status">
//           <div className="form-grid-three">
//             <div className="form-group">
//               <label className="form-label">Payment Method</label>
//               <select
//                 className="form-input"
//                 value={workSummary.payment_type || ''}
//                 onChange={(e) =>
//                   setWorkSummary((prev) => ({
//                     ...prev,
//                     payment_type: e.target.value,
//                   }))
//                 }
//               >
//                 <option value="">Select Payment Method</option>
//                 <option value="cash">💵 Cash</option>
//                 <option value="upi">📱 UPI</option>
//                 <option value="bank_transfer">🏦 Bank Transfer</option>
//               </select>
//             </div>

//             <div className="form-group">
//               <label className="form-label">Actual Payment Amount</label>
//               <input
//                 type="number"
//                 min="0"
//                 className="form-input"
//                 value={workSummary.payed_amount || ''}
//                 onChange={(e) => handlePositiveNumberInput(e.target.value, 'payed_amount')}
//                 placeholder="Enter paid amount"
//               />
//             </div>

//             <div className="form-group">
//               <label className="form-label">Pending Amount</label>
//               <input
//                 type="number"
//                 className="form-input pending-amount"
//                 value={workSummary.pending_payment || 0}
//                 readOnly
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Submit Button */}
//       <div className="submit-section">
//         <button className="submit-btn" onClick={onSubmit}>
//           ✅ Submit & Save Payment
//         </button>
//       </div>
//     </div>
//   );
// };

// export default WorkSummaryPayment;
