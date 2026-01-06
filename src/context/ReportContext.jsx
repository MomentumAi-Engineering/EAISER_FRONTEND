import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

const ReportContext = createContext();

export const useReportContext = () => useContext(ReportContext);

export const ReportProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [reportResult, setReportResult] = useState(null);
    const [error, setError] = useState(null);
    const [inProgress, setInProgress] = useState(false);

    // You can extend this to store form data if needed to restore the form state
    // const [formData, setFormData] = useState({});

    const generateReport = async ({ imageFile, description, address, zip_code, latitude, longitude, user_email }) => {
        setLoading(true);
        setInProgress(true);
        setError(null);
        setReportResult(null);

        try {
            const response = await apiClient.createIssue({
                imageFile,
                description,
                address,
                zip_code,
                latitude,
                longitude,
                user_email
            });
            setReportResult(response);
        } catch (err) {
            console.error("Error generating report:", err);
            setError(err.message || "Failed to generate report.");
        } finally {
            setLoading(false);
            setInProgress(false);
        }
    };

    const clearReport = () => {
        setReportResult(null);
        setError(null);
        setLoading(false);
        setInProgress(false);
    };

    const value = {
        loading,
        reportResult,
        error,
        inProgress,
        generateReport,
        clearReport
    };

    return (
        <ReportContext.Provider value={value}>
            {children}
        </ReportContext.Provider>
    );
};
