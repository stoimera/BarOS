"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  MapPin, 
  Star, 
  ArrowRight, 
  Play, 
  Wine,
  Coffee,
  Utensils,
  Users,
  Calendar,
  Package,
  Award,
  Music,
  Mail,
  Phone,
  Clock
} from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { SiFacebook, SiGithub, SiInstagram, SiTiktok } from "react-icons/si"
import { useEvents } from "@/hooks/useEvents"
import { useTranslations } from "next-intl"
import { format } from "date-fns"
// import { useGoogleReviews } from "@/hooks/useGoogleReviews"

// Main landing page component for the bar's public website
export default function LandingPage() {
  const t = useTranslations("Landing")
  const router = useRouter()
  const [contactOpen, setContactOpen] = useState(false)
  const [callModalOpen, setCallModalOpen] = useState(false)
  const [reservationModalOpen, setReservationModalOpen] = useState(false)

  // Menu highlights for the hero section
  const menuHighlights = [
    {
      name: "Craft Cocktails",
      description: "Handcrafted with premium spirits and fresh ingredients",
      price: "€9-15",
      icon: Wine
    },
    {
      name: "Artisan Coffee",
      description: "Locally roasted beans, perfect for any time of day",
      price: "€2-8",
      icon: Coffee
    },
    {
      name: "Gourmet Bites",
      description: "Chef-curated small plates and appetizers",
      price: "€8-16",
      icon: Utensils
    }
  ]

  // Fetch real events data from the API
  const { events } = useEvents()
  
  // Process upcoming events for display (next 3 events)
  const upcomingEvents = events
    .filter(event => new Date(event.event_date) >= new Date())
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .slice(0, 3)
    .map(event => {

      // Convert time format for display
      let timeDisplay = '8:00 PM' // Default time
      
      if (event.start_time) {
        // Convert 24-hour format to 12-hour format
        const timeStr = event.start_time.toString()
        if (timeStr.includes(':')) {
          const [hours, minutes] = timeStr.split(':')
          const hour = parseInt(hours)
          const ampm = hour >= 12 ? 'PM' : 'AM'
          const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
          timeDisplay = `${displayHour}:${minutes.padStart(2, '0')} ${ampm}`
        } else {
          timeDisplay = timeStr
        }
      }
      
      return {
        title: event.title,
        date: format(new Date(event.event_date), 'EEEE, MMM d'),
        time: timeDisplay,
        description: event.description || 'Join us for this special event!'
      }
    })

  // Feature highlights for the services section
  const features = [
    {
      icon: Users,
      title: "Remembered by Name & Favorite Drink",
      description: "Feel like a regular from your very first visit - our team remembers your favorite drinks and preferences."
    },
    {
      icon: Calendar,
      title: "Easy Reservations & VIP Access",
      description: "Book your table or event in seconds and get instant confirmation - no waiting, no hassle."
    },
    {
      icon: Package,
      title: "Always Your Favorites in Stock",
      description: "Your favorite drinks and dishes are always available - no more 'Sorry, we're out!' moments."
    },
    {
      icon: Star,
      title: "Rewards Every Visit",
      description: "Earn points and enjoy exclusive rewards every time you visit."
    },
    {
      icon: Award,
      title: "Personalized Offers",
      description: "Receive special offers and event invites tailored to your tastes."
    },
    {
      icon: Music,
      title: "Memorable Experiences",
      description: "Enjoy live music, themed nights, and unforgettable events designed for you."
    }
  ]

  const reviews = [
    {
      name: "Sarah M.",
      text: "Amazing atmosphere and their special cocktails are incredible! The staff remembered my favorite drink from my first visit.",
      rating: 5
    },
    {
      name: "Michael R.",
      text: "Best lounge in the city. The live music nights are fantastic and the food is top-notch.",
      rating: 5
    },
    {
      name: "Emma L.",
      text: "Perfect spot for date night. The wine selection is impressive and the service is impeccable.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-background backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">UL</span>
            </div>
            <span className="font-bold text-xl text-foreground">{t("brandName")}</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle 
              iconClassName="!text-primary"
              buttonClassName="border-border hover:bg-muted hover:text-foreground"
              dropdownClassName="border-border"
              dropdownItemClassName="focus:bg-muted focus:text-foreground"
            />
            <Button variant="outline" onClick={() => router.push('/login')} className="border-border hover:bg-muted hover:text-foreground">
              {t("login")}
            </Button>
            <Dialog open={contactOpen} onOpenChange={setContactOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setContactOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                  {t("contactUs")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-background">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Contact Us</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Reach out to us for reservations, events, or any questions!
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <span className="text-sm text-foreground">urbanlounge@email.com</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <span className="text-sm text-foreground">+389 123-456-789</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span className="text-sm text-foreground">Partizanski Odredi 47</span>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background">
        <div className="absolute inset-0 bg-muted/30"></div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-primary text-primary-foreground border-none">
              <Music className="w-4 h-4 mr-2 text-foreground" />
              Live Music Tonight
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Welcome to{" "}Urban Lounge
            </h1>
            <p className="text-xl text-foreground mb-8 max-w-2xl mx-auto">
              Your premier destination for craft cocktails, artisan coffee, live music, and unforgettable experiences.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" onClick={() => setReservationModalOpen(true)} className="text-lg px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                Reserve Your Table
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push('/menu')} className="text-lg px-8 py-3 border-border hover:bg-muted hover:text-foreground">
                <Play className="mr-2 h-5 w-5" />
                View Menu
              </Button>
            </div>
            
            {/* Quick Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
              <div className="text-center">
                <Clock className="h-8 w-8 text-foreground mx-auto mb-2" />
                <div className="text-lg font-semibold text-foreground">Open Daily</div>
                <div className="text-foreground">08:00 AM - 00:00 AM</div>
              </div>
              <div className="text-center">
                <MapPin className="h-8 w-8 text-foreground mx-auto mb-2" />
                <div className="text-lg font-semibold text-foreground">Downtown</div>
                <div className="text-foreground">Partizanski Odredi 47</div>
              </div>
              <div className="text-center">
                <Phone className="h-8 w-8 text-foreground mx-auto mb-2" />
                <div className="text-lg font-semibold text-foreground">Call Us</div>
                <div className="text-foreground">+389 123-456-789</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Highlights */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              What We&apos;re Known For
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover our signature offerings that keep our guests coming back for more.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {menuHighlights.map((item, index) => (
              <Card key={index} className="border-border shadow-lg hover:shadow-xl transition-shadow bg-card">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <item.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-foreground">{item.name}</CardTitle>
                  <div className="text-primary font-semibold">{item.price}</div>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <section className="py-20 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">
                What&apos;s Happening
              </h2>
              <p className="text-xl text-muted-foreground">
                Join us for unforgettable evenings of entertainment and community.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {upcomingEvents.map((event, index) => (
                <Card key={index} className="border-border shadow-lg bg-card">
                  <CardHeader>
                    <CardTitle className="text-xl text-foreground">{event.title}</CardTitle>
                    <div className="flex items-center gap-2 text-primary">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-primary">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{event.time}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{event.description}</p>
                    <Button 
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={() => setReservationModalOpen(true)}
                    >
                      Reserve Your Spot
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CRM Features Section - Discreet */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Behind the Scenes
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our team uses smart technology to ensure every visit is perfect.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-border shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              What Our Guests Say
            </h2>
            <p className="text-xl text-muted-foreground">
              Real experiences from our valued customers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.map((review, index) => (
              <Card key={index} className="border-border shadow-lg bg-card">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-primary fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">
                    &quot;{review.text}&quot;
                  </p>
                  <div>
                    <div className="font-semibold text-foreground">
                      {review.name}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Join Us Tonight
          </h2>
          <p className="text-xl text-amber-700 dark:text-amber-100 mb-8 max-w-2xl mx-auto">
            Experience the perfect blend of atmosphere, exceptional service, and unforgettable moments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={() => setReservationModalOpen(true)} className="text-lg px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              Reserve Your Table
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Dialog open={callModalOpen} onOpenChange={setCallModalOpen}>
              <DialogTrigger asChild>
                <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-border hover:bg-muted hover:text-foreground">
                  <Phone className="mr-2 h-5 w-5" />
                  Call to Book
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-background">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Call to Book</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Give us a call to make your reservation or ask any questions!
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="flex items-center justify-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-border">
                    <Phone className="h-6 w-6 text-primary" />
                    <span className="text-xl font-semibold text-foreground">+389 123-456-789</span>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Available daily from 08:00 AM to 00:00 AM
                    </p>
                    <p className="text-sm text-muted-foreground">
                      For immediate assistance and reservations
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="bg-gradient-to-r from-rose-50 to-amber-100 dark:from-amber-900/20 dark:to-orange-900/20 text-foreground dark:text-amber-100 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-rose-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">UL</span>
                </div>
                <span className="font-bold text-xl text-foreground">Urban Lounge</span>
              </div>
              <p className="mb-4 text-amber-700 dark:text-amber-100">
                Where craft cocktails meet community. Experience the perfect blend of atmosphere, 
                exceptional service, and unforgettable moments.
              </p>
              <div className="flex gap-4">
                <SiInstagram className="h-5 w-5 text-primary hover:text-amber-500 cursor-pointer" />
                <SiFacebook className="h-5 w-5 text-primary hover:text-amber-500 cursor-pointer" />
                <SiTiktok className="h-5 w-5 text-primary hover:text-amber-500 cursor-pointer" />
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Visit Us</h3>
              <ul className="space-y-2 text-amber-700 dark:text-amber-100">
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Partizanski Odredi 47
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  +389 123-456-789
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  urbanlounge@email.com
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  08:00 AM - 00:00 AM Daily
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Menu</h3>
              <ul className="space-y-2 text-amber-700 dark:text-amber-100">
                <li><a href="/menu#Drinks" className="hover:text-primary">Cocktails</a></li>
                <li><a href="/menu#Drinks" className="hover:text-primary">Beer & Wine</a></li>
                <li><a href="/menu#Food" className="hover:text-primary">Food</a></li>
                <li><a href="/menu#Shisha" className="hover:text-primary">Shisha</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Events</h3>
              <ul className="space-y-2 text-amber-700 dark:text-amber-100">
                <li className="hover:text-primary">Friday Jazz Night</li>
                <li className="hover:text-primary">Live Music</li>
                <li className="hover:text-primary">Private Events</li>
                <li className="hover:text-primary">Tastings</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <footer className="w-full bg-background backdrop-blur-md border-t border-border py-2">
        <div className="container mx-auto px-4 text-center text-amber-700 dark:text-primary space-y-2">
          <p>&copy; {new Date().getFullYear()} Urban Lounge. All rights reserved.</p>
          {process.env.NEXT_PUBLIC_REPO_URL ? (
            <p>
              <a
                href={process.env.NEXT_PUBLIC_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <SiGithub className="h-4 w-4" aria-hidden />
                View source on GitHub
              </a>
            </p>
          ) : null}
        </div>
      </footer>

      
      {/* Reservation Modal */}
      <Dialog open={reservationModalOpen} onOpenChange={setReservationModalOpen}>
        <DialogContent className="max-w-md bg-background">
          <DialogHeader>
            <DialogTitle className="text-foreground">Reserve Your Table</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Choose how you&apos;d like to make your reservation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Button 
              onClick={() => router.push('/login')} 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3"
            >
              Login to Reserve
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              or
            </div>
            <div className="flex items-center justify-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-border">
              <Phone className="h-6 w-6 text-primary" />
              <span className="text-xl font-semibold text-foreground">+389 123-456-789</span>
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Call us directly to make your reservation
              </p>
              <p className="text-sm text-muted-foreground">
                Available daily from 08:00 AM to 00:00 AM
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 