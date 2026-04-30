import { PublicPageContainer } from "@/components/public-page-container";

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <PublicPageContainer>{children}</PublicPageContainer>;
}
