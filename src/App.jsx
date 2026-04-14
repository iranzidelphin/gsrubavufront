import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './Components/LanguageSwitcher';
import { AnnouncementsPageContent, PublicAnnouncementsPreview } from './Features/PublicAnnouncements';
import { RolePortal } from './Features/PortalExperience';
import { API_BASE_URL, apiJson, clearAuthSession, getDashboardRoute, getStoredUser, saveAuthSession } from './lib/api';
import { disconnectSocket } from './lib/socket';
import './App.css';

const BACKEND_KEEP_ALIVE_MS = 14 * 60 * 1000;

function useBackendKeepAlive() {
  useEffect(() => {
    const pingBackend = () => {
      fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
      }).catch(() => {});
    };

    pingBackend();
    const intervalId = window.setInterval(pingBackend, BACKEND_KEEP_ALIVE_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pingBackend();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}

// ===================== COMPONENTS =====================

// Navbar Component
function Navbar() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full top-0 left-0 z-50 transition-all duration-300 ${scrolled ? 'bg-gs-dark/95 shadow-lg backdrop-blur-md py-2' : 'bg-gs-dark py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gs-accent rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
          <span className="font-serif text-xl md:text-2xl font-bold tracking-wide text-white hidden sm:block">TTC <span className="text-gs-accent">RUBENGERA</span></span>
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <LanguageSwitcher />
          <div className="flex items-center gap-6 font-medium">
            <Link to="/" className="text-white hover:text-gs-accent transition-colors text-sm">{t('home')}</Link>
            <Link to="/about" className="text-white hover:text-gs-accent transition-colors text-sm">{t('aboutUs')}</Link>
            <Link to="/programs" className="text-white hover:text-gs-accent transition-colors text-sm">{t('programs')}</Link>
            <Link to="/announcements" className="text-white hover:text-gs-accent transition-colors text-sm">{t('news')}</Link>
            <Link to="/apply" className="px-4 py-2 border border-white hover:bg-white hover:text-gs-dark transition-colors rounded text-sm text-white">{t('applyOnline')}</Link>
            <Link to="/login" className="px-6 py-2 bg-gs-accent hover:bg-orange-700 text-white rounded-full transition-all transform hover:scale-105 shadow-lg text-sm">{t('login')}</Link>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-white text-2xl p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <i className={`fa-solid ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`md:hidden fixed inset-0 bg-gs-dark z-40 flex flex-col items-center justify-center gap-6 text-white text-lg transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <button className="absolute top-4 right-4 text-3xl p-4" onClick={() => setMobileMenuOpen(false)}>
          <i className="fa-solid fa-times"></i>
        </button>
        <div className="mb-4"><LanguageSwitcher /></div>
        <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-gs-accent">{t('home')}</Link>
        <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-gs-accent">{t('aboutUs')}</Link>
        <Link to="/programs" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-gs-accent">{t('programs')}</Link>
        <Link to="/announcements" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-gs-accent">{t('news')}</Link>
        <Link to="/apply" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-gs-accent">{t('applyOnline')}</Link>
        <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="px-6 py-2 bg-gs-accent rounded-full text-white">{t('login')}</Link>
      </div>
    </nav>
  );
}

// Hero Section
function HeroSection() {
  const { t } = useTranslation();
  return (
    <header className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" alt="School Campus" className="w-full h-full object-cover opacity-90 scale-110" id="hero-bg" />
        <div className="absolute inset-0 bg-gradient-to-b from-gs-dark/80 via-gs-dark/40 to-gs-dark/90"></div>
      </div>
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="overflow-hidden mb-4">
          <h2 className="text-gs-accent font-bold tracking-[0.3em] uppercase text-sm md:text-base">{t('welcome')}</h2>
        </div>
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-6 leading-tight text-shadow">{t('schoolMotto')}</h1>
        <p className="text-gray-200 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-light">{t('schoolDescription')}</p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link to="/programs" className="px-8 py-4 bg-gs-accent text-white rounded-sm hover:bg-orange-700 transition-all duration-300 shadow-xl border border-gs-accent">{t('programs')}</Link>
          <Link to="/apply" className="px-8 py-4 bg-transparent border border-white text-white rounded-sm hover:bg-white hover:text-gs-dark transition-all duration-300">{t('apply')}</Link>
        </div>
      </div>
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce text-white/70">
        <i className="fa-solid fa-chevron-down text-2xl"></i>
      </div>
    </header>
  );
}

// Announcement Ticker
function AnnouncementTicker() {
  const { t } = useTranslation();
  const items = [
    { icon: 'fa-bullhorn', text: t('announcement1') },
    { icon: 'fa-calendar', text: t('announcement2') },
    { icon: 'fa-bus', text: t('announcement3') },
    { icon: 'fa-trophy', text: t('announcement4') },
  ];

  return (
    <div className="bg-gs-accent text-white py-3 overflow-hidden relative z-20 shadow-lg">
      <div className="whitespace-nowrap animate-marquee flex items-center gap-8 font-bold text-sm uppercase tracking-wider">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <span><i className={`fa-solid ${item.icon} mr-2`}></i> {item.text}</span>
            {index < items.length - 1 && <span className="opacity-50">|</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// Footer
function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="bg-gs-dark text-gs-cream pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gs-accent rounded-full flex items-center justify-center text-white font-bold text-sm"><i className="fa-solid fa-graduation-cap"></i></div>
            <span className="font-serif text-xl font-bold">TTC RUBENGERA</span>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">{t('footerDescription')}</p>
        </div>
        <div>
          <h4 className="font-bold text-white mb-6">{t('quickLinks')}</h4>
          <ul className="space-y-3 text-sm text-gray-400">
            <li><Link to="/apply" className="hover:text-gs-accent transition-colors">{t('admissions')}</Link></li>
            <li><a href="#" className="hover:text-gs-accent transition-colors">{t('academicCalendar')}</a></li>
            <li><a href="#" className="hover:text-gs-accent transition-colors">{t('schoolPolicies')}</a></li>
            <li><a href="#" className="hover:text-gs-accent transition-colors">{t('careers')}</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-white mb-6">{t('contactUs')}</h4>
          <ul className="space-y-3 text-sm text-gray-400">
            <li><i className="fa-solid fa-location-dot mr-2 text-gs-accent"></i> Rubavu District, Western Province</li>
            <li><i className="fa-solid fa-phone mr-2 text-gs-accent"></i> +250 788 123 456</li>
            <li><i className="fa-solid fa-envelope mr-2 text-gs-accent"></i> info@ttcrubengera.edu.rw</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-white mb-6">{t('newsletter')}</h4>
          <p className="text-xs text-gray-400 mb-4">{t('newsletterDesc')}</p>
          <div className="flex">
            <input type="email" placeholder={t('yourEmail')} className="bg-white/10 border border-white/20 text-white px-4 py-2 rounded-l focus:outline-none w-full text-sm" />
            <button className="bg-gs-accent px-4 py-2 rounded-r hover:bg-orange-700 transition-colors"><i className="fa-solid fa-paper-plane"></i></button>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 pt-8 text-center text-xs text-gray-500">
        <p>&copy; 2023 TTC Rubengera. {t('allRightsReserved')}</p>
      </div>
    </footer>
  );
}

// ===================== PAGES =====================

// Home Page
function HomePage() {
  const { t } = useTranslation();
  return (
    <div className="font-sans text-gs-text antialiased">
      <Navbar />
      <div className="pt-0">
        <HeroSection />
      </div>
      <AnnouncementTicker />
      <AboutPreview />
      <ProgramsPreview />
      <NewsPreview />
      <Footer />
    </div>
  );
}

// About Preview (Home Page Section)
function AboutPreview() {
  const { t } = useTranslation();
  return (
    <section id="about" className="py-20 px-6 lg:px-20 bg-gs-cream relative">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative group">
            <div className="absolute -inset-4 bg-gs-accent/20 rounded-xl transform rotate-3 transition-transform group-hover:rotate-6"></div>
            <img src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Students Learning" className="relative rounded-xl shadow-2xl w-full object-cover h-[500px] grayscale group-hover:grayscale-0 transition-all duration-500" />
            <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-lg shadow-xl max-w-xs hidden md:block">
              <div className="flex items-center gap-4">
                <div className="text-4xl text-gs-accent font-serif font-bold">34+</div>
                <div className="text-sm text-gray-600 leading-tight">{t('yearsExperience')}</div>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-gs-accent font-bold tracking-widest uppercase mb-2">{t('whoWeAre')}</h3>
            <h2 className="font-serif text-4xl md:text-5xl text-gs-dark mb-6">{t('legacyTitle')}</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">{t('shortAbout')}</p>
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="flex items-start gap-3">
                <div className="bg-gs-dark text-white p-2 rounded"><i className="fa-solid fa-book-open"></i></div>
                <div><h4 className="font-bold text-gs-dark">{t('modernCurriculum')}</h4><p className="text-sm text-gray-500">{t('stemArts')}</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-gs-dark text-white p-2 rounded"><i className="fa-solid fa-users"></i></div>
                <div><h4 className="font-bold text-gs-dark">{t('expertFaculty')}</h4><p className="text-sm text-gray-500">{t('passionateEducators')}</p></div>
              </div>
            </div>
            <Link to="/about" className="text-gs-accent font-bold border-b-2 border-gs-accent pb-1 hover:text-gs-dark hover:border-gs-dark transition-colors">
              {t('ourHistory')} <i className="fa-solid fa-arrow-right ml-2"></i>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// Programs Preview
function ProgramsPreview() {
  const { t } = useTranslation();
  const options = [
    { icon: "fa-flask", title: "SME", full: t('scienceMath'), description: t('smeDesc'), image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
    { icon: "fa-globe", title: "SRS", full: t('socialStudies'), description: t('srsDesc'), image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
    { icon: "fa-language", title: "LE", full: t('languageEducation'), description: t('leDesc'), image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
    { icon: "fa-child", title: "ECLP", full: t('earlyChildhood'), description: t('eclpDesc'), image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
  ];

  return (
    <section id="programs" className="py-20 bg-gs-dark text-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl mb-4">{t('academicPrograms')}</h2>
          <p className="text-gray-400 mt-2">{t('programsSubtitle')}</p>
          <div className="w-24 h-1 bg-gs-accent mx-auto mt-4"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {options.map((opt, index) => (
            <div key={index} className="group relative overflow-hidden rounded-xl h-80 cursor-pointer">
              <img src={opt.image} alt={opt.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-50 group-hover:opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6">
                <div className="text-gs-accent text-3xl mb-2"><i className={`fa-solid ${opt.icon}`}></i></div>
                <span className="bg-gs-accent text-white text-xs font-bold px-2 py-1 rounded mb-2 inline-block">{opt.title}</span>
                <h3 className="font-serif text-lg font-bold mb-1">{opt.full}</h3>
                <p className="text-gray-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">{opt.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link to="/programs" className="px-8 py-3 bg-gs-accent text-white rounded hover:bg-orange-700 transition-colors">{t('viewAllPrograms')}</Link>
        </div>
      </div>
    </section>
  );
}

// News Preview
function NewsPreview() {
  return <PublicAnnouncementsPreview />;
}

// About Page
function AboutPage() {
  const { t } = useTranslation();
  const [showHistory, setShowHistory] = useState(false);
  
  return (
    <div className="font-sans text-gs-text antialiased pt-20">
      <Navbar />
      <section className="bg-gs-dark text-white py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="font-serif text-5xl mb-4">{t('whoWeAre')}</h1>
          <p className="text-gray-400">{t('legacyTitle')}</p>
        </div>
      </section>
      <section className="py-20 px-6 lg:px-20 bg-gs-cream">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h3 className="text-gs-accent font-bold tracking-widest uppercase mb-2">{t('whoWeAre')}</h3>
              <h2 className="font-serif text-4xl md:text-5xl text-gs-dark mb-6">{t('legacyTitle')}</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {showHistory ? t('fullHistory') : t('shortAbout')}
              </p>
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="flex items-start gap-3">
                  <div className="bg-gs-dark text-white p-2 rounded"><i className="fa-solid fa-book-open"></i></div>
                  <div><h4 className="font-bold text-gs-dark">{t('modernCurriculum')}</h4><p className="text-sm text-gray-500">{t('stemArts')}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-gs-dark text-white p-2 rounded"><i className="fa-solid fa-users"></i></div>
                  <div><h4 className="font-bold text-gs-dark">{t('expertFaculty')}</h4><p className="text-sm text-gray-500">{t('passionateEducators')}</p></div>
                </div>
              </div>
              <button onClick={() => setShowHistory(!showHistory)} className="text-gs-accent font-bold border-b-2 border-gs-accent pb-1 hover:text-gs-dark hover:border-gs-dark transition-colors">
                {showHistory ? t('showLess') : t('ourHistory')}
              </button>
            </div>
            <div className="relative group">
              <img src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Students Learning" className="rounded-xl shadow-2xl w-full object-cover h-[500px]" />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-lg shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="text-4xl text-gs-accent font-serif font-bold">25+</div>
                  <div className="text-sm text-gray-600 leading-tight">{t('yearsExperience')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

// Programs Page
function ProgramsPage() {
  const { t } = useTranslation();
  const options = [
    { icon: "fa-flask", title: "SME", full: t('scienceMath'), description: t('smeDesc'), image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
    { icon: "fa-globe", title: "SRS", full: t('socialStudies'), description: t('srsDesc'), image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
    { icon: "fa-language", title: "LE", full: t('languageEducation'), description: t('leDesc'), image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
    { icon: "fa-child", title: "ECLP", full: t('earlyChildhood'), description: t('eclpDesc'), image: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" },
  ];

  const trainings = [
    { icon: "fa-laptop", title: t('eLearning'), desc: t('eLearningDesc') },
    { icon: "fa-comments", title: t('englishProficiency'), desc: t('englishProficiencyDesc') },
  ];

  const clubs = [
    { icon: "fa-dove", title: t('neverAgainClub'), desc: t('neverAgainClubDesc') },
    { icon: "fa-robot", title: t('roboticsClub'), desc: t('roboticsClubDesc') },
    { icon: "fa-book-open", title: t('englishClub'), desc: t('englishClubDesc') },
  ];

  return (
    <div className="font-sans text-gs-text antialiased pt-20">
      <Navbar />
      <section className="bg-gs-dark text-white py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="font-serif text-5xl mb-4">{t('academicPrograms')}</h1>
          <p className="text-gray-400">{t('programsSubtitle')}</p>
        </div>
      </section>

      <section className="py-20 bg-gs-cream">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {options.map((opt, index) => (
              <div key={index} className="group relative overflow-hidden rounded-xl h-80 cursor-pointer">
                <img src={opt.image} alt={opt.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-50 group-hover:opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6">
                  <div className="text-gs-accent text-3xl mb-2"><i className={`fa-solid ${opt.icon}`}></i></div>
                  <span className="bg-gs-accent text-white text-xs font-bold px-2 py-1 rounded mb-2 inline-block">{opt.title}</span>
                  <h3 className="font-serif text-lg font-bold mb-1">{opt.full}</h3>
                  <p className="text-gray-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">{opt.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl text-gs-dark mb-2">{t('trainingPrograms')}</h2>
            <div className="w-16 h-1 bg-gs-accent mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {trainings.map((tr, i) => (
              <div key={i} className="bg-gs-cream rounded-xl p-8 shadow-lg flex items-start gap-4">
                <div className="w-14 h-14 bg-gs-dark rounded-full flex items-center justify-center text-gs-accent text-2xl flex-shrink-0"><i className={`fa-solid ${tr.icon}`}></i></div>
                <div><h4 className="font-bold text-gs-dark text-lg mb-1">{tr.title}</h4><p className="text-gray-500 text-sm">{tr.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gs-cream">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl text-gs-dark mb-2">{t('studentClubs')}</h2>
            <div className="w-16 h-1 bg-gs-accent mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {clubs.map((c, i) => (
              <div key={i} className="text-center group p-6 rounded-xl hover:bg-white transition-colors">
                <div className="w-16 h-16 bg-gs-accent rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4"><i className={`fa-solid ${c.icon}`}></i></div>
                <h4 className="font-bold text-gs-dark text-lg mb-2">{c.title}</h4>
                <p className="text-gray-500 text-sm">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}

// Announcements Page
function AnnouncementsPage() {
  const { t } = useTranslation();

  return (
    <div className="font-sans text-gs-text antialiased pt-20">
      <Navbar />
      <section className="bg-gs-dark text-white py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="font-serif text-5xl mb-4">{t('news')}</h1>
          <p className="text-gray-400">{t('stayUpdated')}</p>
        </div>
      </section>
      <AnnouncementsPageContent />
      <Footer />
    </div>
  );
}

// Login Page
function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedUser = getStoredUser();

    if (savedUser) {
      navigate(getDashboardRoute(savedUser.role), { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const data = await apiJson('/auth/login', 'POST', { email, password });
      
      if (data.success) {
        saveAuthSession(data.token, data.user);
        navigate(getDashboardRoute(data.user.role), { replace: true });
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans text-gs-text antialiased pt-20 min-h-screen bg-gs-cream">
      <Navbar />
      <div className="flex items-center justify-center py-20">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gs-dark rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4"><i className="fa-solid fa-graduation-cap"></i></div>
            <h2 className="font-serif text-2xl font-bold text-gs-dark">{t('schoolName')}</h2>
            <p className="text-gray-500 text-sm">{t('signInToContinue')}</p>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gs-dark mb-1">{t('email')}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-gs-accent" placeholder="your@email.com" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gs-dark mb-1">{t('password')}</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 pr-12 border border-gray-300 rounded focus:outline-none focus:border-gs-accent" placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gs-dark" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-gs-accent text-white font-bold rounded hover:bg-orange-700 transition-colors disabled:opacity-50">
              {loading ? t('signingIn') : t('signIn')}
            </button>
            {loading ? (
              <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm">
                {t('wakingUpServer')}
              </div>
            ) : null}
          </form>
          <div className="mt-4 rounded-xl bg-[#fffaf4] border border-gs-dark/10 p-4 text-sm text-gray-600">
            {t('loginHelpText')}
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">{t('dontHaveAccount')} <Link to="/register" className="text-gs-accent font-bold">{t('registerHere')}</Link></p>
          <div className="text-center mt-6">
            <Link to="/" className="text-gs-dark text-sm hover:text-gs-accent"><i className="fa-solid fa-arrow-left mr-1"></i> {t('backToHome')}</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// Register Page
function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const roleDescriptions = {
    student: 'Gets the student dashboard for downloading teacher tasks and posting comments.',
    teacher: 'Gets the teacher dashboard for uploading task files, adding the first comment, and tracking student replies.',
    parent: 'Gets the parent dashboard for announcements and admin chat.',
    admin: 'Gets the admin dashboard for announcements, user roles, and conversations.',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const data = await apiJson('/auth/register', 'POST', {
        email,
        password,
        role,
        firstName,
        lastName
      });
      
      if (data.success) {
        alert(`${t('accountCreated')}! ${t('pleaseLogin')}`);
        navigate('/login');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans text-gs-text antialiased pt-20 min-h-screen bg-gs-cream">
      <Navbar />
      <div className="flex items-center justify-center py-20">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gs-dark rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4"><i className="fa-solid fa-user-plus"></i></div>
            <h2 className="font-serif text-2xl font-bold text-gs-dark">{t('createAccount')}</h2>
            <p className="text-gray-500 text-sm">{t('joinSchool')}</p>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}
          
          <div className="mb-6">
            <label className="block text-sm font-bold text-gs-dark mb-2">{t('iAmA')}</label>
            <div className="grid grid-cols-2 gap-2">
              {['student', 'teacher', 'parent'].map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)} className={`py-2 px-3 rounded text-sm font-bold capitalize transition-all ${role === r ? 'bg-gs-accent text-white' : 'bg-gray-100 text-gs-dark hover:bg-gray-200'}`}>
                  {t(r)}
                </button>
              ))}
            </div>
            <div className="mt-3 rounded-xl bg-[#fffaf4] border border-gs-dark/10 p-4 text-sm text-gray-600">
              {roleDescriptions[role]}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gs-dark mb-1">{t('fullName')}</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-gs-accent" placeholder="John Doe" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gs-dark mb-1">{t('email')}</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-gs-accent" placeholder="your@email.com" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-gs-dark mb-1">{t('password')}</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 pr-12 border border-gray-300 rounded focus:outline-none focus:border-gs-accent" placeholder="••••••••" required minLength={6} />
                <button type="button" onClick={() => setShowPassword((current) => !current)} className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gs-dark" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>
            
            <button type="submit" disabled={loading} className="w-full py-3 bg-gs-accent text-white font-bold rounded hover:bg-orange-700 transition-colors disabled:opacity-50">
              {loading ? t('creatingAccount') : t('createAccount')}
            </button>
            {loading ? (
              <div className="rounded-xl bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm">
                {t('wakingUpServer')}
              </div>
            ) : null}
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">{t('alreadyHaveAccount')} <Link to="/login" className="text-gs-accent font-bold">{t('signIn')}</Link></p>
          <div className="text-center mt-6">
            <Link to="/" className="text-gs-dark text-sm hover:text-gs-accent"><i className="fa-solid fa-arrow-left mr-1"></i> {t('backToHome')}</Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// Apply Page
function ApplyPage() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="font-sans text-gs-text antialiased pt-20 min-h-screen bg-gs-cream">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="max-w-2xl bg-white p-12 rounded-2xl shadow-2xl text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fa-solid fa-check text-4xl text-green-600"></i>
            </div>
            <h2 className="font-serif text-3xl font-bold text-gs-dark mb-4">{t('applicationSubmitted')}</h2>
            <p className="text-gray-600 mb-6">{t('applicationSuccessMessage')}</p>
            <Link to="/" className="px-6 py-3 bg-gs-accent text-white rounded hover:bg-orange-700 transition-colors">{t('backToHome')}</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="font-sans text-gs-text antialiased pt-20">
      <Navbar />
      <div className="bg-gs-dark py-4 shadow-md">
        <h1 className="text-white text-center text-xl md:text-2xl font-bold tracking-wide">{t('admissionForm')}</h1>
      </div>
      <div className="max-w-6xl mx-auto bg-gray-100 p-6 mt-6 shadow-lg rounded-lg mb-20">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold mb-1">{t('sdmsCode')} <span className="text-red-600">*</span></label>
              <input type="text" required className="w-full border border-gray-400 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gs-accent" />
            </div>
            <div>
              <label className="block font-semibold mb-1">{t('firstName')} <span className="text-red-600">*</span></label>
              <input type="text" required className="w-full border border-gray-400 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gs-accent" />
            </div>
            <div>
              <label className="block font-semibold mb-1">{t('lastName')} <span className="text-red-600">*</span></label>
              <input type="text" required className="w-full border border-gray-400 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gs-accent" />
            </div>
            <div>
              <label className="block font-semibold mb-1">{t('lastLevelMark')} <span className="text-red-600">*</span></label>
              <input type="number" required className="w-full border border-gray-400 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-gs-accent" />
            </div>
            <div>
              <label className="block font-semibold mb-1">{t('tradeOrSection')} <span className="text-red-600">*</span></label>
              <select required className="w-full border border-gray-400 px-3 py-2 rounded focus:ring-2 focus:ring-gs-accent">
                <option value="">{t('selectTrade')}</option>
                <option value="SME">{t('scienceMath')}</option>
                <option value="SRS">{t('socialStudies')}</option>
                <option value="LE">{t('languageEducation')}</option>
                <option value="ECLP">{t('earlyChildhood')}</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">{t('model')} <span className="text-red-600">*</span></label>
              <select required className="w-full border border-gray-400 px-3 py-2 rounded focus:ring-2 focus:ring-gs-accent">
                <option value="">{t('selectModel')}</option>
                <option>{t('day')}</option>
                <option>{t('boarding')}</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">{t('gender')} <span className="text-red-600">*</span></label>
              <select required className="w-full border border-gray-400 px-3 py-2 rounded focus:ring-2 focus:ring-gs-accent">
                <option value="">{t('selectGender')}</option>
                <option>{t('male')}</option>
                <option>{t('female')}</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">{t('level')} <span className="text-red-600">*</span></label>
              <select required className="w-full border border-gray-400 px-3 py-2 rounded focus:ring-2 focus:ring-gs-accent">
                <option value="">{t('selectLevel')}</option>
                <option>L3</option><option>L4</option><option>L5</option><option>L6</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">{t('fatherName')}</label>
              <input type="text" className="w-full border border-gray-400 px-3 py-2 rounded focus:ring-2 focus:ring-gs-accent" />
            </div>
            <div>
              <label className="block font-semibold mb-1">{t('motherName')}</label>
              <input type="text" className="w-full border border-gray-400 px-3 py-2 rounded focus:ring-2 focus:ring-gs-accent" />
            </div>
            <div>
              <label className="block font-semibold mb-1">{t('phone')} <span className="text-red-600">*</span></label>
              <input type="tel" required pattern="[0-9]{10}" className="w-full border border-gray-400 px-3 py-2 rounded focus:ring-2 focus:ring-gs-accent" />
            </div>
            <div>
              <label className="block font-semibold mb-1">{t('dateOfBirth')} <span className="text-red-600">*</span></label>
              <input type="date" required className="w-full border border-gray-400 px-3 py-2 rounded focus:ring-2 focus:ring-gs-accent" />
            </div>
          </div>
          <div className="mt-6">
            <label className="block font-semibold mb-1">{t('studentEmail')} <span className="text-red-600">*</span></label>
            <input type="email" required className="w-full border border-gray-400 px-3 py-2 rounded focus:ring-2 focus:ring-gs-accent" />
          </div>
          <div className="mt-8">
            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded font-semibold shadow-md transition duration-300">{t('apply')}</button>
          </div>
        </form>
        <div className="text-center mt-6">
          <Link to="/" className="text-gs-dark text-sm hover:text-gs-accent"><i className="fa-solid fa-arrow-left mr-1"></i> {t('backToHome')}</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// Portal Page with Dashboard
function PortalPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role } = useParams();
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());

  const handleLogout = () => {
    disconnectSocket();
    clearAuthSession();
    setCurrentUser(null);
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (role !== currentUser.role) {
    return <Navigate to={getDashboardRoute(currentUser.role)} replace />;
  }

  return (
    <div className="font-sans text-gs-text antialiased pt-20 min-h-screen bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gs-cream rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gs-accent/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 relative z-10 py-12">
        <div className="text-center mb-12">
          <h2 className="font-serif text-4xl text-gs-dark">{t('schoolManagement')}</h2>
          <p className="text-gray-500 mt-2">{currentUser.fullName} | {currentUser.role}</p>
        </div>
        <RolePortal user={currentUser} onLogout={handleLogout} />
      </div>
      <Footer />
    </div>
  );
}

function PortalRedirect() {
  const savedUser = getStoredUser();

  if (!savedUser) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getDashboardRoute(savedUser.role)} replace />;
}

// ===================== MAIN APP =====================
function App() {
  useBackendKeepAlive();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/programs" element={<ProgramsPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/portal" element={<PortalRedirect />} />
        <Route path="/portal/:role" element={<PortalPage />} />
      </Routes>
    </Router>
  );
}

export default App;



