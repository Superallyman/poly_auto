"use client";
import React from "react";
import { useUserData } from "@/hooks/useUserData";

// Define types for your data structures
interface Doctor {
  id: string | number;
  doctor_name: string;
  doctor_image: string;
}

interface Staff {
  id: string | number;
  staff_name: string;
  staff_image: string;
  staff_contact: string;
}

interface Location {
  id: string | number;
  location_name: string;
  location_address: string;
  location_phone: string;
  location_header: string;
  location_footer: string;
  setting_toggle_location_address: boolean;
  setting_toggle_location_phone: boolean;
  setting_toggle_location_header: boolean;
  setting_toggle_location_doctor: boolean;
  setting_toggle_location_doctor_image: boolean;
  setting_toggle_location_doctor_bio: boolean;
  setting_toggle_staff: boolean;
  setting_location_toggle_staff_image: boolean;
  setting_location_toggle_staff_contact: boolean;
  setting_location_toggle_location_footer: boolean;
}

interface Topic {
  id: string | number;
  topic_name: string;
  topic_content: string;
}

// Generic type for InfoCard props
interface InfoCardProps<T> {
  title: string;
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  noDataMessage: string;
  extraInfo?: React.ReactNode;
}

// Reusable Card Component for displaying Doctors, Staff, and Topics
const InfoCard = <T,>({ title, data, renderItem, noDataMessage, extraInfo }: InfoCardProps<T>) => (
  // Main card background
  <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
    <h2 className="text-xl font-semibold text-gray-800 mb-4 dark:text-gray-100">{title}</h2>
    {data && data.length > 0 ? (
      <div className="space-y-4">
        {data.slice(0, 10).map((item, index) => renderItem(item, index))}
        {data.length > 10 && <p className="text-sm text-gray-500 dark:text-gray-400">... and {data.length - 10} more</p>}
      </div>
    ) : (
      <p className="text-gray-500 dark:text-gray-400">{noDataMessage}</p>
    )}
    {extraInfo}
  </div>
);

export default function CustomHookPage() {
  const { data, loading, error, refetch } = useUserData();
  console.log("Custom Hook Data:", data);

  if (loading) {
    return (
      // Background and text for loading state
      <div className="min-h-screen bg-gray-100 flex items-center justify-center dark:bg-gray-900">
        <div className="bg-white p-8 rounded-lg shadow-md dark:bg-gray-800">
          <p className="text-blue-500 dark:text-blue-400">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      // Background and text for error state
      <div className="min-h-screen bg-gray-100 flex items-center justify-center dark:bg-gray-900">
        <div className="bg-white p-8 rounded-lg shadow-md dark:bg-gray-800">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded dark:bg-red-900 dark:border-red-700 dark:text-red-300">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
            <button
              onClick={refetch}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors dark:bg-blue-600 dark:hover:bg-blue-700">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      // Background and text for no data state
      <div className="min-h-screen bg-gray-100 flex items-center justify-center dark:bg-gray-900">
        <div className="bg-white p-8 rounded-lg shadow-md dark:bg-gray-800">
          <p className="text-gray-600 dark:text-gray-300">No data available</p>
        </div>
      </div>
    );
  }

  return (
    // Main page background
    <div className="min-h-screen bg-gray-100 p-4 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 dark:text-gray-100">User Data Settings;</h1>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 mb-8">
          <InfoCard<Doctor>
            title="Doctors"
            data={data.doctors || []}
            renderItem={(doctor, index) => (
              // Individual item background and text
              <div
                key={doctor.id || index}
                className="flex items-center space-x-4 p-2 bg-gray-50 rounded-lg shadow-sm dark:bg-gray-700">
                <img
                  src={doctor.doctor_image || "https://via.placeholder.com/150"}
                  alt={doctor.doctor_name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-300 dark:border-gray-500"
                />
                <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{doctor.doctor_name}</p>
              </div>
            )}
            noDataMessage="No doctors found"
            extraInfo={data.doctors.length > 5 && <p className="text-sm text-gray-500 dark:text-gray-400">... and {data.doctors.length - 5} more doctors</p>}
          />
          <InfoCard<Staff>
            title="Staff"
            data={data.staff || []}
            renderItem={(staffMember, index) => (
              // Individual item background and text
              <div
                key={staffMember.id || index}
                className="flex items-center space-x-4 p-2 bg-gray-50 rounded-lg shadow-sm dark:bg-gray-700">
                <img
                  src={staffMember.staff_image || "https://via.placeholder.com/150"}
                  alt={staffMember.staff_name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-300 dark:border-gray-500"
                />
                <div className="flex-1">
                  <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{staffMember.staff_name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{staffMember.staff_contact}</p>
                </div>
              </div>
            )}
            noDataMessage="No staff found"
          />
          <InfoCard<Location>
            title="Location Settings"
            data={data.locations || []}
            renderItem={(location, index) => (
              // Individual item background and text
              <div
                key={location.id || index}
                className="p-4 bg-gray-50 rounded-lg shadow-sm dark:bg-gray-700">
                <p className="text-xl font-bold text-gray-900 dark:text-gray-50">location_name: {location.location_name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">location_address: {location.location_address}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">location_phone: {location.location_phone}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">location_header: {location.location_header}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">location_footer: {location.location_footer}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">setting_toggle_location_address: {location.setting_toggle_location_address ? "Enabled" : "Disabled"}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">setting_toggle_location_phone: {location.setting_toggle_location_phone ? "Enabled" : "Disabled"}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">setting_toggle_location_header: {location.setting_toggle_location_header ? "Enabled" : "Disabled"}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">setting_toggle_location_doctor: {location.setting_toggle_location_doctor ? "Enabled" : "Disabled"}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">setting_toggle_location_doctor_image: {location.setting_toggle_location_doctor_image ? "Enabled" : "Disabled"}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">setting_toggle_location_doctor_bio: {location.setting_toggle_location_doctor_bio ? "Enabled" : "Disabled"}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">setting_toggle_staff: {location.setting_toggle_staff ? "Enabled" : "Disabled"}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">setting_location_toggle_staff_image: {location.setting_location_toggle_staff_image ? "Enabled" : "Disabled"}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">setting_location_toggle_staff_contact: {location.setting_location_toggle_staff_contact ? "Enabled" : "Disabled"}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">setting_location_toggle_location_footer: {location.setting_location_toggle_location_footer ? "Enabled" : "Disabled"}</p>
              </div>
            )}
            noDataMessage="No locations found"
          />
          <InfoCard<Topic>
            title="Topics"
            data={data.topics || []}
            renderItem={(topic, index) => (
              // Individual item background and text
              <div
                key={topic.id || index}
                className="p-2 bg-gray-50 rounded dark:bg-gray-700">
                <p className="font-semibold text-gray-800 dark:text-gray-100">{topic.topic_name}</p>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: topic.topic_content.replace(/<p><\/p>/g, "<p>&nbsp;</p>"),
                  }}
                />
              </div>
            )}
            noDataMessage="No topics found"
          />
        </div>
        {/* Refetch Button */}
        <div className="mt-6 text-center">
          <button
            onClick={refetch}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors dark:bg-blue-600 dark:hover:bg-blue-700">
            Refresh Data
          </button>
        </div>
        {/* Raw Data Section (for debugging) */}
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 dark:text-gray-100">Raw Data (Debug)</h2>
          <div className="bg-gray-50 p-4 rounded overflow-auto max-h-96 dark:bg-gray-700">
            <pre className="text-sm text-gray-600 dark:text-gray-300">{JSON.stringify(data, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
