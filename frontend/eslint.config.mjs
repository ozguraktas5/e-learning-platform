import { dirname } from "path"; // dirname'i import ettik
import { fileURLToPath } from "url"; // fileURLToPath'i import ettik
import { FlatCompat } from "@eslint/eslintrc"; // FlatCompat'i import ettik

const __filename = fileURLToPath(import.meta.url); // __filename değişkeni oluşturduk
const __dirname = dirname(__filename); // __dirname değişkeni oluşturduk

const compat = new FlatCompat({ // compat objesi oluşturduk
  baseDirectory: __dirname,
}); // compat objesi oluşturduk

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"), // compat.extends fonksiyonu ile next/core-web-vitals ve next/typescript'i ekliyoruz
];

export default eslintConfig;
