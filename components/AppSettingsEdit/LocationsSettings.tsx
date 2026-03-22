//profiledata/locations.tsx

"use client";
import React, { useState } from "react";
import { useUserData } from "@/hooks/useUserData";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

// Define types for your data structures
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

// Form data type for editing
interface LocationFormData {
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

// Form data type for adding new location
interface NewLocationFormData {
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

// Generic type for InfoCard props
interface InfoCardProps<T> {
  title: string;
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  noDataMessage: string;
  extraInfo?: React.ReactNode;
}

// Reusable Card Component for displaying Locations
const InfoCard = <T,>({ title, data, renderItem, noDataMessage, extraInfo }: InfoCardProps<T>) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
    <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">
      <Link href={`/profiledata/${title.toLowerCase()}`}>{title}</Link>
    </h2>
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

export default function LocationsSettings() {
  const { data, loading, error, refetch } = useUserData();

  // State for managing edit mode
  const [editingLocationId, setEditingLocationId] = useState<string | number | null>(null);
  const [editFormData, setEditFormData] = useState<LocationFormData | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // State for managing add location mode
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [addFormData, setAddFormData] = useState<NewLocationFormData>({
    location_name: "",
    location_address: "",
    location_phone: "",
    location_header: "",
    location_footer: "",
    setting_toggle_location_address: false,
    setting_toggle_location_phone: false,
    setting_toggle_location_header: false,
    setting_toggle_location_doctor: false,
    setting_toggle_location_doctor_image: false,
    setting_toggle_location_doctor_bio: false,
    setting_toggle_staff: false,
    setting_location_toggle_staff_image: false,
    setting_location_toggle_staff_contact: false,
    setting_location_toggle_location_footer: false,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  console.log("Custom Hook Data:", data);

  // Start editing a location
  const startEditing = (location: Location) => {
    setEditingLocationId(location.id);
    setEditFormData({
      location_name: location.location_name || "",
      location_address: location.location_address || "",
      location_phone: location.location_phone || "",
      location_header: location.location_header || "",
      location_footer: location.location_footer || "",
      setting_toggle_location_address: location.setting_toggle_location_address,
      setting_toggle_location_phone: location.setting_toggle_location_phone,
      setting_toggle_location_header: location.setting_toggle_location_header,
      setting_toggle_location_doctor: location.setting_toggle_location_doctor,
      setting_toggle_location_doctor_image: location.setting_toggle_location_doctor_image,
      setting_toggle_location_doctor_bio: location.setting_toggle_location_doctor_bio,
      setting_toggle_staff: location.setting_toggle_staff,
      setting_location_toggle_staff_image: location.setting_location_toggle_staff_image,
      setting_location_toggle_staff_contact: location.setting_location_toggle_staff_contact,
      setting_location_toggle_location_footer: location.setting_location_toggle_location_footer,
    });
    setUpdateError(null);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingLocationId(null);
    setEditFormData(null);
    setUpdateError(null);
  };

  // Handle form input changes for editing
  const handleInputChange = (field: keyof LocationFormData, value: string | boolean) => {
    if (editFormData) {
      setEditFormData({
        ...editFormData,
        [field]: value,
      });
    }
  };

  // Start adding a new location
  const startAddingLocation = () => {
    setIsAddingLocation(true);
    setAddFormData({
      location_name: "",
      location_address: "",
      location_phone: "",
      location_header: "",
      location_footer: "",
      setting_toggle_location_address: false,
      setting_toggle_location_phone: false,
      setting_toggle_location_header: false,
      setting_toggle_location_doctor: false,
      setting_toggle_location_doctor_image: false,
      setting_toggle_location_doctor_bio: false,
      setting_toggle_staff: false,
      setting_location_toggle_staff_image: false,
      setting_location_toggle_staff_contact: false,
      setting_location_toggle_location_footer: false,
    });
    setCreateError(null);
  };

  // Cancel adding a new location
  const cancelAddingLocation = () => {
    setIsAddingLocation(false);
    setAddFormData({
      location_name: "",
      location_address: "",
      location_phone: "",
      location_header: "",
      location_footer: "",
      setting_toggle_location_address: false,
      setting_toggle_location_phone: false,
      setting_toggle_location_header: false,
      setting_toggle_location_doctor: false,
      setting_toggle_location_doctor_image: false,
      setting_toggle_location_doctor_bio: false,
      setting_toggle_staff: false,
      setting_location_toggle_staff_image: false,
      setting_location_toggle_staff_contact: false,
      setting_location_toggle_location_footer: false,
    });
    setCreateError(null);
  };

  // Handle form input changes for adding
  const handleAddInputChange = (field: keyof NewLocationFormData, value: string | boolean) => {
    setAddFormData({
      ...addFormData,
      [field]: value,
    });
  };

  // Create new location
  const createLocation = async () => {
    // Validate required fields
    if (!addFormData.location_name.trim()) {
      setCreateError("Location name is required");
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

      console.log("Making API request to create location...");
      const requestBody = {
        location_name: addFormData.location_name.trim(),
        location_address: addFormData.location_address.trim(),
        location_phone: addFormData.location_phone.trim(),
        location_header: addFormData.location_header.trim(),
        location_footer: addFormData.location_footer.trim(),
        setting_toggle_location_address: addFormData.setting_toggle_location_address,
        setting_toggle_location_phone: addFormData.setting_toggle_location_phone,
        setting_toggle_location_header: addFormData.setting_toggle_location_header,
        setting_toggle_location_doctor: addFormData.setting_toggle_location_doctor,
        setting_toggle_location_doctor_image: addFormData.setting_toggle_location_doctor_image,
        setting_toggle_location_doctor_bio: addFormData.setting_toggle_location_doctor_bio,
        setting_toggle_staff: addFormData.setting_toggle_staff,
        setting_location_toggle_staff_image: addFormData.setting_location_toggle_staff_image,
        setting_location_toggle_staff_contact: addFormData.setting_location_toggle_staff_contact,
        setting_location_toggle_location_footer: addFormData.setting_location_toggle_location_footer,
      };
      console.log("Request body:", requestBody);

      const response = await fetch("/api/userData/locations", {
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
        console.log("Success! Location created:", responseData.location);
        // Refresh data and exit add mode
        await refetch();
        setIsAddingLocation(false);
        setAddFormData({
          location_name: "",
          location_address: "",
          location_phone: "",
          location_header: "",
          location_footer: "",
          setting_toggle_location_address: false,
          setting_toggle_location_phone: false,
          setting_toggle_location_header: false,
          setting_toggle_location_doctor: false,
          setting_toggle_location_doctor_image: false,
          setting_toggle_location_doctor_bio: false,
          setting_toggle_staff: false,
          setting_location_toggle_staff_image: false,
          setting_location_toggle_staff_contact: false,
          setting_location_toggle_location_footer: false,
        });
      } else {
        console.log("API Error:", responseData.message);
        setCreateError(responseData.message || "Failed to create location");
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
  const saveChanges = async (locationId: string | number) => {
    if (!editFormData) return;

    console.log("=== FRONTEND UPDATE DEBUG ===");
    console.log("Location ID:", locationId);
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
        location_name: (editFormData.location_name || "").trim(),
        location_address: (editFormData.location_address || "").trim(),
        location_phone: (editFormData.location_phone || "").trim(),
        location_header: (editFormData.location_header || "").trim(),
        location_footer: (editFormData.location_footer || "").trim(),
        setting_toggle_location_address: editFormData.setting_toggle_location_address,
        setting_toggle_location_phone: editFormData.setting_toggle_location_phone,
        setting_toggle_location_header: editFormData.setting_toggle_location_header,
        setting_toggle_location_doctor: editFormData.setting_toggle_location_doctor,
        setting_toggle_location_doctor_image: editFormData.setting_toggle_location_doctor_image,
        setting_toggle_location_doctor_bio: editFormData.setting_toggle_location_doctor_bio,
        setting_toggle_staff: editFormData.setting_toggle_staff,
        setting_location_toggle_staff_image: editFormData.setting_location_toggle_staff_image,
        setting_location_toggle_staff_contact: editFormData.setting_location_toggle_staff_contact,
        setting_location_toggle_location_footer: editFormData.setting_location_toggle_location_footer,
      };
      console.log("Request body:", requestBody);

      const response = await fetch(`/api/userData/locations/${locationId}`, {
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
        console.log("Success! Location updated:", responseData.location);
        // Refresh data and exit edit mode
        await refetch();
        setEditingLocationId(null);
        setEditFormData(null);
      } else {
        console.log("API Error:", responseData.message);
        setUpdateError(responseData.message || "Failed to update location");
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

  // Ensure data.locations exists and is an array
  const locations = data?.locations || [];

  return (
    <div>
      <div>
        {/* <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto"> */}
        {/* Add Location Modal */}
        {isAddingLocation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Add New Location</h2>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createLocation();
                  }}
                  className="space-y-4">
                  {/* Location Name - Required */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Location Name: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={addFormData.location_name}
                      onChange={(e) => handleAddInputChange("location_name", e.target.value)}
                      placeholder="Main Clinic"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                      required
                    />
                  </div>

                  {/* Location Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location Address:</label>
                    <input
                      type="text"
                      value={addFormData.location_address}
                      onChange={(e) => handleAddInputChange("location_address", e.target.value)}
                      placeholder="123 Main St, Anytown"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                    />
                  </div>

                  {/* Location Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location Phone:</label>
                    <input
                      type="tel"
                      value={addFormData.location_phone}
                      onChange={(e) => handleAddInputChange("location_phone", e.target.value)}
                      placeholder="555-123-4567"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                    />
                  </div>

                  {/* Location Header */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location Header:</label>
                    <input
                      type="text"
                      value={addFormData.location_header}
                      onChange={(e) => handleAddInputChange("location_header", e.target.value)}
                      placeholder="Welcome to our clinic!"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                    />
                  </div>

                  {/* Location Footer */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location Footer:</label>
                    <textarea
                      value={addFormData.location_footer}
                      onChange={(e) => handleAddInputChange("location_footer", e.target.value)}
                      placeholder="Thank you for visiting."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                    />
                  </div>

                  {/* Toggle Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(addFormData)
                      .filter((key) => key.startsWith("setting_toggle") || key.startsWith("setting_location_toggle"))
                      .map((key) => (
                        <div
                          key={key}
                          className="flex items-center">
                          <input
                            type="checkbox"
                            id={`add-${key}`}
                            checked={addFormData[key as keyof NewLocationFormData] as boolean}
                            onChange={(e) => handleAddInputChange(key as keyof NewLocationFormData, e.target.checked)}
                            className="rounded text-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <label
                            htmlFor={`add-${key}`}
                            className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            {key.replace(/_/g, " ").replace("setting toggle", "Show").replace("setting location toggle", "Show")}
                          </label>
                        </div>
                      ))}
                  </div>
                </form>

                {/* Error message */}
                {createError && <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">{createError}</div>}

                {/* Action buttons */}
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    type="button"
                    onClick={cancelAddingLocation}
                    disabled={isCreating}
                    className="px-4 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={createLocation}
                    disabled={isCreating || !addFormData.location_name.trim()}
                    className="px-4 py-2 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50">
                    {isCreating ? "Creating..." : "Create Location"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <InfoCard
          title="Locations"
          data={locations}
          renderItem={(location) => {
            const isEditing = editingLocationId === location.id;
            const formData = isEditing ? editFormData : null;

            return (
              <div
                key={location.id}
                className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex-1">
                  <div className="mb-2">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location Name:</label>
                          <input
                            type="text"
                            value={formData?.location_name || ""}
                            onChange={(e) => handleInputChange("location_name", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location Address:</label>
                          <input
                            type="text"
                            value={formData?.location_address || ""}
                            onChange={(e) => handleInputChange("location_address", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location Phone:</label>
                          <input
                            type="tel"
                            value={formData?.location_phone || ""}
                            onChange={(e) => handleInputChange("location_phone", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location Header:</label>
                          <input
                            type="text"
                            value={formData?.location_header || ""}
                            onChange={(e) => handleInputChange("location_header", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location Footer:</label>
                          <textarea
                            value={formData?.location_footer || ""}
                            onChange={(e) => handleInputChange("location_footer", e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100"
                          />
                        </div>

                        {/* Toggle Settings for Editing */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          {Object.keys(formData || {})
                            .filter((key) => key.startsWith("setting_toggle") || key.startsWith("setting_location_toggle"))
                            .map((key) => (
                              <div
                                key={key}
                                className="flex items-center">
                                <input
                                  type="checkbox"
                                  id={`edit-${location.id}-${key}`}
                                  checked={(formData?.[key as keyof LocationFormData] as boolean) || false}
                                  onChange={(e) => handleInputChange(key as keyof LocationFormData, e.target.checked)}
                                  className="rounded text-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                                />
                                <label
                                  htmlFor={`edit-${location.id}-${key}`}
                                  className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                  {key.replace(/_/g, " ").replace("setting toggle", "Show").replace("setting location toggle", "Show")}
                                </label>
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Location Name: {location.location_name}</h3>
                        <p className="text-blue-600 dark:text-blue-400 font-medium">
                          Address: {location.location_address ? <span className="text-green-600">&quot;{location.location_address}&quot;</span> : <span className="text-yellow-600">No Address Set</span>}
                        </p>
                        <p className="text-blue-600 dark:text-blue-400 font-medium">
                          Phone: {location.location_phone ? <span className="text-green-600">&quot;{location.location_phone}&quot;</span> : <span className="text-yellow-600">No Phone Set</span>}
                        </p>
                        <p className="text-blue-600 dark:text-blue-400 font-medium">
                          Header: {location.location_header ? <span className="text-green-600">&quot;{location.location_header}&quot;</span> : <span className="text-yellow-600">No Header Set</span>}
                        </p>
                        <p className="text-blue-600 dark:text-blue-400 font-medium">
                          Footer: {location.location_footer ? <span className="text-green-600">&quot;{location.location_footer}&quot;</span> : <span className="text-yellow-600">No Footer Set</span>}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4 text-sm text-gray-700 dark:text-gray-300">
                          {(Object.keys(location) as Array<keyof Location>)
                            .filter((key) => key.startsWith("setting_toggle") || key.startsWith("setting_location_toggle"))
                            .map((key) => (
                              <div
                                key={key}
                                className="flex items-center">
                                <span className="font-medium mr-1">{key.replace(/_/g, " ").replace("setting toggle", "Show").replace("setting location toggle", "Show")}:</span>
                                <span className={location[key] ? "text-green-600" : "text-red-600"}>{location[key] ? "Enabled" : "Disabled"}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
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
                        onClick={() => saveChanges(location.id)}
                        disabled={isUpdating}
                        className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50">
                        {isUpdating ? "Saving..." : "Save"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEditing(location)}
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
          noDataMessage="No locations found"
          extraInfo={
            <div className="mt-4 flex justify-between items-center">
              {locations.length > 5 && <p className="text-sm text-gray-500 dark:text-gray-400">... and {locations.length - 5} more locations</p>}

              {locations.length === 0 ? (
                <button
                  onClick={startAddingLocation}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors dark:bg-green-600 dark:hover:bg-green-700">
                  Add Location
                </button>
              ) : (
                <></>
              )}
              {/* UNCOMMENT BUTTON BELOW TO GAIN ABILITY TO ADD NEW LOCATIONS!! */}
              {/* 
              <button
                onClick={startAddingLocation}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors dark:bg-green-600 dark:hover:bg-green-700">
                Add Location
              </button> */}
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
