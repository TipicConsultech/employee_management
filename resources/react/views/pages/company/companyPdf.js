import jsPDF from "jspdf";
import "jspdf-autotable";
import { getUserData } from "../../../util/session";
import logo from "../../../assets/brand/TipicConsultech.png";

/**
 * Generates a professional-looking PDF receipt for company subscriptions
 * matching the Milk Factory 10 style
 * @param {Object} receiptData - The data for generating the receipt
 * @returns {String} - Returns the filename of the generated PDF
 */
export function generateCompanyReceiptPDF(receiptData) {
    // Initialize PDF document
    const pdf = new jsPDF({ 
        orientation: "portrait", 
        unit: "mm", 
        format: "a4" 
    });
    
    // Theme configuration matching the Milk Factory 10 receipt
    const theme = {
        primary: "#00bcd4",       // Original teal blue from previous version
        secondary: "#607d8b",     // Blue grey for accent
        textDark: "#333333",      // Dark text
        textLight: "#666666",     // Light text
        border: "#cccccc"         // Border color
    };
    
    // Helper functions
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Invalid Date";
        return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
    };
    
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return "N/A";
        return `${parseFloat(amount).toLocaleString('en-IN', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} /-`;
    };
    
    // Get company information
    const ci = getUserData()?.company_info || {};
    const today = new Date().toISOString().split("T")[0];
    const formattedDate = formatDate(today);
    
    // Document setup
    pdf.setFont("helvetica", "normal");
    
    // Add professional border
    pdf.setDrawColor(theme.border);
    pdf.setLineWidth(0.5);
    pdf.rect(5, 5, pdf.internal.pageSize.getWidth() - 10, pdf.internal.pageSize.getHeight() - 10, "S");
    
    // Header - Title
    pdf.setFontSize(18);
    pdf.setTextColor(theme.textDark);
    pdf.setFont("helvetica", "bold");
    pdf.text("Subscription Receipt", pdf.internal.pageSize.getWidth() / 2, 15, { align: "center" });
    
    // Logo
    if (logo) {
        pdf.addImage(logo, "PNG", 15, 25, 35, 35);
    }
    
    // Company information - Right aligned
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text(ci.company_name || "Tipic ConsulTech", 190, 30, { align: "right" });
    pdf.text(ci.land_mark || "Konark Karya", 190, 35, { align: "right" });
    
    // Format address line
    let addressLine = "";
    if (ci.Tal) addressLine += ci.Tal;
    if (ci.Dist) {
        if (addressLine) addressLine += ", ";
        addressLine += ci.Dist;
    }
    if (ci.pincode) {
        if (addressLine) addressLine += ", ";
        addressLine += ci.pincode;
    }
    
    pdf.text(addressLine || "Keshav Nagar, Pune, 411000", 190, 40, { align: "right" });
    pdf.text(`Phone: ${ci.phone_no || "9900000000"}`, 190, 45, { align: "right" });
    
    // Horizontal line separator
    pdf.setDrawColor(theme.primary);
    pdf.setLineWidth(0.7);
    pdf.line(15, 65, pdf.internal.pageSize.getWidth() - 15, 65);
    
    // Customer section
    pdf.setFontSize(13);
    pdf.setTextColor(theme.primary);
    pdf.setFont("helvetica", "bold");
    pdf.text("Receipt to:", 15, 75);
    
    // Customer details with right-aligned values
    pdf.setFontSize(11);
    pdf.setTextColor(theme.textDark);
    pdf.setFont("helvetica", "normal");
    
    // Left-aligned labels
    pdf.text("Company Name", 15, 83);
    pdf.text("Mobile Number", 15, 89);
    pdf.text("Email", 15, 95);
    pdf.text("Transaction ID", 15, 101);
    
    // Right-aligned values (aligned at 70mm from left)
    pdf.text(": ", 45, 83);
    pdf.text(": ", 45, 89);
    pdf.text(": ", 45, 95);
    pdf.text(": ", 45, 101);
    
    // Values
    pdf.text(`${receiptData?.company?.company_name || "N/A"}`, 48, 83);
    pdf.text(`${receiptData?.company?.phone_no || "N/A"}`, 48, 89);
    pdf.text(`${receiptData?.company?.email_id || "N/A"}`, 48, 95);
    pdf.text(`${receiptData?.transaction_id || "N/A"}`, 48, 101);
    
    // Receipt details - Right side
    // Labels
    pdf.text("Receipt Date", 130, 83);
    pdf.text("Valid Till", 130, 89);
    
    // Colons
    pdf.text(": ", 165, 83);
    pdf.text(": ", 165, 89);
    
    // Values
    pdf.text(`${formattedDate}`, 168, 83);
    pdf.text(`${formatDate(receiptData?.valid_till) || "N/A"}`, 168, 89);
    
    // Plan details section
    pdf.setFontSize(13);
    pdf.setTextColor(theme.primary);
    pdf.setFont("helvetica", "bold");
    pdf.text("Plan Details", 15, 115);
    
    // Plan details table
    const planTable = [
        [
            receiptData?.plan?.name || "Basic Plan",
            formatDate(receiptData?.created_at) || formattedDate,
            formatDate(receiptData?.valid_till) || "N/A",
            `${receiptData?.plan?.price || "0"} /-`
        ]
    ];
    
    pdf.autoTable({
        startY: 120,
        headStyles: { 
            fillColor: theme.primary, 
            textColor: "#FFFFFF", 
            fontStyle: "bold"
        },
        bodyStyles: { 
            textColor: theme.textDark
        },
        theme: "grid",
        head: [["Plan Name", "Start Date", "End Date", "Amount(Per Month)"]],
        body: planTable,
        margin: { left: 15, right: 15 },
        columnStyles: { 
            3: { halign: "right" } 
        },
    });
    
    // Payment details section
    pdf.setFontSize(13);
    pdf.setTextColor(theme.primary);
    pdf.setFont("helvetica", "bold");
    pdf.text("Payment Details", 15, pdf.autoTable.previous.finalY + 15);
    
    // Calculate values for payment details
    const subtotal = parseFloat(receiptData?.total_amount || 0);
    const gst = parseFloat(receiptData?.gst || 0);
    const total = parseFloat(receiptData?.payable_amount || 0);
    
    const paymentTable = [
        ["Amount", `${subtotal} /-`],
        ["GST", `${gst} /-`],
        ["Amount Paid", `${total} /-`]
    ];
    
    // Payment details table
    pdf.autoTable({
        startY: pdf.autoTable.previous.finalY + 20,
        headStyles: { 
            fillColor: theme.primary, 
            textColor: "#FFFFFF", 
            fontStyle: "bold"
        },
        bodyStyles: { 
            textColor: theme.textDark
        },
        theme: "grid",
        head: [["Description", "Amount"]],
        body: paymentTable,
        margin: { left: 15, right: 15 },
        columnStyles: { 
            1: { halign: "right" } 
        },
    });
    
    // Footer
    pdf.setFontSize(10);
    pdf.setTextColor(theme.textDark);
    pdf.setFont("helvetica", "normal");
    pdf.text("This receipt has been generated by computer and is authorized.", 15, pdf.internal.pageSize.getHeight() - 15);
    
    // Save with meaningful filename
    const filename = `${receiptData?.company?.company_name || "Company"}.pdf`;
    pdf.save(filename);
    
    // Return the filename for reference
    return filename;
}