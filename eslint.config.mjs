import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTypescript,
  { ignores: [".next/**", ".remember/**", "node_modules/**", "src/db/migrations/**"] },
];

export default eslintConfig;
