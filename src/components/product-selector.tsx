
'use client';

import React, { useState, useEffect } from 'react';
import { getProducts } from '@/services/shopify';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Check, Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export interface ShopifyProductVariant {
    id: string;
    title: string;
}

export interface ShopifyProduct {
    id: string;
    title: string;
    description: string;
    handle: string;
    tags: string[];
    totalInventory: number;
    priceRangeV2: {
        minVariantPrice: {
            amount: string;
            currencyCode: string;
        };
    };
    variants: {
        edges: {
            node: ShopifyProductVariant;
        }[];
    };
    featuredImage?: {
        url: string;
        altText: string;
    };
}

interface ProductSelectorProps {
    selectedProduct: ShopifyProduct | null;
    onProductSelect: (product: ShopifyProduct | null) => void;
    selectedVariantId: string | null;
    onVariantSelect: (variantId: string | null) => void;
}

const PRODUCTS_PER_PAGE = 6;

export function ProductSelector({ selectedProduct, onProductSelect, selectedVariantId, onVariantSelect }: ProductSelectorProps) {
    const [products, setProducts] = useState<ShopifyProduct[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<ShopifyProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchProducts() {
            setIsLoading(true);
            try {
                const fetchedProducts = await getProducts();
                if (Array.isArray(fetchedProducts)) {
                    setProducts(fetchedProducts);
                    setFilteredProducts(fetchedProducts);
                } else {
                     throw new Error('Failed to fetch products or invalid format.');
                }
            } catch (error) {
                console.error("Failed to fetch products:", error);
                toast({
                    variant: 'destructive',
                    title: 'Error Fetching Products',
                    description: (error as Error).message,
                });
            } finally {
                setIsLoading(false);
            }
        }
        fetchProducts();
    }, [toast]);

    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filtered = products.filter(product =>
            product.title.toLowerCase().includes(lowercasedFilter)
        );
        setFilteredProducts(filtered);
        setCurrentPage(1); // Reset to first page on search
    }, [searchTerm, products]);

    const handleSelectProduct = (product: ShopifyProduct) => {
        onProductSelect(product);
        if (product.variants.edges.length > 0) {
            onVariantSelect(product.variants.edges[0].node.id);
        } else {
            onVariantSelect(null);
        }
    };
    
    const handleClearSelection = () => {
        onProductSelect(null);
        onVariantSelect(null);
    }

    // Pagination calculations
    const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * PRODUCTS_PER_PAGE,
        currentPage * PRODUCTS_PER_PAGE
    );

    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };


    if (selectedProduct) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-medium text-gray-800">Selected Product</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-start gap-4 p-4 border rounded-lg flex-col sm:flex-row">
                        <Image
                            src={selectedProduct.featuredImage?.url || 'https://placehold.co/80x80'}
                            alt={selectedProduct.title}
                            width={80}
                            height={80}
                            className="rounded-md object-cover flex-shrink-0"
                        />
                        <div className="flex-1 w-full">
                            <p className="font-semibold">{selectedProduct.title}</p>
                            <p className="font-bold text-destructive">{new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedProduct.priceRangeV2.minVariantPrice.currencyCode }).format(parseFloat(selectedProduct.priceRangeV2.minVariantPrice.amount))}</p>
                             {selectedProduct.variants.edges.length > 1 && (
                                <div className="mt-2">
                                     <Select value={selectedVariantId || ''} onValueChange={(value) => onVariantSelect(value)}>
                                        <SelectTrigger className="w-full sm:w-[200px]">
                                            <SelectValue placeholder="Select variant" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedProduct.variants.edges.map(({node: variant}) => (
                                                <SelectItem key={variant.id} value={variant.id}>
                                                    {variant.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                        <Button onClick={handleClearSelection} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto">Change</Button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
             <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-800">Choose Your Product</CardTitle>
                 <p className="text-sm text-gray-600">Select the product you'd like to hire a designer for.</p>
            </CardHeader>
            <CardContent>
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 min-h-[300px]">
                            {paginatedProducts.map((product) => (
                                <Card
                                    key={product.id}
                                    onClick={() => handleSelectProduct(product)}
                                    className={cn(
                                        "cursor-pointer transition-all hover:shadow-lg flex flex-col",
                                        selectedProduct?.id === product.id && "ring-2 ring-primary"
                                    )}
                                >
                                    <div className="relative aspect-square w-full overflow-hidden rounded-t-lg">
                                        <Image
                                            src={product.featuredImage?.url || 'https://placehold.co/300x300'}
                                            alt={product.title}
                                            fill
                                            className="object-cover"
                                        />
                                        {selectedProduct?.id === product.id && (
                                            <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                                                <Check className="h-4 w-4 text-primary-foreground" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 flex flex-col flex-grow">
                                        <h3 className="font-semibold text-sm truncate">{product.title}</h3>
                                        <p className="font-bold text-destructive text-lg">{new Intl.NumberFormat('en-US', { style: 'currency', currency: product.priceRangeV2.minVariantPrice.currencyCode }).format(parseFloat(product.priceRangeV2.minVariantPrice.amount))}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {filteredProducts.length === 0 && !isLoading && (
                            <div className="text-center py-10 text-muted-foreground">
                                <p>No products found matching your search.</p>
                            </div>
                        )}
                        
                        {totalPages > 1 && (
                             <div className="flex items-center justify-end gap-4 mt-6">
                                <span className="text-sm text-muted-foreground">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePrevPage}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Previous
                                </Button>
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
