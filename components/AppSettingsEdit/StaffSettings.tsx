"use client";
import React, { useState } from "react";
import { useUserData } from "@/hooks/useUserData";
import { createClient } from "@supabase/supabase-js";
// import {usePathname } from "next/navigation";
import Link from "next/link";


// Define types for your data structures
interface Staff {
  id: string | number;
  staff_id: number;
  staff_name: string;
  staff_image: string;
  staff_role: string;
  staff_contact: string;
  created_at: string;
  is_archived: boolean;
  user_id: string;
}

// Form data type for editing
interface StaffFormData {
  staff_name: string;
  staff_role: string;
  staff_contact: string;
  staff_image: string;
  is_archived: boolean;
}

// Form data type for adding new staff
interface NewStaffFormData {
  staff_name: string;
  staff_role: string;
  staff_contact: string;
  staff_image: string;
}

// Generic type for InfoCard props
interface InfoCardProps<T> {
  title: string;
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  noDataMessage: string;
  extraInfo?: React.ReactNode;
}

// Reusable Card Component for displaying Staffs, Staff, and Topics
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

// Helper function to format date
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

export default function StaffsSettings() {
  const { data, loading, error, refetch } = useUserData();

  // //get Pathname
  // const pathname = usePathname();


  // State for managing edit mode
  const [editingStaffId, setEditingStaffId] = useState<string | number | null>(null);
  const [editFormData, setEditFormData] = useState<StaffFormData | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // State for managing add staff mode
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [addFormData, setAddFormData] = useState<NewStaffFormData>({
    staff_name: "",
    staff_role: "",
    staff_contact: "",
    staff_image: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log("Custom Hook Data:", data);

  // Start editing a staff
  const startEditing = (staff: Staff) => {
    setEditingStaffId(staff.id);
    setEditFormData({
      staff_name: staff.staff_name || "",
      staff_role: staff.staff_role || "",
      staff_contact: staff.staff_contact || "",
      staff_image: staff.staff_image || "",
      is_archived: staff.is_archived,
    });
    setUpdateError(null);
  };



  // Cancel editing
  const cancelEditing = () => {
    setEditingStaffId(null);
    setEditFormData(null);
    setUpdateError(null);
  };

  // Handle form input changes for editing
  const handleInputChange = (field: keyof StaffFormData, value: string | boolean) => {
    if (editFormData) {
      setEditFormData({
        ...editFormData,
        [field]: value,
      });
    }
  };

  // Start adding a new staff
  const startAddingStaff = () => {
    setIsAddingStaff(true);
    setAddFormData({
      staff_name: "",
      staff_role: "",
      staff_contact: "",
      staff_image: "",
    });
    setCreateError(null);
  };

  // Cancel adding a new staff
  const cancelAddingStaff = () => {
    setIsAddingStaff(false);
    setAddFormData({
      staff_name: "",
      staff_role: "",
      staff_contact: "",
      staff_image: "",
    });
    setCreateError(null);
  };

  // Handle form input changes for adding
  const handleAddInputChange = (field: keyof NewStaffFormData, value: string) => {
    setAddFormData({
      ...addFormData,
      [field]: value,
    });
  };

  // Create new staff
  const createStaff = async () => {
    // Validate required fields
    if (!addFormData.staff_name.trim()) {
      setCreateError("Staff name is required");
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

      console.log("Making API request to create staff...");
      const requestBody = {
        staff_name: addFormData.staff_name.trim(),
        staff_role: addFormData.staff_role.trim(),
        staff_contact: addFormData.staff_contact.trim(),
        staff_image: addFormData.staff_image.trim(),
        is_archived: false, // Always set to false for new staff
      };
      console.log("Request body:", requestBody);

      const response = await fetch("/api/userData/staff", {
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
        console.log("Success! Staff created:", responseData.staff);
        // Refresh data and exit add mode
        await refetch();
        setIsAddingStaff(false);
        setAddFormData({
          staff_name: "",
          staff_role: "",
          staff_contact: "",
          staff_image: "",
        });
      } else {
        console.log("API Error:", responseData.message);
        setCreateError(responseData.message || "Failed to create staff");
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
  const saveChanges = async (staffId: string | number) => {
    if (!editFormData) return;

    console.log("=== FRONTEND UPDATE DEBUG ===");
    console.log("Staff ID:", staffId);
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
        staff_name: (editFormData.staff_name || "").trim(),
        staff_role: (editFormData.staff_role || "").trim(),
        staff_contact: (editFormData.staff_contact || "").trim(),
        staff_image: (editFormData.staff_image || "").trim(),
        is_archived: editFormData.is_archived,
      };
      console.log("Request body:", requestBody);

      const response = await fetch(`/api/userData/staff/${staffId}`, {
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
        console.log("Success! Staff updated:", responseData.staff);
        // Refresh data and exit edit mode
        await refetch();
        setEditingStaffId(null);
        setEditFormData(null);
      } else {
        console.log("API Error:", responseData.message);
        setUpdateError(responseData.message || "Failed to update staff");
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
        {/* Add Staff Modal */}
        {isAddingStaff && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Add New Staff</h2>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createStaff();
                  }}
                  className="space-y-4">
                  {/* Staff Name - Required */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Staff Name: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addFormData.staff_name}
                      onChange={(e) => handleAddInputChange("staff_name", e.target.value)}
                      placeholder="Dr. Joe Smith"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                      required
                    />
                  </div>

                  {/* Staff Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Staff Image URL:</label>
                    <input
                      type="url"
                      value={addFormData.staff_image}
                      onChange={(e) => handleAddInputChange("staff_image", e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                    />
                    {addFormData.staff_image && (
                      <div className="mt-2">
                        <img
                          src={addFormData.staff_image}
                          alt="Preview"
                          className="w-16 h-16 object-cover rounded-full"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Staff Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Staff Role -- what your patient sees:</label>
                    <input
                      type="text"
                      value={addFormData.staff_role}
                      onChange={(e) => handleAddInputChange("staff_role", e.target.value)}
                      placeholder="e.g., Technician, Front Desk, Nurse"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                    />
                  </div>

                  {/* Staff contact */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{"Staff contact (for patient to use):"}</label>
                    <textarea
                      value={addFormData.staff_contact}
                      onChange={(e) => handleAddInputChange("staff_contact", e.target.value)}
                      placeholder="email"
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
                    onClick={cancelAddingStaff}
                    disabled={isCreating}
                    className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={createStaff}
                    disabled={isCreating || !addFormData.staff_name.trim()}
                    className="px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50">
                    {isCreating ? "Creating..." : "Create Staff"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <InfoCard
          title="Staff"
          data={data.staff || []}
          renderItem={(staff) => {
            const isEditing = editingStaffId === staff.id;
            const formData = isEditing ? editFormData : null;

            return (
              <div
                key={staff.id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                {/* Header section with image and basic info */}
                <div className="flex items-start space-x-4 mb-4">
                  <div className="flex-shrink-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <img
                          src={formData?.staff_image || "/api/placeholder/64/64"}
                          alt="Staff"
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <input
                          type="url"
                          value={formData?.staff_image || ""}
                          onChange={(e) => handleInputChange("staff_image", e.target.value)}
                          placeholder="Image URL"
                          className="w-24 text-xs px-2 py-1 border rounded dark:bg-gray-600 dark:border-gray-500"
                        />
                      </div>
                    ) : (
                      <img
                        src={staff.staff_image || "/api/placeholder/64/64"}
                        alt="Staff"
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
                          <span className={`text-xs px-2 py-1 rounded ${staff.is_archived ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>{staff.is_archived ? "Archived" : "Active"}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="mb-2">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Staff Name:</label>
                            <input
                              type="text"
                              value={formData?.staff_name || ""}
                              onChange={(e) => handleInputChange("staff_name", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Staff Role:</label>
                            <input
                              type="text"
                              value={formData?.staff_role || ""}
                              onChange={(e) => handleInputChange("staff_role", e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Staff contact:</label>
                            <textarea
                              value={formData?.staff_contact || ""}
                              onChange={(e) => handleInputChange("staff_contact", e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Staff Name: {staff.staff_name}</h3>
                          <p className="text-blue-600 dark:text-blue-400 font-medium">Staff Role: {staff.staff_role ? <span className="text-green-600">&quot;{staff.staff_role}&quot;</span> : <span className="text-yellow-600">No Role Set</span>}</p>
                          <p className="text-blue-600 dark:text-blue-400 font-medium">
                            Staff contact: {staff.staff_contact ? <span className="text-green-600">&quot;{staff.staff_contact}&quot;</span> : <span className="text-yellow-600">No contact Set</span>}
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
                        onClick={() => saveChanges(staff.id)}
                        disabled={isUpdating}
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50">
                        {isUpdating ? "Saving..." : "Save"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEditing(staff)}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
                      Edit
                    </button>
                  )}
                </div>

                {/* Error contact */}
                {updateError && isEditing && <div className="mt-2 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">{updateError}</div>}
              </div>
            );
          }}
          noDataMessage="No staff found"
          extraInfo={
            <div className="mt-4 flex justify-between items-center">
              {data.staff.length > 5 && <p className="text-sm text-gray-500 dark:text-gray-400">... and {data.staff.length - 5} more staff</p>}
              <button
                onClick={startAddingStaff}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors dark:bg-green-600 dark:hover:bg-green-700">
                Add Staff
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
