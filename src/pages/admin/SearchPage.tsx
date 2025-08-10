import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Visit } from '../../types';
import { Search, User, Calendar, Phone, FileText } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const AdminSearchPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setLoading(true);
    setSearchPerformed(true);

    try {
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,uid.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setSearchResults(data || []);
      
      if (data && data.length === 0) {
        toast.info('No patients found matching your search');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search patients');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      upcoming: 'bg-blue-100 text-blue-800',
      arrived: 'bg-green-100 text-green-800',
      in_consultation: 'bg-purple-100 text-purple-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Search Patients</h1>
        <p className="text-gray-600 mt-1">Find patients by name, UID, or phone number</p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search for patients
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter patient name, UID (e.g., XC-001), or phone number..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            <span>{loading ? 'Searching...' : 'Search'}</span>
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-sm text-gray-600">
          <span className="bg-gray-100 px-3 py-1 rounded-full">💡 Tips:</span>
          <span>Search by full or partial name</span>
          <span>•</span>
          <span>Use UID format: XC-001</span>
          <span>•</span>
          <span>Enter phone number with or without spaces</span>
        </div>
      </div>

      {/* Search Results */}
      {searchPerformed && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Search Results
              {searchResults.length > 0 && (
                <span className="text-base font-normal text-gray-600 ml-2">
                  ({searchResults.length} {searchResults.length === 1 ? 'patient' : 'patients'} found)
                </span>
              )}
            </h2>
          </div>

          {searchResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient Info
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      UID / Token
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Visit Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {searchResults.map((visit) => (
                    <tr key={visit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{visit.name}</div>
                            <div className="text-sm text-gray-500 flex items-center">
                              {visit.age && <span>{visit.age} years</span>}
                              {visit.age && visit.phone && <span className="mx-2">•</span>}
                              {visit.phone && (
                                <span className="flex items-center">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {visit.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-mono text-blue-600">{visit.uid}</div>
                        <div className="text-sm text-gray-500">Token #{visit.token_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(visit.created_at), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(visit.created_at), 'h:mm a')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(visit.visit_status)}`}>
                          {visit.visit_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs">
                          {visit.reason ? (
                            <div className="truncate" title={visit.reason}>
                              {visit.reason}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No reason specified</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/admin/patient/${visit.uid}`}
                          className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                        >
                          <FileText className="w-4 h-4" />
                          <span>View Profile</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No patients found</h3>
              <p className="text-gray-500 mb-4">
                We couldn't find any patients matching "{searchTerm}"
              </p>
              <div className="text-sm text-gray-500 space-y-1">
                <p>Try searching with:</p>
                <div className="flex justify-center space-x-4 mt-2">
                  <span>• Full or partial name</span>
                  <span>• Complete UID (XC-001)</span>
                  <span>• Phone number</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help Section */}
      {!searchPerformed && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Search className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How to Search</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
                <div>
                  <div className="font-medium text-blue-800 mb-1">By Name</div>
                  <p>Search using full or partial patient name. Case insensitive.</p>
                </div>
                <div>
                  <div className="font-medium text-green-800 mb-1">By UID</div>
                  <p>Use the unique identifier format like XC-001, XC-002, etc.</p>
                </div>
                <div>
                  <div className="font-medium text-purple-800 mb-1">By Phone</div>
                  <p>Enter the phone number with or without formatting.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};