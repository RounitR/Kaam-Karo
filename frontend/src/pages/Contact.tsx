import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Send,
  CheckCircle2,
} from "lucide-react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log("Form submitted:", formData);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-hero">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
            Get in Touch
          </h1>
          <p className="text-lg sm:text-xl text-primary-foreground/90 max-w-3xl mx-auto mb-8">
            Have questions? We're here to help. Send us a message and we'll
            respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Information Cards */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {/* Email Us */}
            <div className="bg-gradient-card border border-border rounded-2xl p-6 text-center shadow-card hover:shadow-hover transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Email Us
              </h3>
              <p className="text-muted-foreground text-sm mb-3">
                support@kaamkaro.in
              </p>
              <p className="text-muted-foreground text-xs">
                We'll respond within 24 hours
              </p>
            </div>

            {/* Call Us */}
            <div className="bg-gradient-card border border-border rounded-2xl p-6 text-center shadow-card hover:shadow-hover transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Call Us
              </h3>
              <p className="text-muted-foreground text-sm mb-3">
                +91 98765-43210
              </p>
              <p className="text-muted-foreground text-xs">
                Mon-Sat 9 AM - 7 PM
              </p>
            </div>

            {/* Visit Us */}
            <div className="bg-gradient-card border border-border rounded-2xl p-6 text-center shadow-card hover:shadow-hover transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Visit Us
              </h3>
              <p className="text-muted-foreground text-sm mb-3">
                Mumbai, Maharashtra
              </p>
              <p className="text-muted-foreground text-xs">
                By appointment only
              </p>
            </div>

            {/* Response Time */}
            <div className="bg-gradient-card border border-border rounded-2xl p-6 text-center shadow-card hover:shadow-hover transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Response Time
              </h3>
              <p className="text-muted-foreground text-sm mb-3">
                Within 24 Hours
              </p>
              <p className="text-muted-foreground text-xs">
                Average response time
              </p>
            </div>
          </div>

          {/* Contact Form and Info Section */}
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-gradient-card border border-border rounded-2xl p-8 shadow-card flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-hero rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  Send us a Message
                </h2>
              </div>
              <p className="text-muted-foreground mb-8">
                Fill out the form below and we'll get back to you shortly.
              </p>

              <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-8">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Full Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Email Address
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+91 98765-43210"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-foreground mb-2"
                    >
                      Subject
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="How can we help?"
                      required
                    />
                  </div>
                </div>

                <div className="flex-1 flex flex-col">
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Message
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Tell us more about your query..."
                    className="flex-1 min-h-[120px] resize-none"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-hero text-primary-foreground hover:opacity-90 mt-auto"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </div>

            {/* Quick Questions & FAQ */}
            <div className="space-y-8">
              {/* Quick Questions */}
              <div className="bg-gradient-card border border-border rounded-2xl p-8 shadow-card">
                <h3 className="text-xl font-bold text-foreground mb-4">
                  Quick Questions?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Check our FAQ section or reach out directly via WhatsApp for
                  faster responses.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-border hover:bg-accent"
                >
                  Chat on WhatsApp
                </Button>
              </div>

              {/* Why Contact KaamKaro */}
              <div className="bg-gradient-card border border-border rounded-2xl p-8 shadow-card">
                <h3 className="text-xl font-bold text-foreground mb-6">
                  Why Contact KaamKaro?
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">
                        Questions about posting a job or finding workers
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">
                        Support with payments or transactions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">
                        Partnership and business inquiries
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">
                        Feedback and suggestions
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="bg-gradient-card border border-border rounded-2xl p-8 shadow-card">
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div>
                    <div className="w-12 h-12 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h4 className="font-semibold text-foreground">Secure</h4>
                    <p className="text-sm text-muted-foreground">
                      Data Protected
                    </p>
                  </div>
                  <div>
                    <div className="w-12 h-12 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h4 className="font-semibold text-foreground">
                      Fast Response
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Within 24hrs
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;