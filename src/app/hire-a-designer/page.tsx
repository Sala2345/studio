

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Mic, Play, Pause, Trash2, Download, UploadCloud, File as FileIcon, X, CheckCircle, Loader2, Upload, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, collection, serverTimestamp, arrayUnion, writeBatch } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { Progress } from '@/components/ui/progress';
import { createOrderFromLogFlow } from '@/ai/flows/create-order-from-log';
import { ProductSelector } from '@/components/product-selector';
import type { ShopifyProduct } from '@/components/product-selector';
import { StylePreference } from '@/components/style-preference';
import { ColorPreference } from '@/components/color-preference';
import { InspirationLinks } from '@/components/inspiration-links';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { provinces, getCitiesForProvince } from '@/lib/canadian-locations';
import imageCompression from 'browser-image-compression';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';


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
    streetAddress: string;
    city: string;
    province: string;
    postalCode: string;
    selectedProduct: ShopifyProduct | null;
    selectedVariantId: string | null;
    selectedVariantTitle?: string | null;
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
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [playingId, setPlayingId] = useState<number | null>(null);

    const [uploadedFiles, setUploadedFiles] = useState<UploadableFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [availableCities, setAvailableCities] = useState<string[]>([]);


    const [formState, setFormState] = useState<FormState>({
        name: '',
        email: '',
        phoneNumber: '',
        streetAddress: '',
        city: '',
        province: '',
        postalCode: '',
        selectedProduct: null,
        selectedVariantId: null,
        selectedVariantTitle: null,
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

    const handleProductSelect = useCallback((product: ShopifyProduct | null) => {
        setFormState(prev => ({
            ...prev, 
            selectedProduct: product,
            // Automatically select the first variant when a product is chosen
            selectedVariantId: product?.variants.edges[0]?.node.id || null,
            selectedVariantTitle: product?.variants.edges[0]?.node.title || null,
        }));
    }, []);

    const handleVariantSelect = useCallback((variantId: string | null) => {
        const variant = formState.selectedProduct?.variants.edges.find(edge => edge.node.id === variantId)?.node;
        setFormState(prev => ({ 
            ...prev, 
            selectedVariantId: variantId,
            selectedVariantTitle: variant?.title
        }));
    }, [formState.selectedProduct]);

    useEffect(() => {
        const email = searchParams.get('email') || '';
        const name = searchParams.get('name') || '';
        const phone = searchParams.get('phone') || '';
        const customerId = searchParams.get('customer_id') || '';
        const address1 = searchParams.get('address1') || '';
        const city = searchParams.get('city') || '';
        const provinceCode = searchParams.get('provinceCode') || '';
        const zip = searchParams.get('zip') || '';
        
        const provinceName = provinces.find(p => p.code === provinceCode)?.name || '';

        setFormState(prev => ({
            ...prev,
            email: email || prev.email,
            name: name || prev.name,
            phoneNumber: phone || prev.phoneNumber,
            streetAddress: address1 || prev.streetAddress,
            city: city || prev.city,
            province: provinceName || prev.province,
            postalCode: zip || prev.postalCode,
            shopifyCustomerId: customerId || prev.shopifyCustomerId
        }));

        if (provinceName) {
            setAvailableCities(getCitiesForProvince(provinceName));
        }

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

    const handleSelectChange = (field: keyof FormState) => (value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }));
        
        if (field === 'province') {
            const cities = getCitiesForProvince(value);
            setAvailableCities(cities);
            // Reset city when province changes
            setFormState(prev => ({ ...prev, city: '' }));
        }
    }

    const handleContactModeChange = useCallback((value: string) => {
        setFormState(prev => ({...prev, contactMode: value}));
    }, []);

    const handleStyleChange = useCallback((value: string) => {
        setFormState(prev => ({...prev, designStyle: value}));
    }, []);
    
    const handleColorChange = useCallback((colors: string) => {
        setFormState(prev => ({ ...prev, colors }));
    }, []);

    const handleLinksChange = useCallback((links: string[]) => {
        setFormState(prev => ({ ...prev, inspirationLinks: links }));
    }, []);

    const startRecording = async () => {
        if (hasPermission === null) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setHasPermission(true);
                stream.getTracks().forEach(track => track.stop()); // We have permission, now stop the track and start again properly.
            } catch (error) {
                console.error('Error accessing microphone:', error);
                setHasPermission(false);
                toast({
                    variant: 'destructive',
                    title: 'Microphone Access Denied',
                    description: 'Please grant microphone permission in your browser to record a voice note.',
                });
                return; // Stop execution if permission is denied
            }
        }
    
        if (hasPermission === false) {
             toast({
                variant: 'destructive',
                title: 'Microphone Access Denied',
                description: 'Please grant microphone permission in your browser to record a voice note.',
            });
            return;
        }

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
            console.error('Error starting recording:', error);
             toast({
                variant: 'destructive',
                title: 'Recording Error',
                description: 'Could not start recording. Please try again.',
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

    const processAndUploadFiles = async (designRequestRef: any, customerId: string, designRequestId: string, filesToUpload: UploadableFile[]) => {
        if (!firestore) return;
        const storage = getStorage();
        const fileUrls: string[] = [];
        const fileErrors: { fileName: string, error: string }[] = [];

        const compressionPromises = filesToUpload.map(async (fileToUpload) => {
            let fileToProcess = fileToUpload.file;
            if (fileToProcess.type.startsWith('image/') && fileToProcess.size > 1024 * 1024) { // Only compress images > 1MB
                try {
                    const compressedFile = await imageCompression(fileToProcess, {
                        maxSizeMB: 5,
                        maxWidthOrHeight: 1920,
                        useWebWorker: true,
                    });
                    toast({
                        title: `Image compressed: ${compressedFile.name}`,
                        description: `Original size: ${formatFileSize(fileToUpload.file.size)}, New size: ${formatFileSize(compressedFile.size)}`,
                    });
                    return { ...fileToUpload, file: compressedFile };
                } catch (compressionError) {
                    console.warn(`Could not compress image ${fileToUpload.file.name}. Uploading original.`, compressionError);
                }
            }
            return fileToUpload;
        });

        const filesToActuallyUpload = await Promise.all(compressionPromises);

        const uploadPromises = filesToActuallyUpload.map(fileToUpload => {
            return new Promise<void>((resolve) => {
                const filePath = `design_requests/${customerId}/${designRequestId}/${fileToUpload.file.name}`;
                const storageRef = ref(storage, filePath);
                const uploadTask = uploadBytesResumable(storageRef, fileToUpload.file);

                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        setUploadedFiles(prevFiles =>
                            prevFiles.map(f =>
                                f.id === fileToUpload.id ? { ...f, progress } : f
                            )
                        );
                    },
                    (error) => {
                        console.error(`Upload failed for ${fileToUpload.file.name}:`, error);
                        fileErrors.push({ fileName: fileToUpload.file.name, error: error.message });
                        resolve();
                    },
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        fileUrls.push(downloadURL);
                        resolve();
                    }
                );
            });
        });

        await Promise.all(uploadPromises);

        // Batch update Firestore with all URLs and errors at once
        const batch = writeBatch(firestore);
        const updateData: { fileUrls: any, status: string, fileErrors?: any } = {
            fileUrls: arrayUnion(...fileUrls),
            status: 'files-uploaded',
        };

        if (fileErrors.length > 0) {
            updateData.status = 'upload-error';
            updateData.fileErrors = arrayUnion(...fileErrors);
        }

        batch.update(designRequestRef, updateData);
        await batch.commit();
    };

    const handleSubmit = async () => {
        if (!firestore) {
            toast({ variant: 'destructive', title: 'Database not available.' });
            return;
        }

        const fullShippingAddress = [formState.streetAddress, formState.city, formState.province, formState.postalCode].filter(Boolean).join(', ');

        const validationErrors = [];
        if (!formState.name.trim()) validationErrors.push('Please enter your name.');
        if (!formState.email.trim()) validationErrors.push('Please enter your email.');
        if (!formState.phoneNumber.trim()) validationErrors.push('Please enter your phone number.');
        if (!formState.streetAddress.trim()) validationErrors.push('Please enter your street address.');
        if (!formState.city.trim()) validationErrors.push('Please select a city.');
        if (!formState.province.trim()) validationErrors.push('Please select a province.');
        if (!formState.postalCode.trim()) validationErrors.push('Please enter your postal code.');
        if (!formState.selectedProduct) validationErrors.push('Please select a product.');
        if (!formState.designDescription.trim()) validationErrors.push('Please provide a design description.');
        
        if (validationErrors.length > 0) {
            const errorString = validationErrors.join(' ');
            setSubmissionError(errorString);
            toast({ variant: 'destructive', title: 'Missing Information', description: errorString });
            return;
        }
        
        setSubmissionError(null);
        setIsSubmitting(true);

        const designRequestId = doc(collection(firestore, 'ids')).id;
        const customerId = user?.uid || `anon_${doc(collection(firestore, 'ids')).id}`;

        const customerRef = doc(firestore, 'customers', customerId);
        const customerData: any = {
            id: customerId,
            email: formState.email,
            name: formState.name,
            phoneNumber: formState.phoneNumber,
            shippingAddress: fullShippingAddress,
            updatedAt: serverTimestamp(),
        };
        if (formState.shopifyCustomerId) {
            customerData.shopifyCustomerId = formState.shopifyCustomerId;
        }
         if (!user) { // Set createdAt only for new anonymous users
            customerData.createdAt = serverTimestamp();
        }
        // Create or merge customer data without blocking
        setDocumentNonBlocking(customerRef, customerData, { merge: true });


        const designRequestRef = doc(firestore, 'customers', customerId, 'designRequests', designRequestId);
        const preliminaryFormState = {
            ...formState,
            id: designRequestId,
            customerId: customerId,
            customerName: formState.name,
            productId: formState.selectedProduct?.id,
            productTitle: formState.selectedProduct?.title,
            shippingAddress: fullShippingAddress,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            status: 'pending',
            fileUrls: [], // Will be populated by background process
        };
        
        // Clean up data for Firestore
        delete (preliminaryFormState as any).selectedProduct;
        delete (preliminaryFormState as any).name;
        if(!(preliminaryFormState as any).shopifyCustomerId) {
            delete (preliminaryFormState as any).shopifyCustomerId;
        }
        delete (preliminaryFormState as any).streetAddress;
        delete (preliminaryFormState as any).city;
        delete (preliminaryFormState as any).province;
        delete (preliminaryFormState as any).postalCode;

        // Create the design request document without blocking
        setDocumentNonBlocking(designRequestRef, preliminaryFormState, { merge: false });

        // Show success message immediately
        setSubmissionSuccess(true);
        setIsSubmitting(false); // Allow UI to update to success screen

        // --- Start background processing ---

        // 1. Files
        const allFilesToUpload: UploadableFile[] = [
            ...uploadedFiles,
            ...recordings.map(rec => ({
                file: new File([rec.blob], `voicenote-${rec.id}.webm`, { type: 'audio/webm' }),
                id: rec.id.toString(),
                progress: 0,
            }))
        ];
        if (allFilesToUpload.length > 0) {
                processAndUploadFiles(designRequestRef, customerId, designRequestId, allFilesToUpload)
                .catch((err) => { 
                    console.error("File processing/upload failed:", err);
                    updateDocumentNonBlocking(designRequestRef, { status: 'upload-error', orderError: 'File upload failed.' });
                });
        } else {
            updateDocumentNonBlocking(designRequestRef, { status: 'files-uploaded' });
        }

        // 2. Shopify Order
        if (formState.selectedVariantId) {
            createOrderFromLogFlow({ log: preliminaryFormState as any })
                .then(async (draftOrderResult) => {
                    if (!draftOrderResult.success || !draftOrderResult.invoiceUrl) {
                        console.warn("Could not create Shopify draft order:", draftOrderResult.error);
                        updateDocumentNonBlocking(designRequestRef, { 
                            status: 'order-error',
                            orderError: draftOrderResult.error || 'Unknown Shopify error'
                        });
                    } else {
                        setInvoiceUrl(draftOrderResult.invoiceUrl); // Still set for the UI
                        updateDocumentNonBlocking(designRequestRef, { 
                            status: 'complete',
                            invoiceUrl: draftOrderResult.invoiceUrl,
                            shopifyOrderId: draftOrderResult.orderId,
                            });
                    }
                })
                .catch(async (err) => {
                    console.error("Flow execution failed:", err);
                    updateDocumentNonBlocking(designRequestRef, { 
                        status: 'order-error',
                        orderError: (err as Error).message || 'Flow execution failed'
                    });
                });
        } else {
            console.warn("Skipping Shopify draft order: Missing Product Variant ID.");
            updateDocumentNonBlocking(designRequestRef, { status: 'complete' }); // Complete if no order needed
        }
        // --- End background processing ---
    };

    if (submissionSuccess) {
        return (
            <div className="bg-background">
                <div className="max-w-screen-xl mx-auto py-16 px-5 font-sans">
                    <Card className="p-6 md:p-12 text-center bg-green-50 border-2 border-green-500">
                        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-green-800 mb-4">Request Submitted Successfully!</h2>
                        <p className="text-lg text-gray-700">Thank you! Your design request has been submitted.</p>
                        <p className="text-lg text-gray-700 mt-2">File uploads and order processing are continuing in the background. Our team will review your request and contact you at <strong>{formState.email}</strong>.</p>
                        {invoiceUrl ? (
                             <div className="mt-8">
                                <p className="text-gray-600 mb-4">Your draft order is ready. Please proceed with the payment.</p>
                                <Button asChild size="lg">
                                    <a href={invoiceUrl} target="_blank" rel="noopener noreferrer">
                                        Pay Now
                                    </a>
                                </Button>
                            </div>
                        ) : (
                             <div className="mt-8 text-center">
                                <p className="text-gray-600 mb-4">We are generating your invoice...</p>
                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                             </div>
                        )}
                    </Card>
                </div>
            </div>
        )
    }

    const SummaryItem = ({ label, value, isComplete }: { label: string, value: string, isComplete: boolean }) => (
        <div className="flex items-center justify-between bg-white rounded-lg p-3">
            <div className="flex items-center gap-3">
                <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    isComplete ? 'bg-destructive border-destructive' : 'border-gray-300'
                )}>
                    {isComplete && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm text-gray-600">{label}</span>
            </div>
            <span className="text-sm font-medium text-gray-800">{value}</span>
        </div>
    );


    return (
        <div className="bg-background font-sans">
            <div className="max-w-[1200px] mx-auto py-16 px-5">
                <div className="grid grid-cols-1 gap-16 items-start">
                    <main>
                        <h1 className="text-5xl font-bold leading-tight text-gray-800 mb-10 max-w-4xl">
                            Our designers are ready to create your ideal design
                        </h1>

                        <p className="text-xl font-medium text-gray-800 mb-8">It takes just 3 simple steps:</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
                            {designSteps.map((step, index) => (
                                <div key={index} className="bg-primary p-6 rounded-lg flex items-center gap-4 text-primary-foreground">
                                    <div className="text-4xl font-bold min-w-[30px]">{index + 1}</div>
                                    <div className="text-base font-bold leading-snug">{step.text}</div>
                                </div>
                            ))}
                        </div>

                        <div className="mb-10">
                            <h2 className="text-lg font-medium text-gray-800 mb-4">Your Contact Information</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                                    <Input id="name" type="text" placeholder="Your full name" value={formState.name} onChange={handleFormChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                                    <Input id="email" type="email" placeholder="you@example.com" value={formState.email} onChange={handleFormChange} />
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="phoneNumber">Phone Number <span className="text-destructive">*</span></Label>
                                    <Input id="phoneNumber" type="tel" placeholder="(555) 123-4567" value={formState.phoneNumber} onChange={handleFormChange} />
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="streetAddress">Street Address <span className="text-destructive">*</span></Label>
                                    <Input id="streetAddress" placeholder="123 Main St" value={formState.streetAddress} onChange={handleFormChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="province">Province <span className="text-destructive">*</span></Label>
                                     <Select value={formState.province} onValueChange={handleSelectChange('province')}>
                                        <SelectTrigger id="province">
                                            <SelectValue placeholder="Select a province" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {provinces.map(p => <SelectItem key={p.code} value={p.name}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
                                     <Select value={formState.city} onValueChange={handleSelectChange('city')} disabled={!formState.province}>
                                        <SelectTrigger id="city">
                                            <SelectValue placeholder="Select a city" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableCities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="postalCode">Postal Code <span className="text-destructive">*</span></Label>
                                    <Input id="postalCode" placeholder="A1B 2C3" value={formState.postalCode} onChange={handleFormChange} />
                                </div>
                            </div>
                        </div>

                        <div className="mb-10">
                             <ProductSelector
                                selectedProduct={formState.selectedProduct}
                                onProductSelect={handleProductSelect}
                                selectedVariantId={formState.selectedVariantId}
                                onVariantSelect={handleVariantSelect}
                             />
                        </div>
                        
                        <div className="mt-10">
                            <Label htmlFor="designDescription" className="text-lg font-bold text-gray-800 mb-2 block">
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
                                    variant="outline"
                                    onClick={handleVoiceNoteClick}
                                    className={cn('text-primary border-primary hover:bg-primary/5 hover:text-primary transition-colors', isRecording && 'text-destructive')}
                                >
                                    <Mic className={cn('mr-2 h-4 w-4', isRecording && 'animate-pulse')} />
                                    {isRecording ? 'Stop Recording' : 'Add a Voice note'}
                                    {isRecording && <span className="ml-2 font-semibold text-destructive">{formatTime(recordingTime)}</span>}
                                </Button>

                                {recordings.length > 0 && !isSubmitting && (
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
                        
                        <div className="mt-10">
                            <Label className="text-lg font-bold text-gray-800 mb-2 block">
                                What files would you like included? <span className="text-gray-500 font-normal">(optional)</span>
                            </Label>
                            <p className="text-sm text-gray-600 mb-4">
                                Add logos and images, as well as any references you'd like us to look at.
                            </p>
                            <div className="max-w-3xl">
                                <div
                                    className={cn(
                                        "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors bg-gray-50",
                                        isDragging ? "border-primary bg-primary/10 border-solid" : "border-gray-300 hover:border-gray-400 hover:bg-gray-100"
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
                                    <UploadCloud className="mx-auto h-12 w-12 text-gray-500" />
                                    <p className="mt-4 text-gray-800">Click to browse, or drag and drop a file here</p>
                                    <p className="mt-2 text-xs text-gray-500">
                                      Supported file types: pdf, png, jpeg, jpg, ai, psd, tif, cdr, eps, gif, doc, docx, bpm<br/>
                                      Supported file size: maximum 400 MB
                                    </p>
                                </div>
                                
                                {uploadedFiles.length > 0 && (
                                    <div className="mt-6">
                                        <h3 className="font-semibold mb-4 text-gray-800">Uploaded Files:</h3>
                                        <div className="space-y-3">
                                            {uploadedFiles.map(f => (
                                                <Card key={f.id} className="flex items-center p-4 gap-4 hover:shadow-md transition-shadow">
                                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                                        <FileIcon className="h-6 w-6 text-gray-500" />
                                                    </div>
                                                    <div className="flex-1 overflow-hidden">
                                                        <p className="text-sm font-medium truncate text-gray-800">{f.file.name}</p>
                                                        <p className="text-xs text-gray-500">{formatFileSize(f.file.size)}</p>
                                                        {f.progress > 0 && f.progress < 100 && <Progress value={f.progress} className="h-1 mt-2" />}
                                                        {f.error && <p className="text-xs text-destructive mt-1">{f.error}</p>}
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 hover:bg-red-100 hover:text-destructive" onClick={() => removeFile(f.id)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                         <div className="my-10">
                            <InspirationLinks
                                onChange={handleLinksChange}
                            />
                        </div>

                        <div className="mt-12 max-w-2xl mx-auto">
                            <div className="bg-gray-50 rounded-xl p-6 sm:p-8 space-y-4">
                                <h3 className="text-center text-xl font-semibold text-gray-800 mb-6">Review Your Request</h3>
                                <div className="space-y-3">
                                     <SummaryItem
                                        label="Contact Information:"
                                        value={formState.name && formState.email && formState.phoneNumber && formState.streetAddress ? 'Complete' : 'Incomplete'}
                                        isComplete={!!(formState.name && formState.email && formState.phoneNumber && formState.streetAddress)}
                                    />
                                    <SummaryItem
                                        label="Product and Variant:"
                                        value={formState.selectedProduct ? `${formState.selectedProduct.title}${formState.selectedVariantTitle ? ` (${formState.selectedVariantTitle})` : ''}` : 'Not selected'}
                                        isComplete={!!formState.selectedProduct && !!formState.selectedVariantId}
                                    />
                                    <SummaryItem
                                        label="Description:"
                                        value={formState.designDescription ? 'Provided' : 'Not provided'}
                                        isComplete={!!formState.designDescription.trim()}
                                    />
                                     <SummaryItem
                                        label="Voice Note:"
                                        value={recordings.length > 0 ? `${recordings.length} added` : 'None'}
                                        isComplete={recordings.length > 0}
                                    />
                                    <SummaryItem
                                        label="Contact Mode:"
                                        value={formState.contactMode.charAt(0).toUpperCase() + formState.contactMode.slice(1)}
                                        isComplete={!!formState.contactMode}
                                    />
                                     <SummaryItem
                                        label="Style:"
                                        value={formState.designStyle ? formState.designStyle.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not specified'}
                                        isComplete={!!formState.designStyle}
                                    />
                                    <SummaryItem
                                        label="Colors:"
                                        value={formState.colors ? 'Specified' : 'Not specified'}
                                        isComplete={!!formState.colors}
                                    />
                                    <SummaryItem
                                        label="Files:"
                                        value={uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s)` : 'None'}
                                        isComplete={uploadedFiles.length > 0}
                                    />
                                    <SummaryItem
                                        label="Inspiration Links:"
                                        value={formState.inspirationLinks.filter(l => l).length > 0 ? `${formState.inspirationLinks.filter(l => l).length} link(s)` : 'None'}
                                        isComplete={formState.inspirationLinks.filter(l => l).length > 0}
                                    />
                                </div>
                            </div>
                            
                            <Button 
                                onClick={handleSubmit} 
                                disabled={isSubmitting || isUserLoading} 
                                size="lg" 
                                className="w-full mt-6 text-lg py-7"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>
                                        <Upload className="mr-3 h-5 w-5" />
                                        Hire a Designer
                                    </>
                                )}
                            </Button>
                            {submissionError && <div className="text-center mt-4 text-sm text-destructive">{submissionError}</div>}
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

    


    


