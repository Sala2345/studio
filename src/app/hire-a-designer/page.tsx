
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Check, Wand2, Trash2, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ProductSelector } from '@/components/product-selector';
import type { ShopifyProduct } from '@/components/product-selector';
import { StylePreference } from '@/components/style-preference';
import { ColorPreference } from '@/components/color-preference';
import { InspirationLinks } from '@/components/inspiration-links';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { provinces, getCitiesForProvince } from '@/lib/canadian-locations';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { UploadcareWidget } from '@/components/uploadcare-widget';

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
  key: string;
}

const designSteps = [
    {
        text: 'Submit your request details',
    },
    {
        text: 'Review your submitted information',
    },
    {
        text: "We'll contact you to finalize",
    },
]

const initialFormState = {
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
    shopifyCustomerId: '',
    uploadedFiles: [],
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
    uploadedFiles: UploadedFile[];
}

const saveDesignRequest = (requestData: any) => {
    if (typeof window === 'undefined') return;
    const existingRequests = JSON.parse(localStorage.getItem('designRequests') || '[]');
    const newRequest = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...requestData
    };
    existingRequests.push(newRequest);
    localStorage.setItem('designRequests', JSON.stringify(existingRequests));
    return newRequest;
};

function HireADesignerPageContent() {
    const searchParams = useSearchParams();
    const [availableCities, setAvailableCities] = useState<string[]>([]);
    const [formState, setFormState] = useState<FormState>(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState<string | null>(null);
    const [isDesignerModalOpen, setIsDesignerModalOpen] = useState(false);
    
    const { toast } = useToast();

     useEffect(() => {
        const handleMessage = async (event: MessageEvent) => {
            if (event.data?.type === 'ADD_GENERATED_DESIGN') {
                setIsDesignerModalOpen(false); // Close the modal
                const { file: fileData } = event.data;
                
                const newFile: UploadedFile = {
                    name: fileData.name,
                    url: fileData.url, // This will be a data URI for AI, or a CDN url for Uploadcare
                    size: fileData.size,
                    type: fileData.type,
                    key: fileData.key,
                };
                setFormState(prev => ({
                    ...prev,
                    uploadedFiles: [...prev.uploadedFiles, newFile]
                }));
                toast({ title: "AI Design Added!", description: "The generated design has been attached to your request." });
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const handleProductSelect = useCallback((product: ShopifyProduct | null) => {
        setFormState(prev => ({
            ...prev, 
            selectedProduct: product,
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

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormState(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (field: keyof FormState) => (value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }));
        
        if (field === 'province') {
            const cities = getCitiesForProvince(value);
            setAvailableCities(cities);
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

    const handleFilesUploaded = useCallback((files: Omit<UploadedFile, 'key'>[]) => {
        const newFiles = files.map(file => ({
            ...file,
            key: file.url, // Use URL as a key for uploaded files
        }));
        setFormState(prev => ({
            ...prev,
            uploadedFiles: [...prev.uploadedFiles, ...newFiles]
        }));
        toast({
            title: "Upload Successful",
            description: `${files.length} file(s) have been added to your request.`
        });
    }, []);

    const removeFile = (key: string) => {
        setFormState(prev => ({
            ...prev,
            uploadedFiles: prev.uploadedFiles.filter(f => f.key !== key)
        }));
    };


    const handleSubmit = async () => {
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
        
        try {
            const selectedVariant = formState.selectedProduct?.variants.edges.find(edge => edge.node.id === formState.selectedVariantId)?.node;

            const requestData = {
                name: formState.name,
                email: formState.email,
                phoneNumber: formState.phoneNumber,
                streetAddress: formState.streetAddress,
                city: formState.city,
                province: formState.province,
                postalCode: formState.postalCode,
                shopifyCustomerId: formState.shopifyCustomerId,
                selectedProduct: formState.selectedProduct,
                selectedVariant: selectedVariant, 
                designDescription: formState.designDescription,
                contactMode: formState.contactMode,
                designStyle: formState.designStyle,
                colors: formState.colors,
                inspirationLinks: formState.inspirationLinks.filter(l => l),
                uploadedFiles: formState.uploadedFiles,
            };

            saveDesignRequest(requestData);

            const ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/25403328/uzbcv85/';
            try {
                const response = await fetch(ZAPIER_WEBHOOK_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        customer: {
                            first_name: requestData.name.split(' ')[0] || requestData.name,
                            last_name: requestData.name.split(' ').slice(1).join(' ') || '',
                            email: requestData.email,
                            phone: requestData.phoneNumber,
                        },
                        shipping_address: {
                            address1: requestData.streetAddress,
                            city: requestData.city,
                            province: requestData.province,
                            zip: requestData.postalCode,
                            country: 'Canada',
                            phone: requestData.phoneNumber,
                        },
                        line_items: [{
                            variant_id: requestData.selectedVariant?.id || formState.selectedProduct?.variants?.edges[0]?.node.id,
                            quantity: 1,
                            price: formState.selectedProduct?.priceRangeV2.minVariantPrice.amount,
                        }],
                        note: `Design Request:\n\n${requestData.designDescription}\n\nContact Method: ${requestData.contactMode || 'Email'}\nStyle: ${requestData.designStyle || 'Not specified'}\n\nFiles: ${requestData.uploadedFiles?.length || 0} uploaded\nInspiration Links: ${requestData.inspirationLinks?.filter(l => l).length || 0}`,
                        tags: 'design-request,custom-order',
                        metafields: {
                            design_description: requestData.designDescription,
                            contact_method: requestData.contactMode,
                            design_style: requestData.designStyle,
                            colors: requestData.colors,
                            uploaded_files: JSON.stringify(requestData.uploadedFiles.map(f => f.url)),
                            inspiration_links: JSON.stringify(requestData.inspirationLinks),
                        }
                    })
                });
                if (!response.ok) {
                    throw new Error('Webhook failed');
                }
                console.log('Successfully sent to Zapier');
            } catch (webhookError) {
                console.error('Zapier webhook error:', webhookError);
            }

            toast({
                title: 'Submission Successful!',
                description: "Your design request has been submitted and order is being created.",
            });

            const email = searchParams.get('email') || '';
            const name = searchParams.get('name') || '';
            const phone = searchParams.get('phone') || '';
            const customerId = searchParams.get('customer_id') || '';
            const address1 = searchParams.get('address1') || '';
            const city = searchParams.get('city') || '';
            const provinceCode = searchParams.get('provinceCode') || '';
            const zip = searchParams.get('zip') || '';
            const provinceName = provinces.find(p => p.code === provinceCode)?.name || '';
            
            setFormState({
                ...initialFormState,
                email: email,
                name: name,
                phoneNumber: phone,
                shopifyCustomerId: customerId,
                streetAddress: address1,
                city: city,
                province: provinceName,
                postalCode: zip,
                uploadedFiles: [],
            });
            if (provinceName) {
                setAvailableCities(getCitiesForProvince(provinceName));
            }

        } catch (error: any) {
            console.error("Error during submission:", error);
            setSubmissionError("There was an error submitting your request. Please try again.");
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: "There was an error submitting your request. Please try again.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const getDesignerPrompt = () => {
        const { selectedProduct, designDescription } = formState;
        let prompt = designDescription || '';

        if (selectedProduct?.title) {
            prompt = `A design for a ${selectedProduct.title}: ${prompt}`;
        }
        
        return prompt;
    };

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
        <>
            <Dialog open={isDesignerModalOpen} onOpenChange={setIsDesignerModalOpen}>
                <DialogContent className="max-w-7xl h-[90vh] p-0">
                     <DialogHeader className="p-6 pb-0">
                        <DialogTitle>AI Designer</DialogTitle>
                        <DialogDescription>
                            Generate a design with AI. When you're done, click "Use This Design" to add it to your request.
                        </DialogDescription>
                    </DialogHeader>
                    <iframe
                        src={`/designer?prompt=${encodeURIComponent(getDesignerPrompt())}`}
                        className="w-full h-full border-0"
                        title="AI Designer"
                    />
                </DialogContent>
            </Dialog>

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
                                    <Button variant="outline" onClick={() => setIsDesignerModalOpen(true)}>
                                        <Wand2 className="mr-2 h-4 w-4" />
                                        Launch AI Designer
                                    </Button>
                                </div>
                            </div>

                             <div className="my-10">
                                 <h2 className="text-lg font-medium text-gray-800 mb-2">Upload Your Files <span className="text-base text-gray-500 font-normal">(optional)</span></h2>
                                 <p className="text-sm text-gray-600 mb-4">Upload any logos, images, or documents that will help our designers.</p>
                                <Card className="p-4 bg-muted/50">
                                    <UploadcareWidget onFilesUploaded={handleFilesUploaded} />
                                    {formState.uploadedFiles.length > 0 && (
                                        <div className="mt-4 space-y-3 pt-4 border-t">
                                            <h3 className="text-sm font-medium text-muted-foreground">Attached Files:</h3>
                                            <ul className="space-y-2">
                                                {formState.uploadedFiles.map((file) => (
                                                    <li key={file.key} className="flex items-center justify-between text-sm bg-background p-2 rounded-md border">
                                                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="truncate text-primary hover:underline flex items-center gap-2">
                                                            <LinkIcon className="w-4 h-4" />
                                                            {file.name}
                                                        </a>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => removeFile(file.key)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </Card>
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
                                            label="Attached Files:"
                                            value={`${formState.uploadedFiles.length} file(s)`}
                                            isComplete={true}
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
                                            label="Inspiration Links:"
                                            value={formState.inspirationLinks.filter(l => l).length > 0 ? `${formState.inspirationLinks.filter(l => l).length} link(s)` : 'None'}
                                            isComplete={formState.inspirationLinks.filter(l => l).length > 0}
                                        />
                                    </div>
                                </div>
                                
                                <Button 
                                    onClick={handleSubmit}
                                    disabled={isSubmitting} 
                                    size="lg" 
                                    className="w-full mt-6 text-lg py-7"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                        <>
                                            <Send className="mr-3 h-5 w-5" />
                                            Submit Design Request
                                        </>
                                    )}
                                </Button>
                                {submissionError && <div className="text-center mt-4 text-sm text-destructive">{submissionError}</div>}
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        </>
    );
}

export default function HireADesignerPage() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <HireADesignerPageContent />
        </React.Suspense>
    )
}

    