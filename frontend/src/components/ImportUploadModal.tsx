import { useState } from 'react';
import { Upload, X, File as FileIcon, Loader2 } from 'lucide-react';

import { cn } from '../lib/utils';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface ImportUploadModalProps {
    trigger: React.ReactNode;
    title?: string;
    description?: string;
    onUpload: (file: File) => Promise<void>;
    children?: React.ReactNode; // Extra form fields
    accept?: string;
    onFileSelect?: (file: File) => void; // Optional callback when file is selected
}

export function ImportUploadModal({
    trigger,
    title = "Upload Data Import",
    description = "Drag and drop your Excel file here or click to browse.",
    onUpload,
    children,
    accept = ".xlsx, .xls",
    onFileSelect
}: ImportUploadModalProps) {
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isDragActive, setIsDragActive] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleUpload = async () => {
        if (!uploadFile) return;
        setIsUploading(true);
        setUploadError(null);
        try {
            await onUpload(uploadFile);
            handleCloseDialog();
        } catch (error: any) {
            setUploadError(error.response?.data?.detail || error.message || 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        // Reset state after a delay to avoid UI flicker during close animation
        setTimeout(() => {
            setUploadFile(null);
            setUploadError(null);
            setIsUploading(false);
            setIsDragActive(false);
        }, 300);
    };

    const setFile = (file: File) => {
        setUploadFile(file);
        if (onFileSelect) {
            onFileSelect(file);
        }
    }

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            // Simple extension check
            const extensions = accept.split(',').map(ext => ext.trim());
            if (extensions.some(ext => file.name.endsWith(ext))) {
                setFile(file);
            } else {
                setUploadError(`Invalid file format. Must be ${accept}`);
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setFile(file);
        }
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {!uploadFile ? (
                        <div
                            className={cn(
                                "border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 h-[200px]",
                                isDragActive ? "border-primary bg-muted/50" : "border-muted-foreground/25",
                                uploadError ? "border-destructive/50 bg-destructive/5" : ""
                            )}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            onClick={() => document.getElementById('file-upload')?.click()}
                        >
                            <Upload className={cn("h-10 w-10 mb-2", isDragActive ? "text-primary" : "text-muted-foreground")} />
                            <p className="text-sm text-muted-foreground font-medium">
                                {isDragActive ? "Drop file here" : "Drag & drop file here or click to browse"}
                            </p>
                            <p className="text-xs text-muted-foreground/70">
                                Supports {accept}
                            </p>
                            <input
                                id="file-upload"
                                type="file"
                                className="hidden"
                                accept={accept}
                                onChange={handleFileSelect}
                            />
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="bg-primary/10 p-2 rounded">
                                        <FileIcon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="truncate">
                                        <p className="text-sm font-medium truncate">{uploadFile.name}</p>
                                        <p className="text-xs text-muted-foreground">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setUploadFile(null);
                                        setUploadError(null);
                                    }}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Render extra form fields from parent here */}
                            {children}
                        </div>
                    )}

                    {uploadError && (
                        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium flex items-center gap-2">
                            <X className="h-4 w-4" />
                            {uploadError}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="submit"
                        onClick={handleUpload}
                        disabled={!uploadFile || isUploading}
                        className="w-full sm:w-auto"
                    >
                        {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isUploading ? 'Uploading...' : 'Upload File'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
