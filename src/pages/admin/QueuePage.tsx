import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase, updateQueueSummary, parseQRData } from '../../lib/supabase';
import { Visit } from '../../types';
import { QRScanner } from '../../components/QRScanner';
import { 
  Users, 
  Search, 
  QrCode, 
  Clock, 
  CheckCircle, 
  X, 
  Phone,
  CreditCard,
  UserCheck,
  PlayCircle
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const AdminQueuePage: React.FC = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [filteredVisits, setFilteredVisits] = useState<Visit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVisits();
    
    // Subscribe to real-time updates
    const visitsSubscription = supabase
      .channel('queue-visits')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'visits' },
        (payload) => {
          console.log('Queue update:', payload);
          fetchVisits();
        }
      )
      .subscribe();

    return () => {
      visitsSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    filterVisits();
  }, [visits, searchTerm, statusFilter]);

  const fetchVisits = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`)
        .order('token_number', { ascending: true });

      if (error) throw error;
      setVisits(data || []);
    } catch (error) {
      console.error('Error fetching visits:', error);
      toast.error('Failed to load queue data');
    } finally {
      setLoading(false);
    }
  };

  const filterVisits = () => {
    let filtered = visits;

    if (searchTerm) {
      filtered = filtered.filter(
        (visit) =>
          visit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          visit.uid.toLowerCase().includes(searchTerm.toLowerCase()) ||
          visit.phone?.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((visit) => visit.visit_status === statusFilter);
    }

    setFilteredVisits(filtered);
  };

  const updateVisitStatus = async (visitId: string, status: string, additionalData: any = {}) => {
    try {
      const updateData = {
        visit_status: status,
        updated_at: new Date().toISOString(),
        ...additionalData,
      };

      if (status === 'arrived') {
        updateData.arrived_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (status === 'in_consultation') {
        updateData.consultation_start_time = new Date().toISOString();
      } else if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('visits')
        .update(updateData)
        .eq('id', visitId);

      if (error) throw error;

      // Update queue summary
      setTimeout(async () => {
        await updateQueueSummary();
      }, 500);
      
      toast.success('Visit status updated successfully');
      fetchVisits();
    } catch (error) {
      console.error('Error updating visit status:', error);
      toast.error('Failed to update visit status');
    }
  };

  const updatePaymentStatus = async (visitId: string, status: 'paid' | 'pending') => {
    try {
      const updateData: any = { 
        payment_status: status,
        updated_at: new Date().toISOString()
      };

      if (status === 'paid') {
        updateData.payment_id = `pay_${Date.now()}`;
      }

      const { error } = await supabase
        .from('visits')
        .update(updateData)
        .eq('id', visitId);

      if (error) throw error;

      // Update queue summary
      setTimeout(async () => {
        await updateQueueSummary();
      }, 500);

      toast.success('Payment status updated');
      fetchVisits();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    }
  };


  const handleQRScan = (data: string) => {
    const parsed = parseQRData(data);
    
    if (parsed && parsed.uid) {
      setSearchTerm(parsed.uid);
      toast.success(`Found patient: ${parsed.uid}`);
      
      // If we have a visit ID, navigate directly to patient profile
      if (parsed.visitId) {
        window.open(`/admin/patient/${parsed.uid}`, '_blank');
      }
    } else {
      toast.error('Invalid QR code format');
    }
    
    setShowQRScanner(false);
  };

  const cancelVisit = async (visitId: string) => {
    if (window.confirm('Are you sure you want to cancel this visit?')) {
      await updateVisitStatus(visitId, 'cancelled');
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

  const getStatusText = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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
          <h1 className="text-3xl font-bold text-gray-900">Live Queue Management</h1>
          <p className="text-gray-600 mt-1">
            Manage today's patient queue and check-ins
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{filteredVisits.length}</div>
          <div className="text-sm text-gray-600">Total Patients</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, UID, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Waiting</option>
              <option value="arrived">Arrived</option>
              <option value="in_consultation">In Consultation</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* QR Scanner Button */}
          <button
            onClick={() => setShowQRScanner(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <QrCode className="w-5 h-5" />
            <span>Scan QR</span>
          </button>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Token
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UID
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
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
                    <div className="text-lg font-bold text-blue-600">#{visit.token_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{visit.name}</div>
                    <div className="text-sm text-gray-500">
                      {visit.age && `${visit.age} years`}
                      {visit.phone && (
                        <span className="flex items-center mt-1">
                          <Phone className="w-3 h-3 mr-1" />
                          {visit.phone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-blue-600">{visit.uid}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(visit.created_at), 'h:mm a')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(visit.visit_status)}`}>
                      {getStatusText(visit.visit_status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        visit.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {visit.payment_status}
                      </span>
                      {visit.payment_status === 'pending' && (
                        <button
                          onClick={() => updatePaymentStatus(visit.id, 'paid')}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Mark as paid"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {visit.visit_status === 'upcoming' && (
                        <button
                          onClick={() => updateVisitStatus(visit.id, 'arrived')}
                          className="text-green-600 hover:text-green-800 p-1 rounded"
                          title="Mark as arrived"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                      
                      {visit.visit_status === 'arrived' && (
                        <button
                          onClick={() => updateVisitStatus(visit.id, 'in_consultation')}
                          className="text-purple-600 hover:text-purple-800 p-1 rounded"
                          title="Start consultation"
                        >
                          <PlayCircle className="w-4 h-4" />
                        </button>
                      )}

                      {visit.visit_status === 'in_consultation' && (
                        <button
                          onClick={() => updateVisitStatus(visit.id, 'completed')}
                          className="text-gray-600 hover:text-gray-800 p-1 rounded"
                          title="Complete consultation"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}

                      <Link
                        to={`/admin/patient/${visit.uid}`}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded"
                        title="View patient profile"
                      >
                        <Users className="w-4 h-4" />
                      </Link>

                      {['upcoming', 'arrived'].includes(visit.visit_status) && (
                        <button
                          onClick={() => cancelVisit(visit.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded"
                          title="Cancel visit"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredVisits.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No patients found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search filters'
                  : 'Patients will appear here as they book appointments'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
};