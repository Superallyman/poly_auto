//testauth/page.tsx

"use client";

import React from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useTrialStatus } from "@/hooks/useTrialStatus";
import Link from "next/link";

export default function Page() {
  const { user, isSubscriber } = useAuth();
  const { isInTrial } = useTrialStatus();

  console.log(user);
  console.log("isSubscriber", isSubscriber);
  console.log("isInTrial: ", isInTrial);

  return (
    <div>
      {isSubscriber ? <h1>you are a subscriber</h1> : <h1>you are NOT a subscriber</h1>}

      {isInTrial ? <h1>Nice! You are in a trial</h1> : <h1>You are NOT in a TRIAL </h1>}

      {isSubscriber || isInTrial ? <h1>You are a subscriber OR your are in a trial! </h1> : <h1>No subscription OR trial found for this account</h1>}

      <div className="p-6 sm:p-8 max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900 rounded-xl shadow-2xl space-y-6 font-sans transition-colors duration-300">
        {isSubscriber || isInTrial ? (
          <>
            <h1 className="text-2xl font-semibold text-green-600">You&apos;re all set!</h1>
            <p className="text-gray-700 dark:text-gray-300">You are a subscriber or currently in a trial. Enjoy the full experience!</p>
            <h1 className="text-2xl font-semibold text-red-600">No active subscription or trial found.</h1>
            <p className="text-gray-700 dark:text-gray-300">To get started, please update your profile and subscribe.</p>
            <Link
              href={"/profile"}
              className="inline-block mt-4 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg transition-all duration-300 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-opacity-50">
              Update Profile
            </Link>
          </>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}
