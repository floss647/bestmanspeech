import { useParams } from "react-router-dom";
import { useEffect } from "react";
import SpeechLandingPage from "@/components/SpeechLandingPage";
import { getLandingPageBySlug } from "@/lib/landingPageData";
import NotFound from "./NotFound";

const LandingPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const data = slug ? getLandingPageBySlug(slug) : undefined;

  useEffect(() => {
    if (data) {
      document.title = data.metaTitle;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", data.metaDescription);
      } else {
        const meta = document.createElement("meta");
        meta.name = "description";
        meta.content = data.metaDescription;
        document.head.appendChild(meta);
      }
    }
  }, [data]);

  if (!data) return <NotFound />;

  return <SpeechLandingPage data={data} />;
};

export default LandingPage;
