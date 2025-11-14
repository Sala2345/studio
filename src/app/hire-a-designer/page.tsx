

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { CheckCircle, Loader2, Upload, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { doc, collection, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { createOrderFromLogFlow } from '@/ai/flows/create-order-from-log';
import { ProductSelector } from '@/components/product-selector';
import type { ShopifyProduct } from '@/components/product-selector';
import { StylePreference } from '@/components/style-preference';
import { ColorPreference } from '@/components/color-preference';
import { InspirationLinks } from '@/components/inspiration-links';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { provinces, getCitiesForProvince } from '@/lib/canadian-locations';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { OptimizedFileUploader, type UploadedFileData } from '@/components/optimized-file-uploader';
import { cn } from '@/lib/utils';


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
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFileData[]>([]);
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

    const handleFilesUploaded = useCallback((finalFiles: UploadedFileData[]) => {
        setUploadedFiles(finalFiles);
    }, []);

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

        const fileUrls = uploadedFiles.map(f => f.url).filter((url): url is string => !!url);
        
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
            fileUrls: fileUrls, 
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

        // Shopify Order
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
                                Add logos, voice notes, and images, as well as any references you'd like us to look at.
                            </p>
                            <div className="max-w-3xl">
                               <OptimizedFileUploader onFilesUploaded={handleFilesUploaded} />
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

    