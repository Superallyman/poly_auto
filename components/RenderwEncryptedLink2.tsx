// component/RenderwEncryptedLink2.tsx
"use client";

import React, { useEffect, useState } from "react";
import { ApiResponseData, DecryptedData } from "@/types/apiResponse"; // Import the interfaces from centralized file

import Report from "./Report"; // THIS is where all the styling and rendering of the report will be done (easy place to style from)

// Change the prop type to FullApiResponseForComponent
export const RenderwEncryptedLink: React.FC<{ encryptedData: string }> = ({ encryptedData }) => {
  // const data = encryptedData; // Get the 'data' URL parameter

  // console.log("Encrypted data received:", encryptedData);

  // Set initial state as DecryptedData or string (error) or null
  const [decryption, setDecryption] = useState<DecryptedData | string | null>(null);
  const [doctor, setDoctor] = useState<ApiResponseData["doctor"] | null>(null);
  const [location, setLocation] = useState<ApiResponseData["location"] | null>(null);
  const [staff, setStaff] = useState<ApiResponseData["staff"] | null>(null);
  const [topics, setTopics] = useState<ApiResponseData["topics"] | null>(null);

  const [patientName, setPatientName] = useState<string | null>(null);
  const [examDate, setExamDate] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    //this useEffect sends the encrypted data to the API and receives the decrypted, parsed data necessary for the component to load
    const sendDataToApi = async () => {
      if (encryptedData) {
        console.log(encryptedData)
        setIsLoading(true);
        try {
          const response = await fetch("/api/reportData", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ encryptedData: encryptedData }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.statusText}`);
          }

          const result = await response.json(); // Use .json() directly if API returns JSON
          // console.log("Decrypted data received from API:", result);

          // Validate the response structure before setting state
          if (result && typeof result === "object" && result.data) {
            // Ensure errors is an array if it exists
            if (result.errors && typeof result.errors === "string") {
              result.errors = [result.errors];
            }
            setDecryption(result as DecryptedData);
          } else {
            setDecryption("Invalid response format from API.");
          }
        } catch (error) {
          console.error("Error sending data to API:", error);
          setDecryption("Error during decryption process.");
        } finally {
          setIsLoading(false);
        }
      } else {
        setDecryption("No encrypted data found in URL.");
      }
    };

    sendDataToApi();
  }, [encryptedData]); // Re-run effect if encryptedData changes

  console.log("Decrypted data:", decryption);

  // Type guard function to check if decryption is a valid DecryptedData object
  const isDecryptedData = (data: DecryptedData | string | null): data is DecryptedData => {
    return data !== null && typeof data === "object" && "data" in data && data.data !== undefined;
  };
  // Use effect to set doctor state when decryption is valid
  useEffect(() => {
    if (isDecryptedData(decryption)) {
      setDoctor(decryption.data.doctor); // Set doctor from decrypted data
      setLocation(decryption.data.location); // Set location from decrypted data
      setStaff(decryption.data.staff); // Set staff from decrypted data
      setTopics(decryption.data.topics); // Set topics from decrypted data
      setPatientName(decryption.data.patientName);
      setExamDate(decryption.data.examDate);
    }
  }, [decryption]); // Only run when decryption changes

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {/* Now data.message will correctly access the message property
      <h1>encryptedData Message (from URL param): {encryptedData}</h1> */}
      {decryption && typeof decryption === "string" ? (
        // <h1>{decryption}</h1> // Render error or status message
        <p className="flex justify-center items-center h-screen text-4xl text-red-600 dark:text-red-400">Sorry! Could not find report</p>
      ) : (
        // Render message from decrypted data
        isDecryptedData(decryption) && (
          <>
            {/* <h1>decryptedData Message: {decryption.message}</h1>
            <h1>decryptedData Message: {decryption.data.location.location_name}</h1> //// chatGPT why does this line work but the one using location.location_name does not?
            <h1>decryptedData Message: {decryption.data.doctor.doctor_name}</h1> */}
            {/* Add null check for doctor before accessing its properties */}
            {/* {doctor ? <h1>Data Doctor Name (from state): {doctor.doctor_name}</h1> : <h1>Doctor data is not available yet</h1>}
            {location ? <h1>Data Location Name (from state): {location.location_name}</h1> : <h1>Location data is not available yet</h1>} */}
            {/* Add null check for both doctor and location before accessing their properties */}
            {location ? (
              <>
                <Report
                  doctor={doctor}
                  location={location}
                  staff={staff}
                  topics={topics}
                  patientName={patientName}
                  examDate={examDate}
                />
                {/* <h1>Doctor Name (from state): {doctor.doctor_name}</h1>
                <h1>Location Name (from state): {location.location_name}</h1> */}
              </>
            ) : (
              // Doctor Data or Location Data is missing
              <h1 className="flex justify-center items-center h-screen text-4xl text-red-600 dark:text-red-400">Sorry! Could not find report -- missing data </h1>
            )}
          </>
        )
      )}
    </>
  );
};
