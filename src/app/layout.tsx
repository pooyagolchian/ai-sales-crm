import type { Metadata } from "next";
import { DM_Sans, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

const dmSans = DM_Sans({
	variable: "--font-display",
	subsets: ["latin"],
	weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
	title: "AI Sales CRM — Notion MCP",
	description: "AI-powered CRM using Notion as the data layer and Gemini as the brain",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${inter.variable} ${dmSans.variable} font-sans antialiased`}>
				{children}
				<Toaster />
			</body>
		</html>
	);
}
