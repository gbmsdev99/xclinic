import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Visit, ClinicSettings } from '../../types';
import { Users, Clock, CreditCard, Calendar, TrendingUp, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const AdminDashboardPage: React.FC = () => {
  const [todayVisits, setTodayVisits] = useState<Visit[]>([]);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null);
  const [stats, setStats] = useState({
    totalToday: 0,
    waiting: 0,
    completed: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Subscribe to real-time updates
    const visitsSubscription = supabase
      .channel('admin-visits')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'visits' },
        (payload) => {
          console.log('Visits update:', payload);
          fetchTodayVisits();
        }
      )
      .subscribe();

    return () => {
      visitsSubscription.unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    try {
      await Promise.all([fetchTodayVisits(), fetchClinicSettings()]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayVisits = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('visits')
      .select('*')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    setTodayVisits(data || []);
    calculateStats(data || []);
  };

  const fetchClinicSettings = async () => {
    const { data, error } = await supabase
      .from('clinic_settings')
      .select('*')
      .single();

    if (error) throw error;
    setClinicSettings(data);
  };

  const calculateStats = (visits: Visit[]) => {
    const totalToday = visits.length;
    const waiting = visits.filter(v => ['upcoming', 'arrived'].includes(v.visit_status)).length;
    const completed = visits.filter(v => v.visit_status === 'completed').length;
    const totalRevenue = visits
      .filter(v => v.payment_status === 'paid')
      .reduce((sum, v) => sum + (clinicSettings?.consultation_fee || 500), 0);

    setStats({ totalToday, waiting, completed, totalRevenue });
  };

  const quickMarkArrived = async (visitId: string) => {
    try {
      await supabase
        .from('visits')
        .update({ 
          visit_status: 'arrived', 
          arrived_at: new Date().toISOString() 
        })
        .eq('id', visitId);
      
      toast.success('Patient marked as arrived');
      fetchTodayVisits();
    } catch (error) {
      console.error('Error marking arrived:', error);
      toast.error('Failed to update visit status');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome to {clinicSettings?.clinic_name} Admin Panel
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">Today's Date</div>
          <div className="text-lg font-semibold text-gray-900">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.totalToday}</div>
              <div className="text-sm text-gray-600">Total Visits Today</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-yellow-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.waiting}</div>
              <div className="text-sm text-gray-600">Currently Waiting</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-green-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completed Today</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-100">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue}</div>
              <div className="text-sm text-gray-600">Revenue Today</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Link
          to="/admin/queue"
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Manage Queue</h3>
              <p className="text-gray-600">View and manage live patient queue</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/payments"
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Payment Records</h3>
              <p className="text-gray-600">Track payments and transactions</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/settings"
          className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Clinic Settings</h3>
              <p className="text-gray-600">Update clinic information</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Visits */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Today's Visits</h2>
            <Link
              to="/admin/queue"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View All →
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  UID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {todayVisits.slice(0, 10).map((visit) => (
                <tr key={visit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{visit.name}</div>
                    {visit.age && (
                      <div className="text-sm text-gray-500">{visit.age} years</div>
                    )}
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(visit.visit_status)}`}>
                      {visit.visit_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      visit.payment_status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {visit.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {visit.visit_status === 'upcoming' && (
                      <button
                        onClick={() => quickMarkArrived(visit.id)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Mark Arrived
                      </button>
                    )}
                    <Link
                      to={`/admin/patient/${visit.uid}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {todayVisits.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No visits today</h3>
              <p className="text-gray-500">Visits will appear here as patients book appointments</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};