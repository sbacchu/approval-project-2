import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { Loader2 } from 'lucide-react';

interface Import {
    id: string;
    original_filename: string;
    uploaded_by: string;
    uploaded_at: string;
    status: string;
    row_count: number;
    approved_by?: string;
    approved_at?: string;
}

export default function Dashboard() {
    const queryClient = useQueryClient();
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const { data: imports, isLoading } = useQuery({
        queryKey: ['imports', filterStatus],
        queryFn: async () => {
            const params = filterStatus ? { status: filterStatus } : {};
            const res = await api.get<Import[]>('/imports', { params });
            return res.data;
        }
    });

    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);
            return api.post('/imports', formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['imports'] });
            setUploadFile(null);
            setUploadError(null);
            setIsUploading(false);
        },
        onError: (error: any) => {
            setUploadError(error.response?.data?.detail || 'Upload failed');
            setIsUploading(false);
        }
    });

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile) return;
        setIsUploading(true);
        uploadMutation.mutate(uploadFile);
    };

    const user = localStorage.getItem('dev_user') || 'alice';
    const canUpload = ['alice', 'admin'].includes(user);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Imports Dashboard</h2>
                {canUpload && (
                    <div className="flex gap-2">
                        <label className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium text-sm transition-colors">
                            Upload Excel
                            <input
                                type="file"
                                className="hidden"
                                accept=".xlsx, .xls"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) {
                                        setUploadFile(e.target.files[0]);
                                    }
                                }}
                            />
                        </label>
                    </div>
                )}
            </div>

            {/* Upload Preview */}
            {uploadFile && (
                <div className="border border-border rounded-lg p-4 bg-muted/30 animate-in fade-in slide-in-from-top-2">
                    <h3 className="font-medium mb-2">Confirm Upload</h3>
                    <p className="text-sm mb-4">Selected file: <span className="font-mono bg-muted px-1 rounded">{uploadFile.name}</span></p>
                    {uploadError && <p className="text-destructive text-sm mb-4 bg-destructive/10 p-2 rounded">{uploadError}</p>}
                    <div className="flex gap-2">
                        <button
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm disabled:opacity-50 flex items-center gap-2 hover:bg-primary/90 transition-colors"
                        >
                            {isUploading && <Loader2 className="animate-spin h-4 w-4" />}
                            {isUploading ? 'Uploading...' : 'Start Upload'}
                        </button>
                        <button
                            onClick={() => { setUploadFile(null); setUploadError(null); }}
                            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md text-sm hover:bg-secondary/80 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="flex gap-2 items-center">
                <span className="text-sm text-muted-foreground">Filter Status:</span>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border rounded px-2 py-1 text-sm bg-background focus:ring-1 focus:ring-primary"
                >
                    <option value="">All</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>

            <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted text-muted-foreground border-b">
                        <tr>
                            <th className="h-10 px-4 font-medium">Filename</th>
                            <th className="h-10 px-4 font-medium">Status</th>
                            <th className="h-10 px-4 font-medium">Uploaded By</th>
                            <th className="h-10 px-4 font-medium">Uploaded At</th>
                            <th className="h-10 px-4 font-medium">Rows</th>
                            <th className="h-10 px-4 font-medium">Approved By</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />Loading imports...</td></tr>
                        ) : imports?.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No imports found</td></tr>
                        ) : (
                            imports?.map(imp => (
                                <tr key={imp.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                    <td className="p-4">
                                        <Link to={`/imports/${imp.id}`} className="font-medium text-primary hover:underline decoration-primary/50 underline-offset-4">
                                            {imp.original_filename}
                                        </Link>
                                    </td>
                                    <td className="p-4">
                                        <span className={cn(
                                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                                            imp.status === 'PENDING' ? "bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-400 dark:ring-yellow-400/20" :
                                                imp.status === 'APPROVED' ? "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-400/20" :
                                                    "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-400/20"
                                        )}>
                                            {imp.status}
                                        </span>
                                    </td>
                                    <td className="p-4">{imp.uploaded_by}</td>
                                    <td className="p-4 text-muted-foreground">{new Date(imp.uploaded_at).toLocaleString()}</td>
                                    <td className="p-4 font-mono">{imp.row_count}</td>
                                    <td className="p-4">
                                        {imp.approved_by ? (
                                            <div className="flex flex-col">
                                                <span>{imp.approved_by}</span>
                                                <span className="text-xs text-muted-foreground">{imp.approved_at && new Date(imp.approved_at).toLocaleDateString()}</span>
                                            </div>
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
