// src/app/(commonLayout)/product/[id]/page.tsx

import { notFound } from "next/navigation";
import RelatedProduct from "../RelatedProduct";
import ProductDetails from "../productDetails";

type tParams = Promise<{ id: string[] }>;

const ProductPage = async ({ params }: { params: tParams }) => {
  const { id } = await params;

  try {
    const apiUrl = `https://mirexa-store-backend.vercel.app/api/product/${id}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      notFound();
      return; // Ensure the function exits here if not found
    }

    const productData = await response.json();
    console.log("Product Data:", productData);

    if (!productData || !productData.data || !productData.data.category) {
      notFound(); // Instead of throwing an error, redirect to notFound
      return; // Ensure the function exits here
    }

    const relatedProductsUrl = `https://mirexa-store-backend.vercel.app/api/product/category/${productData.data.category}`;
    const relatedProductsResponse = await fetch(relatedProductsUrl);
    console.log(relatedProductsUrl);
    const relatedProducts = relatedProductsResponse.ok
      ? await relatedProductsResponse.json()
      : { data: [] };
    console.log("Related Products:", relatedProducts);

    const relatedProductsData = relatedProducts?.data || [];

    return (
      <>
        <ProductDetails
          product={productData}
          relatedProducts={relatedProductsData}
        />

        {Array.isArray(relatedProductsData) &&
        relatedProductsData.length > 0 ? (
          <RelatedProduct relatedProducts={relatedProductsData} />
        ) : (
          <p>No related products available.</p>
        )}
      </>
    );
  } catch (error) {
    console.error("Error fetching product details:", error);
    notFound();
  }
};

// This will treat this page as a static page

export default ProductPage;
