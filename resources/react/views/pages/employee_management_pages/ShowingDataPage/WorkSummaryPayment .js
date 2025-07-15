import React from 'react';
import {
  CRow,
  CCol,
  CFormInput,
  CButton,
  CFormSelect,
  CCard,
  CCardBody,
} from '@coreui/react';
import { useTranslation } from 'react-i18next';

const WorkSummaryPayment = ({
  workSummary,
  setWorkSummary,
  employee,
  onSubmit,
  title = "Work Summary & Payment"
}) => {
  const { t } = useTranslation('global');

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

  return (
    <div className="modern-work-summary">
      <style jsx>{`
        .modern-work-summary {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px;
        }
        
        .summary-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        
        .summary-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
        }
        
        .hours-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .hour-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          border: 1px solid #e8ecf4;
          transition: transform 0.2s ease;
        }
        
        .hour-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
        }
        
        .hour-label {
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 8px;
          line-height: 1.2;
        }
        
        .hour-value {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0;
        }
        
        .hour-value.regular { color: #059669; }
        .hour-value.overtime { color: #d97706; }
        .hour-value.total { color: #2563eb; }
        .hour-value.half-day { color: #7c3aed; }
        .hour-value.holiday { color: #dc2626; }
        .hour-value.paid-leave { color: #0891b2; }
        
        .section-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          border: 1px solid #e8ecf4;
        }
        
        .section-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 16px;
          color: #1f2937;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }
        
        .wage-form-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
        }
        
        .form-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
        }
        
        .form-input {
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          transition: border-color 0.2s ease;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        
        .form-input[readonly] {
          background-color: #f9fafb;
          color: #6b7280;
        }
        
        .payment-breakdown {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .breakdown-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
        }
        
        .breakdown-label {
          font-size: 0.7rem;
          color: #64748b;
          margin-bottom: 4px;
          line-height: 1.2;
        }
        
        .breakdown-value {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
        }
        
        .payment-status {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid #bae6fd;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
        }
        
        .submit-section {
          text-align: center;
          margin-top: 24px;
        }
        
        .submit-btn {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          border: none;
          color: white;
          padding: 16px 32px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
        }
        
        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(5, 150, 105, 0.4);
        }
        
        .pending-amount {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        }
        
        @media (max-width: 768px) {
          .modern-work-summary {
            padding: 12px;
          }
          
          .summary-header {
            padding: 16px;
            margin-bottom: 16px;
          }
          
          .summary-title {
            font-size: 1.25rem;
          }
          
          .hours-overview {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            margin-bottom: 16px;
          }
          
          .hour-card {
            padding: 12px;
          }
          
          .hour-label {
            font-size: 0.7rem;
          }
          
          .hour-value {
            font-size: 1.125rem;
          }
          
          .section-card {
            padding: 16px;
            margin-bottom: 12px;
          }
          
          .section-title {
            font-size: 1rem;
            margin-bottom: 12px;
          }
          
          .wage-form-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          
          .payment-breakdown {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          
          .breakdown-item {
            padding: 8px;
          }
          
          .breakdown-label {
            font-size: 0.65rem;
          }
          
          .breakdown-value {
            font-size: 1rem;
          }
          
          .submit-btn {
            width: 100%;
            padding: 14px;
          }
          
          .payment-status {
            padding: 12px;
          }
        }
        
        @media (max-width: 480px) {
          .hours-overview {
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
          }
          
          .hour-card {
            padding: 8px;
          }
          
          .hour-label {
            font-size: 0.65rem;
          }
          
          .hour-value {
            font-size: 1rem;
          }
          
          .payment-breakdown {
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
          }
          
          .breakdown-item {
            padding: 6px;
          }
          
          .breakdown-label {
            font-size: 0.6rem;
          }
          
          .breakdown-value {
            font-size: 0.875rem;
          }
          
          .section-card {
            padding: 12px;
          }
          
          .wage-form-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          
          .form-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .form-input {
            padding: 10px;
            font-size: 0.8rem;
          }
          
          .form-label {
            font-size: 0.8rem;
          }
        }
      `}</style>

      <div className="summary-header">
        <h1 className="summary-title">{title}</h1>
      </div>

      {/* Work Hours Overview */}
      <div className="hours-overview">
        {(workSummary?.regular_day || 0) > 0 && (
          <div className="hour-card">
            <div className="hour-label">Regular Days</div>
            <div className="hour-value regular">{workSummary?.regular_day || 0}</div>
          </div>
        )}
        {((employee.overtime_type==="hourly" ? workSummary?.overtime_hours : workSummary?.over_time_day) || 0) > 0 && (
          <div className="hour-card">
            <div className="hour-label">Overtime {employee.overtime_type==="hourly" ?"Hours":"Days"}</div>
            <div className="hour-value overtime">{employee.overtime_type==="hourly" ? workSummary?.overtime_hours || 0 : workSummary?.over_time_day || 0}</div>
          </div>
        )}
        {(workSummary?.half_day || 0) > 0 && (
          <div className="hour-card">
            <div className="hour-label">Half Days</div>
            <div className="hour-value half-day">{workSummary?.half_day || 0}</div>
          </div>
        )}
        {(workSummary?.holiday || 0) > 0 && (
          <div className="hour-card">
            <div className="hour-label">Holidays</div>
            <div className="hour-value holiday">{workSummary?.holiday || 0}</div>
          </div>
        )}
        {(workSummary?.paid_leaves || 0) > 0 && (
          <div className="hour-card">
            <div className="hour-label">Paid Leaves</div>
            <div className="hour-value paid-leave">{workSummary?.paid_leaves || 0}</div>
          </div>
        )}
        {totalWorkedHours > 0 && (
          <div className="hour-card">
            <div className="hour-label">Total Hours</div>
            <div className="hour-value total">{totalWorkedHours}h</div>
          </div>
        )}
      </div>

      {/* Wage Configuration */}
      <div className="section-card">
        <h3 className="section-title">
          <span>⚙️</span> Wage Configuration
        </h3>
        <div className="wage-form-grid">
          {(workSummary?.regular_day || 0) > 0 && (
            <div className="form-group">
              <label className="form-label">Regular Day Rate</label>
              <input
                type="number"
                className="form-input"
                value={regularWage || ''}
                onChange={(e) =>
                  setWorkSummary((prev) => ({
                    ...prev,
                    custom_regular_wage: parseInt(e.target.value || 0, 10),
                  }))
                }
                placeholder="Enter regular wage"
              />
            </div>
          )}
          {((employee.overtime_type==="hourly" ? workSummary?.overtime_hours : workSummary?.over_time_day) || 0) > 0 && (
            <div className="form-group">
              <label className="form-label">Overtime Rate /{employee.overtime_type=="hourly"?"Hour":"Day"}</label>
              <input
                type="number"
                className="form-input"
                value={overtimeWage || ''}
                onChange={(e) =>
                  setWorkSummary((prev) => ({
                    ...prev,
                    custom_overtime_wage: parseInt(e.target.value || 0, 10),
                  }))
                }
                placeholder="Enter overtime wage"
              />
            </div>
          )}
          {(workSummary?.half_day || 0) > 0 && (
            <div className="form-group">
              <label className="form-label">Half Day Rate</label>
              <input
                type="number"
                className="form-input"
                value={halfDayWage || ''}
                onChange={(e) =>
                  setWorkSummary((prev) => ({
                    ...prev,
                    custom_half_day_wage: parseInt(e.target.value || 0, 10),
                  }))
                }
                placeholder="Enter half day wage"
              />
            </div>
          )}
          {(workSummary?.holiday || 0) > 0 && (
            <div className="form-group">
              <label className="form-label">Holiday Rate</label>
              <input
                type="number"
                className="form-input"
                value={holidayWage || ''}
                onChange={(e) =>
                  setWorkSummary((prev) => ({
                    ...prev,
                    custom_holiday_wage: parseInt(e.target.value || 0, 10),
                  }))
                }
                placeholder="Enter holiday wage"
              />
            </div>
          )}
          {(workSummary?.paid_leaves || 0) > 0 && (
            <div className="form-group">
              <label className="form-label">Paid Leave Rate</label>
              <input
                type="number"
                className="form-input"
                value={paidLeaveWage || ''}
                onChange={(e) =>
                  setWorkSummary((prev) => ({
                    ...prev,
                    custom_paid_leave_wage: parseInt(e.target.value || 0, 10),
                  }))
                }
                placeholder="Enter paid leave wage"
              />
            </div>
          )}
        </div>
      </div>

      {/* Payment Breakdown */}
      <div className="section-card">
        <h3 className="section-title">
          <span>💰</span> Payment Breakdown
        </h3>
        <div className="payment-breakdown">
          {(workSummary?.regular_day || 0) > 0 && (
            <div className="breakdown-item">
              <div className="breakdown-label">Regular Payment</div>
              <div className="breakdown-value">₹{regularPayment.toLocaleString()}</div>
            </div>
          )}
          {((employee.overtime_type==="hourly" ? workSummary?.overtime_hours : workSummary?.over_time_day) || 0) > 0 && (
            <div className="breakdown-item">
              <div className="breakdown-label">Overtime Payment</div>
              <div className="breakdown-value">₹{overtimePayment.toLocaleString()}</div>
            </div>
          )}
          {(workSummary?.half_day || 0) > 0 && (
            <div className="breakdown-item">
              <div className="breakdown-label">Half Day Payment</div>
              <div className="breakdown-value">₹{halfDayPayment.toLocaleString()}</div>
            </div>
          )}
          {(workSummary?.holiday || 0) > 0 && (
            <div className="breakdown-item">
              <div className="breakdown-label">Holiday Payment</div>
              <div className="breakdown-value">₹{holidayPayment.toLocaleString()}</div>
            </div>
          )}
          {(workSummary?.paid_leaves || 0) > 0 && (
            <div className="breakdown-item">
              <div className="breakdown-label">Paid Leave Payment</div>
              <div className="breakdown-value">₹{paidLeavePayment.toLocaleString()}</div>
            </div>
          )}
          <div className="breakdown-item">
            <div className="breakdown-label">Total Payment</div>
            <div className="breakdown-value">₹{totalCalculatedPayment.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Payment Status */}
      <div className="section-card">
        <h3 className="section-title">
          <span>💳</span> Payment Details
        </h3>
        <div className="payment-status">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                className="form-input"
                value={workSummary.payment_type || ''}
                onChange={(e) =>
                  setWorkSummary((prev) => ({
                    ...prev,
                    payment_type: e.target.value,
                  }))
                }
              >
                <option value="">Select Payment Method</option>
                <option value="cash">💵 Cash</option>
                <option value="upi">📱 UPI</option>
                <option value="bank_transfer">🏦 Bank Transfer</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Actual Payment Amount</label>
              <input
                type="number"
                className="form-input"
                value={workSummary.payed_amount || ''}
                onChange={(e) => {
                  const actual = parseFloat(e.target.value || 0);
                  const pending = totalCalculatedPayment - actual;
                  setWorkSummary((prev) => ({
                    ...prev,
                    payed_amount: actual,
                    pending_payment: pending >= 0 ? pending : 0,
                  }));
                }}
                placeholder="Enter paid amount"
              />
            </div>
          </div>
          
          {workSummary.pending_payment > 0 && (
            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Pending Amount</label>
              <input
                type="number"
                className="form-input pending-amount"
                value={workSummary.pending_payment || 0}
                readOnly
              />
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="submit-section">
        <button className="submit-btn" onClick={onSubmit}>
          ✅ Submit & Save Payment
        </button>
      </div>
    </div>
  );
};

export default WorkSummaryPayment;