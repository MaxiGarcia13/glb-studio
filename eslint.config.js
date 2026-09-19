import { eslintConfig } from '@maxigarcia/eslint-config';

export default eslintConfig(
  {
    typescript: true,
    astro: true,
    react: true,
    tailwind: true,
  },
  {
    ignores: [
      'public',
    ],
  },
);
