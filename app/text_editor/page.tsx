"use client";

import Tiptap from '@/components/TextEditor/TipTap';
import React, { useEffect, useState } from "react";

export default function Page() {
  const [initialtext] = useState<string>("I'm gonna <b>bold</b> and <i>italic</i> text");
  const [text, setText] = useState<string>(initialtext);
  const [richtext, setRichtext] = useState<string>(text);

  // Keep richtext in sync with text
  useEffect(() => {
    setRichtext(text);
  }, [text]);

  return (
    <div>
      <Tiptap setText={setText} initialText={initialtext} />

      <h3>Raw Text:</h3>
      <div>{text}</div>

      <h3>Rendered Rich Text:</h3>
      <div
        dangerouslySetInnerHTML={{ __html: richtext }}
        style={{ border: '1px solid #ccc', padding: '10px', marginTop: '10px' }}
      />
    </div>
  );
}
