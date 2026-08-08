import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"Algorithm Atlas — Interactive algorithm visualizer",description:"Explore 13 foundational algorithms in Java, Go, Python, and TypeScript with synchronized animated simulations.",openGraph:{title:"Algorithm Atlas",description:"Watch code become an algorithm.",images:["/og.png"]},twitter:{card:"summary_large_image",title:"Algorithm Atlas",description:"Watch code become an algorithm.",images:["/og.png"]}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
