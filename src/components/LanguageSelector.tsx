
import React, { useContext } from 'react';
import { LanguageContext } from '../App';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LanguageSelector = () => {
  const { currentLanguage, setCurrentLanguage } = useContext(LanguageContext);
  const languages = ["English", "Hebrew", "Russian"];

  const handleLanguageChange = (value: string) => {
    setCurrentLanguage(value);
  };

  return (
    <div className="flex items-center">
      <Globe className="w-4 h-4 mr-1 text-gray-500" />
      <Select value={currentLanguage} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[110px] h-8 text-sm border-none bg-transparent hover:bg-gray-100 focus:ring-0">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang} value={lang}>
              {lang}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSelector;
