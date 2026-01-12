"use client";

import { useState } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface ProofThumbnailProps {
    /** Storage path to the proof image */
    proofPath: string;
    /** Alt text for accessibility */
    alt?: string;
    /** Size of the thumbnail in pixels */
    size?: number;
    /** Whether clicking opens full image */
    expandable?: boolean;
    /** Supabase storage bucket name */
    bucket?: string;
}

/**
 * ProofThumbnail - Displays proof images with top-aligned cropping
 * 
 * Uses object-position: top to show the top of the image where step counts
 * typically appear in fitness app screenshots.
 */
export function ProofThumbnail({
    proofPath,
    alt = "Proof image",
    size = 48,
    expandable = true,
    bucket = "proofs",
}: ProofThumbnailProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Construct Supabase storage URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const imageUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${proofPath}`;

    if (imageError) {
        return (
            <div
                className="flex items-center justify-center bg-muted text-muted-foreground text-xs rounded"
                style={{ width: size, height: size }}
            >
                —
            </div>
        );
    }

    return (
        <>
            <button
                onClick={() => expandable && setIsOpen(true)}
                className={`relative overflow-hidden rounded border border-border bg-muted ${expandable ? "cursor-pointer hover:border-primary transition-colors" : ""
                    }`}
                style={{ width: size, height: size }}
                title={expandable ? "Click to view full image" : alt}
            >
                <Image
                    src={imageUrl}
                    alt={alt}
                    fill
                    className="object-cover object-top"
                    sizes={`${size}px`}
                    onError={() => setImageError(true)}
                />
            </button>

            {expandable && (
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto p-2">
                        <DialogTitle className="sr-only">Proof Image</DialogTitle>
                        <div className="relative w-full">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={imageUrl}
                                alt={alt}
                                className="w-full h-auto rounded"
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
