import DoctorsSettings from "@/components/AppSettingsEdit/DoctorsSettings";
import LocationsSettings from "@/components/AppSettingsEdit/LocationsSettings";
import StaffSettings from "@/components/AppSettingsEdit/StaffSettings";
import React from "react";

export default function page() {
  return (
    <div className="min-h-screen bg-gray-100 p-4 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto space-y-9">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 dark:text-gray-100">User Data Settings</h1>
        <LocationsSettings />
        <DoctorsSettings />
        <StaffSettings />
      </div>
    </div>
  );
}
