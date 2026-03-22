"use client";
import React, { useState } from "react";
import { useUserData } from "@/hooks/useUserData";
import { createClient } from "@supabase/supabase-js";
// import {usePathname } from "next/navigation";
import Link from "next/link";


// Define types for your data structures
interface Doctor {
  id: string | number;
  doctor_id: number;
  doctor_name: string;
  doctor_image: string;
  doctor_role: string;
  doctor_message: string;
  created_at: string;
  is_archived: boolean;
  user_id: string;
}

// Form data type for editing
interface DoctorFormData {
  doctor_name: string;
  doctor_role: string;
  doctor_message: string;
  doctor_image: string;
  is_archived: boolean;
}

// Form data type for adding new doctor
interface NewDoctorFormData {
  doctor_name: string;
  doctor_role: string;
  doctor_message: string;
  doctor_image: string;
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
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
    <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100"><Link href={`/profiledata/${title.toLowerCase()}`}>{title}</Link></h2>
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

// // Helper function to format date
// const formatDate = (dateString: string) => {
//   try {
//     return new Date(dateString).toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "short",
//       day: "numeric",
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//   } catch {
//     return dateString;
//   }
// };

export default function DoctorsSettings() {
  const { data, loading, error, refetch } = useUserData();

  // //get Pathname
  // const pathname = usePathname();


  // State for managing edit mode
  const [editingDoctorId, setEditingDoctorId] = useState<string | number | null>(null);
  const [editFormData, setEditFormData] = useState<DoctorFormData | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // State for managing add doctor mode
  const [isAddingDoctor, setIsAddingDoctor] = useState(false);
  const [addFormData, setAddFormData] = useState<NewDoctorFormData>({
    doctor_name: "",
    doctor_role: "",
    doctor_message: "",
    doctor_image: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log("Custom Hook Data:", data);

  // Start editing a doctor
  const startEditing = (doctor: Doctor) => {
    setEditingDoctorId(doctor.id);
    setEditFormData({
      doctor_name: doctor.doctor_name || "",
      doctor_role: doctor.doctor_role || "",
      doctor_message: doctor.doctor_message || "",
      doctor_image: doctor.doctor_image || "",
      is_archived: doctor.is_archived,
    });
    setUpdateError(null);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingDoctorId(null);
    setEditFormData(null);
    setUpdateError(null);
  };

  // Handle form input changes for editing
  const handleInputChange = (field: keyof DoctorFormData, value: string | boolean) => {
    if (editFormData) {
      setEditFormData({
        ...editFormData,
        [field]: value,
      });
    }
  };

  // Start adding a new doctor
  const startAddingDoctor = () => {
    setIsAddingDoctor(true);
    setAddFormData({
      doctor_name: "",
      doctor_role: "",
      doctor_message: "",
      doctor_image: "",
    });
    setCreateError(null);
  };

  // Cancel adding a new doctor
  const cancelAddingDoctor = () => {
    setIsAddingDoctor(false);
    setAddFormData({
      doctor_name: "",
      doctor_role: "",
      doctor_message: "",
      doctor_image: "",
    });
    setCreateError(null);
  };

  // Handle form input changes for adding
  const handleAddInputChange = (field: keyof NewDoctorFormData, value: string) => {
    setAddFormData({
      ...addFormData,
      [field]: value,
    });
  };

  // Create new doctor
  const createDoctor = async () => {
    // Validate required fields
    if (!addFormData.doctor_name.trim()) {
      setCreateError("Doctor name is required");
      return;
    }

    console.log("=== FRONTEND CREATE DEBUG ===");
    console.log("Create data:", addFormData);

    setIsCreating(true);
    setCreateError(null);

    try {
      console.log("Getting auth token from Supabase session...");
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
        setCreateError("Failed to get authentication session");
        return;
      }

      const token = sessionData.session?.access_token;
      console.log("Token found:", !!token);

      if (!token) {
        console.log("No authentication token found");
        setCreateError("Authentication token not found. Please log in again.");
        return;
      }

      console.log("Making API request to create doctor...");
      const requestBody = {
        doctor_name: addFormData.doctor_name.trim(),
        doctor_role: addFormData.doctor_role.trim(),
        doctor_message: addFormData.doctor_message.trim(),
        doctor_image: addFormData.doctor_image.trim(),
        is_archived: false, // Always set to false for new doctors
      };
      console.log("Request body:", requestBody);

      const response = await fetch("/api/userData/doctors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (response.ok) {
        console.log("Success! Doctor created:", responseData.doctor);
        // Refresh data and exit add mode
        await refetch();
        setIsAddingDoctor(false);
        setAddFormData({
          doctor_name: "",
          doctor_role: "",
          doctor_message: "",
          doctor_image: "",
        });
      } else {
        console.log("API Error:", responseData.message);
        setCreateError(responseData.message || "Failed to create doctor");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      const errorMessage = err instanceof Error ? err.message : "Network error occurred";
      setCreateError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  // Save changes for editing
  const saveChanges = async (doctorId: string | number) => {
    if (!editFormData) return;

    console.log("=== FRONTEND UPDATE DEBUG ===");
    console.log("Doctor ID:", doctorId);
    console.log("Update data:", editFormData);

    setIsUpdating(true);
    setUpdateError(null);

    try {
      console.log("Getting auth token from Supabase session...");
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
        setUpdateError("Failed to get authentication session");
        return;
      }

      const token = sessionData.session?.access_token;
      console.log("Token found:", !!token);
      console.log("Token preview:", token ? token.substring(0, 20) + "..." : "null");

      if (!token) {
        console.log("No authentication token found");
        setUpdateError("Authentication token not found. Please log in again.");
        return;
      }

      console.log("Making API request...");
      const requestBody = {
        doctor_name: (editFormData.doctor_name || "").trim(),
        doctor_role: (editFormData.doctor_role || "").trim(),
        doctor_message: (editFormData.doctor_message || "").trim(),
        doctor_image: (editFormData.doctor_image || "").trim(),
        is_archived: editFormData.is_archived,
      };
      console.log("Request body:", requestBody);

      const response = await fetch(`/api/userData/doctors/${doctorId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      const responseData = await response.json();
      console.log("Response data:", responseData);

      if (response.ok) {
        console.log("Success! Doctor updated:", responseData.doctor);
        // Refresh data and exit edit mode
        await refetch();
        setEditingDoctorId(null);
        setEditFormData(null);
      } else {
        console.log("API Error:", responseData.message);
        setUpdateError(responseData.message || "Failed to update doctor");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      const errorMessage = err instanceof Error ? err.message : "Network error occurred";
      setUpdateError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading user data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong>
            <span className="block sm:inline">{error}</span>
            <button
              onClick={refetch}
              className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">No data available</div>
        </div>
      </div>
    );
  }

  return (
    <div  >
    <div>
    {/* <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8"> */}
        {/* Add Doctor Modal */}
        {isAddingDoctor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Add New Doctor</h2>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createDoctor();
                  }}
                  className="space-y-4">
                  {/* Doctor Name - Required */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Doctor Name: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addFormData.doctor_name}
                      onChange={(e) => handleAddInputChange("doctor_name", e.target.value)}
                      placeholder="Dr. Joe Smith"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                      required
                    />
                  </div>

                  {/* Doctor Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Doctor Image URL:</label>
                    <input
                      type="url"
                      value={addFormData.doctor_image}
                      onChange={(e) => handleAddInputChange("doctor_image", e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                    />
                    {addFormData.doctor_image && (
                      <div className="mt-2">
                        <img
                          src={addFormData.doctor_image}
                          alt="Preview"
                          className="w-16 h-16 object-cover rounded-full"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Doctor Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Doctor Role -- what your patient sees:</label>
                    <input
                      type="text"
                      value={addFormData.doctor_role}
                      onChange={(e) => handleAddInputChange("doctor_role", e.target.value)}
                      placeholder="e.g., Cardiologist, General Practitioner"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                    />
                  </div>

                  {/* Doctor Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Doctor Message -- to the patient:</label>
                    <textarea
                      value={addFormData.doctor_message}
                      onChange={(e) => handleAddInputChange("doctor_message", e.target.value)}
                      placeholder="Thank you for seeing me"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                    />
                  </div>
                </form>

                {/* Error message */}
                {createError && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">{createError}</div>}

                {/* Action buttons */}
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={cancelAddingDoctor}
                    disabled={isCreating}
                    className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={createDoctor}
                    disabled={isCreating || !addFormData.doctor_name.trim()}
                    className="px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50">
                    {isCreating ? "Creating..." : "Create Doctor"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <InfoCard
          title="Doctors"
          data={data.doctors || []}
          renderItem={(doctor) => {
            const isEditing = editingDoctorId === doctor.id;
            const formData = isEditing ? editFormData : null;

            return (
              <div
                key={doctor.id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                {/* Header section with image and basic info */}
                <div className="flex items-start space-x-4 mb-4">
                  <div className="flex-shrink-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <img
                          src={formData?.doctor_image || "/api/placeholder/64/64"}
                          alt="Doctor"
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <input
                          type="url"
                          value={formData?.doctor_image || ""}
                          onChange={(e) => handleInputChange("doctor_image", e.target.value)}
                          placeholder="Image URL"
                          className="w-24 text-xs px-2 py-1 border rounded dark:bg-gray-600 dark:border-gray-500"
                        />
                      </div>
                    ) : (
                      <img
                        src={doctor.doctor_image || "/api/placeholder/64/64"}
                        alt="Doctor"
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    )}
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        {isEditing ? (
                          <label className="flex items-center space-x-1 text-xs">
                            <input
                              type="checkbox"
                              checked={!formData?.is_archived}
                              onChange={(e) => handleInputChange("is_archived", !e.target.checked)}
                              className="rounded"
                            />
                            <span>Active</span>
                          </label>
                        ) : (
                          <span className={`text-xs px-2 py-1 rounded ${doctor.is_archived ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>{doctor.is_archived ? "Archived" : "Active"}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="mb-2">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Doctor Name:</label>
                            <input
                              type="text"
                              value={formData?.doctor_name || ""}
                              onChange={(e) => handleInputChange("doctor_name", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Doctor Role:</label>
                            <input
                              type="text"
                              value={formData?.doctor_role || ""}
                              onChange={(e) => handleInputChange("doctor_role", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Doctor Message:</label>
                            <textarea
                              value={formData?.doctor_message || ""}
                              onChange={(e) => handleInputChange("doctor_message", e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Doctor Name: {doctor.doctor_name}</h3>
                          <p className="text-blue-600 dark:text-blue-400 font-medium">Doctor Role: {doctor.doctor_role ? <span className="text-green-600">&quot;{doctor.doctor_role}&quot;</span> : <span className="text-yellow-600">No Role Set</span>}</p>
                          <p className="text-blue-600 dark:text-blue-400 font-medium">
                            Doctor Message: {doctor.doctor_message ? <span className="text-green-600">&quot;{doctor.doctor_message}&quot;</span> : <span className="text-yellow-600">No Message Set</span>}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200 dark:border-gray-600">
                  {isEditing ? (
                    <>
                      <button
                        onClick={cancelEditing}
                        disabled={isUpdating}
                        className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50">
                        Cancel
                      </button>
                      <button
                        onClick={() => saveChanges(doctor.id)}
                        disabled={isUpdating}
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50">
                        {isUpdating ? "Saving..." : "Save"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEditing(doctor)}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
                      Edit
                    </button>
                  )}
                </div>

                {/* Error message */}
                {updateError && isEditing && <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">{updateError}</div>}
              </div>
            );
          }}
          noDataMessage="No doctors found"
          extraInfo={
            <div className="mt-4 flex justify-between items-center">
              {data.doctors.length > 5 && <p className="text-sm text-gray-500 dark:text-gray-400">... and {data.doctors.length - 5} more doctors</p>}
              <button
                onClick={startAddingDoctor}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors dark:bg-green-600 dark:hover:bg-green-700">
                Add Doctor
              </button>
            </div>
          }
        />

        {/* Refetch Button */}
        {/* <div className="mt-6 text-center">
          <button
            onClick={refetch}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors dark:bg-blue-600 dark:hover:bg-blue-700">
            Refresh Data
          </button>
        </div> */}
      </div>
    </div>
  );
}
