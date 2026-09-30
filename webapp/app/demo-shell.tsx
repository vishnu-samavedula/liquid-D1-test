"use client";

import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, Terminal } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export function DemoShell({ children, section = "DECISION SYSTEM", title = "WORKBENCH" }: { children: ReactNode; section?: string; title?: string }) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen style={{ "--sidebar-width": "13.75rem", "--sidebar-width-icon": "3.25rem" } as CSSProperties}>
      <Sidebar collapsible="icon" className="demo-sidebar">
        <SidebarHeader className="nav-header">
          <div className="nav-monogram">L</div>
          <div className="nav-title"><strong>DEMO INDEX</strong><span>DECISION LAB</span></div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>WORKSPACE</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem><SidebarMenuButton asChild tooltip="Workbench" isActive={pathname === "/"}><Link href="/"><Terminal /><span>Workbench</span></Link></SidebarMenuButton></SidebarMenuItem>
                <SidebarMenuItem><SidebarMenuButton asChild tooltip="Transaction Pulse" isActive={pathname === "/demos/financial-services/transaction-pulse"}><Link href="/demos/financial-services/transaction-pulse"><Scale /><span>Transaction Pulse</span></Link></SidebarMenuButton></SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="nav-footer"><span>LOCAL DEMO</span><span>D1 / SYSTEM ONE</span></SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="bg-transparent">
        <div className="min-h-screen px-4 py-4 md:px-8 md:py-7">
          <div className="mx-auto max-w-[1480px]">
            <header className="masthead">
              <SidebarTrigger className="nav-trigger" />
              <div className="brand-lockup">
                <Image src="/liquid-logo-white.png" alt="Liquid AI" width={1539} height={504} priority className="liquid-logo" />
                <span className="brand-divider" aria-hidden="true" />
                <div><p className="eyebrow">{section}</p><h1>{title}</h1></div>
              </div>
            </header>
            <div className="ticker" aria-hidden="true">
              <span>YOUR INPUT</span><span>DON&apos;T OVER-JEV IT. JUST LFM.</span><span>STRUCTURED PROBABILITIES</span>
            </div>
            {children}
            <footer><span>LOCAL SESSION</span><span>KEY PROTECTED SERVER-SIDE</span><span>D1 / SYSTEM ONE</span></footer>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
