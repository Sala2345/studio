'use client'
import { useState } from 'react';
import { FileUploaderRegular } from '@uploadcare/react-uploader/next';
import '@uploadcare/react-uploader/core.css';
function App() {
  const [uploadedUrl, setUploadedUrl] = useState(null);

  const handleUploadSuccess = (e) => {
    const fileUrl = e.detail.successEntries[0]?.cdnUrl;
    if (fileUrl) {
      setUploadedUrl(fileUrl);
      console.log("Uploaded file URL:", fileUrl);
    }
  };
  return (
    <div>
      <FileUploaderRegular
        sourceList="local, camera, facebook, gdrive"
        classNameUploader="uc-light"
        pubkey="bfba8b2aa59367bc12a8"
        onCommonUploadSuccess={handleUploadSuccess}
      />

      {uploadedUrl && (
        <div style={{ marginTop: '20px' }}>
          <p><strong>Uploaded File URL:</strong></p>
          <a href={uploadedUrl} target="_blank" rel="noopener noreferrer">
            {uploadedUrl}
          </a>
        </div>
      )}
    </div>
  );
}
export default App;
