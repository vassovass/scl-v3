/**
 * Tour Feedback Dialog
 * 
 * Dialog shown after tour completion to collect user feedback.
 * Uses shadcn/ui Dialog component for consistency.
 * 
 * @see PRD 50: Modular Tour System v2.0
 */

'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { tourAnalytics } from '@/lib/tours/unified-analytics';
import { t } from '@/lib/tours/i18n';

interface TourFeedbackDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tourId: string;
}

export function TourFeedbackDialog({
    open,
    onOpenChange,
    tourId,
}: TourFeedbackDialogProps) {
    const [rating, setRating] = useState<number>(0);
    const [hoveredRating, setHoveredRating] = useState<number>(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            // Track feedback
            tourAnalytics.trackFeedbackSubmitted({
                tourId,
                rating: rating > 0 ? rating : undefined,
                comment: comment.trim() || undefined,
            });

            setIsSubmitted(true);

            // Close after brief delay
            setTimeout(() => {
                onOpenChange(false);
                // Reset state after close
                setTimeout(() => {
                    setRating(0);
                    setComment('');
                    setIsSubmitted(false);
                }, 300);
            }, 1500);
        } catch (err) {
            console.error('[TourFeedback] Failed to submit:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkip = () => {
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                {isSubmitted ? (
                    // Thank you message
                    <div className="py-8 text-center">
                        <div className="text-4xl mb-4">🙏</div>
                        <DialogTitle className="text-lg font-semibold mb-2">
                            {t('common.feedback.thankYou')}
                        </DialogTitle>
                    </div>
                ) : (
                    // Feedback form
                    <>
                        <DialogHeader>
                            <DialogTitle>{t('common.feedback.title')}</DialogTitle>
                            <DialogDescription>
                                Your feedback helps us improve the tour experience.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-4">
                            {/* Star Rating */}
                            <div className="space-y-2">
                                <Label>{t('common.feedback.rating')}</Label>
                                <div className="flex gap-1" role="group" aria-label="Rating">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoveredRating(star)}
                                            onMouseLeave={() => setHoveredRating(0)}
                                            className={cn(
                                                'p-1 rounded transition-colors',
                                                'hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                                            )}
                                            aria-label={`Rate ${star} out of 5`}
                                        >
                                            <Star
                                                className={cn(
                                                    'w-8 h-8 transition-colors',
                                                    star <= (hoveredRating || rating)
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : 'text-muted-foreground'
                                                )}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Comment */}
                            <div className="space-y-2">
                                <Label htmlFor="feedback-comment">
                                    {t('common.feedback.comment')}
                                </Label>
                                <Textarea
                                    id="feedback-comment"
                                    placeholder="What could be improved?"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={3}
                                    className="resize-none"
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleSkip}
                                disabled={isSubmitting}
                            >
                                Skip
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : t('common.feedback.submit')}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
