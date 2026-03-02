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
        const iconClass = "w-10 h-10";
        switch (dialog.variant) {
            case 'error': return <AlertTriangle className={`${iconClass} text-red-500`} />;
            case 'success': return <CheckCircle2 className={`${iconClass} text-emerald-500`} />;
            case 'warning': return <AlertTriangle className={`${iconClass} text-amber-500`} />;
            default: return <Info className={`${iconClass} text-blue-500`} />;
        }
    };

    const getGradients = () => {
        switch (dialog.variant) {
            case 'error': return "from-red-600/30 via-red-600/5 to-transparent";
            case 'success': return "from-emerald-600/30 via-emerald-600/5 to-transparent";
            case 'warning': return "from-amber-600/30 via-amber-600/5 to-transparent";
            default: return "from-blue-600/30 via-blue-600/5 to-transparent";
        }
    };

    const getButtonStyles = () => {
        switch (dialog.variant) {
            case 'error': return "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]";
            case 'success': return "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]";
            case 'warning': return "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-gray-950 shadow-[0_0_20px_rgba(245,158,11,0.4)]";
            default: return "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]";
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-md pointer-events-auto flex items-center justify-center p-4"
            onClick={handleCancel}
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 100, rotateX: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 100 }}
                transition={{ type: "spring", damping: 18, stiffness: 200 }}
                className="relative bg-gray-950/80 border border-white/10 text-white rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] w-full max-w-lg overflow-hidden flex flex-col items-center text-center p-10 md:p-14"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Glass Glow Background */}
                <div className={`absolute top-0 left-0 w-full h-40 bg-gradient-to-b ${getGradients()} opacity-40`} />
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-[100px]" />
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-[100px]" />

                {/* Advanced Icon Box */}
                <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="relative mb-8 group"
                >
                    <div className="absolute inset-[-10px] bg-white/5 rounded-[2.5rem] blur-xl" />
                    <div className="relative w-28 h-28 rounded-[2.5rem] bg-gray-900/50 border border-white/20 flex items-center justify-center shadow-2xl backdrop-blur-3xl overflow-hidden">
                        <div className={`absolute inset-0 bg-gradient-to-br ${getGradients()} opacity-25`} />
                        <div className="relative transform group-hover:scale-110 transition-transform duration-500">
                            {getIcon()}
                        </div>
                    </div>
                </motion.div>

                {/* Text Content */}
                <div className="relative z-10 w-full space-y-4">
                    <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl font-black text-white tracking-tight leading-none"
                    >
                        {dialog.title}
                    </motion.h3>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-400 text-lg md:text-xl font-medium leading-relaxed max-w-sm mx-auto"
                    >
                        {dialog.message}
                    </motion.p>

                    {dialog.type === 'prompt' && (
                        <div className="mt-8">
                            <input
                                ref={inputRef}
                                type="text"
                                className="w-full bg-white/5 border border-white/20 rounded-2xl px-6 py-5 text-white text-center text-xl focus:border-white/40 focus:bg-white/10 outline-none transition-all placeholder-gray-600 shadow-inner"
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

                {/* Premium Buttons */}
                <div className="relative z-10 mt-12 flex flex-col w-full gap-4">
                    <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleConfirm}
                        className={`w-full py-6 rounded-2xl text-xl font-black tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-3 group relative overflow-hidden ${getButtonStyles()}`}
                    >
                        <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                        <span className="relative">{dialog.confirmText || 'Understand'}</span>
                    </motion.button>

                    {dialog.type !== 'alert' && (
                        <button
                            onClick={handleCancel}
                            className="w-full py-5 text-gray-500 hover:text-white transition-all text-sm font-black uppercase tracking-[0.2em] hover:bg-white/5 rounded-2xl"
                        >
                            {dialog.cancelText || 'Go Back'}
                        </button>
                    )}
                </div>

                {/* Luxury Close Button */}
                <button
                    onClick={handleCancel}
                    className="absolute top-8 right-8 p-3 rounded-full bg-white/5 border border-white/0 hover:border-white/10 hover:bg-white/10 text-gray-500 hover:text-white transition-all duration-300"
                >
                    <X className="w-6 h-6" />
                </button>
            </motion.div>
        </motion.div>
    );
};
