import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"

import api from '../lib/api';
import { cn } from '../lib/utils';
import { ArrowLeft, Loader2, Check, Download, AlertTriangle } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';

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

interface ImportRow {
    id: number;
    row_index: number;
    date: string;
    series: string;
    value_num: number | null;
    value_text: string | null;
    frequency: string;
    units: string;
    country: string;
}

export default function ImportDetail() {
    const { id } = useParams<{ id: string }>();
    const queryClient = useQueryClient();

    const { data: importData, isLoading: isLoadingImport } = useQuery<ImportDetailData>({
        queryKey: ['import', id],
        queryFn: async () => {
            const res = await api.get(`/imports/${id}`);
            return res.data;
        }
    });

    const { data: rowsData } = useQuery({
        queryKey: ['import-rows', id],
        queryFn: async () => {
            // Fetch all rows by setting a large page_size. 
            // The backend might need to support a generic "all" or we just use a large number.
            // Using 100000 as a safe upper bound for now based on user request "import all rows".
            const params = { page: 1, page_size: 100000 };
            const res = await api.get(`/imports/${id}/rows`, { params });
            return res.data;
        }
    });

    const approveMutation = useMutation({
        mutationFn: async () => {
            return api.post(`/imports/${id}/approve/`);
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

    const columns: ColumnDef<ImportRow>[] = useMemo(
        () => [
            {
                accessorKey: "row_index",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Row
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => <span className="font-mono text-muted-foreground text-xs">{row.getValue("row_index")}</span>,
            },
            {
                accessorKey: "date",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Date
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    )
                },
            },
            {
                accessorKey: "series",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Series
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => <span className="font-medium">{row.getValue("series")}</span>,
            },
            {
                accessorKey: "value_num", // Use value_num for sorting logic, but render differently
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Value
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    )
                },
                cell: ({ row }) => {
                    const valNum = row.original.value_num;
                    const valText = row.original.value_text;
                    return valNum !== null ? valNum : <span className="italic text-muted-foreground">{valText}</span>;
                },
            },
            {
                accessorKey: "frequency",
                header: "Freq",
            },
            {
                accessorKey: "units",
                header: "Units",
            },
            {
                accessorKey: "country",
                header: ({ column }) => {
                    return (
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        >
                            Country
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                    )
                },
            },
        ],
        []
    )

    if (isLoadingImport) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (!importData) return <div className="p-8">Import not found</div>;

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
                <DataTable
                    columns={columns}
                    data={rowsData?.data || []}
                />
            </div>
        </div>
    );
}
