// report.tsx
"use client";
import React from "react";
import { ApiResponseData } from "@/types/apiResponse"; // Import the interfaces from centralized file

interface ReportProps {
  doctor: ApiResponseData["doctor"] | null;
  location: ApiResponseData["location"];
  staff: ApiResponseData["staff"] | null; // Allow null
  topics: ApiResponseData["topics"] | null; // Allow null
  patientName: ApiResponseData["patientName"] | null; // Allow null
  examDate: ApiResponseData["examDate"] | null; // Allow null
}

export default function Report({ doctor, location, staff, topics, patientName, examDate }: ReportProps) {
  console.log("Doctor data received:", doctor);
  console.log("Location data received:", location);
  console.log("Staff data received:", staff);
  console.log("Topics data received:", topics);

  const isImageUrl = (str: string): boolean => {
    return /\.(jpeg|jpg|gif|png|svg|webp)$/.test(str);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-lg rounded-lg overflow-hidden">
      {/* Header Section */}
      <div className=" dark:bg-gray-800 text-white px-6 py-4">
        <div className="text-center">
          {location.setting_toggle_location_header &&
            location.location_header &&
            (isImageUrl(location.location_header) ? (
              <img
                src={location.location_header}
                alt="Location Header"
                className="w-full h-auto max-h-64 object-cover rounded-md mb-4"
              />
            ) : (
              <h1 className="text-2xl font-bold">{location.location_header}</h1>
            ))}
          <div className="mt-2 text-gray-500 dark:text-gray-300">
            <p className="font-medium">{location.location_name}</p>
            <p className="text-sm">{location.location_address}</p>
            <p className="text-sm">Phone: {location.location_phone}</p>
          </div>
        </div>
      </div>

      <div>
        {patientName ? (
          <h1 className="p-6 text-center text-lg sm:text-xl leading-snug">
            Hello <strong>{patientName}</strong>! Thank you for joining us at {location.location_name} on <strong>{examDate}</strong>
          </h1>
        ) : (
          <></>
        )}
      </div>

      <div className="p-6 space-y-8">
        {/* Doctor Section */}
        {location.setting_toggle_location_doctor && doctor && (
          <>
            <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{doctor.doctor_role ? doctor.doctor_role : "Your Healthcare Provider"}</h2>
              <div className="flex items-center space-x-4">
                {location.setting_toggle_location_doctor_image && (
                  <img
                    src={doctor?.doctor_image || "https://png.pngtree.com/png-clipart/20230206/ourmid/pngtree-smiley-emoji-png-image_6587368.png"}
                    alt={`Dr. ${doctor.doctor_name}`}
                    className="w-20 h-20 rounded-full border-2 border-blue-200 dark:border-gray-600 object-cover shadow-md"
                  />
                )}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{doctor.doctor_name}</h3>
                  {doctor.doctor_message ? <p className="text-gray-600 dark:text-gray-400"> &quot;{doctor.doctor_message}&quot; </p> : <></>}
                </div>
              </div>
            </div>
          </>
        )}
        {/* Topics Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          {topics && topics.length > 0 && <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">{topics.length === 1 ? "Topic Was Discussed During Your Visit" : `${topics.length} Topics Were Discussed During Your Visit`}</h2>}{" "}
          {topics && topics.length > 0 ? (
            <div className="space-y-4">
              {topics.map((topic, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500 dark:border-blue-400">
                  {/* <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 ">{topic.topic_name}</h1> */}
                  <div
                    className="text-gray-700 dark:text-gray-300 leading-relaxed prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: topic.topic_content }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-gray-600 dark:text-gray-400">No specific topics were documented for this visit.</p>
            </div>
          )}
        </div>

        {/* Staff Contact Section */}
        {location.setting_location_toggle_staff_contact && staff && (
          <div className="bg-blue-50 dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Your Care Team Contact</h2>
            <div className="flex items-center space-x-4 mb-4">
              {location.setting_location_toggle_staff_image && (
                <img
                  src={staff.staff_image || "https://png.pngtree.com/png-clipart/20230206/ourmid/pngtree-smiley-emoji-png-image_6587368.png"}
                  alt={staff.staff_name}
                  className="w-16 h-16 rounded-full border-2 border-blue-200 dark:border-gray-600 object-cover shadow-md"
                />
              )}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{staff.staff_name}</h3>
                {staff.staff_role ? <p className="text-gray-600 dark:text-gray-400"> {staff.staff_role} </p> : <></>}
                {staff.staff_contact ? <p className="text-gray-600 font-semibold  dark:text-gray-400"> Contact Information: {staff.staff_contact} </p> : <></>}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-700 rounded-md p-4 border border-blue-200 dark:border-gray-600">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">Have questions about your visit or need assistance?</span>
                <br />
                Feel free to reach out to <span className="font-medium font-extrabold">{staff.staff_name} </span> {`at (`}
                <span>{staff.staff_contact}</span>
                {`)`} who is here to help with any concerns or questions you may have about your care.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Section */}
      {location.setting_location_toggle_location_footer && location.location_footer && (
        <div className="bg-gray-100 dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">{location.location_footer}</p>
        </div>
      )}
    </div>
  );
}
