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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

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
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Filename</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Uploaded By</TableHead>
                            <TableHead>Uploaded At</TableHead>
                            <TableHead>Rows</TableHead>
                            <TableHead>Approved By</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                        <span>Loading imports...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : imports?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No imports found
                                </TableCell>
                            </TableRow>
                        ) : (
                            imports?.map(imp => (
                                <TableRow key={imp.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex flex-col">
                                            <Link to={`/imports/${imp.id}`} className="text-primary hover:underline decoration-primary/50 underline-offset-4">
                                                {imp.display_name || imp.original_filename}
                                            </Link>
                                            {imp.display_name && imp.display_name !== imp.original_filename && (
                                                <span className="text-xs text-muted-foreground mt-0.5">{imp.original_filename}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={cn(
                                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                                            imp.status === 'PENDING' ? "bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-400 dark:ring-yellow-400/20" :
                                                imp.status === 'APPROVED' ? "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-400/20" :
                                                    "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400 dark:ring-red-400/20"
                                        )}>
                                            {imp.status}
                                        </span>
                                    </TableCell>
                                    <TableCell>{imp.uploaded_by}</TableCell>
                                    <TableCell className="text-muted-foreground">{new Date(imp.uploaded_at).toLocaleString()}</TableCell>
                                    <TableCell className="font-mono">{imp.row_count}</TableCell>
                                    <TableCell>
                                        {imp.approved_by ? (
                                            <div className="flex flex-col">
                                                <span>{imp.approved_by}</span>
                                                <span className="text-xs text-muted-foreground">{imp.approved_at && new Date(imp.approved_at).toLocaleDateString()}</span>
                                            </div>
                                        ) : '-'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
