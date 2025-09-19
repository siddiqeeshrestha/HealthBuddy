import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LanguageSwitcherProps {
  variant?: 'header' | 'sidebar';
}

export default function LanguageSwitcher({ variant = 'header' }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const languages = [
    { code: 'en', name: t('common.english'), nativeName: 'English' },
    { code: 'bn', name: t('common.bengali'), nativeName: 'বাংলা' }
  ];

  if (variant === 'sidebar') {
    return (
      <div className="px-2 py-2">
        <div className="flex items-center px-2 py-2 text-sm font-medium text-muted-foreground">
          <Globe className="mr-3 h-4 w-4" />
          <span>{t('common.language')}</span>
        </div>
        <Select value={i18n.language} onValueChange={changeLanguage}>
          <SelectTrigger className="w-full mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                <span className="flex items-center gap-2">
                  <span>{lang.nativeName}</span>
                  <span className="text-xs text-muted-foreground">({lang.name})</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Globe className="h-4 w-4 text-muted-foreground" />
      <Select value={i18n.language} onValueChange={changeLanguage}>
        <SelectTrigger className="w-32 h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <span className="flex items-center gap-2">
                <span>{lang.nativeName}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
