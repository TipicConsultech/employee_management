import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  CContainer,
  CRow,
  CCol,
  CCard,
  CCardHeader,
  CCardBody,
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
import { cilCloudDownload, cilCalendar, cilSpreadsheet } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import { getAPICall, post } from '../../../util/api';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const styles = `
  .serial-no-column {
    width: 50px !important;
    max-width: 50px !important;
    min-width: 50px !important;
  }
`;

const WeeklyMonthlyPresentyPayroll = () => {
  const { t } = useTranslation("global");
  const [reportType, setReportType] = useState('');
  const [selectedWeekDay, setSelectedWeekDay] = useState('monday');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const currentDate = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    return monthNames[currentDate.getMonth()];
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [weekDates, setWeekDates] = useState([]);
  const [monthlyWeeks, setMonthlyWeeks] = useState([]);
  const [hasFetchedData, setHasFetchedData] = useState(false);
  const tableRef = useRef(null);

  const showNotification = useCallback((type, message) => {
    setNotification({ show: true, type, message });
    if (type === 'success') {
      setTimeout(() => {
        setNotification({ show: false, type: '', message: '' });
      }, 3000);
    }
  }, []);

  const reportTypes = [
    { value: 'weekly', label: t('LABELS.weeklyReport') },
    { value: 'monthly', label: t('LABELS.monthlyReport') }
  ];

  const weekDays = [
    { value: 'monday', label: t('LABELS.monday') },
    { value: 'tuesday', label: t('LABELS.tuesday') },
    { value: 'wednesday', label: t('LABELS.wednesday') },
    { value: 'thursday', label: t('LABELS.thursday') },
    { value: 'friday', label: t('LABELS.friday') },
    { value: 'saturday', label: t('LABELS.saturday') },
    { value: 'sunday', label: t('LABELS.sunday') }
  ];

  const months = [
    { value: 'January', label: t('LABELS.january') },
    { value: 'February', label: t('LABELS.february') },
    { value: 'March', label: t('LABELS.march') },
    { value: 'April', label: t('LABELS.april') },
    { value: 'May', label: t('LABELS.may') },
    { value: 'June', label: t('LABELS.june') },
    { value: 'July', label: t('LABELS.july') },
    { value: 'August', label: t('LABELS.august') },
    { value: 'September', label: t('LABELS.september') },
    { value: 'October', label: t('LABELS.october') },
    { value: 'November', label: t('LABELS.november') },
    { value: 'December', label: t('LABELS.december') }
  ];

  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear - 5; year <= currentYear + 1; year++) {
    years.push({ value: year.toString(), label: year.toString() });
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');
  };

  const getWeekDates = (startDate, selectedWeekDay) => {
    if (!startDate) return [];
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
    if (!dateString || !weekStartDay) return { start: '', end: '' };
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
    let daysToSubtract = (dayOfWeek - targetDay + 7) % 7;

    const weekStart = new Date(selectedDate);
    weekStart.setDate(selectedDate.getDate() - daysToSubtract);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return {
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0]
    };
  };

  const getMonthDates = (monthStart, monthEnd) => {
    if (!monthStart || !monthEnd) return [];
    const dates = [];
    const start = new Date(monthStart);
    const end = new Date(monthEnd);

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const getMonthlyWeeks = (monthStart, monthEnd, weekStartDay) => {
    if (!monthStart || !monthEnd || !weekStartDay) return [];
    const weeks = [];
    const startDate = new Date(monthStart);
    const endDate = new Date(monthEnd);

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
    let currentWeekStart = new Date(startDate);
    const dayOfWeek = currentWeekStart.getDay();
    let daysToSubtract = (dayOfWeek - targetDay + 7) % 7;

    currentWeekStart.setDate(currentWeekStart.getDate() - daysToSubtract);

    while (currentWeekStart <= endDate) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(currentWeekStart.getDate() + 6);

      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        if (date >= startDate && date <= endDate) {
          weekDates.push(dateString);
        }
      }

      if (weekDates.length > 0) {
        weeks.push({
          start: weekDates[0],
          end: weekDates[weekDates.length - 1],
          dates: weekDates
        });
      }

      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    return weeks;
  };

  const handleReportTypeChange = (e) => {
    const type = e.target.value;
    setReportType(type);
    setSelectedWeek('');
    setStartDate('');
    setEndDate('');

    if (type !== 'monthly') {
      setSelectedMonth('');
    } else if (!selectedMonth) {
      const currentDate = new Date();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
      setSelectedMonth(monthNames[currentDate.getMonth()]);
    }

    setEmployeeData([]);
    setWeekDates([]);
    setMonthlyWeeks([]);
    setHasFetchedData(false);
    setNotification({ show: false, type: '', message: '' });
  };

  const handleWeekDayChange = (e) => {
    const weekDay = e.target.value;
    setSelectedWeekDay(weekDay);
    setSelectedWeek('');
    setStartDate('');
    setEndDate('');
    setWeekDates([]);
    setNotification({ show: false, type: '', message: '' });
  };

  const handleWeekChange = (e) => {
    const selectedDate = e.target.value;
    if (!selectedWeekDay) {
      showNotification('warning', t('MSG.pleaseSelectWeekdayFirst'));
      return;
    }
    setNotification({ show: false, type: '', message: '' });
    setSelectedWeek(selectedDate);
    const weekRange = getWeekFromDate(selectedDate, selectedWeekDay);
    setStartDate(weekRange.start);
    setEndDate(weekRange.end);
    setWeekDates(getWeekDates(weekRange.start, selectedWeekDay));
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
    setNotification({ show: false, type: '', message: '' });
  };

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
    setNotification({ show: false, type: '', message: '' });
  };

  const handleGetEmployeeData = async () => {
    if (reportType === 'weekly') {
      if (!selectedWeek || !selectedWeekDay) {
        showNotification('warning', t('MSG.pleaseSelectWeekAndDate'));
        return;
      }
    } else if (reportType === 'monthly') {
      if (!selectedMonth || !selectedYear) {
        showNotification('warning', t('MSG.pleaseSelectMonthAndYear'));
        return;
      }
    } else {
      showNotification('warning', t('MSG.pleaseSelectReportType'));
      return;
    }

    setLoading(true);
    setNotification({ show: false, type: '', message: '' });

    try {
      let response;
      let weekStart, weekEnd;

      if (reportType === 'weekly') {
        response = await post('/api/weeklyPresenty', {
          date: selectedWeek,
          week_start_day: selectedWeekDay
        });

        if (response.data && response.data.week_start && response.data.week_end) {
          weekStart = response.data.week_start;
          weekEnd = response.data.week_end;
        } else {
          const weekRange = getWeekFromDate(selectedWeek, selectedWeekDay);
          weekStart = weekRange.start;
          weekEnd = weekRange.end;
        }

        setWeekDates(getWeekDates(weekStart, selectedWeekDay));
        setStartDate(weekStart);
        setEndDate(weekEnd);
      } else {
        response = await post('/api/monthlyPresenty', {
          month: selectedMonth,
          year: selectedYear
        });

        let monthStart, monthEnd;
        if (response.data && response.data.month_start && response.data.month_end) {
          monthStart = response.data.month_start;
          monthEnd = response.data.month_end;
        } else {
          const monthIndex = months.findIndex(m => m.value.toLowerCase() === selectedMonth.toLowerCase()) + 1;
          monthStart = `${selectedYear}-${monthIndex.toString().padStart(2, '0')}-01`;
          const lastDay = new Date(selectedYear, monthIndex, 0);
          monthEnd = lastDay.toISOString().split('T')[0];
        }

        const monthDates = getMonthDates(monthStart, monthEnd);
        setWeekDates(monthDates);
        setStartDate(monthStart);
        setEndDate(monthEnd);
        const weeks = getMonthlyWeeks(monthStart, monthEnd, selectedWeekDay);
        setMonthlyWeeks(weeks);
      }

      const employees = response.data.data || response.data.employees || response.data;
      if (Array.isArray(employees) && employees.length > 0) {
        setEmployeeData(employees);
        setHasFetchedData(true);
        showNotification('success', t('MSG.employeeDataFetchedSuccess'));
      } else {
        setEmployeeData([]);
        showNotification('warning', t('MSG.noEmployeeDataAvailable'));
      }
    } catch (err) {
      console.error('API Error:', err);
      showNotification('warning', `${t('MSG.errorConnectingToServer')}: ${err.message}`);
      setEmployeeData([]);
      setWeekDates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetchedData) {
      if (reportType === 'weekly' && selectedWeek && selectedWeekDay) {
        handleGetEmployeeData();
      } else if (reportType === 'monthly' && selectedMonth && selectedYear) {
        handleGetEmployeeData();
      }
    }
  }, [reportType, selectedWeek, selectedWeekDay, selectedMonth, selectedYear, hasFetchedData]);

  const calculateTotalDays = (attendance) => {
    if (!attendance) return 0;
    return Object.values(attendance).filter(day => day?.status === 'P').length;
  };

  const calculateOvertimeHours = (attendance, overtimeType) => {
    if (!attendance) return 0;
    const type = overtimeType ? String(overtimeType).trim().toLowerCase() : 'not available';
    if (type === 'fixed') {
      return Object.values(attendance).reduce((total, day) => {
        return total + (day?.overtime_hours > 0 ? 1 : 0);
      }, 0);
    } else {
      return Object.values(attendance).reduce((total, day) => {
        return total + (day?.overtime_hours || 0);
      }, 0);
    }
  };

  const calculateTotalAmount = (employee) => {
    if (!employee || !employee.attendance || !employee.payment_details) return 0;

    const { regular_day_payment = 0, half_day_payment = 0, holiday_payment = 0 } = employee.payment_details;
    const overtimeType = employee.overtime_type ? String(employee.overtime_type).trim().toLowerCase() : 'not available';
    const overtimeRate = employee.wage_overtime || 0;

    const totalRegularDays = calculateTotalDays(employee.attendance);
    const regularPayment = totalRegularDays * (employee.wage_hour || 0);

    let overtimePayment = 0;
    if (overtimeType === 'fixed') {
      const overtimeDays = calculateOvertimeHours(employee.attendance, overtimeType);
      overtimePayment = overtimeDays * overtimeRate;
    } else if (overtimeType === 'hourly') {
      const overtimeHours = calculateOvertimeHours(employee.attendance, overtimeType);
      overtimePayment = overtimeHours * overtimeRate;
    }

    return regularPayment + overtimePayment + half_day_payment + holiday_payment;
  };

  const getOvertimeDisplay = (employee, date) => {
    const attendance = employee.attendance && employee.attendance[date];
    const overtimeHours = attendance?.overtime_hours || 0;
    const overtimeType = employee.overtime_type ? String(employee.overtime_type).trim().toLowerCase() : 'not available';

    switch (overtimeType) {
      case 'hourly':
        return overtimeHours > 0 ? `${overtimeHours}h` : '-';
      case 'fixed':
        return overtimeHours > 0 ? '1 D' : '-';
      case 'not available':
        return '-';
      default:
        return '-';
    }
  };

  const getOvertimeTypeLabel = (overtimeType) => {
    const type = overtimeType ? String(overtimeType).trim().toLowerCase() : 'not available';
    switch (type) {
      case 'hourly':
        return <span className="badge bg-primary">{t('LABELS.hourly')}</span>;
      case 'fixed':
        return <span className="badge bg-success">{t('LABELS.fixed')}</span>;
      case 'not available':
        return <span className="badge bg-secondary">{t('LABELS.na')}</span>;
      default:
        return <span className="badge bg-secondary">{t('LABELS.na')}</span>;
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    const title = reportType === 'weekly'
      ? t('LABELS.weeklyPresentyPayrollChart')
      : t('LABELS.monthlyPresentyPayrollChart');
    doc.text(title, 14, 20);

    doc.setFontSize(12);
    const dateRange = reportType === 'weekly'
      ? `${t('LABELS.week')}: ${formatDate(startDate)} ${t('LABELS.to')} ${formatDate(endDate)}`
      : `${t('LABELS.month')}: ${selectedMonth} ${selectedYear}`;
    doc.text(dateRange, 14, 30);

    if (reportType === 'weekly') {
      const tableHeaders = [
        t('LABELS.serialNo'),
        t('LABELS.employeeName'),
        ...weekDates.map(date => new Date(date).toLocaleDateString('en-GB', { day: '2-digit' })),
        t('LABELS.totalDays'),
        t('LABELS.oTRate'),
        t('LABELS.overtimeHours'),
        t('LABELS.dayRate'),
        t('LABELS.holidayRate'),
        t('LABELS.halfDayRate'),
        t('LABELS.totalAmount')
      ];

      const tableData = employeeData.map((employee, index) => [
        index + 1,
        `${employee.employee_name || 'Unknown'} (${employee.overtime_type ? employee.overtime_type : 'N/A'})`,
        ...weekDates.map(date => {
          const attendance = employee.attendance && employee.attendance[date];
          return attendance ? attendance.status : '-';
        }),
        calculateTotalDays(employee.attendance),
        employee.wage_overtime || 0,
        calculateOvertimeHours(employee.attendance, employee.overtime_type),
        employee.wage_hour || 0,
        employee.holiday_day_rate || 0,
        employee.half_day_rate || 0,
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
    } else {
      let currentY = 40;

      monthlyWeeks.forEach((week, weekIndex) => {
        const weekDates = week.dates;
        const weekHeader = `${t('LABELS.week')} ${weekIndex + 1}: ${formatDate(week.start)} ${t('LABELS.to')} ${formatDate(week.end)}`;
        doc.setFontSize(12);
        doc.text(weekHeader, 14, currentY);
        currentY += 10;

        const tableHeaders = [
          t('LABELS.serialNo'),
          t('LABELS.employeeName'),
          ...weekDates.map(date => new Date(date).toLocaleDateString('en-GB', { day: '2-digit' })),
          t('LABELS.totalDays'),
          t('LABELS.oTRate'),
          t('LABELS.overtimeHours'),
          t('LABELS.dayRate'),
          t('LABELS.holidayRate'),
          t('LABELS.halfDayRate'),
          t('LABELS.totalAmount')
        ];

        const tableData = employeeData.map((employee, index) => [
          index + 1,
          `${employee.employee_name || 'Unknown'} (${employee.overtime_type ? employee.overtime_type : 'N/A'})`,
          ...weekDates.map(date => {
            const attendance = employee.attendance && employee.attendance[date];
            return attendance ? attendance.status : '-';
          }),
          calculateTotalDays(employee.attendance),
          employee.wage_overtime || 0,
          calculateOvertimeHours(employee.attendance, employee.overtime_type),
          employee.wage_hour || 0,
          employee.holiday_day_rate || 0,
          employee.half_day_rate || 0,
          calculateTotalAmount(employee)
        ]);

        doc.autoTable({
          head: [tableHeaders],
          body: tableData,
          startY: currentY,
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

        currentY = doc.lastAutoTable.finalY + 10;

        // Add overtime details table
        const overtimeHeaders = [
          '',
          `${t('LABELS.overTime')} (${t('LABELS.type')})`,
          ...weekDates.map(date => new Date(date).toLocaleDateString('en-GB', { day: '2-digit' })),
          '', '', '', '', '', '', ''
        ];

        const overtimeData = employeeData.map(employee => [
          '',
          `${employee.employee_name || 'Unknown'} (${employee.overtime_type ? employee.overtime_type : 'N/A'})`,
          ...weekDates.map(date => getOvertimeDisplay(employee, date)),
          '', '', '', '', '', '', ''
        ]);

        doc.autoTable({
          head: [overtimeHeaders],
          body: overtimeData,
          startY: currentY,
          styles: {
            fontSize: 8,
            cellPadding: 2
          },
          headStyles: {
            fillColor: [200, 200, 200],
            textColor: 0
          },
          alternateRowStyles: {
            fillColor: [245, 245, 245]
          }
        });

        currentY = doc.lastAutoTable.finalY + 15;
      });
    }

    const fileName = reportType === 'weekly'
      ? `weekly-presenty-${startDate}-to-${endDate}.pdf`
      : `monthly-presenty-${selectedMonth}-${selectedYear}.pdf`;

    doc.save(fileName);
    showNotification('success', t('MSG.pdfExportedSuccess'));
  };

  const exportToCSV = () => {
    const headers = [
    t('LABELS.serialNo'),
      t('LABELS.employeeName'),
      ...weekDates.map(date => new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
      })),
      t('LABELS.totalDays'),
      t('LABELS.oTRate'),
      t('LABELS.overtimeHours'),
      t('LABELS.dayRate'),
      t('LABELS.holidayRate'),
      t('LABELS.halfDayRate'),
      t('LABELS.totalAmount')
    ];

    const csvData = [];

    const title = reportType === 'weekly'
      ? t('LABELS.weeklyPresentyPayrollChart')
      : t('LABELS.monthlyPresentyPayrollChart');
    csvData.push([title]);

    const dateRange = reportType === 'weekly'
      ? `${t('LABELS.week')}: ${formatDate(startDate)} ${t('LABELS.to')} ${formatDate(endDate)}`
      : `${t('LABELS.month')}: ${selectedMonth} ${selectedYear}`;
    csvData.push([dateRange]);

    csvData.push([]);

    csvData.push(headers);

    employeeData.forEach((employee, index) => {
      const mainRow = [
        index + 1,
        `${employee.employee_name || 'Unknown'} (${employee.overtime_type ? employee.overtime_type : 'N/A'})`,
        ...weekDates.map(date => {
          const attendance = employee.attendance && employee.attendance[date];
          return attendance?.status || '-';
        }),
        calculateTotalDays(employee.attendance),
        employee.wage_overtime || 0,
        calculateOvertimeHours(employee.attendance, employee.overtime_type),
        employee.wage_hour || 0,
        employee.holiday_day_rate || 0,
        employee.half_day_rate || 0,
        calculateTotalAmount(employee)
      ];
      csvData.push(mainRow);

      const overtimeRow = [
        '',
        `${t('LABELS.overTime')} (${employee.overtime_type ? employee.overtime_type : 'N/A'})`,
        ...weekDates.map(date => getOvertimeDisplay(employee, date)),
        '', '', '', '', '', '', ''
      ];
      csvData.push(overtimeRow);
    });

    const csvString = csvData.map(row =>
      row.map(cell => {
        let cellString = String(cell);
        if (cellString.includes(',') || cellString.includes('\n') || cellString.includes('"')) {
          cellString = `"${cellString.replace(/"/g, '""')}"`;
        }
        return cellString;
      }).join(',')
    ).join('\r\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);

      const fileName = reportType === 'weekly'
        ? `weekly-presenty-${startDate}-to-${endDate}.csv`
        : `monthly-presenty-${selectedMonth}-${selectedYear}.csv`;

      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    showNotification('success', t('MSG.csvExportedSuccess'));
  };

  const getDateRangeDisplay = () => {
    if (reportType === 'weekly' && startDate && endDate) {
      return `${formatDate(startDate)} ${t('LABELS.to')} ${formatDate(endDate)}`;
    } else if (reportType === 'monthly' && selectedMonth && selectedYear) {
      return `${selectedMonth} ${selectedYear}`;
    }
    return '';
  };

  if (loading && employeeData.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <CSpinner color="primary" />
      </div>
    );
  }

  return (
    <CContainer fluid>
      <style>{styles}</style>
      <CRow className="mb-2">
        <CCol>
          <CCard className="mb-2 shadow-sm">
            <CCardHeader style={{ backgroundColor: "#E6E6FA" }}>
              <strong>{t('LABELS.selectReportParameters')}</strong>
            </CCardHeader>

            {notification.show && (
              <CAlert
                color={notification.type}
                dismissible
                onClose={() => setNotification({ show: false, type: '', message: '' })}
              >
                {notification.message}
              </CAlert>
            )}

            <CCardBody>
              <CForm>
                <CRow className="mb-3">
                  <CCol md={4}>
                    <CFormLabel htmlFor="reportType">{t('LABELS.selectReportType')}</CFormLabel>
                    <CFormSelect
                      id="reportType"
                      value={reportType}
                      onChange={handleReportTypeChange}
                    >
                      <option value="">{t('LABELS.chooseReportType')}</option>
                      {reportTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>
                </CRow>

                {reportType === 'weekly' && (
                  <CRow className="mb-3">
                    <CCol md={4}>
                      <CFormLabel htmlFor="weekDay">{t('LABELS.selectWeekStartingDay')}</CFormLabel>
                      <CFormSelect
                        id="weekDay"
                        value={selectedWeekDay}
                        onChange={handleWeekDayChange}
                      >
                        {weekDays.map(day => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </CFormSelect>
                    </CCol>
                    <CCol md={4}>
                        <CFormLabel htmlFor="weekPicker">{t('LABELS.selectAnyDateInWeek')}</CFormLabel>
                        <CFormInput
                          type="date"
                          id="weekPicker"
                          value={selectedWeek}
                          onChange={handleWeekChange}
                        />
                    </CCol>

                      <CCol md={4}>
                        <CFormLabel htmlFor="weekRange">{t('LABELS.weekRange')}</CFormLabel>
                        <CFormInput
                          type="text"
                          id="weekRange"
                          value={startDate && endDate ? `${formatDate(startDate)} ${t('LABELS.to')} ${formatDate(endDate)}` : ''}
                          disabled
                          readOnly
                        />
                      </CCol>
                    </CRow>
                  )}

                  {reportType === 'monthly' && (
                    <CRow className="mb-3">
                      <CCol md={4}>
                        <CFormLabel htmlFor="monthSelect">{t('LABELS.selectMonth')}</CFormLabel>
                        <CFormSelect
                          id="monthSelect"
                          value={selectedMonth}
                          onChange={handleMonthChange}
                        >
                          <option value="">{t('LABELS.chooseMonth')}</option>
                          {months.map(month => (
                            <option key={month.value} value={month.value}>
                              {month.label}
                            </option>
                          ))}
                        </CFormSelect>
                      </CCol>

                      <CCol md={4}>
                        <CFormLabel htmlFor="yearSelect">{t('LABELS.selectYear')}</CFormLabel>
                        <CFormSelect
                          id="yearSelect"
                          value={selectedYear}
                          onChange={handleYearChange}
                        >
                          {years.map(year => (
                            <option key={year.value} value={year.value}>
                              {year.label}
                            </option>
                          ))}
                        </CFormSelect>
                      </CCol>
                    </CRow>
                  )}

                  <CRow>
                    <CCol className="d-flex gap-2">
                      <CButton
                        color="primary"
                        onClick={handleGetEmployeeData}
                        disabled={!reportType || loading}
                      >
                        {loading ? <CSpinner size="sm" className="me-2" /> : <CIcon icon={cilCalendar} className="me-2" />}
                        {t('LABELS.getEmployeesData')}
                      </CButton>

                      {employeeData.length > 0 && (
                        <>
                          <CButton
                            color="success"
                            onClick={exportToPDF}
                            disabled={loading}
                            className="me-2"
                          >
                            <CIcon icon={cilCloudDownload} className="me-2" />
                            {t('LABELS.exportToPDF')}
                          </CButton>

                          <CButton
                            color="info"
                            onClick={exportToCSV}
                            disabled={loading}
                          >
                            <CIcon icon={cilSpreadsheet} className="me-2" />
                            {t('LABELS.exportToCSV')}
                          </CButton>
                        </>
                      )}
                    </CCol>
                  </CRow>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>

        {employeeData.length > 0 && weekDates.length > 0 && (
          <CRow>
            <CCol>
              <CCard className="shadow-sm">
                <CCardHeader style={{ backgroundColor: "#E6E6FA" }} className="d-flex justify-content-between align-items-center flex-wrap">
                  <strong>{t('LABELS.employeeAttendancePayrollReport')}</strong>
                  <small className="text-muted">
                    {reportType === 'weekly' && `${t('LABELS.week')}: `}
                    {reportType === 'monthly' && `${t('LABELS.month')}: `}
                    {getDateRangeDisplay()}
                  </small>
                </CCardHeader>
                <CCardBody>
                  <div className="table-responsive" ref={tableRef}>
                    <CTable striped bordered hover>
                      <CTableHead color="dark">
                        <CTableRow>
                          <CTableHeaderCell rowSpan="2" className="text-center align-middle serial-no-column">
                            {t('LABELS.serialNo')}
                          </CTableHeaderCell>
                          <CTableHeaderCell rowSpan="2" className="text-center align-middle">
                            {t('LABELS.employeeName')}
                          </CTableHeaderCell>
                          <CTableHeaderCell colSpan={weekDates.length} className="text-center">
                            {(reportType === 'weekly' ? t('LABELS.weekDays') : t('LABELS.monthDays'))}
                          </CTableHeaderCell>
                          <CTableHeaderCell rowSpan="2" className="text-center align-middle">
                            {t('LABELS.totalDays')}
                          </CTableHeaderCell>
                          <CTableHeaderCell rowSpan="2" className="text-center align-middle">
                            {t('LABELS.oTRate')}
                          </CTableHeaderCell>
                          <CTableHeaderCell rowSpan="2" className="text-center align-middle">
                            {t('LABELS.overtimeHours')}
                          </CTableHeaderCell>
                          <CTableHeaderCell rowSpan="2" className="text-center align-middle">
                            {t('LABELS.dayRate')}
                          </CTableHeaderCell>
                          <CTableHeaderCell rowSpan="2" className="text-center align-middle">
                            {t('LABELS.holidayRate')}
                          </CTableHeaderCell>
                          <CTableHeaderCell rowSpan="2" className="text-center align-middle">
                            {t('LABELS.halfDayRate')}
                          </CTableHeaderCell>
                          <CTableHeaderCell rowSpan="2" className="text-center align-middle">
                            {t('LABELS.totalAmount')}
                          </CTableHeaderCell>
                        </CTableRow>
                        <CTableRow>
                          {weekDates.map((date, index) => (
                            <CTableHeaderCell key={index} className="text-center">
                              {new Date(date).toLocaleDateString('en-GB', {
                                day: '2-digit',
                              })}
                            </CTableHeaderCell>
                          ))}
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {employeeData.map((employee, index) => (
                          <React.Fragment key={employee.employee_id || index}>
                            <CTableRow>
                              <CTableDataCell className="text-center" rowSpan="2" style={{width: '50px', maxWidth: '50px', minWidth: '50px'}}>{index + 1}</CTableDataCell>
                              <CTableDataCell>
                                <div>{employee.employee_name || 'Unknown'}</div>
                              </CTableDataCell>
                              {weekDates.map((date, dateIndex) => {
                                const attendance = employee.attendance && employee.attendance[date];
                                return (
                                  <CTableDataCell key={dateIndex} className="text-center">
                                    <span className={`badge ${
                                      attendance?.status === 'P' ? 'bg-success' :
                                      attendance?.status === 'A' ? 'bg-danger' :
                                      attendance?.status === 'HF' ? 'bg-warning' : 'bg-secondary'
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
                                ₹{employee.wage_overtime || 0}
                              </CTableDataCell>
                              <CTableDataCell className="text-center" rowSpan="2">
                                {calculateOvertimeHours(employee.attendance, employee.overtime_type)}
                              </CTableDataCell>
                              <CTableDataCell className="text-center" rowSpan="2">
                                ₹{employee.wage_hour || 0}
                              </CTableDataCell>
                              <CTableDataCell className="text-center" rowSpan="2">
                                ₹{employee.holiday_day_rate || 0}
                              </CTableDataCell>
                              <CTableDataCell className="text-center" rowSpan="2">
                                ₹{employee.half_day_rate || 0}
                              </CTableDataCell>
                              <CTableDataCell className="text-center font-weight-bold" rowSpan="2">
                                ₹{calculateTotalAmount(employee)}
                              </CTableDataCell>
                            </CTableRow>
                            <CTableRow className="bg-light">
                              <CTableDataCell className="small text-muted">
                                <span className="d-inline">
                                  {t('LABELS.overTime')}
                                </span>
                                <span className="ms-1 d-inline">
                                  {getOvertimeTypeLabel(employee.overtime_type)}
                                </span>
                              </CTableDataCell>
                              {weekDates.map((date, dateIndex) => (
                                <CTableDataCell key={dateIndex} className="text-center small text-muted">
                                  {getOvertimeDisplay(employee, date)}
                                </CTableDataCell>
                              ))}
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

  export default WeeklyMonthlyPresentyPayroll;
