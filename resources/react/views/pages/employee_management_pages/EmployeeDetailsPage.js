
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CContainer, CCard, CCardBody, CCardHeader, CRow, CCol, CTable, CTableHead,
  CTableRow, CTableHeaderCell, CTableBody, CTableDataCell, CSpinner,
  CFormInput, CButton,
  CFormSelect
} from '@coreui/react';
import { getAPICall, post } from '../../../util/api';

const EmployeeDetailsPage = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [workSummary, setWorkSummary] = useState(null);

  useEffect(() => {
    getAPICall(`/api/employee/${id}`)
      .then(data => {
        setEmployee(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading employee:', error);
        setLoading(false);
      });
  }, [id]);

  const handleCalculate = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates.');
      return;
    }

    const requestData = {
      employee_id: parseInt(id),
      start_date: startDate,
      end_date: endDate,
      working_hours: 8
    };

    try {
      const response = await post('/api/workSummary', requestData);
      const data =  response;
      setWorkSummary(data);
    } catch (error) {
      console.error('Error fetching work summary:', error);
    }
  };

  

  if (loading) return <CSpinner color="primary" />;
  if (!employee) return <p>Employee not found.</p>;

  const handleSubmit = async () => {
  const regularWage = workSummary.custom_regular_wage ?? employee.wage_hour;
  const overtimeWage = workSummary.custom_overtime_wage ?? employee.wage_overtime;

  const salary_amount =
    (workSummary.regular_hours * regularWage) +
    (workSummary.overtime_hours * overtimeWage);

  const payload = {
    start_date: startDate,
    end_date: endDate,
    employee_id: parseInt(id),
    payed_amount: workSummary.payed_amount,
    salary_amount,
    payment_type: workSummary.payment_type,
  };

  try {
    const res = await post('/api/payment', payload);
    const data = await res.json();
    console.log('Payment Submitted:', data);
    alert('Payment submitted successfully!');
  } catch (err) {
    console.error('Payment Error:', err);
    alert('Something went wrong while submitting payment.');
  }
};


  return (
    <CContainer>
      <CCard className="mt-4 shadow">
        <CCardHeader>Employee History: {employee.name}</CCardHeader>
        <CCardBody>
          {/* Employee Info */}
          <CRow>
            <CCol md={6}>
              <p><strong>ID:</strong> {employee.id}</p>
              <p><strong>Mobile:</strong> {employee.mobile}</p>
              <p><strong>Adhaar:</strong> {employee.adhaar_number}</p>
              <p><strong>Wage/Hour:</strong> ₹{employee.wage_hour}</p>
            </CCol>
            <CCol md={6}>
              <p><strong>Wage OT:</strong> ₹{employee.wage_overtime}</p>
              <p><strong>Credit:</strong> ₹{employee.credit}</p>
              <p><strong>Debit:</strong> ₹{employee.debit}</p>
              <p><strong>Referral:</strong> {employee.refferal_by}</p>
            </CCol>
          </CRow>

          {/* Filter Section */}
          <CRow className="align-items-end mt-4">
            <CCol md={4}>
              <label htmlFor="start-date" className="form-label fw-semibold">Start Date</label>
              <input
                type="date"
                id="start-date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </CCol>
            <CCol md={4}>
              <label htmlFor="end-date" className="form-label fw-semibold">End Date</label>
              <input
                type="date"
                id="end-date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </CCol>
            <CCol md={2}>
              <label htmlFor="working-hours" className="form-label fw-semibold">Working Hours</label>
              <select
                id="working-hours"
                className="form-select"
                value={8}
                disabled
              >
                <option value={8}>8 Hours</option>
              </select>
            </CCol>
            <CCol md={2}>
              <button className="btn btn-primary w-100" onClick={handleCalculate}>
                Calculate
              </button>
            </CCol>
          </CRow>

          {/* Attendance Table */}
          <h5 className="mt-5">Attendance History</h5>
          {employee.trackers?.length > 0 ? (
            <>
              <CTable bordered responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Date</CTableHeaderCell>
                    <CTableHeaderCell>Check In</CTableHeaderCell>
                    <CTableHeaderCell>Check Out</CTableHeaderCell>
                    <CTableHeaderCell>Check-In GPS</CTableHeaderCell>
                    <CTableHeaderCell>Check-Out GPS</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {employee.trackers.map((t, i) => (
                    <CTableRow key={i}>
                      <CTableDataCell>
                        {new Date(t.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </CTableDataCell>
                      <CTableDataCell>{t.check_in ? '✔️' : '❌'}</CTableDataCell>
                      <CTableDataCell>{t.check_out ? '✔️' : '❌'}</CTableDataCell>
                      <CTableDataCell>{t.check_in_gps || 'N/A'}</CTableDataCell>
                      <CTableDataCell>{t.check_out_gps || 'N/A'}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
              <p className="mt-3">
                <strong>Total Present Days:</strong>{' '}
                {employee.trackers.filter(t => t.check_in).length}
              </p>
            </>
          ) : (
            <p>No tracker data available.</p>
          )}
        </CCardBody>
      </CCard>

      {/* Work Summary Form (Visible after Calculate) */}
{workSummary && (
  <CCard className="shadow-sm mt-4">
    <CCardBody>
      {/* Editable Hours */}
      <CRow className="mb-3">
        {/* ✅ Fixed Hour Summary as Text */}
      <div className="mb-4 fw-semibold">
        Regular Hours: {workSummary.regular_hours} &nbsp;&nbsp;|&nbsp;&nbsp;
        Overtime Hours: {workSummary.overtime_hours} &nbsp;&nbsp;|&nbsp;&nbsp;
        Total Worked Hours: {(workSummary.regular_hours || 0) + (workSummary.overtime_hours || 0)}
      </div>
      </CRow>

      {/* Editable Wage Inputs */}
     <CRow className="mb-3">
  <CCol md={6}>
    <label className="form-label">Regular Wage per Hour</label>
    <CFormInput
      type="number"
      value={Math.max(0, workSummary.custom_regular_wage ?? 0)}
      onChange={(e) => {
        const val = parseInt(e.target.value || '0', 10);
        setWorkSummary({
          ...workSummary,
          custom_regular_wage: val >= 0 ? val : 0,
        });
      }}
      min={0}
    />
  </CCol>
  <CCol md={6}>
    <label className="form-label">Overtime Wage per Hour</label>
    <CFormInput
      type="number"
      value={Math.max(0, workSummary.custom_overtime_wage ?? 0)}
      onChange={(e) => {
        const val = parseInt(e.target.value || '0', 10);
        setWorkSummary({
          ...workSummary,
          custom_overtime_wage: val >= 0 ? val : 0,
        });
      }}
      min={0}
    />
  </CCol>
</CRow>

      {/* Calculated Payments */}
     <CRow className="mb-4">
  <CCol md={4}>
    <label className="form-label">Regular Payment</label>
    <CFormInput
      type="number"
      value={
        (parseInt(workSummary.regular_hours) || 0) *
        (parseInt(workSummary.custom_regular_wage) || 0)
      }
      readOnly
    />
  </CCol>

  <CCol md={4}>
    <label className="form-label">Overtime Payment</label>
    <CFormInput
      type="number"
      value={
        (parseInt(workSummary.overtime_hours) || 0) *
        (parseInt(workSummary.custom_overtime_wage) || 0)
      }
      readOnly
    />
  </CCol>

  <CCol md={4}>
    <label className="form-label">Total Calculated Payment</label>
    <CFormInput
      type="number"
      value={
        ((parseInt(workSummary.regular_hours) || 0) *
          (parseInt(workSummary.custom_regular_wage) || 0)) +
        ((parseInt(workSummary.overtime_hours) || 0) *
          (parseInt(workSummary.custom_overtime_wage) || 0))
      }
      readOnly
    />
  </CCol>
</CRow>


      {/* Actual Payment & Pending */}
      <CRow className="mb-4">
        <CCol md={6}>
          <label className="form-label">Actual Payment (Given to Employee)</label>
          <CFormInput
            type="number"
            value={workSummary.payed_amount || ''}
            onChange={(e) => {
              const actual = parseInt(e.target.value || 0);
              const total =
                (workSummary.regular_hours *
                  (workSummary.custom_regular_wage ?? employee.wage_hour)) +
                (workSummary.overtime_hours *
                  (workSummary.custom_overtime_wage ?? employee.wage_overtime));
              const pending = total - actual;

              setWorkSummary({
                ...workSummary,
                payed_amount: actual,
                pending_payment: pending >= 0 ? pending : 0,
              });
            }}
          />
        </CCol>
        <CCol md={6}>
          <label className="form-label">Pending Amount (From Owner)</label>
          <CFormInput
            type="number"
            value={workSummary.pending_payment || 0}
            readOnly
          />
        </CCol>
      </CRow>

      {/* Payment Method */}
    <CRow className="mb-3">
  <CCol md={6}>
    <label className="form-label">Payment Method</label>
    <CFormSelect
      value={workSummary.payment_type || ''}
      onChange={(e) =>
        setWorkSummary({
          ...workSummary,
          payment_type: e.target.value,
        })
      }
    >
      <option value="">-- Select Payment Method --</option>
      <option value="cash">Cash</option>
      <option value="upi">UPI</option>
      <option value="bank_transfer">Bank Transfer</option>
    </CFormSelect>
  </CCol>
</CRow>


      {/* Submit Button */}
      <div className="d-flex justify-content-end">
        <CButton color="success" onClick={handleSubmit}>
  Submit
</CButton>

      </div>
    </CCardBody>
  </CCard>
)}

    </CContainer>
  );
};

export default EmployeeDetailsPage;




{/* <CContainer>
  {/* EMPLOYEE PROFILE CARD 
  <CCard className="mt-4 shadow-sm">
    <CCardBody>
      <CRow className="align-items-center">
        <CCol md={8}>
          <h5 className="mb-1 fw-bold">{employee.name}</h5>
          <p className="mb-0 text-muted">ID: {employee.id} | Mobile: {employee.mobile}</p>
        </CCol>
        <CCol md={4} className="text-end">
          <p className="mb-0">
            Wage: ₹{employee.wage_hour}/hr | OT: ₹{employee.wage_overtime}/hr
          </p>
          <small className="text-success fw-semibold">
            Present Days: {employee.trackers?.filter(t => t.check_in).length}
          </small>
        </CCol>
      </CRow>

      {/* Date Filters 
      <CRow className="mt-4">
        <CCol md={3}>
          <label className="form-label">Start Date</label>
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </CCol>
        <CCol md={3}>
          <label className="form-label">End Date</label>
          <input
            type="date"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </CCol>
        <CCol md={3}>
          <label className="form-label">Hours</label>
          <select className="form-select" disabled>
            <option>8 Hours</option>
          </select>
        </CCol>
        <CCol md={3} className="d-flex align-items-end">
          <CButton color="primary" className="w-100" onClick={handleCalculate}>
            Calculate
          </CButton>
        </CCol>
      </CRow>

      {/* Attendance List 
      <div className="mt-5">
        <h6 className="text-success fw-bold">
          <i className="bi bi-check-circle-fill me-2" /> Attendance
        </h6>
        {employee.trackers?.map((t, i) => (
          <div
            key={i}
            className="d-flex justify-content-between border-bottom py-2 align-items-center"
          >
            <div>{new Date(t.created_at).toLocaleString('en-IN')}</div>
            <div className="text-success fw-semibold">
              <i className="bi bi-check-circle me-1" /> GPS ✓
            </div>
          </div>
        ))}
      </div>
    </CCardBody>
  </CCard>

  {/* WORK SUMMARY CARD 
  {workSummary && (
    <CCard className="mt-4 shadow-sm">
      <CCardBody>
        {/* Summary Badge 
        <div className="text-center mb-4">
          <span className="badge bg-primary me-2">
            Regular: {workSummary.regular_hours}
          </span>
          <span className="badge bg-warning text-dark me-2">
            OT: {workSummary.overtime_hours}
          </span>
          <span className="badge bg-success text-white">
            Total: {(workSummary.regular_hours || 0) + (workSummary.overtime_hours || 0)}
          </span>
        </div>

        {/* Wage Inputs 
        <CRow className="mb-4">
          <CCol md={6}>
            <label className="form-label">Regular Wage/hr</label>
            <CFormInput
              type="number"
              value={workSummary.custom_regular_wage ?? 0}
              onChange={(e) =>
                setWorkSummary({
                  ...workSummary,
                  custom_regular_wage: parseInt(e.target.value || 0),
                })
              }
            />
          </CCol>
          <CCol md={6}>
            <label className="form-label">OT Wage/hr</label>
            <CFormInput
              type="number"
              value={workSummary.custom_overtime_wage ?? 0}
              onChange={(e) =>
                setWorkSummary({
                  ...workSummary,
                  custom_overtime_wage: parseInt(e.target.value || 0),
                })
              }
            />
          </CCol>
        </CRow>

        {/* Payment Display Boxes 
        <CRow className="mb-4 text-center">
          <CCol md={4}>
            <div className="bg-light border rounded py-3">
              <h5 className="text-primary mb-1">
                ₹
                {(parseInt(workSummary.regular_hours) || 0) *
                  (parseInt(workSummary.custom_regular_wage) || 0)}
              </h5>
              <small>Regular</small>
            </div>
          </CCol>
          <CCol md={4}>
            <div className="bg-warning-subtle border rounded py-3">
              <h5 className="text-warning mb-1">
                ₹
                {(parseInt(workSummary.overtime_hours) || 0) *
                  (parseInt(workSummary.custom_overtime_wage) || 0)}
              </h5>
              <small>Overtime</small>
            </div>
          </CCol>
          <CCol md={4}>
            <div className="bg-success-subtle border rounded py-3">
              <h5 className="text-success mb-1">
                ₹
                {((parseInt(workSummary.regular_hours) || 0) *
                  (parseInt(workSummary.custom_regular_wage) || 0)) +
                  ((parseInt(workSummary.overtime_hours) || 0) *
                    (parseInt(workSummary.custom_overtime_wage) || 0))}
              </h5>
              <small>Total</small>
            </div>
          </CCol>
        </CRow>

        {/* Payment Form 
        <h6 className="fw-bold mb-3">💳 Payment</h6>
        <CRow className="mb-4">
          <CCol md={4}>
            <label className="form-label">Actual Payment</label>
            <CFormInput
              type="number"
              value={workSummary.actual_payment || ''}
              onChange={(e) => {
                const actual = parseInt(e.target.value || 0);
                const total =
                  (workSummary.regular_hours *
                    (workSummary.custom_regular_wage ?? 0)) +
                  (workSummary.overtime_hours *
                    (workSummary.custom_overtime_wage ?? 0));
                const pending = total - actual;

                setWorkSummary({
                  ...workSummary,
                  actual_payment: actual,
                  pending_payment: pending >= 0 ? pending : 0,
                });
              }}
            />
          </CCol>
          <CCol md={4}>
            <label className="form-label">Pending Amount</label>
            <CFormInput
              type="number"
              value={workSummary.pending_payment || 0}
              readOnly
            />
          </CCol>
          <CCol md={4}>
            <label className="form-label">Method</label>
            <CFormSelect
              value={workSummary.payment_method || ''}
              onChange={(e) =>
                setWorkSummary({
                  ...workSummary,
                  payment_method: e.target.value,
                })
              }
            >
              <option value="">-- Select Payment Method --</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
            </CFormSelect>
          </CCol>
        </CRow>

        {/* Submit 
        <div className="d-grid">
          <CButton color="success" size="lg" onClick={handleSubmit}>
            Submit Payment
          </CButton>
        </div>
      </CCardBody>
    </CCard>
  )}
</CContainer> 
*/}
