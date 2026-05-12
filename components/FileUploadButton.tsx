"use client";

import { Upload } from "lucide-react";

export default function FileUploadButton({
  label,
  multiple,
  onFiles
}: {
  label: string;
  multiple?: boolean;
  onFiles: (files: FileList) => void;
}) {
  return (
    <label className="btn secondary">
      <Upload size={18} />
      {label}
      <input
        className="hidden-file"
        type="file"
        multiple={multiple}
        onChange={(event) => {
          if (event.target.files?.length) onFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </label>
  );
}
