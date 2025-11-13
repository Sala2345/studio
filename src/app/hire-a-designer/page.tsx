
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Mic, Play, Pause, Trash2, Download, UploadCloud, File as FileIcon, X, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Progress } from '@/components/ui/progress';
import { createDraftOrderFlow } from '@/ai/flows/create-draft-order';
import { ProductSelector } from '@/components/product-selector';
import type { ShopifyProduct } from '@/components/product-selector';
import { StylePreference } from '@/components/style-preference';
import { ColorPreference } from '@/components/color-preference';

const designSteps = [
    {
        text: 'Submit request and place order',
    },
    {
        text: 'Finalize design with our expert',
    },
    {
        text: "We'll print and ship your order",
    },
]

type Recording = {
    id: number;
    blob: Blob;
    url: string;
    duration: number;
};

type UploadableFile = {
    file: File;
    id: string;
    progress: number;
    url?: string;
    error?: string;
};

interface FormState {
    name: string;
    email: string;
    phoneNumber: string;
    selectedProduct: ShopifyProduct | null;
    designDescription: string;
    contactMode: string;
    designStyle: string;
    colors: string;
    inspirationLinks: string[];
    shopifyCustomerId?: string;
}

function HireADesignerPageContent() {
    const searchParams = useSearchParams();
    const [recordings, setRecordings] = useState<Recording[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [playingId, setPlayingId] = useState<number | null>(null);

    const [uploadedFiles, setUploadedFiles] = useState<UploadableFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    const [formState, setFormState] = useState<FormState>({
        name: '',
        email: '',
        phoneNumber: '',
        selectedProduct: null,
        designDescription: '',
        contactMode: 'email',
        designStyle: '',
        colors: '',
        inspirationLinks: [''],
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [submissionSuccess, setSubmissionSuccess] = useState(false);
    const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);

    const { toast } = useToast();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordingStartTimeRef = useRef<number>(0);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Extract customer data from URL parameters
        const email = searchParams.get('email') || '';
        const firstName = searchParams.get('firstName') || '';
        const lastName = searchParams.get('lastName') || '';
        const phone = searchParams.get('phone') || '';
        const customerId = searchParams.get('customerId') || '';
        const fullName = `${firstName} ${lastName}`.trim();

        setFormState(prev => ({
            ...prev,
            email: email || prev.email,
            name: fullName || prev.name,
            phoneNumber: phone || prev.phoneNumber,
            shopifyCustomerId: customerId || prev.shopifyCustomerId
        }));

    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

     useEffect(() => {
        if (user) {
            setFormState(prev => ({
                ...prev,
                name: prev.name || user.displayName || '',
                email: prev.email || user.email || '',
                phoneNumber: prev.phoneNumber || user.phoneNumber || ''
            }));
        }
    }, [user]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormState(prev => ({ ...prev, [id]: value }));
    };

    const handleContactModeChange = useCallback((value: string) => {
        setFormState(prev => ({...prev, contactMode: value}));
    }, []);

    const handleStyleChange = useCallback((value: string) => {
        setFormState(prev => ({...prev, designStyle: value}));
    }, []);
    
    const handleColorChange = useCallback((colors: string) => {
        setFormState(prev => ({ ...prev, colors }));
    }, []);

    // Voice note functions
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = mediaRecorder;
            let audioChunks: Blob[] = [];

            mediaRecorder.addEventListener('dataavailable', event => {
                audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener('stop', () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                const duration = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
                
                setRecordings(prev => [
                    ...prev,
                    { id: Date.now(), blob: audioBlob, url: audioUrl, duration },
                ]);

                stream.getTracks().forEach(track => track.stop());
            });

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            recordingStartTimeRef.current = Date.now();
            timerIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            toast({
                variant: 'destructive',
                title: 'Microphone Access Denied',
                description: 'Please grant microphone permission in your browser to record a voice note.',
            });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        }
    };

    const handleVoiceNoteClick = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };
    
    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handlePlayPause = (recording: Recording) => {
        if (playingId === recording.id) {
            audioRef.current?.pause();
            setPlayingId(null);
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            const newAudio = new Audio(recording.url);
            audioRef.current = newAudio;
            newAudio.play();
            setPlayingId(recording.id);
            newAudio.onended = () => setPlayingId(null);
        }
    };

    const handleDeleteRecording = (id: number) => {
        if (playingId === id) {
            audioRef.current?.pause();
            setPlayingId(null);
        }
        setRecordings(recordings.filter(rec => rec.id !== id));
    };

    const handleDownloadRecording = (recording: Recording) => {
        const a = document.createElement('a');
        a.href = recording.url;
        a.download = `voice-note-${recording.id}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
             if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, []);

    // File Upload Functions
    const handleFileSelect = (files: FileList | null) => {
        if (!files) return;
        const newFiles = Array.from(files).map(file => ({
            file,
            id: `${file.name}-${Date.now()}`,
            progress: 0,
        }));
        setUploadedFiles(prev => [...prev, ...newFiles]);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    };

    const removeFile = (id: string) => {
        setUploadedFiles(files => files.filter(f => f.id !== id));
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    // Form submission
    const handleSubmit = async () => {
        if (!user || !firestore) {
            toast({ variant: 'destructive', title: 'You must be logged in to submit a request.' });
            return;
        }

        const validationErrors = [];
        if (!formState.selectedProduct) validationErrors.push('Please select a product.');
        if (!formState.designDescription.trim()) validationErrors.push('Please provide a design description.');
        if (!formState.contactMode) validationErrors.push('Please select a contact method.');
        
        if (validationErrors.length > 0) {
            const errorString = validationErrors.join(' ');
            setSubmissionError(errorString);
            toast({ variant: 'destructive', title: 'Missing Information', description: errorString });
            return;
        }
        
        setSubmissionError(null);
        setIsSubmitting(true);

        try {
            const storage = getStorage();
            const designRequestId = doc(collection(firestore, 'ids')).id;
            
            // Combine uploaded files and voice notes
            const allFilesToUpload: UploadableFile[] = [
                ...uploadedFiles,
                ...recordings.map(rec => ({
                    file: new File([rec.blob], `voicenote-${rec.id}.webm`, { type: 'audio/webm' }),
                    id: rec.id.toString(),
                    progress: 0,
                }))
            ];

            // 1. Upload all files (including voice notes) to Firebase Storage
            const fileUploadPromises = allFilesToUpload.map(async (fileToUpload) => {
                const filePath = `design_requests/${user.uid}/${designRequestId}/${fileToUpload.file.name}`;
                const storageRef = ref(storage, filePath);
                const uploadTask = uploadBytesResumable(storageRef, fileToUpload.file);

                return new Promise<string>((resolve, reject) => {
                    uploadTask.on('state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            // Update progress for both regular files and voice notes
                             setUploadedFiles(prevFiles =>
                                prevFiles.map(f =>
                                    f.id === fileToUpload.id ? { ...f, progress } : f
                                )
                            );
                        },
                        (error) => {
                             setUploadedFiles(prevFiles =>
                                prevFiles.map(f =>
                                    f.id === fileToUpload.id ? { ...f, error: error.message } : f
                                )
                            );
                            console.error(`Upload failed for ${fileToUpload.file.name}:`, error);
                            reject(error);
                        },
                        async () => {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            setUploadedFiles(prevFiles =>
                                prevFiles.map(f =>
                                    f.id === fileToUpload.id ? { ...f, url: downloadURL, progress: 100 } : f
                                )
                            );
                            resolve(downloadURL);
                        }
                    );
                });
            });

            const uploadedFileUrls = await Promise.all(fileUploadPromises);
            
            // Create/update customer profile
            const customerRef = doc(firestore, 'customers', user.uid);
            const customerData = {
                id: user.uid,
                email: formState.email || user.email,
                name: formState.name || user.displayName,
                phoneNumber: formState.phoneNumber || user.phoneNumber,
                shopifyCustomerId: formState.shopifyCustomerId,
                updatedAt: serverTimestamp(),
            };
            await setDoc(customerRef, customerData, { merge: true });


            // 2. Create Firestore document
            const designRequestRef = doc(firestore, 'customers', user.uid, 'designRequests', designRequestId);
            const finalFormState = {
                ...formState,
                productId: formState.selectedProduct?.id,
                productTitle: formState.selectedProduct?.title,
                customerName: formState.name || user.displayName,
                id: designRequestId,
                customerId: user.uid,
                fileUrls: uploadedFileUrls,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            delete (finalFormState as any).selectedProduct;


            await setDoc(designRequestRef, finalFormState);

            // 3. Create Shopify Draft Order
            // This assumes user.uid can be mapped to a Shopify Customer Numeric ID.
            // In a real app, you'd look up the shopifyCustomerId from the /customers/{uid} document.
            // For this example, we'll use the one from the URL param if available
            const shopifyCustomerIdForOrder = formState.shopifyCustomerId?.replace(/[^0-9]/g, '');
            if (!shopifyCustomerIdForOrder) {
                throw new Error("Could not determine a numeric Shopify customer ID from your user account or URL.");
            }
            
            if (!formState.selectedProduct?.variants.edges[0]?.node.id) {
                throw new Error("Selected product does not have a valid variant ID.");
            }

            const draftOrderResult = await createDraftOrderFlow({
                designRequestId,
                customerId: shopifyCustomerIdForOrder, 
                variantId: formState.selectedProduct!.variants.edges[0]!.node.id,
                fileUrls: uploadedFileUrls,
            });

            if (!draftOrderResult.success || !draftOrderResult.invoiceUrl) {
                throw new Error(draftOrderResult.error || "Failed to create draft order in Shopify.");
            }
            
            setInvoiceUrl(draftOrderResult.invoiceUrl);
            setSubmissionSuccess(true);
        } catch (error: any) {
            console.error("Submission failed:", error);
            const errorMessage = error.message || 'An unknown error occurred during submission.';
            setSubmissionError(errorMessage);
            toast({ variant: 'destructive', title: 'Submission Failed', description: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submissionSuccess) {
        return (
            <div className="bg-background">
                <div className="max-w-screen-xl mx-auto py-16 px-5 font-sans">
                    <Card className="p-6 md:p-12 text-center bg-green-50 border-2 border-green-500">
                        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-green-800 mb-4">Request Submitted Successfully!</h2>
                        <p className="text-lg text-gray-700">Thank you! Your design request has been submitted.</p>
                        <p className="text-lg text-gray-700 mt-2">Our team will review your request and contact you within 24 hours at <strong>{user?.email}</strong>.</p>
                        {invoiceUrl && (
                            <div className="mt-8">
                                <p className="text-gray-600 mb-4">Please complete your order by paying the design fee.</p>
                                <Button asChild size="lg">
                                    <a href={invoiceUrl} target="_blank" rel="noopener noreferrer">
                                        Pay Now
                                    </a>
                                </Button>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        )
    }


    return (
        <div className="bg-background font-sans">
            <div className="max-w-screen-xl mx-auto py-16 px-5">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-16 items-start">
                    <main>
                        <h1 className="text-5xl font-bold leading-tight text-gray-800 mb-10 max-w-4xl">
                            Our designers are ready to create your ideal design
                        </h1>

                        <p className="text-xl font-medium text-gray-800 mb-8">It takes just 3 simple steps:</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
                            {designSteps.map((step, index) => (
                                <div key={index} className="bg-primary p-6 rounded-lg flex items-center gap-4 text-primary-foreground">
                                    <div className="text-4xl font-bold min-w-[30px]">{index + 1}</div>
                                    <div className="text-base font-medium leading-snug">{step.text}</div>
                                </div>
                            ))}
                        </div>

                        {/* Contact Info Section */}
                        <div className="mb-10">
                            <h2 className="text-lg font-medium text-gray-800 mb-4">Your Contact Information</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" type="text" placeholder="Your full name" value={formState.name} onChange={handleFormChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="you@example.com" value={formState.email} onChange={handleFormChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumber">Phone Number (Optional)</Label>
                                    <Input id="phoneNumber" type="tel" placeholder="(555) 123-4567" value={formState.phoneNumber} onChange={handleFormChange} />
                                </div>
                            </div>
                        </div>

                        {/* Product Selection Section */}
                        <div className="mb-10">
                             <ProductSelector
                                selectedProduct={formState.selectedProduct}
                                onProductSelect={(product) => setFormState(prev => ({...prev, selectedProduct: product}))}
                             />
                        </div>


                        {/* Form Section */}
                        <div className="mt-10">
                            <Label htmlFor="designDescription" className="text-lg font-medium text-gray-800 mb-2 block">
                                Describe your design in a few words
                                <span className="text-destructive ml-1">*</span>
                            </Label>
                            <p className="text-sm text-gray-600 mb-4">
                                For example: "I want a bold design for my trade show booth."
                            </p>

                            <Textarea
                                id="designDescription"
                                placeholder="Start typing here"
                                value={formState.designDescription}
                                onChange={(e) => setFormState(prev => ({ ...prev, designDescription: e.target.value }))}
                                className="min-h-[150px] text-base"
                                maxLength={500}
                            />
                            <div className="text-right text-sm text-gray-600 mt-2">
                                {formState.designDescription.length}/500
                            </div>

                            <div className="mt-4">
                                <p className="text-sm text-gray-600">You can also add a comment with a voice note.</p>
                                <Button
                                    variant="link"
                                    onClick={handleVoiceNoteClick}
                                    className={cn('p-0 h-auto text-gray-800 hover:text-primary transition-colors', isRecording && 'text-destructive')}
                                >
                                    <Mic className={cn('mr-2 h-4 w-4', isRecording && 'animate-pulse')} />
                                    {isRecording ? 'Stop Recording' : 'Add a Voice note'}
                                    {isRecording && <span className="ml-2 font-semibold text-destructive">{formatTime(recordingTime)}</span>}
                                </Button>

                                {recordings.length > 0 && (
                                    <div className="mt-5 space-y-3">
                                        <h3 className="font-semibold mb-2">Voice Notes:</h3>
                                        {recordings.map((rec) => (
                                            <Card key={rec.id} className="flex items-center justify-between p-3">
                                                <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground flex-shrink-0">
                                                        <Mic className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium text-foreground truncate">Voice Note {rec.id.toString().slice(-4)}</div>
                                                        <div className="text-xs text-muted-foreground">{formatTime(rec.duration)}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handlePlayPause(rec)}>
                                                        {playingId === rec.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadRecording(rec)}>
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                     <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-100 hover:text-destructive" onClick={() => handleDeleteRecording(rec.id)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="my-10">
                            <StylePreference
                                onContactModeChange={handleContactModeChange}
                                onStyleChange={handleStyleChange}
                            />
                        </div>

                        <div className="my-10">
                            <ColorPreference onChange={handleColorChange} />
                        </div>
                        
                        {/* File Upload Section */}
                        <div className="mt-10">
                            <Label className="text-lg font-medium text-gray-800 mb-2 block">
                                What files would you like included? <span className="text-gray-500 font-normal">(optional)</span>
                            </Label>
                            <p className="text-sm text-gray-600 mb-4">
                                Add logos and images, as well as any references you'd like us to look at.
                            </p>
                            <div className="max-w-3xl">
                                <div
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
                                        isDragging ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground"
                                    )}
                                    onClick={() => fileInputRef.current?.click()}
                                    onDragEnter={handleDragEnter}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => handleFileSelect(e.target.files)}
                                        accept=".pdf,.png,.jpeg,.jpg,.ai,.psd,.tif,.cdr,.eps,.gif,.doc,.docx,.bpm,.webm,.m4a,.mp3"
                                    />
                                    <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <p className="mt-4 text-foreground">Click to browse, or drag and drop a file here</p>
                                    <p className="mt-2 text-xs text-muted-foreground">Max file size 400MB. Supported types: pdf, png, jpg, ai, psd, etc.</p>
                                </div>
                                
                                {uploadedFiles.length > 0 && (
                                    <div className="mt-6">
                                        <h3 className="font-semibold mb-2">Uploaded Files:</h3>
                                        <div className="space-y-2">
                                            {uploadedFiles.map(f => (
                                                <Card key={f.id} className="flex items-center p-3 gap-3">
                                                    <FileIcon className="h-8 w-8 text-muted-foreground" />
                                                    <div className="flex-1 overflow-hidden">
                                                        <p className="text-sm font-medium truncate">{f.file.name}</p>
                                                        <p className="text-xs text-muted-foreground">{formatFileSize(f.file.size)}</p>
                                                        {isSubmitting && f.progress < 100 && <Progress value={f.progress} className="h-1 mt-1" />}
                                                        {f.error && <p className="text-xs text-destructive mt-1">{f.error}</p>}
                                                    </div>
                                                    {!isSubmitting && (
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeFile(f.id)}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Submission Section */}
                         <div className="mt-12 max-w-md mx-auto text-center">
                             <div className="bg-muted p-6 rounded-lg mb-6">
                                <h3 className="font-semibold text-lg mb-4">Review Your Request</h3>
                                <div className="space-y-3 text-left">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Product:</span>
                                        <span className="font-medium">{formState.selectedProduct ? "Selected" : "Not Selected"}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Description:</span>
                                        <span className="font-medium">{formState.designDescription ? "Provided" : "Not Provided"}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Contact Mode:</span>
                                        <span className="font-medium capitalize">{formState.contactMode ? formState.contactMode : "Not Selected"}</span>
                                    </div>
                                     <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Style:</span>
                                        <span className="font-medium capitalize">{formState.designStyle ? formState.designStyle.replace(/-/g, ' ') : "Not Selected"}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Files:</span>
                                        <span className="font-medium">{uploadedFiles.length} file(s)</span>
                                    </div>
                                     <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Voice Notes:</span>
                                        <span className="font-medium">{recordings.length} recording(s)</span>
                                    </div>
                                </div>
                            </div>
                            
                            {user && (
                                <>
                                    <Button onClick={handleSubmit} disabled={isSubmitting || isUserLoading} size="lg" className="w-full text-lg">
                                        {isSubmitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                                                Submitting...
                                            </>
                                        ) : 'Hire a Designer & Proceed to Payment'}
                                    </Button>
                                    {submissionError && <div className="mt-4 text-destructive bg-destructive/10 p-3 rounded-md">{submissionError}</div>}
                                </>
                            )}
                             {!user && !isUserLoading && (
                                <Card className="p-6 bg-amber-50 border-amber-300 text-center">
                                    <h4 className="font-bold text-lg text-amber-900 mb-2">Create an Account to Continue</h4>
                                    <p className="text-sm text-amber-800">To submit your request, please log in or create an account. This ensures we can contact you about your design.</p>
                                    <div className="mt-4 flex gap-4 justify-center">
                                        <Button variant="outline">Log In</Button>
                                        <Button>Create Account</Button>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </main>

                    
                </div>
            </div>
        </div>
    );
}


export default function HireADesignerPage() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <HireADesignerPageContent />
        </React.Suspense>
    )
}
