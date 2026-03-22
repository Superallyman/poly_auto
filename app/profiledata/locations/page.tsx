import LocationsSettings from "@/components/AppSettingsEdit/LocationsSettings";
import React from "react";

export default function page() {
  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <LocationsSettings />
        </div>
      </div>
    </>
  );
}
