# genoxplain

GenoXplain is a web application designed for the interpretable analysis of genetic variants and their impact on cancer signaling pathways. Users can upload their genetic variant data (e.g., VCF files) or paste variants directly to receive insights into how these variations may affect cancer-related biological processes. This tool aims to bridge the gap between raw genetic data and actionable understanding for researchers and clinicians in the field of oncology.

Built with [Next.js](https://nextjs.org/), [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), and leveraging AI capabilities via AWS Bedrock, GenoXplain provides a user-friendly interface for complex bioinformatics analysis.

## Prerequisites

Before you begin, ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (version 20.x or higher recommended)
*   [npm](https://www.npmjs.com/) (usually comes with Node.js) or [yarn](https://yarnpkg.com/) or [pnpm](https://pnpm.io/)

## Getting Started

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone <your-repository-url>
    cd genoxplain
    ```

2.  **Install dependencies:**
    Choose your preferred package manager:
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```
    This will start the development server, typically on [http://localhost:3000](http://localhost:3000). The app will use Turbopack for faster development builds.

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result. You can start editing the page by modifying files in the `src/` directory. The page auto-updates as you edit the files.

## Available Scripts

In the project directory, you can run the following scripts:

*   `npm run dev`: Runs the app in development mode with Turbopack.
*   `npm run build`: Builds the app for production.
*   `npm run start`: Starts the production server (after running `npm run build`).
*   `npm run lint`: Lints the codebase using Next.js's ESLint configuration.

(If you use `yarn` or `pnpm`, replace `npm run` with `yarn` or `pnpm run` respectively.)

## Key Technologies & Libraries

This project utilizes several modern web technologies, including:

*   **Framework:** [Next.js](https://nextjs.org/) (v15)
*   **UI Library:** [React](https://react.dev/) (v19)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) (v4)
*   **UI Components:** [Shadcn UI](https://ui.shadcn.com/) (implied by `lucide-react`, `@radix-ui/*`, `tailwind-merge`, `clsx`, `cmdk`, `vaul`)
*   **Markdown:** `react-markdown` for rendering Markdown content.
*   **3D Molecular Visualization:** `ngl` (likely for displaying molecular structures if this is a scientific application)
*   **AWS Integration:** `@aws-sdk/client-bedrock-runtime` (suggests integration with AWS Bedrock for generative AI features)
*   **Linting & Formatting:** ESLint, Prettier (implied by standard Next.js setup and `eslint-config-next`)
*   **TypeScript:** For static typing.

## Project Structure

A brief overview of the main directories:

*   `src/app/`: Contains the core application routes and pages.
*   `src/components/`: For reusable UI components.
*   `src/lib/`: For utility functions and helper modules.
*   `public/`: For static assets like images and fonts.
*   `components.json`: Configuration for Shadcn UI.

## Learn More

To learn more about the technologies used, refer to their official documentation:

*   [Next.js Documentation](https://nextjs.org/docs)
*   [React Documentation](https://react.dev/learn)
*   [Tailwind CSS Documentation](https://tailwindcss.com/docs)
*   [Shadcn UI Documentation](https://ui.shadcn.com/docs)

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

This README was generated to provide a starting point. Feel free to customize it further to better suit your project!
