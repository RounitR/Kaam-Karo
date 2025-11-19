import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import TrustBadge from "@/components/TrustBadge";
import RatingStars from "@/components/RatingStars";
import { useAuth } from "@/contexts/AuthContext";
import {
  ShieldCheck,
  Users,
  Clock,
  Star,
  CheckCircle2,
  Wallet,
  ArrowRight,
} from "lucide-react";
import heroImage from "@/assets/hero-home.jpg";
import testimonial1 from "@/assets/testimonial-1.jpg";
import testimonial2 from "@/assets/testimonial-2.jpg";
import testimonial3 from "@/assets/testimonial-3.jpg";

const Index = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-secondary/30 to-background">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Trusted by 10,000+ Households
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Get Trusted Help for{" "}
                <span className="bg-gradient-hero bg-clip-text text-transparent">
                  Everyday Work
                </span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-xl">
                Connect with verified local workers for cleaning, repairs,
                festival prep, and more. Fast, simple, and reliable service
                across India.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                {isAuthenticated ? (
                  <Button size="lg" asChild className="text-base">
                    <Link
                      to={
                        user?.user_type === "customer" ? "/customer" : "/worker"
                      }
                    >
                      Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button size="lg" asChild className="text-base">
                      <Link to="/login?type=customer">
                        Post a Job <ArrowRight className="ml-2 w-5 h-5" />
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      asChild
                      className="text-base"
                    >
                      <Link to="/login?type=worker">Become a Worker</Link>
                    </Button>
                  </>
                )}
              </div>

              {/* Trust Stats */}
              <div className="flex flex-wrap gap-8 pt-4">
                <div>
                  <div className="text-3xl font-bold text-foreground">10k+</div>
                  <div className="text-sm text-muted-foreground">
                    Happy Customers
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">5k+</div>
                  <div className="text-sm text-muted-foreground">
                    Verified Workers
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold text-foreground">4.8</div>
                  <div>
                    <RatingStars rating={4.8} size={16} showNumber={false} />
                    <div className="text-sm text-muted-foreground">
                      Average Rating
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-hover">
                <img
                  src={heroImage}
                  alt="Professional worker helping at home"
                  className="w-full h-auto object-cover"
                />
              </div>
              {/* Floating Card */}
              <div className="absolute -bottom-6 -left-6 bg-background border border-border rounded-xl p-4 shadow-hover hidden sm:block">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      100% Safe
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Verified Workers
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get help in three simple steps. It's that easy!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-gradient-card border border-border rounded-2xl p-8 text-center shadow-card hover:shadow-hover transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-primary-foreground">
                    1
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Post Your Job
                </h3>
                <p className="text-muted-foreground">
                  Describe what you need - cleaning, repairs, or any household
                  help. Set your budget and timeline.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-gradient-card border border-border rounded-2xl p-8 text-center shadow-card hover:shadow-hover transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-primary-foreground">
                    2
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Workers Respond
                </h3>
                <p className="text-muted-foreground">
                  Verified local workers accept your job or send custom quotes.
                  Review their profiles and ratings.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-gradient-card border border-border rounded-2xl p-8 text-center shadow-card hover:shadow-hover transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-primary-foreground">
                    3
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Work Complete & Pay
                </h3>
                <p className="text-muted-foreground">
                  Worker completes the job. You review their work and pay
                  securely via UPI, card, or cash.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Elements */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-secondary/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Why Choose KaamKaro?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your safety and satisfaction are our top priorities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <TrustBadge
              icon={ShieldCheck}
              title="Verified Workers"
              description="All workers are background verified with identity and address proof"
            />
            <TrustBadge
              icon={Star}
              title="Ratings & Reviews"
              description="Real customer reviews help you choose the best workers"
            />
            <TrustBadge
              icon={Wallet}
              title="Safe Payments"
              description="Pay securely through UPI, cards, or cash after job completion"
            />
            <TrustBadge
              icon={Clock}
              title="24/7 Support"
              description="Our customer support team is always here to help you"
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              What Our Customers Say
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of satisfied customers across India
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-gradient-card border border-border rounded-2xl p-8 shadow-card hover:shadow-hover transition-all duration-300">
              <RatingStars rating={5} className="mb-4" />
              <p className="text-muted-foreground mb-6">
                "Found a reliable cleaner for Diwali prep within hours! The
                worker was professional and did an amazing job. Highly recommend
                KaamKaro."
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={testimonial1}
                  alt="Priya Sharma"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold text-foreground">
                    Priya Sharma
                  </div>
                  <div className="text-sm text-muted-foreground">Mumbai</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-gradient-card border border-border rounded-2xl p-8 shadow-card hover:shadow-hover transition-all duration-300">
              <RatingStars rating={5} className="mb-4" />
              <p className="text-muted-foreground mb-6">
                "As a handyman, KaamKaro has helped me find consistent work near
                my area. The app is easy to use and payments are always on
                time."
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={testimonial2}
                  alt="Rajesh Kumar"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold text-foreground">
                    Rajesh Kumar
                  </div>
                  <div className="text-sm text-muted-foreground">Delhi</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-gradient-card border border-border rounded-2xl p-8 shadow-card hover:shadow-hover transition-all duration-300">
              <RatingStars rating={5} className="mb-4" />
              <p className="text-muted-foreground mb-6">
                "Very impressed with the quality of workers. They are verified
                and professional. Makes finding help for household work so much
                easier!"
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={testimonial3}
                  alt="Anjali Patel"
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold text-foreground">
                    Anjali Patel
                  </div>
                  <div className="text-sm text-muted-foreground">Bangalore</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-hero">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Whether you need help with household work or want to earn as a
            worker, join KaamKaro today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              asChild 
              className="text-base bg-primary-foreground text-black hover:bg-transparent hover:border hover:border-primary-foreground hover:text-primary-foreground"
            >
              <Link to="/customer">I Need Help</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="text-base bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-black"
            >
              <Link to="/worker">I Want to Work</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
