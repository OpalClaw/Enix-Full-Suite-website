import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Phone, ChevronDown, LogIn } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { LOGO_URL } from '@/lib/assets';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const services = [
  { label: "Residential Roofing", path: "/residential-roofing" },
  { label: "Commercial Roofing", path: "/commercial-roofing" },
  { label: "Roof Repairs", path: "/roof-repairs" },
  { label: "Siding", path: "/siding" },
  { label: "Windows", path: "/windows" },
  { label: "Doors", path: "/doors" },
  { label: "Storm Damage", path: "/storm-damage" },
];

const navLinks = [
  { label: "About", path: "/about" },
  { label: "Projects", path: "/projects" },
  { label: "Reviews", path: "/reviews" },
  { label: "Education", path: "/education" },
  { label: "Financing", path: "/financing" },
  { label: "Contact", path: "/contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border/60 shadow-sm">
      <div className="w-full">
        <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 flex items-center justify-between h-24">
          {/* Desktop Left - Logo + Nav */}
          <div className="hidden lg:flex items-center flex-1">
            <Link to="/" className="flex items-center gap-2 flex-shrink-0 pt-1 pl-0">
              <img src={LOGO_URL} alt="Enix Exteriors" className="h-20 w-auto" />
            </Link>
            <div className="flex items-center gap-6">

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button aria-label="Login menu" className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-navy-700 transition-colors">
                     Services <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {services.map((s) => (
                    <DropdownMenuItem key={s.path} asChild>
                      <Link to={s.path} className="cursor-pointer">{s.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="text-sm font-semibold text-foreground hover:text-navy-700 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile Logo */}
          <Link to="/" className="flex lg:hidden items-center gap-2 px-4">
            <img src={LOGO_URL} alt="Enix Exteriors" className="h-20 w-auto" />
          </Link>

          {/* Desktop Right - CTA */}
          <div className="hidden lg:flex items-center gap-5 flex-shrink-0 ml-auto pr-6">
            <a aria-label="Call Enix Exteriors" href="tel:+18656853649" className="flex items-center gap-2 text-sm font-semibold text-navy-600 hover:text-navy-700 transition-colors whitespace-nowrap">
              <Phone className="w-4 h-4 flex-shrink-0" />
              (865) 685-ENIX
            </a>
            <Link to="/contact">
              <Button className="bg-navy-600 hover:bg-navy-700 text-white font-semibold px-6 h-10 transition-colors whitespace-nowrap">
                Free Estimate
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="text-navy-600 border-navy-300 hover:bg-navy-50 font-semibold h-10 px-5 whitespace-nowrap">
                  <LogIn className="w-4 h-4 mr-2 flex-shrink-0" />
                  Login
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem asChild>
                  <Link to="/login/client">Client Login</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/login/employee">Staff Login</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Tablet Right */}
          <div className="hidden md:flex lg:hidden items-center gap-4">
            <a aria-label="Call Enix Exteriors" href="tel:+18656853649" className="flex items-center gap-2 text-sm font-semibold text-navy-600">
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">(865) 685-ENIX</span>
            </a>
            <Link to="/contact">
              <Button className="bg-navy-600 hover:bg-navy-700 text-white font-semibold px-5 h-10 text-sm">
                Free Estimate
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="text-navy-600 border-navy-200 hover:bg-navy-50 h-10 px-5">
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem asChild>
                  <Link to="/login/client">Client Login</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/login/employee">Staff Login</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b">
                  <img src={LOGO_URL} alt="Enix Exteriors" className="h-12" />
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Services</p>
                  {services.map((s) => (
                    <Link key={s.path} to={s.path} onClick={() => setOpen(false)}
                      className="block px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                      {s.label}
                    </Link>
                  ))}
                  <div className="border-t my-2" />
                  {navLinks.map((link) => (
                    <Link key={link.path} to={link.path} onClick={() => setOpen(false)}
                      className="block px-2 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                      {link.label}
                    </Link>
                  ))}
                </div>
                <div className="p-3 border-t space-y-2">
                   <a aria-label="Call Enix Exteriors" href="tel:+18656853649" className="flex items-center justify-center gap-2 text-xs font-semibold text-navy-500 py-2">
                     <Phone className="w-4 h-4" /> (865) 685-ENIX
                   </a>
                   <Link to="/contact" onClick={() => setOpen(false)}>
                     <Button className="w-full bg-navy-500 hover:bg-navy-600 text-white text-sm font-semibold h-9">
                       Free Estimate
                     </Button>
                   </Link>
                   <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                       <Button variant="outline" className="w-full text-sm h-9">Login</Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent className="w-40">
                       <DropdownMenuItem asChild>
                         <Link to="/login/client" onClick={() => setOpen(false)}>Client Login</Link>
                       </DropdownMenuItem>
                       <DropdownMenuItem asChild>
                         <Link to="/login/employee" onClick={() => setOpen(false)}>Staff Login</Link>
                       </DropdownMenuItem>
                     </DropdownMenuContent>
                   </DropdownMenu>
                 </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}