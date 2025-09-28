import { createContext, useContext, useState } from 'react';

type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Header
    'header.home': 'Home',
    'header.materials': 'Materials',
    'header.technologies': 'Technologies',
    'header.testimonials': 'Success Stories',
    'header.cart': 'Cart',
    'header.account': 'Account',
    
    // Hero
    'hero.title': 'Master Your Tech Interviews',
    'hero.subtitle': 'Land Your Dream Job',
    'hero.description': 'Comprehensive interview preparation materials for .NET, React, and Flutter developers. Created by industry experts, trusted by thousands of successful candidates.',
    'hero.start_learning': 'Start Learning Now',
    'hero.view_demo': 'View Demo',
    'hero.successful_candidates': 'Successful Candidates',
    'hero.rating': 'Rating',
    'hero.money_back': 'Money Back Guarantee',
    
    // Search
    'search.title': 'Find Perfect Interview Materials',
    'search.description': 'Search and filter by technology, difficulty level, and content type',
    'search.placeholder': 'Search interview materials...',
    'search.all_technologies': 'All Technologies',
    'search.all_levels': 'All Levels',
    'search.beginner': 'Beginner',
    'search.intermediate': 'Intermediate',
    'search.advanced': 'Advanced',
    
    // Materials
    'materials.title': 'Premium Interview Materials',
    'materials.description': 'Carefully crafted content to help you succeed in your next interview',
    'materials.add_to_cart': 'Add to Cart',
    'materials.preview': 'Preview',
    'materials.view_all': 'View All Materials',
    'materials.pages': 'pages',
    'materials.added': 'Added!',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.buy_now': 'Buy Now',
    'common.download': 'Download',
    'common.login': 'Login',
    'common.logout': 'Logout',
  },
  hi: {
    // Header
    'header.home': 'होम',
    'header.materials': 'सामग्री',
    'header.technologies': 'तकनीकें',
    'header.testimonials': 'सफलता की कहानियां',
    'header.cart': 'कार्ट',
    'header.account': 'खाता',
    
    // Hero
    'hero.title': 'अपने टेक इंटरव्यू में महारत हासिल करें',
    'hero.subtitle': 'अपना ड्रीम जॉब पाएं',
    'hero.description': '.NET, React, और Flutter डेवलपर्स के लिए व्यापक इंटरव्यू तैयारी सामग्री। उद्योग विशेषज्ञों द्वारा बनाई गई, हजारों सफल उम्मीदवारों द्वारा भरोसा किया गया।',
    'hero.start_learning': 'अभी सीखना शुरू करें',
    'hero.view_demo': 'डेमो देखें',
    'hero.successful_candidates': 'सफल उम्मीदवार',
    'hero.rating': 'रेटिंग',
    'hero.money_back': 'पैसे वापसी की गारंटी',
    
    // Search
    'search.title': 'सही इंटरव्यू सामग्री खोजें',
    'search.description': 'तकनीक, कठिनाई स्तर, और सामग्री प्रकार के आधार पर खोजें और फ़िल्टर करें',
    'search.placeholder': 'इंटरव्यू सामग्री खोजें...',
    'search.all_technologies': 'सभी तकनीकें',
    'search.all_levels': 'सभी स्तर',
    'search.beginner': 'शुरुआती',
    'search.intermediate': 'मध्यम',
    'search.advanced': 'उन्नत',
    
    // Materials
    'materials.title': 'प्रीमियम इंटरव्यू सामग्री',
    'materials.description': 'आपके अगले इंटरव्यू में सफल होने में मदद करने के लिए सावधानीपूर्वक तैयार की गई सामग्री',
    'materials.add_to_cart': 'कार्ट में जोड़ें',
    'materials.preview': 'पूर्वावलोकन',
    'materials.view_all': 'सभी सामग्री देखें',
    'materials.pages': 'पेज',
    'materials.added': 'जोड़ा गया!',
    
    // Common
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'त्रुटि',
    'common.success': 'सफलता',
    'common.buy_now': 'अभी खरीदें',
    'common.download': 'डाउनलोड',
    'common.login': 'लॉगिन',
    'common.logout': 'लॉगआउट',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
