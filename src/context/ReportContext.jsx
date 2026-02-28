import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

const ReportContext = createContext();

export const useReportContext = () => useContext(ReportContext);

const SESSION_KEY = 'eaiser_pending_report';

export const ReportProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [reportResult, setReportResult] = useState(() => {
        // Restore report from sessionStorage on mount (survives login redirect)
        try {
            const saved = sessionStorage.getItem(SESSION_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });
    const [error, setError] = useState(null);
    const [inProgress, setInProgress] = useState(false);

    // Persist reportResult to sessionStorage whenever it changes
    useEffect(() => {
        if (reportResult) {
            try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(reportResult)); } catch { }
        } else {
            sessionStorage.removeItem(SESSION_KEY);
        }
    }, [reportResult]);

    const generateReport = async ({ imageFile, description, address, zip_code, latitude, longitude, user_email, issue_type }) => {
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
                user_email,
                issue_type
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
