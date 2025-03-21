
import React, { useContext } from 'react';
import { LanguageContext } from '../App';

interface MultilingualTitleProps {
  className?: string;
}

const MultilingualTitle: React.FC<MultilingualTitleProps> = ({ className = '' }) => {
  const { currentLanguage } = useContext(LanguageContext);
  
  // Title text based on language
  const titleText = {
    English: "Vengerian Stories",
    Russian: "Венгерианские Истории",
    Hebrew: "סיפורים ונגריאניים"
  }[currentLanguage];
  
  // Font class based on language
  const fontClass = {
    English: "font-cursive-cyrillic text-6xl",
    Russian: "font-cursive-cyrillic text-6xl",
    Hebrew: "font-rubik-pixels text-5xl"
  }[currentLanguage];
  
  return (
    <h1 className={`${fontClass} tracking-tight ${className}`} dir={currentLanguage === "Hebrew" ? "rtl" : "ltr"}>
      {titleText}
    </h1>
  );
};

export default MultilingualTitle;
