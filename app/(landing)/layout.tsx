import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import "./landing.css";

export const metadata: Metadata = {
  title: "EasyStock – All-in-One ERP for Growing Businesses",
  description:
    "Streamline operations, automate workflows, and gain real-time visibility across your entire business with EasyStockERP.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
