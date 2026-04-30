import { PublicPageContainer } from "@/components/public-page-container";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <PublicPageContainer>{children}</PublicPageContainer>;
}
