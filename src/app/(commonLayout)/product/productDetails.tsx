/* eslint-disable @next/next/no-img-element */
"use client";

import { v4 as uuidv4 } from "uuid";
import React, { useState, useEffect } from "react";
import "react-toastify/dist/ReactToastify.css";
import { redirect, useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import ReviewsSection from "./review";
import FloatingIcons from "../components/ui/FloatingIcons";
import toast, { Toaster } from "react-hot-toast";
import Image from "next/image";
import Loading from "@/app/loading";

interface ProductDetailsProps {
  product: {
    data: {
      _id: string;
      name: string;
      description: string;
      price: number;
      stockQuantity: number;
      category: string;
      productImages: string[];
      discountPrice?: number;
      brand: string;
      tags: string[];
      variants: Variant[];
    };
  };
  relatedProducts: {
    data: {
      _id: string;
      name: string;
      price: number;
      productImages: string[];
    }[];
  };
}

interface Variant {
  color: string;
  size: string;
  price: number;
  stock: number;
  images: string[];
}

export interface ReviewReply {
  _id: string;
  userId: string;
  userName: string;
  comment: string;
  timestamp: string;
}

interface Review {
  updatedAt: string;
  createdAt: string;
  _id: string;
  userName?: string;
  userId: {
    _id: string;
    name: string;
  };
  timestamp: string;
  rating: number;
  comment: string;
  likes: string[];
  replies: {
    _id: string;
    userId: string;
    comment: string;
    userName: string;
    timestamp: string;
    isEditing: boolean;
  }[];
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product }) => {
  const router = useRouter();
  const [cartQuantity, setCartQuantity] = useState(1);
  const [stockQuantity, setStockQuantity] = useState(
    product.data.stockQuantity
  );
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(
    product.data.productImages[0]
  );
  const [reviews, setReviews] = useState<Review[]>([]);

  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

  const handleVariantChange = (type: string, value: string) => {
    setSelectedVariant(
      (prev: any) =>
        ({
          ...prev,
          [type]: value,
        } as Variant)
    );
  };

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get(
          `https://mirexa-store-backend.vercel.app/api/reviews/${product.data._id}`
        );
        setReviews(response.data.data);
      } catch (error) {
        console.error("Error fetching reviews", error);
      }
    };

    fetchReviews();
  }, [product.data._id]);

  const handleAddToCart = () => {
    if (isLoading) return;
    setIsLoading(true);

    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      toast.error("Please log in to add items to the cart.");
      setIsLoading(false);

      setTimeout(() => {
        router.push("/login");
      }, 1500);

      return;
    }

    const user = JSON.parse(storedUser);
    const userId = user._id;
    const token = localStorage.getItem("accessToken");

    if (!token) {
      toast.error("Authentication token is missing. Please log in again.");
      setIsLoading(false);
      return;
    }

    // ✅ Check if color and size are selected if they exist
    if (product.data.variants) {
      if (
        product.data.variants.some((variant) => variant.color) &&
        !selectedVariant?.color
      ) {
        toast.error("Please select color.");
        setIsLoading(false);
        return;
      }

      if (
        product.data.variants.some((variant) => variant.size) &&
        !selectedVariant?.size
      ) {
        toast.error("Please select size.");
        setIsLoading(false);
        return;
      }
    }

    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingCartItem = cart.find(
      (item: any) =>
        item.productId === product.data._id &&
        item.userId === userId &&
        item.color === selectedVariant?.color &&
        item.size === selectedVariant?.size
    );

    if (existingCartItem) {
      toast.error(
        "This product with selected variant is already in your cart."
      );
      setIsLoading(false);
      return;
    }

    const cartItem = {
      userId,
      productId: product.data._id,
      quantity: cartQuantity,
      name: product.data.name,
      price: product.data.price,
      stockQuantity: selectedVariant?.stock,
      productImages: product.data.productImages,
      color: selectedVariant?.color,
      size: selectedVariant?.size,
    };

    cart.push(cartItem);
    localStorage.setItem("cart", JSON.stringify(cart));

    window.dispatchEvent(new Event("cartUpdated"));
    setStockQuantity((prevStock) => prevStock - cartQuantity);
    toast.success("Added to cart!");
    setIsLoading(false);
  };

  const handleBuyNow = () => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      toast.error("Please log in to proceed to checkout.");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
      return;
    }

    const user = JSON.parse(storedUser);
    const userId = user._id;

    // ✅ Check if color and size are selected if they exist
    if (product.data.variants) {
      if (
        product.data.variants.some((variant) => variant.color) &&
        !selectedVariant?.color
      ) {
        toast.error("Please select color.");
        return;
      }

      if (
        product.data.variants.some((variant) => variant.size) &&
        !selectedVariant?.size
      ) {
        toast.error("Please select size.");
        return;
      }
    }

    const cartItem = {
      userId,
      productId: product.data._id,
      quantity: cartQuantity,
      name: product.data.name,
      price: product.data.price,
      stockQuantity: selectedVariant?.stock,
      productImages: product.data.productImages,
      color: selectedVariant?.color,
      size: selectedVariant?.size,
    };

    let cart = JSON.parse(localStorage.getItem("cart") || "[]");

    const existingCartItem = cart.find(
      (item: any) =>
        item.productId === product.data._id &&
        item.userId === userId &&
        item.color === selectedVariant?.color &&
        item.size === selectedVariant?.size
    );

    if (!existingCartItem) {
      cart.push(cartItem);
      localStorage.setItem("cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("cartUpdated"));
      setStockQuantity((prevStock) => prevStock - cartQuantity);
      toast.success("Added to cart!");
    }

    router.push("/cart/checkout");
  };

  const getUserAndToken = () => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");

    if (!storedUser || !token) {
      toast.error("Please log in first.");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
      return null;
    }

    return { user: JSON.parse(storedUser), token };
  };

  const handleLikeReview = async (reviewId: string) => {
    const auth = getUserAndToken();
    if (!auth) return;

    try {
      const { data } = await axios.post(
        `https://mirexa-store-backend.vercel.app/api/reviews/like/${reviewId}`,
        {},
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );

      toast.success(
        "✨ Your feedback has been recorded! Thanks for engaging! 💖"
      );

      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review._id === reviewId
            ? { ...review, likes: data.data.likes }
            : review
        )
      );
    } catch (error) {
      toast.error("Error toggling like for the review.");
    }
  };

  const handleReplyReview = async (reviewId: string, replyComment: string) => {
    const auth = getUserAndToken();
    if (!auth) return;

    try {
      const { data } = await axios.post(
        `https://mirexa-store-backend.vercel.app/api/reviews/reply/${reviewId}`,
        { reply: replyComment, userName: auth.user.name },
        {
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Replied to the review!");

      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review._id === reviewId
            ? {
                ...review,
                replies: [
                  ...review.replies,
                  {
                    _id: data.newReply?._id,
                    userId: auth.user._id,
                    userName: auth.user.name,
                    comment: replyComment,
                    timestamp: new Date().toISOString(),
                    isEditing: false,
                  },
                ],
              }
            : review
        )
      );
    } catch (error) {
      toast.error("Error replying to the review.");
    }
  };

  const handleDeleteReply = async (reviewId: string, replyId: string) => {
    const auth = getUserAndToken();
    if (!auth) return;

    try {
      await axios.delete(
        `https://mirexa-store-backend.vercel.app/api/reviews/delete-reply/${reviewId}/${replyId}`,
        { headers: { Authorization: `Bearer ${auth.token}` } }
      );

      toast.success("Reply deleted successfully!");
      setReviews((prevReviews) =>
        prevReviews.map((review) =>
          review._id === reviewId
            ? {
                ...review,
                replies: review.replies.filter((r) => r._id !== replyId),
              }
            : review
        )
      );
    } catch (error) {
      toast.error(
        "Error deleting the reply. Please refresh the page and try again."
      );
    }
  };

  const onUpdateReply = (
    reviewId: string,
    replyId: string,
    updatedComment: string
  ) => {
    setReviews((prevReviews) =>
      prevReviews.map((review) =>
        review._id === reviewId
          ? {
              ...review,
              replies: review.replies.map((reply) =>
                reply._id === replyId
                  ? { ...reply, comment: updatedComment }
                  : reply
              ),
            }
          : review
      )
    );
  };

  return (
    <>
      {isLoading ? (
        <Loading />
      ) : (
        <main>
          <div className="product-details pt-5 flex flex-col gap-8 px-4 sm:px-8 lg:px-16">
            <Toaster
              position="top-center" // টোস্ট টপ সেন্টারে আসবে
              gutter={10} // নেভবারের নিচ থেকে gap দিবে
              containerStyle={{
                top: "70px", // নেভবারের উচ্চতার সমান করে নিন (আপনার নেভবারের height অনুযায়ী adjust করুন)
                zIndex: 9999, // যেন অন্য কিছুর নিচে না চলে যায়
              }}
              reverseOrder={false}
            />

            <h1 className="text-3xl font-semibold">{product.data.name}</h1>
            <div className="flex flex-col md:flex-row gap-8">
              {/* Product Images Gallery */}
              <div className="w-full md:w-1/2 flex justify-center items-center">
                <div className="flex flex-wrap gap-4 justify-center">
                  <div className="w-full mb-4 max-w-[600px]">
                    <div className="relative w-full h-80 overflow-hidden rounded-lg shadow-md">
                      <Image
                        src={selectedImage}
                        alt={product.data.name}
                        width={500} // প্রয়োজন অনুযায়ী পরিবর্তন করো
                        height={500} // প্রয়োজন অনুযায়ী পরিবর্তন করো
                        className="w-full h-full object-contain transition-all duration-300"
                        unoptimized={true}
                      />
                    </div>
                  </div>
                  {/* Thumbnails for the Gallery */}
                  <div className="flex gap-4 overflow-x-auto">
                    {product.data.productImages.map((image, index) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={index}
                        src={image}
                        alt={product.data.name}
                        className={`w-20 h-20 object-cover rounded-lg cursor-pointer border transition-all duration-300 ${
                          selectedImage === image
                            ? "border-orange-600"
                            : "border-gray-300"
                        }`}
                        onClick={() => setSelectedImage(image)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="w-full md:w-1/2">
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-4">
                    {product.data.discountPrice ? (
                      <>
                        <span className="text-xl font-semibold text-orange-600">
                          ৳ {product.data.discountPrice}
                        </span>
                        <span className="text-lg text-gray-500 line-through">
                          ৳ {product.data.price}
                        </span>
                      </>
                    ) : (
                      <span className="text-xl font-semibold text-orange-600">
                        ৳ {product.data.price}
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      {product.data.stockQuantity} in stock
                    </span>
                  </div>

                  <p className="text-base text-gray-700">
                    {product.data.description}
                  </p>

                  {/* Brand and Tags */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span>Brand: {product.data.brand}</span>
                    <span>Tags: {product.data.tags.join(", ")}</span>
                  </div>

                  {/* Variants */}
                  {product.data.variants && (
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold mb-2">
                        Select Variants
                      </h4>
                      <div className="grid grid-cols-2 gap-6">
                        {/* Color Options */}
                        {product.data.variants.some(
                          (variant) => variant.color
                        ) && (
                          <div>
                            <h5 className="font-semibold">Color</h5>
                            <div className="flex flex-wrap gap-2">
                              {product.data.variants
                                .filter(
                                  (variant, index, self) =>
                                    index ===
                                    self.findIndex(
                                      (t) => t.color === variant.color
                                    )
                                )
                                .map((variant, index) =>
                                  variant.color ? (
                                    <label
                                      key={index}
                                      className={`cursor-pointer w-10 h-10 border rounded-full ${
                                        selectedVariant?.color === variant.color
                                          ? "border-orange-600"
                                          : "border-gray-300"
                                      }`}
                                      style={{ backgroundColor: variant.color }}
                                      onClick={() =>
                                        handleVariantChange(
                                          "color",
                                          variant.color
                                        )
                                      }
                                    />
                                  ) : null
                                )}
                            </div>
                          </div>
                        )}

                        {/* Size Options */}
                        {product.data.variants.some(
                          (variant) => variant.size
                        ) && (
                          <div>
                            <h5 className="font-semibold">Size</h5>
                            <div className="flex flex-wrap gap-2">
                              {product.data.variants
                                .filter(
                                  (variant, index, self) =>
                                    index ===
                                    self.findIndex(
                                      (t) => t.size === variant.size
                                    )
                                )
                                .map((variant, index) =>
                                  variant.size ? (
                                    <label
                                      key={index}
                                      className={`cursor-pointer px-4 py-2 border rounded-lg ${
                                        selectedVariant?.size === variant.size
                                          ? "bg-orange-600 text-white border-orange-600"
                                          : "border-gray-300"
                                      }`}
                                      onClick={() =>
                                        handleVariantChange(
                                          "size",
                                          variant.size
                                        )
                                      }
                                    >
                                      {variant.size}
                                    </label>
                                  ) : null
                                )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quantity Selector */}
                  <div className="mt-4 flex items-center gap-2">
                    <label className="text-sm">Quantity:</label>
                    <input
                      type="number"
                      value={cartQuantity}
                      min="1"
                      max={selectedVariant ? selectedVariant.stock : 1}
                      onChange={(e) =>
                        setCartQuantity(parseInt(e.target.value))
                      }
                      className="w-20 p-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  {/* Add to Cart & Buy Now Buttons */}
                  <div className="mt-6 flex flex-col gap-4">
                    <button
                      onClick={handleAddToCart}
                      disabled={isLoading || stockQuantity <= 0}
                      className={`w-full py-3 bg-orange-600 text-white font-semibold rounded-md transition-all duration-300 ${
                        isLoading || stockQuantity <= 0
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {isLoading ? "Adding..." : "Add to Cart"}
                    </button>
                    <button
                      onClick={handleBuyNow}
                      disabled={isLoading || stockQuantity <= 0}
                      className={`w-full py-3 bg-green-600 text-white font-semibold rounded-md transition-all duration-300 ${
                        isLoading || stockQuantity <= 0
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {isLoading ? "Processing..." : "Buy Now"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <h3 className="text-2xl font-semibold mb-4">Product Reviews</h3>
            <ReviewsSection
              reviews={reviews}
              setReviews={setReviews}
              onLikeReview={handleLikeReview}
              onReplyReview={handleReplyReview}
              onDeleteReply={handleDeleteReply}
              onUpdateReply={onUpdateReply}
            />
          </div>
        </main>
      )}

      <FloatingIcons />
    </>
  );
};

export default ProductDetails;
