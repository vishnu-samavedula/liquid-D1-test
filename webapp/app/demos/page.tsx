import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { demoCategories } from "@/app/demo-data";
import { DemoShell } from "@/app/demo-shell";

export default function DemosPage() {
  return (
    <DemoShell section="MULTI-INDUSTRY" title="DEMO LIBRARY">
      <section className="library-hero">
        <span className="page-index">01 / BUILD MAP</span>
        <h2>ONE DECISION ENGINE.<br />SEVEN REAL-WORLD TRACKS.</h2>
        <p>Each track is its own page with two focused demos. They are designed around observable decisions—not generic chat—and every high-consequence workflow keeps a human in control.</p>
      </section>
      <section className="category-grid" aria-label="Demo categories">
        {demoCategories.map((category, index) => (
          <Link href={`/demos/${category.slug}`} className="category-card" key={category.slug}>
            <div className="category-card-top"><span>{String(index + 1).padStart(2, "0")}</span><span>{category.code}</span></div>
            <h3>{category.title}</h3>
            <p>{category.description}</p>
            <div className="category-examples">
              {category.examples.map((example) => <span key={example.title}>{example.title}</span>)}
            </div>
            <div className="card-link">OPEN TRACK <ArrowRight size={16} /></div>
          </Link>
        ))}
      </section>
    </DemoShell>
  );
}
