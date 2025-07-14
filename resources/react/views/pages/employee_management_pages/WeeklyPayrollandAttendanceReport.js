import React, { useState, useRef } from 'react';
import {
  CContainer,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormLabel,
  CFormSelect,
  CFormInput,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CSpinner,
  CAlert
} from '@coreui/react';
import { cilCloudDownload, cilCalendar } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import { getAPICall, post } from '../../../util/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const WeeklyPresentyPayroll = () => {
  const [selectedWeekDay, setSelectedWeekDay] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [weekDates, setWeekDates] = useState([]);
  const tableRef = useRef(null);

  const weekDays = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');
  };

  const getWeekDates = (startDate, selectedWeekDay) => {
    const dates = [];
    const start = new Date(startDate);

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
  };

  const getWeekFromDate = (dateString, weekStartDay) => {
  const selectedDate = new Date(dateString);
  const dayOfWeek = selectedDate.getDay();

  const weekDayMap = {
    'sunday': 0,
    'monday': 1,
    'tuesday': 2,
    'wednesday': 3,
    'thursday': 4,
    'friday': 5,
    'saturday': 6
  };

  const targetDay = weekDayMap[weekStartDay];

  // Calculate days to subtract to get to the start of the week
  let daysToSubtract = (dayOfWeek - targetDay + 7) % 7;

  // Get the start of the week
  const weekStart = new Date(selectedDate);
  weekStart.setDate(selectedDate.getDate() - daysToSubtract);

  // Get the end of the week (6 days after start for Monday-Sunday format)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return {
    start: weekStart.toISOString().split('T')[0],
    end: weekEnd.toISOString().split('T')[0]
  };
};


//   const validateWeekAlignment = (selectedDate, weekDay) => {
//     const date = new Date(selectedDate);
//     const dayOfWeek = date.getDay();

//     const weekDayMap = {
//       'sunday': 0,
//       'monday': 1,
//       'tuesday': 2,
//       'wednesday': 3,
//       'thursday': 4,
//       'friday': 5,
//       'saturday': 6
//     };

//     return dayOfWeek === weekDayMap[weekDay];
//   };

  const handleWeekDayChange = (e) => {
  const weekDay = e.target.value;
  setSelectedWeekDay(weekDay);
  setSelectedWeek('');
  setStartDate('');
  setEndDate('');
  setWeekDates([]);
  setError('');
};

