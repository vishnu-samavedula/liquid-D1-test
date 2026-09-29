"use client";

import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, FlaskConical, Gamepad2, HeartPulse, Landmark, Orbit, Scale, ShieldCheck, ShoppingBag, Store, Terminal } from "lucide-react";

import { demoCategories } from "@/app/demo-data";
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

const icons = [Landmark, ShieldCheck, ShoppingBag, Store, HeartPulse, Gamepad2, Orbit];

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
                <SidebarMenuItem><SidebarMenuButton asChild tooltip="All demos" isActive={pathname === "/demos"}><Link href="/demos"><Boxes /><span>All demos</span></Link></SidebarMenuButton></SidebarMenuItem>
                <SidebarMenuItem><SidebarMenuButton asChild tooltip="D1 vs. JEV" isActive={pathname === "/demos/financial-services/transaction-pulse"}><Link href="/demos/financial-services/transaction-pulse"><Scale /><span>D1 vs. JEV</span></Link></SidebarMenuButton></SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>INDUSTRY TRACKS</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {demoCategories.map((category, index) => {
                  const Icon = icons[index] || FlaskConical;
                  const href = `/demos/${category.slug}`;
                  return (
                    <SidebarMenuItem key={category.slug}>
                      <SidebarMenuButton asChild tooltip={category.title} isActive={pathname === href}>
                        <Link href={href}><Icon /><span>{category.navTitle}</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="nav-footer"><span>PRIVATE DEMO</span><span>UNRELEASED</span></SidebarFooter>
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
