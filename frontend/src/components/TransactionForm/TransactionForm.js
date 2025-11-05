import React, { useRef, useState } from "react";
import { Table, Button, Input, FormFeedback } from "reactstrap";
import * as XLSX from "xlsx-js-style";
import NotificationAlert from "react-notification-alert";



const defaultRow = {
    date: "",
    description: "",
    amount: "",
    category: "",
    errors: {
        date: "",
        description: "",
        amount: "",
    },
};


const categoryOptions = ["Food", "Transport", "Utilities", "Entertainment", "Other"];



function TransactionTable() {
    const [rows, setRows] = useState([defaultRow]);
    const notificationAlertRef = useRef(null);


    const validateField = (field, value) => {
        switch (field) {
            case "date":
                if (!value) return "Date is required.";
                if (minDate && value < minDate) return `Date must be after ${minDate}`;
                if (maxDate && value > maxDate) return `Date must be before ${maxDate}`;
                return "";
            case "description":
                if (!value) return "Description is required.";
                if (value.length > 100) return "Must be under 100 characters.";
                return "";
            case "amount":
                if (value === "") return "Amount is required.";
                if (parseFloat(value) < 0) return "Amount cannot be negative.";
                return "";
            default:
                return "";
        }
    };
    const handleInputChange = (index, field, value) => {
        const updated = [...rows];
        const row = updated[index];
        row[field] = value;
        if (!row.errors) row.errors = {};
        row.errors[field] = validateField(field, value);
        setRows(updated);
    };


 const addRow = async () => {
    const updated = rows.map((row) => {
        const newErrors = {
            date: validateField("date", row.date),
            description: validateField("description", row.description),
            amount: validateField("amount", row.amount),
        };
        return { ...row, errors: newErrors };
    });

    const hasErrors = updated.some((row) =>
        Object.values(row.errors).some((err) => err)
    );

    if (hasErrors) {
        setRows(updated);
        return;
    }

    // 🔍 Identify rows missing category
    const toClassify = updated.filter(row => !row.category && row.description);

    if (toClassify.length > 0) {
        try {
            const response = await fetch("http://localhost:8000/api/classify/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ transactions: toClassify }),
            });

            const data = await response.json();

            if (response.ok) {
                // 🧠 Update rows with predicted categories
                const newRows = updated.map((row) => {
                    const classified = data.classified.find(
                        (c) => c.description === row.description &&
                               c.amount === row.amount &&
                               c.date === row.date
                    );
                    return classified
                        ? { ...row, category: classified.predicted_category }
                        : row;
                });

                setRows([
                    ...newRows,
                    { ...defaultRow, errors: { ...defaultRow.errors } },
                ]);
                notify("Category auto-filled for empty rows!", "info");
            } else {
                notify(data.error || "Category classification failed.");
                return;
            }
        } catch (error) {
            console.error(error);
            notify("Failed to connect to backend.");
            return;
        }
    } else {
        setRows([
            ...updated,
            { ...defaultRow, errors: { ...defaultRow.errors } },
        ]);
    }
};
    const notify = (message, type = "danger") => {
        notificationAlertRef.current.notificationAlert({
            place: "tr",
            message: <div><b>{type === "danger" ? "Error:" : "Info:"}</b> {message}</div>,
            type: type,
            icon: "nc-icon nc-bell-55 white-icon",
            autoDismiss: 5,
        });
    };



    const deleteRow = (index) => {
        const updated = [...rows];
        updated.splice(index, 1);
        setRows(updated.length ? updated : [{ ...defaultRow, errors: { ...defaultRow.errors } }]);
    };
    const [minDate, setMinDate] = useState("");
    const [maxDate, setMaxDate] = useState("");


    const exportToExcel = () => {
        const headers = ["Date", "Description", "Amount", "Category"];
        const cleanedRows = rows.slice(0, -1);

        if (cleanedRows.length < 5) {
            notify("Please add at least 5 valid transactions before exporting.");
            return;
        }

        const hasErrors = cleanedRows.some((row) =>
            Object.values(row.errors || {}).some((err) => err)
        );
        if (hasErrors) {
            notify("Please correct all validation errors before exporting.");
            return;
        }

        if (!minDate || !maxDate) {
            notify("Please set both Min Date and Max Date before exporting.");
            return;
        }

        const dataRows = cleanedRows.map(({ date, description, amount, category }) => ([
            date, description, amount, category || ""
        ]));

        const worksheetData = [headers, ...dataRows];
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        headers.forEach((_, colIdx) => {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIdx });
            worksheet[cellAddress].s = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "4472C4" } },
                alignment: { horizontal: "center" },
            };
        });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

        XLSX.writeFile(workbook, "transactions.xlsx");

        notify("Exported successfully!", "success");
    };






    return (
        <div>
            <NotificationAlert ref={notificationAlertRef} />
            <div className="mb-3 d-flex gap-3 align-items-center">
                <div>
                    <label className="form-label">Min Date</label>
                    <Input
                        type="date"
                        value={minDate}
                        onChange={(e) => setMinDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="form-label">Max Date</label>
                    <Input
                        type="date"
                        value={maxDate}
                        onChange={(e) => setMaxDate(e.target.value)}
                    />
                </div>
            </div>
            <div className="mb-3">
                <Button color="success" className="mb-3" onClick={exportToExcel}>
                    Export to Excel
                </Button>
            </div>

            <Table bordered responsive>
                <thead className="text-primary">
                    <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Category (Optional)</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, idx) => (
                        <tr key={idx}>
                            <td>
                                <Input
                                    type="date"
                                    value={row.date}
                                    onChange={(e) => handleInputChange(idx, "date", e.target.value)}
                                    invalid={!!row.errors.date}
                                    disabled={!minDate || !maxDate}
                                />
                                <FormFeedback>{row.errors?.date}</FormFeedback>
                            </td>
                            <td>
                                <Input
                                    type="text"
                                    value={row.description}
                                    onChange={(e) => handleInputChange(idx, "description", e.target.value)}
                                    invalid={!!row.errors.description}
                                    disabled={!minDate || !maxDate}
                                />
                                <FormFeedback>{row.errors.description}</FormFeedback>
                            </td>
                            <td>
                                <Input
                                    type="number"
                                    value={row.amount}
                                    onChange={(e) => handleInputChange(idx, "amount", e.target.value)}
                                    invalid={!!row.errors.amount}
                                    disabled={!minDate || !maxDate}
                                />
                                <FormFeedback>{row.errors.amount}</FormFeedback>
                            </td>
                            <td>
                                <Input
                                    type="select"
                                    value={row.category}
                                    onChange={(e) => handleInputChange(idx, "category", e.target.value)}
                                     disabled={!minDate || !maxDate}
                                >
                                    <option value="">-- Select Category --</option>
                                    {categoryOptions.map((opt, i) => (
                                        <option key={i} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                    
                                </Input>
                            </td>
                            <td>
                                <Button color="danger" size="sm"  disabled={!minDate || !maxDate} onClick={() => deleteRow(idx)}>
                                    Delete
                                    
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            <Button color="primary" onClick={addRow}>
                + Add Transaction
            </Button>
        </div>
    );
}

export default TransactionTable;
