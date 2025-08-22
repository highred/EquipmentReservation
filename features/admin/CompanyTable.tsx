
import React from 'react';
import { Company } from '../../types';
import { PencilIcon, TrashIcon } from '../../components/icons/Icons';

interface CompanyTableProps {
    companies: Company[];
    onEdit: (company: Company) => void;
    onDelete: (company: Company) => void;
}

const CompanyTable: React.FC<CompanyTableProps> = ({ companies, onEdit, onDelete }) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                        <th scope="col" className="relative px-6 py-3">
                            <span className="sr-only">Actions</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {companies.map((company) => (
                        <tr key={company.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{company.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-3">
                                    <button onClick={() => onEdit(company)} className="p-2 text-gray-500 hover:text-brand-primary transition-colors" aria-label="Edit Company">
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => onDelete(company)} className="p-2 text-gray-500 hover:text-status-danger transition-colors" aria-label="Delete Company">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                     {companies.length === 0 && (
                        <tr>
                            <td colSpan={2} className="text-center py-8 text-gray-500">
                                No companies found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default CompanyTable;
