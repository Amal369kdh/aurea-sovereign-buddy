import { Helmet } from "react-helmet-async";

const SITE_URL = "https://aurea-student.fr";

interface SeoProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
}

export const Seo = ({ title, description, path, image, type = "website" }: SeoProps) => {
  const url = `${SITE_URL}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta property="og:image" content={image} />}
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
};
