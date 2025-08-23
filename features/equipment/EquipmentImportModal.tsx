
import React, { useState } from 'react';
import Papa from 'papaparse';
import { apiService } from '../../services/apiService';
import { Equipment } from '../../types';

interface EquipmentImportModalProps {
    onClose: () => void;
    onImportComplete: (result: { createdCount: number; updatedCount: number; errors: any[] }) => void;
}

const REQUIRED_HEADERS = ['gageId', 'description', 'manufacturer', 'model', 'range', 'uom'];
const OPTIONAL_HEADERS = ['imageUrl'];

const EquipmentImportModal: React.FC<EquipmentImportModalProps> = ({ onClose, onImportComplete }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);
    const [importResult, setImportResult] = useState<{ createdCount: number; updatedCount: number; errors: any[] } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFile(e.target.files ? e.target.files[0] : null);
        setParseError(null);
        setImportResult(null);
    };

    const handleDownloadTemplate = () => {
        const csvContent = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS].join(',') + '\n';
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'equipment_template.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleSubmit = async () => {
        if (!file) return;

        setIsSubmitting(true);
        setParseError(null);
        setImportResult(null);

        Papa.parse<Omit<Equipment, 'id'>>(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const headers = results.meta.fields || [];
                const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));

                if (missingHeaders.length > 0) {
                    setParseError(`File is missing required headers: ${missingHeaders.join(', ')}`);
                    setIsSubmitting(false);
                    return;
                }

                const validData = results.data.filter(row => row.gageId && row.description); // Basic validation
                
                if (validData.length === 0) {
                     setParseError('No valid data rows found in the file. Ensure gageId and description are present.');
                     setIsSubmitting(false);
                     return;
                }

                const result = await apiService.bulkUpsertEquipment(validData);
                setImportResult(result);
                onImportComplete(result);
                setIsSubmitting(false);
            },
            error: (error) => {
                setParseError(`Error parsing file: ${error.message}`);
                setIsSubmitting(false);
            }
        });
    };

    const handleClose = () => {
        if (isSubmitting) return;
        onClose();
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-2xl m-4">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Import & Update Equipment from CSV</h2>
                    <button onClick={handleClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-3xl font-bold">&times;</button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Instructions:</h3>
                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-md">
                            <li>If a <code className="text-xs bg-gray-200 dark:bg-gray-600 dark:text-gray-200 p-1 rounded">gageId</code> in the file matches an existing item, its details will be updated.</li>
                            <li>If a <code className="text-xs bg-gray-200 dark:bg-gray-600 dark:text-gray-200 p-1 rounded">gageId</code> does not exist, a new equipment item will be created.</li>
                            <li>Your CSV file must contain the following headers: <code className="text-xs bg-gray-200 dark:bg-gray-600 dark:text-gray-200 p-1 rounded">{REQUIRED_HEADERS.join(', ')}</code></li>
                             <li>An optional <code className="text-xs bg-gray-200 dark:bg-gray-600 dark:text-gray-200 p-1 rounded">imageUrl</code> column can be included with a public URL to a photo.</li>
                            <li>
                                <button onClick={handleDownloadTemplate} className="text-brand-primary dark:text-brand-accent hover:underline font-semibold">
                                    Download Template
                                </button>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <label htmlFor="csv-file-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select CSV File</label>
                        <input
                            id="csv-file-input"
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/40 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/60"
                        />
                    </div>

                    {parseError && <p className="text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300 p-3 rounded-md text-sm">{parseError}</p>}
                    
                    {importResult && (
                        <div className="p-4 rounded-md bg-gray-50 dark:bg-gray-700/50">
                            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Import Results</h3>
                             <p className={`text-sm ${importResult.errors.length > 0 ? 'text-yellow-800 dark:text-yellow-300' : 'text-green-800 dark:text-green-300'}`}>
                                Import complete: {importResult.createdCount} items added, {importResult.updatedCount} items updated.
                                {importResult.errors.length > 0 && ` Failed to import ${importResult.errors.length} items.`}
                            </p>
                            {importResult.errors.length > 0 && (
                                <div className="mt-2 border-t dark:border-gray-600 pt-2 max-h-40 overflow-y-auto">
                                    <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-1">Errors:</p>
                                    <ul className="list-disc list-inside text-xs text-red-600 dark:text-red-400 space-y-1">
                                        {importResult.errors.map((err, index) => (
                                            <li key={index}>Gage ID <code className="bg-red-100 dark:bg-red-900/40 p-0.5 rounded">{err.rowData?.gageId || 'N/A'}</code>: {err.message}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-8 flex justify-end space-x-3">
                    <button type="button" onClick={handleClose} disabled={isSubmitting} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
                        {importResult ? 'Close' : 'Cancel'}
                    </button>
                    <button 
                        type="button" 
                        onClick={handleSubmit} 
                        disabled={!file || isSubmitting || !!importResult} 
                        className="bg-brand-primary text-white font-bold py-2 px-4 rounded-md hover:bg-blue-800 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Importing...' : 'Import'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EquipmentImportModal;