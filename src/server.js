// This file is not part of the Next.js app, but a standalone Express server.
// To run it: node src/server.js

const express = require('express');
const multer = require('multer');
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytesResumable, getDownloadURL } = require('firebase/storage');

// IMPORTANT: You need to provide your Firebase config here.
// You can find this in your Firebase project settings.
const firebaseConfig = {
  "projectId": "studio-6281389376-e03d5",
  "appId": "1:921969095503:web:9e1fd5e52d6083cd8a8b3a",
  "storageBucket": "studio-6281389376-e03d5.appspot.com",
  "apiKey": "AIzaSyDeig0FpEoTwu-03HCt_J7jnWJLdfHRRTE",
  "authDomain": "studio-6281389376-e03d5.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "921969095503"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);

const app = express();

// Configure multer for in-memory file storage
const upload = multer({ storage: multer.memoryStorage() });

app.get('/', (req, res) => {
  res.send('Hello World! This is the file upload server. POST your file to /api/upload.');
});

// The 'file' in upload.single('file') must match the name attribute of your HTML file input field
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  // Create a storage reference
  const storageRef = ref(storage, `uploads/${Date.now()}_${req.file.originalname}`);

  // Create a resumable upload task
  const uploadTask = uploadBytesResumable(storageRef, req.file.buffer, {
    contentType: req.file.mimetype,
  });

  // Handle the upload
  uploadTask.on(
    'state_changed',
    (snapshot) => {
      // You can add progress tracking here if needed
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log('Upload is ' + progress + '% done');
    },
    (error) => {
      console.error("Upload failed:", error);
      res.status(500).send({ message: "Upload failed", error: error.message });
    },
    async () => {
      // Upload completed successfully, now we can get the download URL
      try {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        console.log('File available at', downloadURL);
        res.status(200).send({
          message: "Uploaded successfully!",
          url: downloadURL
        });
      } catch (error) {
        console.error("Failed to get download URL:", error);
        res.status(500).send({ message: "Upload succeeded, but failed to get URL.", error: error.message });
      }
    }
  );
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
