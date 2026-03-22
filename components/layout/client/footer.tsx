import Link from 'next/link';
import { Container } from '@/components/ui/container';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-muted">
      <Container className="grid grid-cols-1 gap-8 py-12 md:grid-cols-4">
        <div>
          <h3 className="mb-4 text-lg font-bold">OneVendor</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Your one-stop shop for all your shopping needs.
          </p>
          <div className="flex space-x-4">
            <Link href="#" className="text-muted-foreground hover:text-primary">
              <Facebook className="h-5 w-5" />
              <span className="sr-only">Facebook</span>
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary">
              <Twitter className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary">
              <Instagram className="h-5 w-5" />
              <span className="sr-only">Instagram</span>
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary">
              <Linkedin className="h-5 w-5" />
              <span className="sr-only">LinkedIn</span>
            </Link>
          </div>
        </div>
        <div>
          <h3 className="mb-4 text-lg font-bold">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/products"
                className="text-muted-foreground hover:text-primary"
              >
                Products
              </Link>
            </li>
            <li>
              <Link
                href="/categories"
                className="text-muted-foreground hover:text-primary"
              >
                Categories
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="text-muted-foreground hover:text-primary"
              >
                About Us
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="text-muted-foreground hover:text-primary"
              >
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-lg font-bold">Contact Us</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start">
              <MapPin className="mr-2 h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">
                123 Commerce St.
                <br />
                Anytown, AT 12345
              </span>
            </li>
            <li className="flex items-center">
              <Mail className="mr-2 h-5 w-5 text-muted-foreground" />
              <a
                href="mailto:support@OneVendor.com"
                className="text-muted-foreground hover:text-primary"
              >
                support@OneVendor.com
              </a>
            </li>
            <li className="flex items-center">
              <Phone className="mr-2 h-5 w-5 text-muted-foreground" />
              <a
                href="tel:+11234567890"
                className="text-muted-foreground hover:text-primary"
              >
                (123) 456-7890
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-4 text-lg font-bold">Newsletter</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Subscribe to our newsletter for the latest updates and offers.
          </p>
          <div className="flex flex-col space-y-2">
            <Input type="email" placeholder="Your email address" />
            <Button>Subscribe</Button>
          </div>
        </div>
      </Container>
      <div className="border-t py-6">
        <Container className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} OneVendor. All rights reserved.
        </Container>
      </div>
    </footer>
  );
}
