import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { cn } from '../lib/utils';
import { ArrowLeft, Loader2, Check, Download, AlertTriangle } from 'lucide-react';

interface ImportDetailData {
    id: string;
    original_filename: string;
    uploaded_by: string;
    uploaded_at: string;
    status: string;
    row_count: number;
    approved_by?: string;
    approved_at?: string;
    parse_warnings?: Array<{ row: number, error: string }>;
}

export default function ImportDetail() {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);

    // Filters
    const [seriesFilter, setSeriesFilter] = useState('');

    const { data: importData, isLoading: isLoadingImport } = useQuery<ImportDetailData>({
        queryKey: ['import', id],
        queryFn: async () => {
            const res = await api.get(`/imports/${id}`);
            return res.data;
        }
    });

    const { data: rowsData, isLoading: isLoadingRows } = useQuery({
        queryKey: ['import-rows', id, page, seriesFilter],
        queryFn: async () => {
            const params = { page, page_size: 50, series: seriesFilter || undefined };
            const res = await api.get(`/imports/${id}/rows`, { params });
            return res.data;
        },
        placeholderData: (previousData) => previousData
    });

    const approveMutation = useMutation({
        mutationFn: async () => {
            return api.post(`/imports/${id}/approve`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['import', id] });
        }
    });

    const user = localStorage.getItem('dev_user') || 'alice';
    const canApprove = (['bob', 'admin'].includes(user)) && importData?.status === 'PENDING';

    const handleDownload = async () => {
        if (!importData) return;
        try {
            const response = await api.get(`/imports/${id}/download/csv`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const filename = importData.original_filename.replace(/\.[^/.]+$/, "") + `_${id}.csv`;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {
            console.error("Download failed", e);
            alert("Download failed. Check console or permissions.");
        }
    };

    if (isLoadingImport) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (!importData) return <div className="p-8">Import not found</div>;

    const totalPages = rowsData ? Math.ceil(rowsData.total / 50) : 0;

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
            <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>

            <div className="flex justify-between items-start border-b pb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2">{importData.original_filename}</h1>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Uploaded by: <span className="font-medium text-foreground">{importData.uploaded_by}</span></span>
                        <span>Date: <span className="font-medium text-foreground">{new Date(importData.uploaded_at).toLocaleString()}</span></span>
                        <span>Rows: <span className="font-medium text-foreground">{importData.row_count}</span></span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className={cn(
                        "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset",
                        importData.status === 'PENDING' ? "bg-yellow-50 text-yellow-800 ring-yellow-600/20" :
                            importData.status === 'APPROVED' ? "bg-green-50 text-green-700 ring-green-600/20" :
                                "bg-red-50 text-red-700 ring-red-600/20"
                    )}>
                        {importData.status}
                    </span>

                    {canApprove && (
                        <button
                            onClick={() => approveMutation.mutate()}
                            disabled={approveMutation.isPending}
                            className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
                        >
                            {approveMutation.isPending && <Loader2 className="animate-spin h-4 w-4" />}
                            <Check className="h-4 w-4" /> Approve Import
                        </button>
                    )}

                    <button
                        onClick={handleDownload}
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                        <Download className="h-4 w-4" /> Download CSV
                    </button>
                </div>
            </div>

            {importData.parse_warnings && importData.parse_warnings.length > 0 && (
                <div className="bg-orange-50 border-orange-200 border rounded-md p-4 text-sm text-orange-800">
                    <h4 className="font-semibold flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4" /> Parse Warnings
                    </h4>
                    <ul className="list-disc pl-5 max-h-32 overflow-y-auto font-mono text-xs">
                        {importData.parse_warnings.map((w: any, i: number) => (
                            <li key={i}>Row {w.row}: {w.error}</li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Observations Preview</h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Filter by series..."
                            value={seriesFilter}
                            onChange={(e) => { setSeriesFilter(e.target.value); setPage(1); }}
                            className="border rounded px-2 py-1 text-sm w-48 focus:ring-1 focus:ring-primary outline-none"
                        />
                    </div>
                </div>

                <div className="border rounded-md overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted border-b text-muted-foreground">
                            <tr>
                                <th className="p-3 w-16">Row</th>
                                <th className="p-3">Date</th>
                                <th className="p-3">Series</th>
                                <th className="p-3">Value</th>
                                <th className="p-3">Freq</th>
                                <th className="p-3">Units</th>
                                <th className="p-3">Country</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoadingRows ? (
                                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></td></tr>
                            ) : rowsData?.data.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No rows found</td></tr>
                            ) : (
                                rowsData?.data.map((row: any) => (
                                    <tr key={row.id} className="border-b hover:bg-muted/10">
                                        <td className="p-3 font-mono text-muted-foreground text-xs">{row.row_index}</td>
                                        <td className="p-3">{row.date}</td>
                                        <td className="p-3 font-medium">{row.series}</td>
                                        <td className="p-3">
                                            {row.value_num !== null ? row.value_num : <span className="italic text-muted-foreground">{row.value_text}</span>}
                                        </td>
                                        <td className="p-3 text-muted-foreground">{row.frequency}</td>
                                        <td className="p-3 text-muted-foreground">{row.units}</td>
                                        <td className="p-3 text-muted-foreground">{row.country}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-center text-sm">
                    <div className="text-muted-foreground">
                        Page {page} of {totalPages} ({rowsData?.total || 0} total rows)
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-muted"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-muted"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
