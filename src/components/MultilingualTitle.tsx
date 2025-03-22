
import React, { useContext } from 'react';
import { LanguageContext } from '../App';
import { useIsMobile } from '../hooks/use-mobile';

interface MultilingualTitleProps {
  className?: string;
}

const MultilingualTitle: React.FC<MultilingualTitleProps> = ({ className = '' }) => {
  const { currentLanguage } = useContext(LanguageContext);
  const isMobile = useIsMobile();
  
  // Title text based on language
  const titleText = {
    English: "Vengerian Stories",
    Russian: "Венгерианские Истории",
    Hebrew: "סיפורים ונגריאניים"
  }[currentLanguage];
  
  // Font class based on language and screen size
  const fontClass = {
    English: isMobile ? "font-cursive-cyrillic text-4xl font-normal" : "font-cursive-cyrillic text-6xl font-normal",
    Russian: isMobile ? "font-cursive-cyrillic text-4xl font-normal" : "font-cursive-cyrillic text-6xl font-normal",
    Hebrew: isMobile ? "font-rubik-pixels text-3xl font-normal" : "font-rubik-pixels text-5xl font-normal"
  }[currentLanguage];
  
  return (
    <div className="w-full flex justify-center py-8 px-4">
      <h1 
        className={`${fontClass} tracking-tight text-center ${className}`} 
        dir={currentLanguage === "Hebrew" ? "rtl" : "ltr"}
      >
        {titleText}
      </h1>
    </div>
  );
};

export default MultilingualTitle;
