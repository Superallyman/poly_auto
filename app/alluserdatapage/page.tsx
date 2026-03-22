// /customhook/page.tsx
'use client';

import React from "react";
import { useUserData } from "@/hooks/useUserData";

export default function CustomHookPage() {
  const { data, loading, error, refetch } = useUserData();

  console.log("Custom Hook Data:", data);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-blue-500">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
            <button 
              onClick={refetch}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">User Data Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Summary Cards */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Doctors</h3>
            <p className="text-3xl font-bold text-blue-600">{data.doctors?.length || 0}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Locations</h3>
            <p className="text-3xl font-bold text-green-600">{data.locations?.length || 0}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Staff</h3>
            <p className="text-3xl font-bold text-purple-600">{data.staff?.length || 0}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Topics</h3>
            <p className="text-3xl font-bold text-orange-600">{data.topics?.length || 0}</p>
          </div>
        </div>

        {/* Data Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Doctors Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Doctors</h2>
            {data.doctors && data.doctors.length > 0 ? (
              <div className="space-y-2">
                {data.doctors.slice(0, 5).map((doctor, index) => (
                  <div key={doctor.id || index} className="p-2 bg-gray-50 rounded">
                    <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(doctor, null, 2)}
                    </pre>
                  </div>
                ))}
                {data.doctors.length > 5 && (
                  <p className="text-sm text-gray-500">... and {data.doctors.length - 5} more</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No doctors found</p>
            )}
          </div>

          {/* Locations Section */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Locations</h2>
            {data.locations && data.locations.length > 0 ? (
              <div className="space-y-2">
                {data.locations.slice(0, 5).map((location, index) => (
                  <div key={location.id || index} className="p-2 bg-gray-50 rounded">
                    <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                      {JSON.stringify(location, null, 2)}
                    </pre>
                  </div>
                ))}
                {data.locations.length > 5 && (
                  <p className="text-sm text-gray-500">... and {data.locations.length - 5} more</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No locations found</p>
            )}
          </div>
        </div>

        {/* Raw Data Section (for debugging) */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Raw Data (Debug)</h2>
          <div className="bg-gray-50 p-4 rounded overflow-auto max-h-96">
            <pre className="text-sm text-gray-600">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>

        {/* Refetch Button */}
        <div className="mt-6 text-center">
          <button 
            onClick={refetch}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}