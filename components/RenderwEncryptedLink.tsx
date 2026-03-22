// component/RenderwEncryptedLink.tsx
"use client";

import React from "react";

// Define the same interfaces as in HomePage for the API response structure
interface Topic {
  id: number;
  created_at: string;
  topic_name: string;
  // Add any other properties your topic objects have
}

interface ApiResponseData {
  doctor: {
    id: number;
    created_at: string;
    doctor_name: string;
    doctor_id: number;
    is_archived: boolean;
    doctor_image: string | null; // Added doctor_image
  };
  locations: Array<{
    id: number;
    created_at: string;
    location_id: number;
    location_name: string;
    location_header: string;
    location_footer: string;
    is_archived: boolean;
    clinic_address: string;
    clinic_phone?: string; // Made optional as it might not always be present
  }>;
  staff: Array<{
    id: number;
    created_at: string;
    staff_id: number;
    staff_name: string;
    staff_contact: string;
    staff_image: string | null;
    is_archived: boolean;
  }>;
  topics: Topic[]; // Now using the specific Topic interface
}

// Now, THIS interface will be used for the 'data' prop of RenderwEncryptedLink
// It includes message, the actual data, and errors.
interface FullApiResponseForComponent {
  message: string;
  data: ApiResponseData;
  errors: string[]; // Assuming errors is an array of strings
  clinicName?: string; // Added clinicName as it was accessed from data
}

// Change the prop type to FullApiResponseForComponent
export const RenderwEncryptedLink: React.FC<{ data: FullApiResponseForComponent }> = ({ data }) => {
  const location = data.data.locations && data.data.locations.length > 0 ? data.data.locations[0] : null;
  const doctor = data.data.doctor || null;
  const staff = data.data.staff && data.data.staff.length > 0 ? data.data.staff[0] : null;

  return (
    <>
      {/* Now data.message will correctly access the message property */}
      <h1>API Message: {data.message}</h1>
      <h2>Raw Data: {JSON.stringify(data.data, null, 2)}</h2> {/* For debugging */}
      <h2>Raw Data: {JSON.stringify(data.data.doctor, null, 2)}</h2> {/* For debugging */}
      {/* CORRECT WAY to access location_name */}
      {doctor && location && <h2>Doctor Name: {doctor.doctor_name}</h2>} {/* Corrected to show doctor name */}
      {location && <h2>Location Name: {location.location_name}</h2>} {/* Added location name */}

      {data.data.topics[1] && <h1>{JSON.stringify(data.data.topics[1].topic_name)}</h1>}


      <div
        className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="report-header text-center mb-6">
          <h1 className="text-3xl font-bold text-indigo-700 dark:text-indigo-400">{data.clinicName || "Eye Exam Summary"}</h1>
          {location?.clinic_address && <p className="text-sm text-gray-600 dark:text-gray-400">{location.clinic_address}</p>}
          {location?.clinic_phone && <p className="text-sm text-gray-600 dark:text-gray-400">Phone: {location.clinic_phone}</p>}
        </div>

        <hr className="my-5 border-gray-300 dark:border-gray-600" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mb-5 text-sm provider-info">
          <div className="flex items-center gap-4">
            {doctor?.doctor_image && (
              <img
                src={doctor.doctor_image}
                alt="Doctor"
                className="w-16 h-16 rounded-full border border-gray-300 dark:border-gray-600 object-cover"
              />
            )}
            <p>
              <strong>Doctor:</strong> {doctor?.doctor_name}
            </p>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-1 section-title">Summary of Your Visit</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Topics Discussed: {data.data.topics.length}</p>


        <div className="report-footer mt-10 pt-6 border-t border-gray-300 dark:border-gray-600 text-center">
          {staff && (
            <h3 className="flex items-center space-x-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              {staff.staff_name && (
                <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                  <strong>Scribe:</strong> {staff.staff_name}
                </p>
              )}
              {staff.staff_image && (
                <img
                  src={staff.staff_image}
                  alt="Scribe"
                  className="w-16 h-16 rounded-full border-2 border-gray-300 dark:border-gray-600 object-cover transition-transform transform hover:scale-105"
                />
              )}
              <div className="flex flex-col">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  If you have any questions, please contact <span className="font-semibold text-blue-600">{staff.staff_name}</span> at their email:
                </p>
                <b className="text-sm text-blue-600">{staff.staff_contact}</b>
              </div>
            </h3>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400">Thank you for choosing {data.clinicName || "our clinic"}. We appreciate your trust in our care.</p>
        </div>
      </div>
    </>
  );
};