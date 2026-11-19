import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { metaPageView } from "@/lib/track";

/** Sends a Meta PageView on each client-side route change. The first page load
 *  is already counted by the pixel snippet in index.html, so it's skipped here. */
const MetaPageViews = () => {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    metaPageView();
  }, [pathname]);
  return null;
};

export default MetaPageViews;
