"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type FeedbackType = "bug" | "feature" | "general" | "positive" | "negative";

interface FeedbackData {
    type?: FeedbackType;
    subject?: string;
    description?: string;
    screenshot?: string | null;
    metadata?: Record<string, any>; // Extra context like error details
}

interface FeedbackContextType {
    isOpen: boolean;
    openFeedback: (data?: FeedbackData) => void;
    closeFeedback: () => void;
    // State necessary for the widget to render
    data: FeedbackData;
    reset: () => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState<FeedbackData>({});

    const openFeedback = (initialData?: FeedbackData) => {
        if (initialData) {
            setData(initialData);
        }
        setIsOpen(true);
    };

    const closeFeedback = () => {
        setIsOpen(false);
    };

    const reset = () => {
        setData({});
    };

    return (
        <FeedbackContext.Provider value={{ isOpen, openFeedback, closeFeedback, data, reset }}>
            {children}
        </FeedbackContext.Provider>
    );
}

export function useFeedback() {
    const context = useContext(FeedbackContext);
    if (context === undefined) {
        throw new Error("useFeedback must be used within a FeedbackProvider");
    }
    return context;
}
