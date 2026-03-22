"use client";

import React, { useRef } from "react";

interface ReportData {
  doctorName: string;
  doctorImage: string;
  scribeName?: string;
  scribeEmail?: string;
  scribeImage?: string;
  topicTitles: string; // Combined titles of selected topics
  reportContent: string; // Combined notes from selected topics
  clinicName?: string;
  clinicAddress?: string;
  clinicPhone?: string;
}

export const RenderPatientReport: React.FC<{ data: ReportData }> = ({ data }) => {
  const reportPreviewRef = useRef<HTMLDivElement>(null);

  // console.log("Generated Report Data:", data);

  // const processContentForDisplay = (content: string) => {
  //   return content.split("\n").map((line, index) => {
  //     if (line.trim() === "---") {
  //       return (
  //         <hr
  //           key={index}
  //           className="my-6 border-gray-300 dark:border-gray-600 print-separator"
  //         />
  //       );
  //     }
  //     if (line.startsWith("**") && line.endsWith("**")) {
  //       return (
  //         <strong
  //           key={index}
  //           className="block mt-4 mb-2 text-md font-semibold text-gray-800 dark:text-gray-200 topic-title-print">
  //           {line.substring(2, line.length - 2)}
  //         </strong>
  //       );
  //     }
  //     if (line.match(/^(\s*)(-|\*|\d+\.)\s+/)) {
  //       // Matches list items with optional leading spaces
  //       const Match = line.match(/^(\s*)(-|\*|\d+\.)\s+(.*)/);
  //       if (Match) {
  //         return (
  //           <li
  //             key={index}
  //             className="ml-6 list-disc text-gray-700 dark:text-gray-300 topic-notes-print list-item-print">
  //             {Match[3]}
  //           </li>
  //         );
  //       }
  //     }
  //     // For regular lines of text within notes
  //     if (line.trim() !== "") {
  //       return (
  //         <p
  //           key={index}
  //           className="text-gray-700 dark:text-gray-300 topic-notes-print">
  //           {line}
  //         </p>
  //       );
  //     }
  //     return null; // Avoid rendering empty lines as <br> or <p> unless specifically intended
  //   });
  // };

  return (
    <div
      ref={reportPreviewRef}
      className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700">
      <div className="report-header text-center mb-6">
        <h1 className="text-3xl font-bold text-indigo-700 dark:text-indigo-400">{data.clinicName || "Eye Exam Summary"}</h1>
        {data.clinicAddress && <p className="text-sm text-gray-600 dark:text-gray-400">{data.clinicAddress}</p>}
        {data.clinicPhone && <p className="text-sm text-gray-600 dark:text-gray-400">Phone: {data.clinicPhone}</p>}
      </div>

      <hr className="my-5 border-gray-300 dark:border-gray-600" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mb-5 text-sm provider-info">
        <div className="flex items-center gap-4">
          <img
            src={data.doctorImage}
            alt="Doctor"
            className="w-16 h-16 rounded-full border border-gray-300 dark:border-gray-600 object-cover"
          />
          <p>
            <strong>Doctor:</strong> {data.doctorName}
          </p>
        </div>
      </div>
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-1 section-title">Summary of Your Visit</h2>
      <div
        className="prose prose-sm dark:prose-invert mb-4"
        dangerouslySetInnerHTML={{
          __html: data.topicTitles.replace(/<p><\/p>/g, "<p>&nbsp;</p>"),
        }}
      />
      <div
        className="prose prose-sm dark:prose-invert mb-4"
        dangerouslySetInnerHTML={{
          __html: data.reportContent.replace(/<p><\/p>/g, "<p>&nbsp;</p>"),
        }}
      />

      {/* <div className="report-content space-y-3">{processContentForDisplay(data.reportContent)}</div> */}

      <div className="report-footer mt-10 pt-6 border-t border-gray-300 dark:border-gray-600 text-center">
        {/* <p className="text-xs text-gray-500 dark:text-gray-400">If you have any questions regarding this summary,</p> */}
        {data.scribeName && (
          <h3 className="flex items-center space-x-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            {data.scribeName && (
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                <strong>Scribe:</strong> {data.scribeName}
              </p>
            )}
            <img
              src={data.scribeImage} //need to change this to the scribe image
              alt="Scribe"
              className="w-16 h-16 rounded-full border-2 border-gray-300 dark:border-gray-600 object-cover transition-transform transform hover:scale-105"
            />
            <div className="flex flex-col">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                If you have any questions, please contact <span className="font-semibold text-blue-600">{data.scribeName}</span> at their email:
              </p>
              <b className="text-sm text-blue-600">{data.scribeEmail}</b>
            </div>
          </h3>
        )}

        <p className="text-xs text-gray-500 dark:text-gray-400">Thank you for choosing {data.clinicName || "our clinic"}. We appreciate your trust in our care.</p>
      </div>
    </div>
  );
};
