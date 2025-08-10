import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Visit } from '../../types';
import { 
  User, 
  Calendar, 
  Phone, 
  FileText, 
  Upload, 
  Download,
  Save,
  ArrowLeft,
  Clock,
  CreditCard
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const PatientProfilePage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [pastVisits, setPastVisits] = useState<Visit[]>([]);
  const [notes, setNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [followUpInstructions, setFollowUpInstructions] = useState('');
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);
  const [prescriptionText, setPrescriptionText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (uid) {
      fetchPatientData();
    }
  }, [uid]);

  const fetchPatientData = async () => {
    try {
      // Fetch current visit
      const { data: currentVisit, error: visitError } = await supabase
        .from('visits')
        .select('*')
        .eq('uid', uid)
        .single();

      if (visitError) throw visitError;
      
      setVisit(currentVisit);
      setNotes(currentVisit.notes || '');
      setDiagnosis(currentVisit.diagnosis || '');
      setTreatmentPlan(currentVisit.treatment_plan || '');
      setFollowUpInstructions(currentVisit.follow_up_instructions || '');

      // Fetch past visits for the same patient (by name and phone)
      let pastVisitsQuery = supabase
        .from('visits')
        .select('*')
        .eq('name', currentVisit.name)
        .neq('id', currentVisit.id)
        .order('created_at', { ascending: false });

      if (currentVisit.phone) {
        pastVisitsQuery = pastVisitsQuery.eq('phone', currentVisit.phone);
      }

      const { data: pastVisitsData, error: pastError } = await pastVisitsQuery;
      
      if (!pastError) {
        setPastVisits(pastVisitsData || []);
      }
    } catch (error) {
      console.error('Error fetching patient data:', error);
      toast.error('Patient not found');
      navigate('/admin/queue');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAllNotes = async () => {
    if (!visit) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('visits')
        .update({ 
          notes,
          diagnosis,
          treatment_plan: treatmentPlan,
          follow_up_instructions: followUpInstructions,
          updated_at: new Date().toISOString()
        })
        .eq('id', visit.id);

      if (error) throw error;

      toast.success('All notes saved successfully');
      setVisit({ 
        ...visit, 
        notes, 
        diagnosis, 
        treatment_plan: treatmentPlan,
        follow_up_instructions: followUpInstructions
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async () => {
    if (!visit || !prescriptionFile) return;

    setSaving(true);
    try {
      // Create prescription record
      const fileExt = prescriptionFile.name.split('.').pop();
      const fileName = `${visit.uid}_prescription_${Date.now()}.${fileExt}`;
      
      // For demo purposes, create a downloadable prescription URL
      const prescriptionUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(
        `PRESCRIPTION\n\nPatient: ${visit.name}\nUID: ${visit.uid}\nDate: ${new Date().toLocaleDateString()}\n\nPrescription:\n${prescriptionText}\n\nDoctor: ${visit.name}\nSignature: Dr. Signature`
      )}`;

      // Create prescription record
      const { data: prescription, error: prescriptionError } = await supabase
        .from('prescriptions')
        .insert({
          visit_id: visit.id,
          patient_name: visit.name,
          patient_uid: visit.uid,
          doctor_name: 'Dr. Sarah Johnson',
          prescription_date: new Date().toISOString().split('T')[0],
          instructions: prescriptionText,
          file_url: prescriptionUrl,
          file_name: fileName,
          file_size: prescriptionFile.size,
          file_type: prescriptionFile.type
        })
        .select()
        .single();

      if (prescriptionError) throw prescriptionError;

      // Update visit with prescription reference
      const { error: visitError } = await supabase
        .from('visits')
        .update({ 
          prescription_id: prescription.id,
          prescription_url: prescriptionUrl,
          prescription_notes: prescriptionText,
          updated_at: new Date().toISOString()
        })
        .eq('id', visit.id);

      if (visitError) throw visitError;

      toast.success('Prescription uploaded successfully');
      setVisit({ 
        ...visit, 
        prescription_id: prescription.id,
        prescription_url: prescriptionUrl,
        prescription_notes: prescriptionText
      });
      setPrescriptionFile(null);
      setPrescriptionText('');
    } catch (error) {
      console.error('Error uploading prescription:', error);
      toast.error('Failed to upload prescription');
    } finally {
      setSaving(false);
    }
  };

  const updateVisitStatus = async (status: string) => {
    if (!visit) return;

    try {
      const updateData: any = { visit_status: status };
      
        updated_at: new Date().toISOString()
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.consultation_end_time = new Date().toISOString();
      } else if (status === 'in_consultation') {
        updateData.consultation_start_time = new Date().toISOString();
      }

      const { error } = await supabase
        .from('visits')
        .update(updateData)
        .eq('id', visit.id);

      if (error) throw error;

      toast.success('Visit status updated');
      setVisit({ ...visit, ...updateData });
    } catch (error) {
      console.error('Error updating visit status:', error);
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

  if (!visit) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Patient Not Found</h1>
        <button
          onClick={() => navigate('/admin/queue')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Queue
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/admin/queue')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Profile</h1>
          <p className="text-gray-600 mt-1">Managing visit for {visit.name}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Patient Information */}
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Patient Information</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(visit.visit_status)}`}>
              {visit.visit_status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">UID</label>
                <div className="font-mono font-semibold text-blue-600">{visit.uid}</div>
              </div>
              <div>
                <label className="text-sm text-gray-600">Token</label>
                <div className="font-semibold">#{visit.token_number}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <User className="w-8 h-8 text-blue-600" />
              <div>
                <div className="font-semibold text-gray-900">{visit.name}</div>
                {visit.age && <div className="text-gray-600">{visit.age} years old</div>}
              </div>
            </div>

            {visit.phone && (
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <Phone className="w-6 h-6 text-green-600" />
                <div>
                  <div className="text-sm text-gray-600">Phone Number</div>
                  <div className="font-semibold text-gray-900">{visit.phone}</div>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
              <div>
                <div className="text-sm text-gray-600">Visit Date & Time</div>
                <div className="font-semibold text-gray-900">
                  {format(new Date(visit.created_at), 'PPp')}
                </div>
              </div>
            </div>

            {visit.reason && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-600">Reason for Visit</span>
                </div>
                <div className="text-gray-900">{visit.reason}</div>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-yellow-600" />
                <span className="text-sm text-gray-600">Payment Status</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                visit.payment_status === 'paid' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {visit.payment_status}
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              {visit.visit_status === 'arrived' && (
                <button
                  onClick={() => updateVisitStatus('in_consultation')}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  Start Consultation
                </button>
              )}
              
              {visit.visit_status === 'in_consultation' && (
                <button
                  onClick={() => updateVisitStatus('completed')}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  Complete Visit
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Doctor's Section */}
        <div className="space-y-6">
          {/* Consultation Notes */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Consultation Notes</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  General Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="General consultation notes and observations..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnosis
                </label>
                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  rows={2}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Patient diagnosis..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Treatment Plan
                </label>
                <textarea
                  value={treatmentPlan}
                  onChange={(e) => setTreatmentPlan(e.target.value)}
                  rows={3}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Recommended treatment plan..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Follow-up Instructions
                </label>
                <textarea
                  value={followUpInstructions}
                  onChange={(e) => setFollowUpInstructions(e.target.value)}
                  rows={2}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Follow-up care instructions..."
                />
              </div>
            </div>
            
            <button
              onClick={handleSaveAllNotes}
              disabled={saving}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save All Notes'}</span>
            </button>
          </div>

          {/* Prescription Upload */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Prescription</h2>
            
            {visit.prescription_url ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-6 h-6 text-green-600" />
                    <div>
                      <div className="font-semibold text-green-800">Prescription Available</div>
                      <div className="text-sm text-green-600">Uploaded and accessible to patient</div>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = visit.prescription_url!;
                    link.download = `prescription_${visit.uid}.txt`;
                    link.click();
                  }}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Download Prescription</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prescription Details
                  </label>
                  <textarea
                    value={prescriptionText}
                    onChange={(e) => setPrescriptionText(e.target.value)}
                    rows={6}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Enter prescription details, medications, dosage, instructions..."
                  />
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setPrescriptionFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-sm text-gray-500">Upload PDF, JPG, or PNG files (optional)</p>
                  </div>
                </div>

                {(prescriptionFile || prescriptionText.trim()) && (
                  <button
                    onClick={handleFileUpload}
                    disabled={saving}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    <Upload className="w-5 h-5" />
                    <span>{saving ? 'Creating...' : 'Create Prescription'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Past Visits */}
      {pastVisits.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Visit History</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">UID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pastVisits.map((pastVisit) => (
                  <tr key={pastVisit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(pastVisit.created_at), 'PP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-blue-600">{pastVisit.uid}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {pastVisit.reason || 'No reason specified'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(pastVisit.visit_status)}`}>
                        {pastVisit.visit_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {pastVisit.notes || 'No notes'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};