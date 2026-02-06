import React, { createContext, useContext, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, AlertTriangle, CheckCircle2, HelpCircle, Info } from 'lucide-react';

const DialogContext = createContext();

export const useDialog = () => {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('useDialog must be used within a DialogProvider');
    }
    return context;
};

export const DialogProvider = ({ children }) => {
    const [dialogs, setDialogs] = useState([]);

    const addDialog = (dialog) => {
        const id = Math.random().toString(36).substr(2, 9);
        setDialogs((prev) => [...prev, { ...dialog, id }]);
        return id;
    };

    const removeDialog = (id) => {
        setDialogs((prev) => prev.filter((d) => d.id !== id));
    };

    const showAlert = (message, options = {}) => {
        return new Promise((resolve) => {
            addDialog({
                type: 'alert',
                message,
                title: options.title || 'Notification',
                variant: options.variant || 'info', // info, success, error, warning
                onClose: () => {
                    resolve(true);
                },
                ...options
            });
        });
    };

    const showConfirm = (message, options = {}) => {
        return new Promise((resolve) => {
            addDialog({
                type: 'confirm',
                message,
                title: options.title || 'Confirm',
                variant: options.variant || 'warning',
                confirmText: options.confirmText || 'Yes',
                cancelText: options.cancelText || 'No',
                onConfirm: () => resolve(true),
                onCancel: () => resolve(false),
                onClose: () => resolve(false), // Clicking outside or X assumes cancel
                ...options
            });
        });
    };

    const showPrompt = (message, options = {}) => {
        return new Promise((resolve) => {
            addDialog({
                type: 'prompt',
                message,
                title: options.title || 'Input Required',
                defaultValue: options.defaultValue || '',
                placeholder: options.placeholder || '',
                confirmText: options.confirmText || 'Submit',
                cancelText: options.cancelText || 'Cancel',
                onConfirm: (value) => resolve(value),
                onCancel: () => resolve(null),
                onClose: () => resolve(null),
                ...options
            });
        });
    };

    return (
        <DialogContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
            {children}
            <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center">
                <AnimatePresence>
                    {dialogs.map((dialog) => (
                        <DialogContainer key={dialog.id} dialog={dialog} onRemove={() => removeDialog(dialog.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </DialogContext.Provider>
    );
};

const DialogContainer = ({ dialog, onRemove }) => {
    const [inputValue, setInputValue] = useState(dialog.defaultValue || '');
    const inputRef = useRef(null);

    React.useEffect(() => {
        if (dialog.type === 'prompt' && inputRef.current) {
            inputRef.current.focus();
        }
    }, [dialog.type]);

    const handleConfirm = () => {
        if (dialog.type === 'prompt') {
            dialog.onConfirm(inputValue);
        } else {
            dialog.onConfirm && dialog.onConfirm();
        }
        onRemove();
    };

    const handleCancel = () => {
        dialog.onCancel && dialog.onCancel();
        onRemove();
    };

    const getIcon = () => {
        switch (dialog.variant) {
            case 'error': return <AlertTriangle className="w-6 h-6 text-red-500" />;
            case 'success': return <CheckCircle2 className="w-6 h-6 text-green-500" />;
            case 'warning': return <AlertTriangle className="w-6 h-6 text-yellow-500" />;
            default: return <Info className="w-6 h-6 text-blue-500" />;
        }
    };

    const getBorderColor = () => {
        switch (dialog.variant) {
            case 'error': return 'border-red-500/50';
            case 'success': return 'border-green-500/50';
            case 'warning': return 'border-yellow-500/50';
            default: return 'border-blue-500/50';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto flex items-center justify-center p-4"
            onClick={handleCancel}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={`bg-gray-900 border ${getBorderColor()} text-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-800 bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full bg-gray-800 border border-gray-700`}>
                            {getIcon()}
                        </div>
                        <h3 className="text-lg font-bold">{dialog.title}</h3>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{dialog.message}</p>

                    {dialog.type === 'prompt' && (
                        <div className="mt-4">
                            <input
                                ref={inputRef}
                                type="text"
                                className="w-full bg-black/30 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-gray-600"
                                placeholder={dialog.placeholder}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleConfirm();
                                    if (e.key === 'Escape') handleCancel();
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-5 bg-gray-900/50 border-t border-gray-800">
                    {dialog.type !== 'alert' && (
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all text-sm font-medium"
                        >
                            {dialog.cancelText || 'Cancel'}
                        </button>
                    )}
                    <button
                        onClick={handleConfirm}
                        className={`px-6 py-2 rounded-lg text-sm font-bold shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2
                            ${dialog.variant === 'error' ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20' :
                                dialog.variant === 'warning' ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-yellow-900/20' :
                                    dialog.variant === 'success' ? 'bg-green-500 hover:bg-green-400 text-white shadow-green-900/20' :
                                        'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'}
                        `}
                    >
                        {dialog.confirmText || 'OK'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