const handleWeekChange = (e) => {
  const selectedDate = e.target.value;

  if (!selectedWeekDay) {
    setError('Please select a weekday first');
    return;
  }

  setError('');
  setSelectedWeek(selectedDate);

  // Calculate the week range based on selected day and week start day
  const weekRange = getWeekFromDate(selectedDate, selectedWeekDay);

  setStartDate(weekRange.start);
  setEndDate(weekRange.end);
  setWeekDates(getWeekDates(weekRange.start, selectedWeekDay));
};

  const handleGetEmployeeData = async () => {
  if (!startDate || !endDate || !selectedWeekDay) {
    setError('Please select week starting day and a date in the week');
    return;
  }

  setLoading(true);
  setError('');

  try {
    // Use the selectedWeek date (any date in the week) and the week start day
    const response = await post('/api/weeklyPresenty', {
        date: selectedWeek, // This is the date user selected in the week
        week_start_day: selectedWeekDay // This is the selected week starting day
    });

    setEmployeeData(response.data || []);
  } catch (err) {
    setError('Failed to fetch employee data');
    console.error('API Error:', err);
  } finally {
    setLoading(false);
  }
};

  const calculateTotalDays = (attendance) => {
    return Object.values(attendance).filter(day => day.status === 'P').length;
  };

  const calculateOvertimeHours = (attendance) => {
    return Object.values(attendance).reduce((total, day) => {
      return total + (day.overtime_hours || 0);
    }, 0);
  };

  const calculateSundayRate = (employee) => {
    const sundayAttendance = Object.entries(employee.attendance).find(([date, data]) => {
      const dayOfWeek = new Date(date).getDay();
      return dayOfWeek === 0 && data.status === 'P'; // Sunday = 0
    });

    if (sundayAttendance) {
      return employee.wage_hour;
    }
    return 0;
  };

  const calculateHalfDayRate = (employee) => {
  const halfDayAttendance = Object.values(employee.attendance).find(day => day.status === 'H');
  if (halfDayAttendance) {
    return employee.half_day_rate || (employee.wage_hour / 2);
  }
  return 0;
};

  const calculateTotalAmount = (employee) => {
  const totalDays = calculateTotalDays(employee.attendance);
  const overtimeHours = calculateOvertimeHours(employee.attendance);
  const sundayRate = calculateSundayRate(employee);
  const halfDayRate = calculateHalfDayRate(employee);

  return (totalDays * employee.wage_hour) +
         (overtimeHours * employee.wage_overtime) +
         sundayRate +
         halfDayRate;
};

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');

    // Add title
    doc.setFontSize(16);
    doc.text('Weekly Presenty and Payroll Chart', 14, 20);

    // Add date range
    doc.setFontSize(12);
    doc.text(`Week: ${formatDate(startDate)} to ${formatDate(endDate)}`, 14, 30);

    // Prepare table data
    const tableHeaders = [
        'Employee Name',
        ...weekDates.map(date => new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })),
        'Total Days',
        'Overtime',
        'Sunday Rate',
        'Half-Day Rate',
        'Total Amount'
        ];

        const tableData = employeeData.map(employee => [
            employee.employee_name,
        ...weekDates.map(date => {
              const attendance = employee.attendance[date];
          return attendance ? attendance.status : '-';
        }),
        calculateTotalDays(employee.attendance),
        calculateOvertimeHours(employee.attendance),
        calculateSundayRate(employee),
        calculateHalfDayRate(employee),
        calculateTotalAmount(employee)
        ]);

    doc.autoTable({
      head: [tableHeaders],
      body: tableData,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [71, 85, 105],
        textColor: 255
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });

    doc.save(`weekly-presenty-${startDate}-to-${endDate}.pdf`);
  };

  return (
    <CContainer fluid>
      <CRow className="mb-2">
        <CCol>
          <h4 className="text-center mb-2">Weekly Presenty and Payroll Chart</h4>
        </CCol>
      </CRow>

      <CRow className="mb-4">
        <CCol>
          <CCard>
            <CCardHeader>
              <strong>Select Week Parameters</strong>
            </CCardHeader>
            <CCardBody>
              <CForm>
                <CRow className="mb-3">
                  <CCol md={4}>
                    <CFormLabel htmlFor="weekDay">Select Week Starting Day</CFormLabel>
                    <CFormSelect
                      id="weekDay"
                      value={selectedWeekDay}
                      onChange={handleWeekDayChange}
                    >
                      <option value="">Choose a day...</option>
                      {weekDays.map(day => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>

                  <CCol md={4}>
                  <CFormLabel htmlFor="weekPicker">Select Any Date in Week</CFormLabel>
                  <CFormInput
                    type="date"
                    id="weekPicker"
                    value={selectedWeek}
                    onChange={handleWeekChange}
                    disabled={!selectedWeekDay}
                  />
                </CCol>

                <CCol md={4}>
                  <CFormLabel htmlFor="weekRange">Week Range</CFormLabel>
                  <CFormInput
                    type="text"
                    id="weekRange"
                    value={startDate && endDate ? `${formatDate(startDate)} to ${formatDate(endDate)}` : ''}
                    disabled
                    readOnly
                  />
                </CCol>
                </CRow>

                <CRow>
                  <CCol className="d-flex gap-2">
                    <CButton
                      color="primary"
                      onClick={handleGetEmployeeData}
                      disabled={!startDate || !endDate || loading}
                    >
                      {loading ? <CSpinner size="sm" className="me-2" /> : <CIcon icon={cilCalendar} className="me-2" />}
                      Get Employees Data
                    </CButton>

                    {employeeData.length > 0 && (
                      <CButton
                        color="success"
                        onClick={exportToPDF}
                        disabled={loading}
                      >
                        <CIcon icon={cilCloudDownload} className="me-2" />
                        Export to PDF
                      </CButton>
                    )}
                  </CCol>
                </CRow>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {error && (
        <CRow className="mb-4">
          <CCol>
            <CAlert color="danger">{error}</CAlert>
          </CCol>
        </CRow>
      )}

      {employeeData.length > 0 && (
        <CRow>
          <CCol>
            <CCard>
              <CCardHeader className="d-flex justify-content-between align-items-center">
                <strong>Employee Attendance & Payroll Report</strong>
                <small className="text-muted">
                  Week: {formatDate(startDate)} to {formatDate(endDate)}
                </small>
              </CCardHeader>
              <CCardBody>
                <div className="table-responsive" ref={tableRef}>
                  <CTable striped bordered hover>
                    <CTableHead color="dark">
                      <CTableRow>
                        <CTableHeaderCell rowSpan="2" className="text-center align-middle">
                          S.No.
                        </CTableHeaderCell>
                        <CTableHeaderCell rowSpan="2" className="text-center align-middle">
                          Employee Name
                        </CTableHeaderCell>
                        <CTableHeaderCell colSpan="7" className="text-center">
                          Week Days
                        </CTableHeaderCell>
                        <CTableHeaderCell rowSpan="2" className="text-center align-middle">
                          Total Days
                        </CTableHeaderCell>
                        <CTableHeaderCell rowSpan="2" className="text-center align-middle">
                          Overtime Hours
                        </CTableHeaderCell>
                        <CTableHeaderCell rowSpan="2" className="text-center align-middle">
                          Day Rate
                        </CTableHeaderCell>
                        <CTableHeaderCell rowSpan="2" className="text-center align-middle">
                          Sunday Rate
                        </CTableHeaderCell>
                        <CTableHeaderCell rowSpan="2" className="text-center align-middle">
                        Half-Day Rate
                        </CTableHeaderCell>
                        <CTableHeaderCell rowSpan="2" className="text-center align-middle">
                          Total Amount
                        </CTableHeaderCell>
                        <CTableHeaderCell rowSpan="2" className="text-center align-middle">
                          Paid Amount
                        </CTableHeaderCell>
                      </CTableRow>
                      <CTableRow>
                        {weekDates.map((date, index) => (
                          <CTableHeaderCell key={index} className="text-center">
                            {new Date(date).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit'
                            })}
                          </CTableHeaderCell>
                        ))}
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {employeeData.map((employee, index) => (
                        <React.Fragment key={employee.employee_id}>
                          {/* Main Employee Row */}
                          <CTableRow>
                            <CTableDataCell className="text-center" rowSpan="2">{index + 1}</CTableDataCell>
                            <CTableDataCell>
                              <div>{employee.employee_name}</div>
                            </CTableDataCell>
                            {weekDates.map((date, dateIndex) => {
                              const attendance = employee.attendance[date];
                              return (
                                <CTableDataCell key={dateIndex} className="text-center">
                                  <span className={`badge ${
                                    attendance?.status === 'P' ? 'bg-success' :
                                    attendance?.status === 'A' ? 'bg-danger' :
                                    attendance?.status === 'H' ? 'bg-warning' : 'bg-secondary'
                                  }`}>
                                    {attendance?.status || '-'}
                                  </span>
                                </CTableDataCell>
                              );
                            })}
                            <CTableDataCell className="text-center" rowSpan="2">
                              {calculateTotalDays(employee.attendance)}
                            </CTableDataCell>
                            <CTableDataCell className="text-center" rowSpan="2">
                              {calculateOvertimeHours(employee.attendance)}
                            </CTableDataCell>
                            <CTableDataCell className="text-center" rowSpan="2">
                              ₹{employee.wage_hour}
                            </CTableDataCell>
                            <CTableDataCell className="text-center" rowSpan="2">
                              ₹{calculateSundayRate(employee)}
                            </CTableDataCell>
                            <CTableDataCell className="text-center" rowSpan="2">
                            ₹{calculateHalfDayRate(employee)}
                            </CTableDataCell>
                            <CTableDataCell className="text-center font-weight-bold" rowSpan="2">
                              ₹{calculateTotalAmount(employee)}
                            </CTableDataCell>
                            <CTableDataCell className="text-center" rowSpan="2">
                              ₹{calculateTotalAmount(employee)}
                            </CTableDataCell>
                          </CTableRow>

                          {/* Overtime Row */}
                          <CTableRow className="bg-light">
                            <CTableDataCell className="small text-muted" style={{paddingLeft: '20px'}}>
                              Over Time
                            </CTableDataCell>
                            {weekDates.map((date, dateIndex) => {
                              const attendance = employee.attendance[date];
                              const overtimeHours = attendance?.overtime_hours || 0;
                              return (
                                <CTableDataCell key={dateIndex} className="text-center small text-muted">
                                  {overtimeHours > 0 ? `${overtimeHours}h` : '-'}
                                </CTableDataCell>
                              );
                            })}
                          </CTableRow>
                        </React.Fragment>
                      ))}
                    </CTableBody>
                  </CTable>
                </div>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      )}
    </CContainer>
  );
};

export default WeeklyPresentyPayroll;
