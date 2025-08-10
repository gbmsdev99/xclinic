import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Visit, ClinicSettings } from '../../types';
import { CreditCard, Calendar, Download, Filter, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const AdminPaymentsPage: React.FC = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<Visit[]>([]);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null);
  const [dateFilter, setDateFilter] = useState('today');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [stats, setStats] = useState({
    totalRevenue: 0,
    paidCount: 0,
    pendingCount: 0,
    onlineCount: 0,
    clinicCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterVisits();
  }, [visits, dateFilter, paymentFilter]);

  const fetchData = async () => {
    try {
      await Promise.all([fetchVisits(), fetchClinicSettings()]);
    } catch (error) {
      console.error('Error fetching payments data:', error);
      toast.error('Failed to load payments data');
    } finally {
      setLoading(false);
    }
  };

  const fetchVisits = async () => {
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setVisits(data || []);
  };

  const fetchClinicSettings = async () => {
    const { data, error } = await supabase
      .from('clinic_settings')
      .select('*')
      .single();

    if (error) throw error;
    setClinicSettings(data);
  };

  const filterVisits = () => {
    let filtered = visits;

    // Date filter
    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(visit => 
        visit.created_at.split('T')[0] === today
      );
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(visit => 
        new Date(visit.created_at) >= weekAgo
      );
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(visit => 
        new Date(visit.created_at) >= monthAgo
      );
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(visit => visit.payment_status === paymentFilter);
    }

    setFilteredVisits(filtered);
    calculateStats(filtered);
  };

  const calculateStats = (filteredData: Visit[]) => {
    const fee = clinicSettings?.consultation_fee || 500;
    
    const totalRevenue = filteredData
      .filter(v => v.payment_status === 'paid')
      .reduce((sum, v) => sum + fee, 0);
      
    const paidCount = filteredData.filter(v => v.payment_status === 'paid').length;
    const pendingCount = filteredData.filter(v => v.payment_status === 'pending').length;
    const onlineCount = filteredData.filter(v => v.payment_method === 'online').length;
    const clinicCount = filteredData.filter(v => v.payment_method === 'clinic').length;

    setStats({
      totalRevenue,
      paidCount,
      pendingCount,
      onlineCount,
      clinicCount,
    });
  };

  const updatePaymentStatus = async (visitId: string, status: 'paid' | 'pending') => {
    try {
      await supabase
        .from('visits')
        .update({ payment_status: status })
        .eq('id', visitId);

      toast.success('Payment status updated');
      fetchVisits();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  };

  const exportToCSV = () => {
    const csvData = filteredVisits.map(visit => ({
      Date: format(new Date(visit.created_at), 'yyyy-MM-dd HH:mm'),
      UID: visit.uid,
      'Patient Name': visit.name,
      'Payment Method': visit.payment_method,
      'Payment Status': visit.payment_status,
      Amount: clinicSettings?.consultation_fee || 500,
      'Visit Status': visit.visit_status,
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Records</h1>
          <p className="text-gray-600 mt-1">Track and manage all payment transactions</p>
        </div>
        <button
          onClick={exportToCSV}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <Download className="w-5 h-5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 border border-green-100">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <div className="text-lg font-bold text-gray-900">₹{stats.totalRevenue}</div>
              <div className="text-xs text-gray-600">Total Revenue</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 border border-blue-100">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <div className="text-lg font-bold text-gray-900">{stats.paidCount}</div>
              <div className="text-xs text-gray-600">Paid</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 border border-yellow-100">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <div className="text-lg font-bold text-gray-900">{stats.pendingCount}</div>
              <div className="text-xs text-gray-600">Pending</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 border border-purple-100">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-xs font-semibold text-purple-600">ON</span>
            </div>
            <div className="ml-3">
              <div className="text-lg font-bold text-gray-900">{stats.onlineCount}</div>
              <div className="text-xs text-gray-600">Online</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-xs font-semibold text-gray-600">CL</span>
            </div>
            <div className="ml-3">
              <div className="text-lg font-bold text-gray-900">{stats.clinicCount}</div>
              <div className="text-xs text-gray-600">At Clinic</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-400" />
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Period:</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="today">Today</option>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Payment:</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="ml-auto text-sm text-gray-600">
            Showing {filteredVisits.length} transactions
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVisits.map((visit) => (
                <tr key={visit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(visit.created_at), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(visit.created_at), 'h:mm a')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{visit.name}</div>
                    {visit.phone && (
                      <div className="text-sm text-gray-500">{visit.phone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-blue-600">{visit.uid}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      ₹{clinicSettings?.consultation_fee || 500}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      visit.payment_method === 'online' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {visit.payment_method === 'online' ? 'Online' : 'At Clinic'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      visit.payment_status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {visit.payment_status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {visit.payment_status === 'pending' ? (
                      <button
                        onClick={() => updatePaymentStatus(visit.id, 'paid')}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Mark Paid
                      </button>
                    ) : (
                      <button
                        onClick={() => updatePaymentStatus(visit.id, 'pending')}
                        className="text-yellow-600 hover:text-yellow-900 mr-3"
                      >
                        Mark Pending
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredVisits.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No payment records found</h3>
              <p className="text-gray-500">
                Payment transactions will appear here as patients book appointments
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};