"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void | Promise<void>;
    isLoading?: boolean;
}

/**
 * ConfirmDialog - A reusable confirmation dialog component
 * 
 * Replaces browser's native confirm() with an accessible shadcn Dialog.
 * 
 * @example
 * const [open, setOpen] = useState(false);
 * const [deleting, setDeleting] = useState(false);
 * 
 * const handleDelete = async () => {
 *   setDeleting(true);
 *   await deleteItem();
 *   setDeleting(false);
 *   setOpen(false);
 * };
 * 
 * <ConfirmDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Delete Item?"
 *   description="This action cannot be undone."
 *   variant="destructive"
 *   onConfirm={handleDelete}
 *   isLoading={deleting}
 * />
 */
export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default",
    onConfirm,
    isLoading = false,
}: ConfirmDialogProps) {
    const handleConfirm = async () => {
        await onConfirm();
    };

    const confirmButtonClasses =
        variant === "destructive"
            ? "bg-rose-600 text-white hover:bg-rose-500 focus:ring-rose-500"
            : "bg-sky-600 text-white hover:bg-sky-500 focus:ring-sky-500";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <DialogDescription>{description}</DialogDescription>
                    )}
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                        className="rounded-lg border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50 transition"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background ${confirmButtonClasses}`}
                    >
                        {isLoading ? "Loading..." : confirmText}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

