
'use server';
import { NextResponse } from 'next/server';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeFirebase } from '@/firebase';

// Initialize Firebase client-side SDKs. This is safe on the server in Next.js.
const { storage } = initializeFirebase();

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }
    
    // Generate a unique filename
    const fileName = `submissions/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '-')}`;
    const storageRef = ref(storage, fileName);

    // Correctly get the file contents as an ArrayBuffer
    const fileBuffer = await file.arrayBuffer();

    // Upload the file buffer
    const snapshot = await uploadBytes(storageRef, fileBuffer, {
      contentType: file.type,
    });
    
    // Get the public URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        originalName: file.name,
        fileName: fileName,
        url: downloadURL,
        size: file.size,
        mimetype: file.type
      }
    });

  } catch (error: any) {
    console.error('Upload API error:', error);
    return NextResponse.json({ success: false, error: error.message || 'An unknown error occurred' }, { status: 500 });
  }
}
