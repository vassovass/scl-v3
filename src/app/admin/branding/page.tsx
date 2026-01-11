"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { useBranding } from "@/hooks/useBranding";
import { Logo } from "@/components/ui/Logo";
import { toast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/Spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";

/**
 * SUPERADMIN-ONLY: Branding Management
 *
 * Customize app branding:
 * - Logo (emoji + text or custom image)
 * - Favicon (auto-generated from uploads)
 * - Theme colors (light + dark mode)
 */
export default function BrandingPage() {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { branding, updateBranding, isLoading, refresh } = useBranding();

    // Form state for text-based logo
    const [logoEmoji, setLogoEmoji] = useState(branding.logo.emoji);
    const [logoTextPrimary, setLogoTextPrimary] = useState(branding.logo.textPrimary);
    const [logoTextSecondary, setLogoTextSecondary] = useState(branding.logo.textSecondary);
    const [themeColorLight, setThemeColorLight] = useState(branding.themeColorLight);
    const [themeColorDark, setThemeColorDark] = useState(branding.themeColorDark);

    // Upload state
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [previewImageLight, setPreviewImageLight] = useState<string | null>(null);
    const [previewImageDark, setPreviewImageDark] = useState<string | null>(null);

    // Sync form state with branding data
    useEffect(() => {
        setLogoEmoji(branding.logo.emoji);
        setLogoTextPrimary(branding.logo.textPrimary);
        setLogoTextSecondary(branding.logo.textSecondary);
        setThemeColorLight(branding.themeColorLight);
        setThemeColorDark(branding.themeColorDark);
    }, [branding]);

    // Auth check
    useEffect(() => {
        async function checkSuperadmin() {
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.replace("/sign-in");
                return;
            }

            const { data: profile } = await supabase
                .from("users")
                .select("is_superadmin")
                .eq("id", user.id)
                .single();

            if (!profile?.is_superadmin) {
                router.replace("/dashboard");
                return;
            }

            setIsAuthorized(true);
            setLoading(false);
        }

        checkSuperadmin();
    }, [router]);

    /**
     * Save text-based logo and theme colors
     */
    const handleSaveTextLogo = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            await updateBranding({
                logo: {
                    emoji: logoEmoji,
                    textPrimary: logoTextPrimary,
                    textSecondary: logoTextSecondary,
                },
                themeColorLight,
                themeColorDark,
            });

            toast({
                title: "Branding Updated",
                description: "Changes saved successfully.",
            });

            // Refresh to update all components
            refresh();
        } catch (error) {
            console.error('Failed to update branding:', error);
            toast({
                title: "Error",
                description: "Failed to save changes. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    /**
     * Handle logo image upload
     */
    const handleLogoImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, theme: 'light' | 'dark') => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Client-side validation
        if (!file.type.startsWith('image/')) {
            toast({
                title: "Invalid file",
                description: "Please upload an image file.",
                variant: "destructive",
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Maximum file size is 5MB.",
                variant: "destructive",
            });
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            if (theme === 'light') {
                setPreviewImageLight(dataUrl);
            } else {
                setPreviewImageDark(dataUrl);
            }
        };
        reader.readAsDataURL(file);

        // Upload to server
        setIsUploading(true);
        try {
            const formData = new FormData();
            const reader2 = new FileReader();

            reader2.onload = async () => {
                const dataUrl = reader2.result as string;

                const payload = theme === 'light'
                    ? { imageLight: dataUrl, imageDark: previewImageDark || undefined }
                    : { imageLight: previewImageLight || branding.logo.imageUrl || '', imageDark: dataUrl };

                const res = await fetch('/api/admin/branding/upload-logo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) {
                    throw new Error('Upload failed');
                }

                const data = await res.json();

                toast({
                    title: "Logo Uploaded",
                    description: "Your custom logo has been saved.",
                });

                // Refresh branding
                refresh();
                setIsUploading(false);
            };

            reader2.readAsDataURL(file);
        } catch (error) {
            console.error('Upload error:', error);
            toast({
                title: "Upload Failed",
                description: "Failed to upload logo. Please try again.",
                variant: "destructive",
            });
            setIsUploading(false);
        }
    };

    /**
     * Remove custom logo images (revert to emoji)
     */
    const handleRemoveCustomLogo = async () => {
        setIsSaving(true);
        try {
            // Send full logo object with null imageUrl fields
            await updateBranding({
                logo: {
                    emoji: branding.logo.emoji,
                    textPrimary: branding.logo.textPrimary,
                    textSecondary: branding.logo.textSecondary,
                    imageUrl: null as any,
                    imageUrlDark: null as any,
                },
            });

            setPreviewImageLight(null);
            setPreviewImageDark(null);

            toast({
                title: "Custom Logo Removed",
                description: "Reverted to emoji logo.",
            });

            refresh();
        } catch (error) {
            console.error('Failed to remove logo:', error);
            toast({
                title: "Error",
                description: "Failed to remove logo.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-mesh flex items-center justify-center">
                <Spinner size="lg" />
            </main>
        );
    }

    if (!isAuthorized) {
        return null;
    }

    const hasCustomLogo = branding.logo.imageUrl || previewImageLight;

    return (
        <main className="min-h-screen bg-gradient-mesh">
            <div className="section-container py-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Branding</h1>
                        <p className="text-slate-400 mt-1">Customize logo, favicon, and theme colors</p>
                    </div>
                    <Link href="/dashboard" className="btn-ghost text-sm">
                        ← Back to Dashboard
                    </Link>
                </div>

                {/* Info Alert */}
                <Alert variant="info" className="mb-8">
                    <AlertDescription>
                        Changes here affect the entire application including favicons, PWA icons, and page titles.
                        The app will automatically regenerate all required assets.
                    </AlertDescription>
                </Alert>

                {/* Logo Preview */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-white mb-4">Current Logo</h2>
                    <div className="glass-card p-8 flex items-center justify-center bg-slate-900">
                        <Logo size="lg" href="" />
                    </div>
                </section>

                {/* Text-Based Logo Section */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-white mb-4">Text-Based Logo</h2>
                    <form onSubmit={handleSaveTextLogo} className="glass-card p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Emoji/Icon
                                </label>
                                <input
                                    type="text"
                                    value={logoEmoji}
                                    onChange={(e) => setLogoEmoji(e.target.value)}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 focus:border-primary focus:outline-none"
                                    placeholder="👟"
                                    maxLength={2}
                                />
                                <p className="text-xs text-slate-500 mt-1">Single emoji character</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Primary Text
                                </label>
                                <input
                                    type="text"
                                    value={logoTextPrimary}
                                    onChange={(e) => setLogoTextPrimary(e.target.value)}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 focus:border-primary focus:outline-none"
                                    placeholder="Step"
                                    maxLength={20}
                                />
                                <p className="text-xs text-slate-500 mt-1">First part of logo text</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Secondary Text
                                </label>
                                <input
                                    type="text"
                                    value={logoTextSecondary}
                                    onChange={(e) => setLogoTextSecondary(e.target.value)}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 focus:border-primary focus:outline-none"
                                    placeholder="League"
                                    maxLength={20}
                                />
                                <p className="text-xs text-slate-500 mt-1">Second part (colored)</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Theme Color (Light Mode)
                                </label>
                                <div className="flex gap-3">
                                    <input
                                        type="color"
                                        value={themeColorLight}
                                        onChange={(e) => setThemeColorLight(e.target.value)}
                                        className="h-12 w-16 rounded-lg border border-slate-700 bg-slate-900 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={themeColorLight}
                                        onChange={(e) => setThemeColorLight(e.target.value)}
                                        className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 focus:border-primary focus:outline-none font-mono text-sm"
                                        placeholder="#ffffff"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Theme Color (Dark Mode)
                                </label>
                                <div className="flex gap-3">
                                    <input
                                        type="color"
                                        value={themeColorDark}
                                        onChange={(e) => setThemeColorDark(e.target.value)}
                                        className="h-12 w-16 rounded-lg border border-slate-700 bg-slate-900 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={themeColorDark}
                                        onChange={(e) => setThemeColorDark(e.target.value)}
                                        className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 focus:border-primary focus:outline-none font-mono text-sm"
                                        placeholder="#020617"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSaving || isLoading}
                                className="btn-primary"
                            >
                                {isSaving ? (
                                    <>
                                        <Spinner size="sm" />
                                        <span className="ml-2">Saving...</span>
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </button>
                        </div>
                    </form>
                </section>

                {/* Custom Logo Image Section */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-white mb-4">Custom Logo Image (Optional)</h2>
                    <div className="glass-card p-6 space-y-6">
                        <Alert>
                            <AlertDescription>
                                Upload custom logo images to replace the emoji. Supports separate images for light and dark mode.
                                Images will be automatically compressed and optimized.
                            </AlertDescription>
                        </Alert>

                        {hasCustomLogo && (
                            <div className="p-4 bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-800 rounded flex items-center justify-center">
                                        {(previewImageLight || branding.logo.imageUrl) && (
                                            <img
                                                src={previewImageLight || branding.logo.imageUrl}
                                                alt="Logo preview"
                                                className="w-10 h-10 object-contain"
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-200">Custom logo active</p>
                                        <p className="text-xs text-slate-500">Using uploaded image instead of emoji</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRemoveCustomLogo}
                                    disabled={isSaving}
                                    className="btn-ghost text-sm"
                                >
                                    Remove Custom Logo
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Logo (Light Mode)
                                </label>
                                <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-primary transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleLogoImageUpload(e, 'light')}
                                        disabled={isUploading}
                                        className="hidden"
                                        id="logo-light-upload"
                                    />
                                    <label
                                        htmlFor="logo-light-upload"
                                        className="cursor-pointer block"
                                    >
                                        {previewImageLight || branding.logo.imageUrl ? (
                                            <img
                                                src={previewImageLight || branding.logo.imageUrl}
                                                alt="Light logo preview"
                                                className="w-24 h-24 object-contain mx-auto mb-3"
                                            />
                                        ) : (
                                            <div className="text-4xl mb-3">📁</div>
                                        )}
                                        <p className="text-sm text-slate-400">
                                            {isUploading ? "Uploading..." : "Click to upload"}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            PNG, JPG, WebP (max 5MB)
                                        </p>
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Logo (Dark Mode) - Optional
                                </label>
                                <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-primary transition-colors">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleLogoImageUpload(e, 'dark')}
                                        disabled={isUploading}
                                        className="hidden"
                                        id="logo-dark-upload"
                                    />
                                    <label
                                        htmlFor="logo-dark-upload"
                                        className="cursor-pointer block"
                                    >
                                        {previewImageDark || branding.logo.imageUrlDark ? (
                                            <img
                                                src={previewImageDark || branding.logo.imageUrlDark}
                                                alt="Dark logo preview"
                                                className="w-24 h-24 object-contain mx-auto mb-3"
                                            />
                                        ) : (
                                            <div className="text-4xl mb-3">📁</div>
                                        )}
                                        <p className="text-sm text-slate-400">
                                            {isUploading ? "Uploading..." : "Click to upload"}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            Falls back to light if not set
                                        </p>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Favicon Notice */}
                <section>
                    <div className="glass-card p-6 border-l-4 border-primary">
                        <h3 className="text-lg font-semibold text-primary mb-2">🔄 Automatic Assets</h3>
                        <p className="text-sm text-slate-400">
                            Favicons and PWA icons are automatically generated from your logo settings.
                            Changes take effect immediately across the entire app, including browser tabs,
                            bookmarks, and home screen icons.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}
