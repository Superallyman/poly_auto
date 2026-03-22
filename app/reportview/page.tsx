//reportview2/page.tsx

"use client";
import React from "react";
import { useSearchParams } from "next/navigation"; // For App Router (Next.js 13+)
import { RenderwEncryptedLink } from "@/components/RenderwEncryptedLink2";


export default function ViewPage() {
  const searchParams = useSearchParams();
  const encryptedData = searchParams.get("data") || ""; // Get the 'data' URL parameter

  return (
    <div>
        {/* <h1>URL paramater: {encryptedData} this is being sent to the API and we're expecting a response for that</h1> */}
      <RenderwEncryptedLink encryptedData={encryptedData} />
    </div>
  );
}