// server.js - Express + Multer + Firebase Storage
// This uploads files through your backend to Firebase Storage

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// =============================================================================
// FIREBASE ADMIN SETUP
// =============================================================================

// Initialize Firebase Admin (use your service account)
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'studio-6281389376-e03d5.appspot.com' // Replace with your bucket
});

const bucket = admin.storage().bucket();

// =============================================================================
// MIDDLEWARE
// =============================================================================

app.use(cors());
app.use(express.json());

// Configure Multer to use memory storage (files stored in RAM temporarily)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10
  }
});

// =============================================================================
// UPLOAD FUNCTIONS
// =============================================================================

/**
 * Upload file buffer to Firebase Storage
 */
async function uploadToFirebase(fileBuffer, originalName, mimetype) {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    const cleanName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '-');
    const fileName = `submissions/${cleanName}-${timestamp}-${randomString}${ext}`;

    console.log(`Uploading to Firebase: ${fileName}`);

    // Create file reference
    const file = bucket.file(fileName);

    // Upload file
    await file.save(fileBuffer, {
      metadata: {
        contentType: mimetype,
        metadata: {
          originalName: originalName,
          uploadedAt: new Date().toISOString()
        }
      }
    });

    console.log(`✓ File uploaded: ${fileName}`);

    // Make file publicly accessible (optional)
    await file.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Alternative: Get signed URL (with expiration)
    // const [signedUrl] = await file.getSignedUrl({
    //   action: 'read',
    //   expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    // });

    return {
      fileName: fileName,
      publicUrl: publicUrl,
      size: fileBuffer.length,
      mimetype: mimetype
    };

  } catch (error) {
    console.error('Firebase upload error:', error);
    throw error;
  }
}

// =============================================================================
// ROUTES
// =============================================================================

// Health check
app.get('/', (req, res) => {
  res.json({
    message: 'Express + Multer + Firebase Storage Server',
    status: 'running',
    endpoints: {
      upload: 'POST /api/upload',
      uploadMultiple: 'POST /api/upload-multiple',
      submitForm: 'POST /api/submit-form'
    }
  });
});

// Single file upload
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    console.log(`Received file: ${req.file.originalname} (${req.file.size} bytes)`);

    // Upload to Firebase
    const result = await uploadToFirebase(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    console.log(`✓ File URL: ${result.publicUrl}`);

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        originalName: req.file.originalname,
        fileName: result.fileName,
        url: result.publicUrl,
        size: result.size,
        mimetype: result.mimetype
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Multiple files upload
app.post('/api/upload-multiple', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    console.log(`Received ${req.files.length} files`);

    // Upload all files to Firebase in parallel
    const uploadPromises = req.files.map(file => 
      uploadToFirebase(file.buffer, file.originalname, file.mimetype)
    );

    const results = await Promise.all(uploadPromises);

    const files = results.map((result, index) => ({
      originalName: req.files[index].originalname,
      fileName: result.fileName,
      url: result.publicUrl,
      size: result.size,
      mimetype: result.mimetype
    }));

    console.log(`✓ All ${files.length} files uploaded`);

    res.json({
      success: true,
      message: `${files.length} files uploaded successfully`,
      files: files
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Form submission with files
app.post('/api/submit-form', async (req, res) => {
  try {
    const {
      contactMode,
      stylePreference,
      colorPreferences,
      additionalNotes,
      files,
      customerInfo
    } = req.body;

    console.log('Form submission received:');
    console.log('- Contact mode:', contactMode);
    console.log('- Style:', stylePreference);
    console.log('- Files:', files?.length || 0);

    // Log file URLs
    if (files && files.length > 0) {
      console.log('\nUploaded file URLs:');
      files.forEach((file, i) => {
        console.log(`${i + 1}. ${file.originalName}`);
        console.log(`   URL: ${file.url}`);
      });
    }

    // Here you would save to database
    // Example with Firestore:
    /*
    const db = admin.firestore();
    const submission = await db.collection('submissions').add({
      contactMode,
      stylePreference,
      colorPreferences,
      additionalNotes,
      files: files.map(f => ({
        name: f.originalName,
        url: f.url,
        size: f.size,
        type: f.mimetype
      })),
      customerEmail: customerInfo?.email,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('Saved to Firestore:', submission.id);
    */

    res.json({
      success: true,
      message: 'Form submitted successfully',
      submissionId: Date.now(),
      data: {
        contactMode,
        stylePreference,
        filesUploaded: files?.length || 0,
        fileUrls: files?.map(f => f.url) || []
      }
    });

  } catch (error) {
    console.error('Form submission error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum 10 files allowed'
      });
    }
  }

  if (error.message.includes('not allowed')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }

  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: error.message
  });
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log('='.repeat(70));
  console.log('🚀 Express + Multer + Firebase Storage Server');
  console.log('='.repeat(70));
  console.log(`📡 Server:          http://localhost:${PORT}`);
  console.log(`📤 Upload Single:   POST http://localhost:${PORT}/api/upload`);
  console.log(`📤 Upload Multiple: POST http://localhost:${PORT}/api/upload-multiple`);
  console.log(`📝 Submit Form:     POST http://localhost:${PORT}/api/submit-form`);
  console.log('='.repeat(70));
  console.log('✓ Ready to upload to Firebase Storage!');
  console.log('');
});
