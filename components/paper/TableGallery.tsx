"use client";

import React, { useState } from "react";
import { ExtractedTableResponse } from "@/lib/api/project-service/extraction";
import {
    TableCellsIcon,
    DocumentIcon,
    EyeIcon,
    XMarkIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ArrowDownTrayIcon
} from "@heroicons/react/24/outline";

interface TableGalleryProps {
    tables: ExtractedTableResponse[];
    paperId: string;
}

interface ParsedCSV {
    headers: string[];
    rows: string[][];
}

export default function TableGallery({ tables, paperId }: TableGalleryProps) {
    const [selectedTable, setSelectedTable] = useState<ExtractedTableResponse | null>(null);
    const [currentTableIndex, setCurrentTableIndex] = useState(0);
    const [parsedCSV, setParsedCSV] = useState<ParsedCSV | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false);

    const initialDisplayCount = 6;
    const displayedTables = showAll ? tables : tables.slice(0, initialDisplayCount);

    const parseCSV = (csvContent: string): ParsedCSV => {
        const lines = csvContent.trim().split('\n');
        const headers = lines[0]?.split(',').map(h => h.trim().replace(/"/g, '')) || [];
        const rows = lines.slice(1).map(line =>
            line.split(',').map(cell => cell.trim().replace(/"/g, ''))
        );
        return { headers, rows };
    };

    const fetchCSVContent = async (csvPath: string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(csvPath);
            if (!response.ok) {
                throw new Error('Failed to fetch CSV content');
            }
            const csvContent = await response.text();
            setParsedCSV(parseCSV(csvContent));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load table data');
            setParsedCSV(null);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (table: ExtractedTableResponse, index: number) => {
        setSelectedTable(table);
        setCurrentTableIndex(index);
        if (table.csvPath) {
            fetchCSVContent(table.csvPath);
        }
    };

    const closeModal = () => {
        setSelectedTable(null);
        setParsedCSV(null);
        setError(null);
    };

    const nextTable = () => {
        const nextIndex = (currentTableIndex + 1) % tables.length;
        setCurrentTableIndex(nextIndex);
        if (tables[nextIndex].csvPath) {
            fetchCSVContent(tables[nextIndex].csvPath);
        }
    };

    const prevTable = () => {
        const prevIndex = (currentTableIndex - 1 + tables.length) % tables.length;
        setCurrentTableIndex(prevIndex);
        if (tables[prevIndex].csvPath) {
            fetchCSVContent(tables[prevIndex].csvPath);
        }
    };


    const downloadCSV = (csvPath: string, tableLabel: string) => {
        const link = document.createElement('a');
        link.href = csvPath;
        link.download = `${tableLabel || 'table'}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!tables || tables.length === 0) {
        return (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 text-center">
                <TableCellsIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No Tables Found</h3>
                <p className="text-slate-500">This paper doesn't contain any extracted tables yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                    Paper Tables
                </h2>
                <p className="text-slate-600">
                    {tables.length} table{tables.length !== 1 ? 's' : ''} extracted from this paper
                </p>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedTables.map((table, index) => (
                    <div
                        key={table.tableId}
                        className="group relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 hover:border-emerald-300"
                    >
                        {/* Table Preview */}
                        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
                            <div className="text-center">
                                <TableCellsIcon className="h-16 w-16 text-emerald-500 mx-auto mb-2" />
                                <p className="text-sm font-medium text-emerald-700">Table Data</p>
                            </div>

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                                <button
                                    onClick={() => openModal(table, index)}
                                    className="opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 shadow-lg"
                                >
                                    <EyeIcon className="h-6 w-6 text-slate-700" />
                                </button>
                            </div>

                            {/* Table Badge */}
                            <div className="absolute top-3 left-3">
                                <span className="bg-emerald-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                                    Table
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-slate-800 truncate">
                                    {table.label ? table.label : `Table ${index + 1}`}
                                </h3>
                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                    Page {table.page}
                                </span>
                            </div>

                            {table.caption && (
                                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                                    {table.caption}
                                </p>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={() => openModal(table, index)}
                                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <EyeIcon className="h-4 w-4" />
                                    View
                                </button>
                                {table.csvPath && (
                                    <button
                                        onClick={() => downloadCSV(table.csvPath, table.label)}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                                    >
                                        <ArrowDownTrayIcon className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Show More/Less Button */}
            {tables.length > initialDisplayCount && (
                <div className="text-center mt-8">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
                    >
                        {showAll ? (
                            <>
                                <span>Show Less</span>
                                <span className="text-xs opacity-75">({tables.length - initialDisplayCount} hidden)</span>
                            </>
                        ) : (
                            <>
                                <span>Show More</span>
                                <span className="text-xs opacity-75">({tables.length - initialDisplayCount} more)</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Modal */}
            {selectedTable && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
                    <div className="relative max-w-7xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">
                                    {tables[currentTableIndex]?.label ? tables[currentTableIndex].label : `Table ${currentTableIndex + 1}`}
                                </h3>
                                <p className="text-sm text-slate-500">
                                    Page {tables[currentTableIndex]?.page} • {tables.length} of {tables.length} tables
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {tables[currentTableIndex]?.csvPath && (
                                    <button
                                        onClick={() => downloadCSV(tables[currentTableIndex].csvPath, tables[currentTableIndex].label)}
                                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                        title="Download CSV"
                                    >
                                        <ArrowDownTrayIcon className="h-5 w-5 text-slate-500" />
                                    </button>
                                )}
                                <button
                                    onClick={closeModal}
                                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <XMarkIcon className="h-6 w-6 text-slate-500" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="relative">
                            {/* Navigation Arrows */}
                            {tables.length > 1 && (
                                <>
                                    <button
                                        onClick={prevTable}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 shadow-lg transition-all"
                                    >
                                        <ChevronLeftIcon className="h-6 w-6 text-slate-700" />
                                    </button>
                                    <button
                                        onClick={nextTable}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 shadow-lg transition-all"
                                    >
                                        <ChevronRightIcon className="h-6 w-6 text-slate-700" />
                                    </button>
                                </>
                            )}

                            {/* Table Content */}
                            <div className="p-6 max-h-[60vh] overflow-auto">
                                {loading ? (
                                    <div className="flex items-center justify-center h-32">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                                        <span className="ml-3 text-slate-600">Loading table data...</span>
                                    </div>
                                ) : error ? (
                                    <div className="text-center py-8">
                                        <DocumentIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                                        <p className="text-slate-600 mb-2">Failed to load table data</p>
                                        <p className="text-sm text-slate-500">{error}</p>
                                    </div>
                                ) : parsedCSV ? (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full border-collapse border border-slate-300">
                                            <thead>
                                                <tr className="bg-emerald-50">
                                                    {parsedCSV.headers.map((header, index) => (
                                                        <th
                                                            key={`header-${index}-${header}`}
                                                            className="border border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-700"
                                                        >
                                                            {header}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {parsedCSV.rows.map((row, rowIndex) => (
                                                    <tr
                                                        key={`row-${rowIndex}`}
                                                        className={rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"}
                                                    >
                                                        {row.map((cell, cellIndex) => (
                                                            <td
                                                                key={`cell-${rowIndex}-${cellIndex}`}
                                                                className="border border-slate-300 px-4 py-3 text-sm text-slate-600"
                                                            >
                                                                {cell}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <TableCellsIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                                        <p className="text-slate-600">No table data available</p>
                                    </div>
                                )}
                            </div>

                            {/* Caption */}
                            {tables[currentTableIndex]?.caption && (
                                <div className="p-6 bg-slate-50 border-t border-slate-200">
                                    <h4 className="font-semibold text-slate-800 mb-2">Caption</h4>
                                    <p className="text-slate-600 leading-relaxed">
                                        {tables[currentTableIndex].caption}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
