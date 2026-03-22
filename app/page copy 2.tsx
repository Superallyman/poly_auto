"use client";
import React, { useState, ChangeEvent, useEffect, useMemo } from "react";
import { useUserData } from "@/hooks/useUserData";
import { useEncryptDecrypt } from "@/hooks/useEncryptDecrypt";
// import { RenderPatientReport } from "@/components/RenderReport";
import { RenderwEncryptedLink } from "@/components/RenderwEncryptedLink2";
// import Link from "next/link";

import { useAuth } from "@/contexts/AuthContext";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import Link from "next/link";

interface Doctor {
  id: string;
  doctor_id: number;
  doctor_name: string;
  doctor_image: string;
  is_archived: boolean;
}
// interface Location {
//   id: string;
//   location_id: number;
//   location_name: string;
// }

interface Staff {
  staff_id: number;
  staff_name: string;
  staff_contact: string;
  staff_image: string;
}

interface Topic {
  topic_id: string;
  topic_name: string;
  topic_content: string;
}

interface LinkData {
  user: string;
  patientName: string | null;
  examDate: string | null;
  selectedDoctor: string | null;
  selectedLocation: string | null;
  selectedStaff: string | null;
  selectedTopics: string[];
}

const MedicalReportGenerator: React.FC = () => {
  const { data, loading, error: hookError } = useUserData();
  const { encrypt } = useEncryptDecrypt();

  const [linkToReport, setLinkToReport] = useState("");
  const [patientName, setPatientName] = useState("");
  const [debouncedPatientName, setDebouncedPatientName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedStaff, setSelectedStaff] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [viewReport, setViewReport] = useState(false);

  const [hasLocation, setHasLocation] = useState(false);

  //Get Subscriber/Trial Status of User
  const { isSubscriber } = useAuth();
  const { isInTrial } = useTrialStatus();

  // Set default values once when data loads
  useEffect(() => {
    if (data && selectedDoctor === "" && selectedLocation === "" && selectedStaff === "") {
      setSelectedDoctor(data.doctors?.[0]?.doctor_id?.toString() || "");
      setSelectedLocation(data.locations?.[0]?.id?.toString() || "");

      if (data.locations?.length !== 0) {
        setHasLocation(true);
      }
      setSelectedStaff(data.staff?.[0]?.staff_id?.toString() || "");
    }
  }, [data, selectedDoctor, selectedLocation, selectedStaff]);

  // Debounce patient name input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedPatientName(patientName);
    }, 700); //time delay so that the app doesn't send an api call for every single key stroke from the user...

    return () => clearTimeout(timeoutId);
  }, [patientName]);

  // Generate report data using useMemo
  // const generatedReportData = "19d7ecf3-3abb-4a1c-8ecf-1ac083d1b456_2_2_3_15";

  // Generate link data using useMemo - now using debouncedPatientName
  const linkData = useMemo((): LinkData => {
    return {
      user: data?.user?.[0]?.id || "",
      patientName: debouncedPatientName || null,
      examDate: examDate || null,
      selectedLocation: selectedLocation || null,
      selectedDoctor: selectedDoctor || null,
      selectedStaff: selectedStaff || null,
      selectedTopics: selectedTopics,
    };
  }, [data, selectedLocation, selectedDoctor, selectedStaff, selectedTopics, debouncedPatientName, examDate]);

  // Single useEffect for updating link when any relevant data changes
  useEffect(() => {
    if (data) {
      const linkDataasString = Object.values(linkData).flat().map(String).join("_");

      console.log("Link Data:", linkData);
      console.log("Link Data as string with just values:", linkDataasString);

      const encryptedLinkDataasString = encrypt(linkDataasString) || "";

      setLinkToReport(encryptedLinkDataasString); //creates encrypted link  (comment this out AND uncomment the line below to switch to using unencrypted links)
      // setLinkToReport(linkDataasString); //creates unencrypted links

      // Only make API call when debouncedPatientName changes and is not empty
      if (debouncedPatientName && debouncedPatientName !== "") {
        console.log("API Call for patientName:", debouncedPatientName);
        // Make the API call here with debouncedPatientName
      }
    }
  }, [linkData, debouncedPatientName, data]);

  const handleDoctorChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedDoctor(e.target.value);
  };

  const handlePatientNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPatientName(e.target.value);
  };

  const handleStaffChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedStaff(e.target.value);
  };

  const handleTopicCheckboxChange = (topicId: string, checked: boolean) => {
    setSelectedTopics((prevSelectedTopics) => {
      if (checked) {
        return prevSelectedTopics.includes(topicId) ? prevSelectedTopics : [...prevSelectedTopics, topicId];
      } else {
        return prevSelectedTopics.filter((id) => id !== topicId);
      }
    });
  };

  // Set default date to today's date (yyyy-mm-dd format)
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0]; // Get today's date in yyyy-mm-dd format
    setExamDate(today); // Set examDate to today's date
  }, []);

  const toggleReport = () => setViewReport((prevState) => !prevState);

  // Type for the copy function
  const copyToClipboard = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText("https://patienteducator.net/reportview?data=" + text);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleCopy = async (): Promise<void> => {
    await copyToClipboard(linkToReport);
    setIsCopied(true);

    // Reset the "copied" state after 2 seconds
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  // Move conditional returns to the end, after all hooks
  if (loading) return <div>Loading data...</div>;
  if (hookError) return <div>Error loading data: {hookError}</div>;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900 rounded-xl shadow-2xl space-y-6 font-sans transition-colors duration-300">
      {isSubscriber || isInTrial ? (
        <>
          <h1 className="text-3xl font-bold text-indigo-700 dark:text-indigo-400 text-center">Patient Visit Report Generator</h1>
          <form className="space-y-6 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Input box for typing patient name */}
              <div>
                <label
                  htmlFor="examdate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Exam Date
                </label>
                <input
                  type="date"
                  id="examdate"
                  value={examDate} // Use state to track the selected date
                  onChange={(e) => setExamDate(e.target.value)} // Handle the date change
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />{" "}
              </div>
              <div>
                <label
                  htmlFor="patientName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {`Patient Name (Optional)`}:
                </label>
                <input
                  type="text"
                  id="doctorSearch"
                  value={patientName} // You can use state to track the input value
                  onBlur={handlePatientNameChange} // Function to handle input changes
                  onChange={(e) => {
                    // Remove any character that's not a letter, number, hyphen, period, or tilde (no underscore)
                    const newValue = e.target.value.replace(/[^a-zA-Z0-9\.~\- ]/g, "");
                    setPatientName(newValue); // Update the state with the sanitized value
                  }}
                  placeholder="Add patient name to report."
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div>
                <label
                  htmlFor="doctor"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Doctor:
                </label>
                <select
                  id="doctor"
                  value={selectedDoctor}
                  onChange={handleDoctorChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <option value="">--No Doctor--</option>
                  {data?.doctors
                    ?.filter((doctor) => !doctor.is_archived) // Filter out archived doctors
                    .map((doctor: Doctor) => (
                      <option
                        key={doctor.doctor_id}
                        value={doctor.doctor_id}>
                        {doctor.doctor_name} - {doctor.is_archived ? "Archived" : "Active"}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="staff"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Staff (Optional):
                </label>
                <select
                  id="staff"
                  value={selectedStaff}
                  onChange={handleStaffChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <option value="">--No Staff--</option>
                  {data?.staff?.map((staff: Staff) => (
                    <option
                      key={staff.staff_id}
                      value={staff.staff_id}>
                      {staff.staff_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Topics Discussed:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/30 max-h-60 overflow-y-auto">
                {data?.topics?.map((topic: Topic) => (
                  <label
                    key={topic.topic_id}
                    className="flex items-center space-x-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded-md transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(topic.topic_id)}
                      onChange={(e) => handleTopicCheckboxChange(topic.topic_id, e.target.checked)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 dark:border-gray-500 rounded focus:ring-indigo-500 dark:bg-gray-600 dark:checked:bg-indigo-500"
                    />
                    <span>{topic.topic_name}</span>
                  </label>
                ))}
              </div>
            </div>
          </form>
          {/* {generatedReportData && linkToReport && (
        <>        
        <RenderwEncryptedLink encryptedData={linkToReport} />
        </>
      )} */}
          {/* <p>{JSON.stringify(linkData, null, 2)}</p>
      {countUnderscores(linkToReport) > 4 && <p>linkToReport: {linkToReport}</p>} */}

          <div className="flex justify-center">
            <button
              className="inline-block px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-full text-sm font-medium transition-colors shadow-subtle hover:shadow-hover"
              onClick={handleCopy}
              type="button"
              disabled={!linkToReport} // Disable if no link to copy
            >
              {isCopied ? "Copied!" : "Copy Link"}
            </button>
          </div>
          {!hasLocation ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-md p-4 text-center">
              <p className="text-red-700 text-base font-semibold">No Location Saved</p>
              <Link
                href="/profiledata/locations"
                className="inline-block px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-full text-sm font-medium transition-colors shadow-subtle hover:shadow-hover">
                Add Your First Location
              </Link>{" "}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="flex justify-center">
                <button
                  onClick={toggleReport}
                  className="inline-block px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-full text-sm font-medium transition-colors shadow-subtle hover:shadow-hover">
                  {viewReport ? `Hide Report Preview` : `Preview Report`}
                </button>
              </div>

              {/* //Report Render Component*/}
              {viewReport && <RenderwEncryptedLink encryptedData={linkToReport} />}
            </div>
          )}
        </>
      ) : (
        <>
          <h1 className="text-2xl font-semibold text-red-600">No active subscription or trial found.</h1>
          <p className="text-gray-700 dark:text-gray-300">To get started, please update your profile and subscribe.</p>
          <Link
            href={"/profile"}
            className="inline-block mt-4 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg transition-all duration-300 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-opacity-50">
            Update Profile
          </Link>{" "}
        </>
      )}
    </div>
  );
};

export default MedicalReportGenerator;
