import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Visit } from '../types';
import { Search, Download, Calendar, User, Phone, FileText, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const VisitPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [uid, setUid] = useState(searchParams.get('uid') || '');
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (uid) {
      handleSearch();
    }
  }, [uid]);

  const handleSearch = async () => {
    if (!uid.trim()) {
      toast.error('Please enter a valid UID');
      return;
    }

    setLoading(true);
    try {
      // Check if we're using demo mode
      const isDemo = import.meta.env.VITE_SUPABASE_URL === 'https://demo.supabase.co' || 
                     !import.meta.env.VITE_SUPABASE_URL ||
                     import.meta.env.VITE_SUPABASE_ANON_KEY === 'demo-key';
      
      let data = null;
      let error = null;
      
      if (isDemo) {
        const allVisits = JSON.parse(localStorage.getItem('demo_visits') || '[]');
        data = allVisits.find((visit: any) => visit.uid === uid);
        if (!data) {
          error = { code: 'PGRST116' };
        }
      } else {
        const result = await supabase
          .from('visits')
          .select('*')
          .eq('uid', uid)
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) {
        if (error.code === 'PGRST116') {
          toast.error('Visit not found. Please check your UID.');
          setVisit(null);
          return;
        }
        throw error;
      }

      setVisit(data);
      setSearchParams({ uid });
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to fetch visit details');
    } finally {
      setLoading(false);
    }
  };

  const downloadPrescription = () => {
    if (visit?.prescription_url) {
      const link = document.createElement('a');
      link.href = visit.prescription_url;
      link.download = `prescription_${visit.uid}.txt`;
      link.click();
    } else {
      toast.error('Prescription not available yet');
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'upcoming':
        return { color: 'text-blue-600 bg-blue-100', text: 'Upcoming' };
      case 'arrived':
        return { color: 'text-green-600 bg-green-100', text: 'Checked In' };
      case 'in_consultation':
        return { color: 'text-purple-600 bg-purple-100', text: 'In Progress' };
      case 'completed':
        return { color: 'text-gray-600 bg-gray-100', text: 'Completed' };
      case 'cancelled':
        return { color: 'text-red-600 bg-red-100', text: 'Cancelled' };
      default:
        return { color: 'text-gray-600 bg-gray-100', text: status };
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">View My Visit</h1>
        <p className="text-gray-600">Access your visit details and download prescriptions</p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter your UID to view visit details
            </label>
            <input
              type="text"
              value={uid}
              onChange={(e) => setUid(e.target.value.toUpperCase())}
              placeholder="e.g., XC-001"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
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
            <span>{loading ? 'Searching...' : 'View Visit'}</span>
          </button>
        </div>
      </div>

      {/* Visit Details */}
      {visit && (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Visit Information */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Visit Information</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusInfo(visit.visit_status).color}`}>
                {getStatusInfo(visit.visit_status).text}
              </span>
            </div>

            <div className="space-y-4">
              {/* UID */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">UID</span>
                <span className="font-mono font-semibold text-blue-600">{visit.uid}</span>
              </div>

              {/* Token Number */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Token Number</span>
                <span className="font-semibold">#{visit.token_number}</span>
              </div>

              {/* Visit Date */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Visit Date
                </span>
                <span>{format(new Date(visit.created_at), 'PPP')}</span>
              </div>

              {/* Visit Time */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Visit Time</span>
                <span>{format(new Date(visit.created_at), 'pp')}</span>
              </div>

              {/* Patient Name */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600 flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  Patient Name
                </span>
                <span className="font-semibold">{visit.name}</span>
              </div>

              {/* Age */}
              {visit.age && (
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Age</span>
                  <span>{visit.age} years</span>
                </div>
              )}

              {/* Phone */}
              {visit.phone && (
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    Phone
                  </span>
                  <span>{visit.phone}</span>
                </div>
              )}

              {/* Reason */}
              {visit.reason && (
                <div className="py-3 border-b border-gray-100">
                  <span className="text-gray-600 flex items-center mb-2">
                    <FileText className="w-4 h-4 mr-1" />
                    Reason for Visit
                  </span>
                  <p className="text-gray-900">{visit.reason}</p>
                </div>
              )}

              {/* Payment Information */}
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-600 flex items-center">
                  <CreditCard className="w-4 h-4 mr-1" />
                  Payment Status
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(visit.payment_status)}`}>
                  {visit.payment_status === 'paid' ? 'Paid' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Prescription & Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Prescription & Notes</h2>

            {visit.prescription_url ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-800">Prescription Available</h4>
                      <p className="text-sm text-green-600">Your digital prescription is ready</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={downloadPrescription}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-green-700 transition-all flex items-center justify-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Prescription</span>
                </button>
              </div>
            ) : (
              <div className="p-6 text-center bg-gray-50 rounded-lg">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-600 mb-2">Prescription Not Available</h4>
                <p className="text-sm text-gray-500">
                  {visit.visit_status === 'completed' 
                    ? 'No prescription was issued for this visit'
                    : 'Prescription will be available after consultation'
                  }
                </p>
              </div>
            )}

            {/* Doctor's Notes */}
            {visit.notes && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Doctor's Notes</h4>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-gray-700">{visit.notes}</p>
                </div>
              </div>
            )}

            {/* Visit Timeline */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Visit Timeline</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Booked</div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(visit.created_at), 'PPp')}
                    </div>
                  </div>
                </div>

                {visit.arrived_at && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Checked In</div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(visit.arrived_at), 'PPp')}
                      </div>
                    </div>
                  </div>
                )}

                {visit.completed_at && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">Completed</div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(visit.completed_at), 'PPp')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions for new users */}
      {!visit && !loading && (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Enter Your UID to View Visit</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Your UID was provided when you booked your visit. Use it to access your complete visit information and download prescriptions.
          </p>
          <div className="flex justify-center space-x-4 text-sm text-gray-500">
            <span>• View visit timeline</span>
            <span>• Download prescriptions</span>
            <span>• Access doctor's notes</span>
          </div>
        </div>
      )}
    </div>
  );
};