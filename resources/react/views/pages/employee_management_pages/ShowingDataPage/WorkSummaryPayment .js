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

  // Check if salary_amount is 0
  const isSalaryZero = totalCalculatedPayment === 0;

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
        salary_amount: totalCalculatedPayment
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

  // Handle transaction ID change
  const handleTransactionIdChange = (value) => {
    setWorkSummary((prev) => ({
      ...prev,
      transaction_id: value || null,
    }));
  };

  // Handle submit with validation
  const handleSubmit = async () => {
    console.log(workSummary);

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

        .form-grid-two {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
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
          margin-top: 06px;
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

        .submit-btn:disabled {
          background: #d1d5db;
          cursor: not-allowed;
          box-shadow: none;
        }

        .submit-btn:hover:not(:disabled) {
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

          .form-grid-two {
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
              {isSalaryZero ? (
                <div className="section">
                  <h3 className="section-title">
                    <span>ℹ️</span> {t('LABELS.noPaymentData')}
                  </h3>
                  <p>No payment data available as the total salary amount is zero.</p>
                </div>
              ) : (
                <>
                  {/* Work Hours Overview with Wage Configuration */}
                  <div className="hours-overview">
                    {(workSummary?.regular_day || 0) > 0 && (workSummary.regular_hours != 0) && (
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

                    {((employee.overtime_type === "hourly" ? workSummary?.overtime_hours : workSummary?.over_time_day) || 0) > 0 && (
                      <div className="hour-card overtime">
                        <label className="wage-label">{t('LABELS.overtimeHours')}</label>
                        <div className="hour-header">
                          <div className="hour-value overtime">{employee.overtime_type === "hourly" ? workSummary?.overtime_hours || 0 : workSummary?.over_time_day || 0}</div>
                          <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>*</span>
                          <div className="wage-input-group">
                            <label className="wage-label">{t('LABELS.overtimeRate')}/{employee.overtime_type === "hourly" ? t('LABELS.hour') : t('LABELS.day')}</label>
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
                  <div className="section" style={{ marginTop: '04px' }}>
                    <h3 className="section-title">
                      <span>💳</span> {t('LABELS.paymentDetails')}
                    </h3>
                    <div className="payment-details-grid">
                      <div className="form-grid-two">
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
                      </div>
                      <div className="form-grid-two">
                        <div className="form-group">
                          <label className="form-label">{t('LABELS.pendingAmount')}</label>
                          <CFormInput
                            type="number"
                            className="form-input pending-amount"
                            value={workSummary.pending_payment || 0}
                            readOnly
                          />
                        </div>
                        {(workSummary.payment_type != "cash") || (workSummary.payment_type != "") || (workSummary.payment_type != null) && (<div className="form-group">
                          <label className="form-label">{t('LABELS.transactionId')}</label>
                          <CFormInput
                            type="text"
                            className="form-input"
                            value={workSummary.transaction_id || ''}
                            onChange={(e) => handleTransactionIdChange(e.target.value)}
                            placeholder={t('LABELS.enterTransactionId')}
                          />
                        </div>)}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="submit-section">
                <CButton
                  className="submit-btn"
                  onClick={handleSubmit}
                  disabled={workSummary?.regular_hours === 0}
                >
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
