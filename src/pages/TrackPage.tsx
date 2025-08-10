import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Visit, QueueSummary } from '../types';
import { Search, Clock, Users, RefreshCw, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const TrackPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [uid, setUid] = useState(searchParams.get('uid') || '');
  const [visit, setVisit] = useState<Visit | null>(null);
  const [queueSummary, setQueueSummary] = useState<QueueSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (uid) {
      handleSearch();
    }
  }, [uid]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (autoRefresh && visit) {
      interval = setInterval(() => {
        fetchVisit(uid);
        fetchQueueSummary();
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, visit, uid]);

  const handleSearch = async () => {
    if (!uid.trim()) {
      toast.error('Please enter a valid UID');
      return;
    }

    setLoading(true);
    try {
      await Promise.all([fetchVisit(uid), fetchQueueSummary()]);
      setSearchParams({ uid });
      setAutoRefresh(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisit = async (visitUid: string) => {
    // Check if we're using demo mode
    const isDemo = import.meta.env.VITE_SUPABASE_URL === 'https://demo.supabase.co' || 
                   !import.meta.env.VITE_SUPABASE_URL ||
                   import.meta.env.VITE_SUPABASE_ANON_KEY === 'demo-key';
    
    let data = null;
    let error = null;
    
    if (isDemo) {
      const allVisits = JSON.parse(localStorage.getItem('demo_visits') || '[]');
      data = allVisits.find((visit: any) => visit.uid === visitUid);
      if (!data) {
        error = { code: 'PGRST116' };
      }
    } else {
      const result = await supabase
        .from('visits')
        .select('*')
        .eq('uid', visitUid)
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
  };

  const fetchQueueSummary = async () => {
    // Check if we're using demo mode
    const isDemo = import.meta.env.VITE_SUPABASE_URL === 'https://demo.supabase.co' || 
                   !import.meta.env.VITE_SUPABASE_URL ||
                   import.meta.env.VITE_SUPABASE_ANON_KEY === 'demo-key';
    
    let data = null;
    let error = null;
    
    if (isDemo) {
      const storedSummary = localStorage.getItem('demo_queue_summary');
      if (storedSummary) {
        data = JSON.parse(storedSummary);
      } else {
        data = {
          id: '1',
          date: new Date().toISOString().split('T')[0],
          total_appointments: 0,
          total_waiting: 0,
          total_completed: 0,
          total_cancelled: 0,
          estimated_wait_time: 0,
          average_consultation_time: 15,
          total_revenue: 0,
          updated_at: new Date().toISOString()
        };
      }
    } else {
      const result = await supabase
        .from('queue_summary')
        .select('*')
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) throw error;
    setQueueSummary(data);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'upcoming':
        return { color: 'text-blue-600 bg-blue-100', text: 'Waiting in Queue' };
      case 'arrived':
        return { color: 'text-green-600 bg-green-100', text: 'Checked In' };
      case 'in_consultation':
        return { color: 'text-purple-600 bg-purple-100', text: 'In Consultation' };
      case 'completed':
        return { color: 'text-gray-600 bg-gray-100', text: 'Completed' };
      case 'cancelled':
        return { color: 'text-red-600 bg-red-100', text: 'Cancelled' };
      default:
        return { color: 'text-gray-600 bg-gray-100', text: status };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Track My Turn</h1>
        <p className="text-gray-600">Monitor your queue position and estimated wait time</p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter your UID to track your position
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
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            <span>{loading ? 'Searching...' : 'Track'}</span>
          </button>
        </div>
      </div>

      {/* Results */}
      {visit && (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Visit Status */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Your Visit Status</h2>
              {autoRefresh && (
                <div className="flex items-center text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  Auto-updating
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
                <div className="text-3xl font-mono font-bold text-blue-600 mb-2">
                  {visit.uid}
                </div>
                <div className="text-sm text-gray-600">Your Unique ID</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">#{visit.token_number}</div>
                  <div className="text-sm text-gray-600">Token Number</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{visit.queue_position}</div>
                  <div className="text-sm text-gray-600">Queue Position</div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusInfo(visit.visit_status).color}`}>
                  {getStatusInfo(visit.visit_status).text}
                </span>
              </div>

              {visit.estimated_time && (
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                  <div className="font-semibold text-blue-600">Estimated Wait</div>
                  <div className="text-blue-600">{visit.estimated_time}</div>
                </div>
              )}
            </div>
          </div>

          {/* Queue Information */}
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Live Queue Info</h2>

            <div className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">
                  {queueSummary?.total_waiting || 0}
                </div>
                <div className="text-sm text-gray-600">People Waiting</div>
              </div>

              {queueSummary?.current_token && (
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                  <div className="font-semibold text-green-600">Currently Being Seen</div>
                  <div className="text-green-600">Token #{queueSummary.current_token}</div>
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <Clock className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                  <div className="font-semibold text-gray-600">Average Wait</div>
                  <div className="text-gray-600">{queueSummary?.estimated_wait_time || 0} minutes</div>
                </div>
              </div>
            </div>

            {/* Status-based Instructions */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Next Steps:</h4>
              {visit.visit_status === 'upcoming' && (
                <p className="text-yellow-700 text-sm">
                  You're in the queue! Monitor this page and arrive 10 minutes before your estimated time.
                </p>
              )}
              {visit.visit_status === 'arrived' && (
                <p className="text-yellow-700 text-sm">
                  You've checked in successfully. Please wait for your turn in the consultation room.
                </p>
              )}
              {visit.visit_status === 'completed' && (
                <p className="text-yellow-700 text-sm">
                  Your consultation is complete. Check your visit details for prescriptions and follow-up instructions.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions for new users */}
      {!visit && !loading && (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Enter Your UID to Track</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Your UID was provided when you booked your visit. It looks like "XC-001" or similar.
          </p>
          <div className="flex justify-center space-x-4 text-sm text-gray-500">
            <span>• Check your booking confirmation</span>
            <span>• Look for SMS/email notification</span>
            <span>• Ask at reception if needed</span>
          </div>
        </div>
      )}
    </div>
  );
};