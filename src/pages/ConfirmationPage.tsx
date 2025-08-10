import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, generateQRData } from '../lib/supabase';
import { Visit } from '../types';
import { QRCodeGenerator } from '../components/QRCodeGenerator';
import { CheckCircle, Calendar, Clock, CreditCard, MapPin, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export const ConfirmationPage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (uid) {
      fetchVisit();
    }
  }, [uid]);

  const fetchVisit = async () => {
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

      if (error) throw error;
      setVisit(data);
    } catch (error) {
      console.error('Error fetching visit:', error);
      toast.error('Visit not found');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!visit) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Visit Not Found</h1>
        <p className="text-gray-600 mb-6">The visit ID you're looking for doesn't exist.</p>
        <Link
          to="/"
          className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span>Go Home</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const qrData = generateQRData(visit.uid, visit.id);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Success Header */}
      <div className="text-center bg-white rounded-2xl shadow-lg p-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
        <p className="text-gray-600">Your appointment has been successfully scheduled</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Visit Details */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-3">
            Visit Details
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">UID</span>
              <span className="font-mono text-lg font-semibold text-blue-600">{visit.uid}</span>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Token Number</span>
              <span className="text-lg font-semibold">#{visit.token_number}</span>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Name</span>
              <span className="font-semibold">{visit.name}</span>
            </div>
            
            {visit.age && (
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Age</span>
                <span>{visit.age} years</span>
              </div>
            )}
            
            {visit.phone && (
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Phone</span>
                <span>{visit.phone}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Queue Position</span>
              <span className="font-semibold">{visit.queue_position}</span>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Estimated Time</span>
              <span className="font-semibold text-blue-600">{visit.estimated_time}</span>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Payment Status</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(visit.payment_status)}`}>
                {visit.payment_status === 'paid' ? 'Paid' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="space-y-6">
          <QRCodeGenerator data={qrData} uid={visit.uid} />
          
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to={`/track?uid=${visit.uid}`}
                className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
              >
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900">Track My Turn</div>
                  <div className="text-sm text-gray-600">Monitor queue position</div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              
              <Link
                to={`/visit?uid=${visit.uid}`}
                className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
              >
                <Calendar className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium text-gray-900">View Visit Details</div>
                  <div className="text-sm text-gray-600">Access full information</div>
                </div>
                <ArrowRight className="w-4 h-4 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Important Instructions */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="w-5 h-5 text-blue-600 mr-2" />
          Important Instructions
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Save your UID and QR code for check-in</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Track the queue to arrive at the right time</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Bring a valid ID for verification</span>
            </li>
          </ul>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span>Arrive 10 minutes before your estimated time</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span>Show QR code or provide UID at reception</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span>Download prescription after consultation</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};