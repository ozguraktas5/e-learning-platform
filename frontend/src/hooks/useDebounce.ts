import { useState, useEffect } from 'react'; // useState ve useEffect kütüphanesini import ettik

export function useDebounce<T>(value: T, delay: number): T { // useDebounce fonksiyonu oluşturduk
  const [debouncedValue, setDebouncedValue] = useState<T>(value); // debouncedValue'ı useState ile oluşturduk

  useEffect(() => { // useEffect fonksiyonu oluşturduk
    const handler = setTimeout(() => { // handler'ı setTimeout ile oluşturduk
      setDebouncedValue(value); // value'ı setDebouncedValue ile güncelledik
    }, delay); // delay'ı setTimeout ile ayarladık

    return () => { // return fonksiyonu oluşturduk
      clearTimeout(handler); // handler'ı clearTimeout ile temizledik
    };
  }, [value, delay]); // value ve delay'ı dependency olarak ekledik

  return debouncedValue; // debouncedValue'ı döndük
} 