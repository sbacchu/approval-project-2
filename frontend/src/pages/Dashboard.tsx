import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { Loader2 } from 'lucide-react';
import { ImportUploadModal } from '@/components/ImportUploadModal';

import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Import {
    id: string;
    original_filename: string;
    uploaded_by: string;
    uploaded_at: string;
    status: string;
    row_count: number;
    approved_by?: string;
    approved_at?: string;
    display_name?: string;
}

export default function Dashboard() {
    const queryClient = useQueryClient();
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [displayName, setDisplayName] = useState('');


    const { data: imports, isLoading } = useQuery({
        queryKey: ['imports', filterStatus],
        queryFn: async () => {
            const params = filterStatus ? { status: filterStatus } : {};
            const res = await api.get<Import[]>('/imports/', { params });
            return res.data;
        }
    });



    const user = localStorage.getItem('dev_user') || 'alice';
    const canUpload = ['alice', 'admin'].includes(user);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Imports Dashboard</h2>
                {canUpload && (
                    <ImportUploadModal
                        trigger={
                            <Button className="gap-2">
                                <Upload className="h-4 w-4" />
                                Upload Excel
                            </Button>
                        }
                        onUpload={async (file) => {
                            const formData = new FormData();
                            formData.append('file', file);
                            if (displayName) {
                                formData.append('display_name', displayName);
                            }
                            await api.post('/imports/', formData);
                            queryClient.invalidateQueries({ queryKey: ['imports'] });
                            setDisplayName(''); // Reset after successful upload
                        }}
                        onFileSelect={(file) => {
                            if (!displayName) {
                                setDisplayName(file.name.split('.')[0]);
                            }
                        }}
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="displayName">Display Name</Label>
                            <Input
                                id="displayName"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder="e.g. Q1 2024 Economic Data"
                            />
                        </div>
                    </ImportUploadModal>
                )}
            </div>

            {/* Upload Preview */}


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
                                            {imp.display_name || imp.original_filename}
                                        </Link>
                                        {imp.display_name && imp.display_name !== imp.original_filename && (
                                            <div className="text-xs text-muted-foreground mt-0.5">{imp.original_filename}</div>
                                        )}
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
