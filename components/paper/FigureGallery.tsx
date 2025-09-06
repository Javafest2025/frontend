"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ExtractedFigureResponse } from "@/lib/api/project-service/extraction";
import {
    MagnifyingGlassIcon,
    DocumentIcon,
    XMarkIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from "@heroicons/react/24/outline";

interface FigureGalleryProps {
    figures: ExtractedFigureResponse[];
    paperId: string;
}

export default function FigureGallery({ figures, paperId }: FigureGalleryProps) {
    const [selectedFigure, setSelectedFigure] = useState<ExtractedFigureResponse | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showAll, setShowAll] = useState(false);

    const initialDisplayCount = 8;
    const displayedFigures = showAll ? figures : figures.slice(0, initialDisplayCount);

    if (!figures || figures.length === 0) {
        return (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 text-center">
                <DocumentIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">No Figures Found</h3>
                <p className="text-slate-500">This paper doesn't contain any extracted figures yet.</p>
            </div>
        );
    }

    const openModal = (figure: ExtractedFigureResponse, index: number) => {
        setSelectedFigure(figure);
        setCurrentImageIndex(index);
    };

    const closeModal = () => {
        setSelectedFigure(null);
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % figures.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + figures.length) % figures.length);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    Paper Figures
                </h2>
                <p className="text-slate-600">
                    {figures.length} figure{figures.length !== 1 ? 's' : ''} extracted from this paper
                </p>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayedFigures.map((figure, index) => (
                    <div
                        key={figure.figureId}
                        className="group relative bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-200 hover:border-blue-300"
                    >
                        {/* Image Container */}
                        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
                            {figure.imagePath ? (
                                <Image
                                    src={figure.imagePath}
                                    alt={figure.caption || `Figure ${figure.label}`}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <DocumentIcon className="h-16 w-16 text-slate-400" />
                                </div>
                            )}

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                                <button
                                    onClick={() => openModal(figure, index)}
                                    className="opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 shadow-lg"
                                >
                                    <MagnifyingGlassIcon className="h-6 w-6 text-slate-700" />
                                </button>
                            </div>

                            {/* Figure Type Badge */}
                            {figure.figureType && (
                                <div className="absolute top-3 left-3">
                                    <span className="bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                                        {figure.figureType}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-slate-800 truncate">
                                    {figure.label || `Figure ${index + 1}`}
                                </h3>
                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                    Page {figure.page}
                                </span>
                            </div>

                            {figure.caption && (
                                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                                    {figure.caption}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Show More/Less Button */}
            {figures.length > initialDisplayCount && (
                <div className="text-center mt-8">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
                    >
                        {showAll ? (
                            <>
                                <span>Show Less</span>
                                <span className="text-xs opacity-75">({figures.length - initialDisplayCount} hidden)</span>
                            </>
                        ) : (
                            <>
                                <span>Show More</span>
                                <span className="text-xs opacity-75">({figures.length - initialDisplayCount} more)</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Modal */}
            {selectedFigure && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
                    <div className="relative max-w-6xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">
                                    {selectedFigure.label || `Figure ${currentImageIndex + 1}`}
                                </h3>
                                <p className="text-sm text-slate-500">
                                    Page {selectedFigure.page} • {figures.length} of {figures.length} figures
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <XMarkIcon className="h-6 w-6 text-slate-500" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="relative">
                            {/* Navigation Arrows */}
                            {figures.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 shadow-lg transition-all"
                                    >
                                        <ChevronLeftIcon className="h-6 w-6 text-slate-700" />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 shadow-lg transition-all"
                                    >
                                        <ChevronRightIcon className="h-6 w-6 text-slate-700" />
                                    </button>
                                </>
                            )}

                            {/* Image */}
                            <div className="relative max-h-[60vh] overflow-hidden bg-slate-50">
                                {figures[currentImageIndex]?.imagePath ? (
                                    <Image
                                        src={figures[currentImageIndex].imagePath}
                                        alt={figures[currentImageIndex].caption || `Figure ${currentImageIndex + 1}`}
                                        width={1200}
                                        height={800}
                                        className="w-full h-auto object-contain"
                                        priority
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-64">
                                        <DocumentIcon className="h-24 w-24 text-slate-400" />
                                    </div>
                                )}
                            </div>

                            {/* Caption */}
                            {figures[currentImageIndex]?.caption && (
                                <div className="p-6 bg-slate-50">
                                    <h4 className="font-semibold text-slate-800 mb-2">Caption</h4>
                                    <p className="text-slate-600 leading-relaxed">
                                        {figures[currentImageIndex].caption}
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
