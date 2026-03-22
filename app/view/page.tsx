"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation"; // For App Router (Next.js 13+)
import { RenderwEncryptedLink } from "@/components/RenderwEncryptedLink";

// Define the same interfaces as in HomePage for the API response structure
interface Topic {
  id: number;
  created_at: string;
  topic_name: string;
  // Add any other properties your topic objects have
}

interface ApiResponseData {
  doctor: {
    id: number;
    created_at: string;
    doctor_name: string;
    doctor_id: number;
    is_archived: boolean;
    doctor_image: string | null; // Added doctor_image
  };
  locations: Array<{
    id: number;
    created_at: string;
    location_id: number;
    location_name: string;
    location_header: string;
    location_footer: string;
    is_archived: boolean;
    clinic_address: string;
    clinic_phone?: string; // Made optional as it might not always be present
  }>;
  staff: Array<{
    id: number;
    created_at: string;
    staff_id: number;
    staff_name: string;
    staff_contact: string;
    staff_image: string | null;
    is_archived: boolean;
  }>;
  topics: Topic[]; // Now using the specific Topic interface
}

interface DecryptedData {
  message: string;
  data: ApiResponseData;
  errors: string[];
  clinicName?: string; // Added clinicName as it was accessed from data
}

export default function ViewPage() {
  const searchParams = useSearchParams();
  const encryptedData = searchParams.get("data"); // Get the 'data' URL parameter

  // Set initial state as DecryptedData or string (error) or null
  const [decryption, setDecryption] = useState<DecryptedData | string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const sendDataToApi = async () => {
      if (encryptedData) {
        setIsLoading(true);
        try {
          const response = await fetch("/api/viewEducation", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ encryptedData: encryptedData }),
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const result = await response.json(); // Use .json() directly if API returns JSON
          console.log("Decrypted data received from API:", result);
          
          // Validate the response structure before setting state
          if (result && typeof result === 'object' && result.data) {
            // Ensure errors is an array if it exists
            if (result.errors && typeof result.errors === 'string') {
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

  // Type guard function to check if decryption is a valid DecryptedData object
  const isDecryptedData = (data: DecryptedData | string | null): data is DecryptedData => {
    return data !== null && 
           typeof data === 'object' && 
           'data' in data && 
           data.data !== undefined;
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {decryption && isDecryptedData(decryption) ? (
        // Only pass the valid DecryptedData to the component
        <RenderwEncryptedLink data={decryption} />
      ) : (
        // Handle error or message cases
        <p>{typeof decryption === 'string' ? decryption : 'An error occurred'}</p>
      )}
    </div>
  );
}