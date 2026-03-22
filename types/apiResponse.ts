//types/apiResponse.ts

export interface Topic {
  id: number;
  created_at: string;
  topic_name: string;
  topic_content: string; // Assuming topics have content
  // Add any other properties your topic objects have
}

export interface ApiResponseData {
  doctor: {
    id: number;
    created_at: string;
    doctor_name: string;
    doctor_message: string | null;
    doctor_role: string | null;
    doctor_id: number;
    is_archived: boolean;
    doctor_image: string | null; // Added doctor_image
  };
  location: {
    id: number;
    created_at: string;
    location_id: number;
    location_name: string;
    location_header?: string;
    location_footer?: string;
    is_archived: boolean;
    location_address?: string;
    location_phone?: string;
    setting_location_toggle_location_footer: boolean;
    setting_location_toggle_staff_contact: boolean;
    setting_location_toggle_staff_image: boolean;
    setting_toggle_location_address: boolean;
    setting_toggle_location_doctor: boolean;
    setting_toggle_location_doctor_bio: boolean;
    setting_toggle_location_doctor_image: boolean;
    setting_toggle_location_header: boolean;
    setting_toggle_location_phone: boolean;
    setting_toggle_staff: boolean;
  };
  staff: {
    id: number;
    created_at: string;
    staff_id: number;
    staff_name: string;
    staff_role: string;
    staff_contact: string;
    staff_image: string | null;
    is_archived: boolean;
  };
  topics: Topic[]; // Now using the specific Topic interface
  patientName: string | null;
  examDate:string | null
}

export interface FullApiResponseForComponent {
  message: string;
  data: ApiResponseData;
  errors: string[]; // Assuming errors is an array of strings
  clinicName?: string; // Added clinicName as it was accessed from data
}

export interface DecryptedData {
  message: string;
  data: ApiResponseData;
  errors: string[];
  clinicName?: string; // Added clinicName as it was accessed from data
}
