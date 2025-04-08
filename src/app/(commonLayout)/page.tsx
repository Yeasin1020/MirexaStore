import Banner from "./components/shared/Banner";
import Newsletter from "./components/shared/NewsletterSubscription/NewsletterSubscription";
import Testimonials from "./components/shared/Testimonial/TestimonialSection";

import FloatingIcons from "./components/ui/FloatingIcons";
import CategorySection from "./product/category/page";
import Product from "./product/page";

const HomePage = () => {
  return (
    <>
      <Banner />
      <CategorySection></CategorySection>
      <Product />
      <Testimonials />
      <Newsletter />
    </>
  );
};

export default HomePage;
