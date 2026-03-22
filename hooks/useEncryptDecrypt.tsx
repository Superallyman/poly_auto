// hooks/useEncryptDecrypt.tsx
'use client';

import { useState } from 'react';
// Import the encryption and decryption utilities from your utils/encryption.ts file
import { encrypt as utilEncrypt, decrypt as utilDecrypt } from '@/utils/encryption'; 

export function useEncryptDecrypt() {
  // `data` state is specific to this hook for potential client-side display or manipulation
  const [data, setData] = useState<string | null>(null);

  // Wrap the utility functions to potentially integrate with the hook's state
  // or simply provide a consistent interface for the client component.

  const encrypt = (text: string) => {
    const encryptedResult = utilEncrypt(text);
    // You could update `data` state here if the hook needed to store the encrypted result
    // setData(encryptedResult); 
    return encryptedResult;
  };

  const decrypt = (encryptedText: string) => {
    const decryptedResult = utilDecrypt(encryptedText);
    // You could update `data` state here if the hook needed to store the decrypted result
    // setData(decryptedResult);
    return decryptedResult;
  };

  return {
    data, // Expose the `data` state if needed by components using this hook
    encrypt,
    decrypt,
  };
}