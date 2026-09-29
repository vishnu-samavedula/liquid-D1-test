import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";

import { demoCategories, getDemoCategory } from "@/app/demo-data";
import { DemoShell } from "@/app/demo-shell";

export function generateStaticParams() {
  return demoCategories.map((category) => ({ slug: category.slug }));
}

export default async function DemoCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getDemoCategory(slug);
  if (!category) notFound();

  const currentIndex = demoCategories.findIndex((item) => item.slug === slug);
  const nextCategory = demoCategories[(currentIndex + 1) % demoCategories.length];

  return (
    <DemoShell section={`INDUSTRY TRACK / ${category.code}`} title={category.title}>
      <section className="track-hero">
        <Link href="/demos" className="back-link"><ArrowLeft size={15} /> ALL DEMOS</Link>
        <span className="page-index">01 / PROBLEM SPACE</span>
        <h2>{category.title}</h2>
        <p>{category.description}</p>
      </section>

      <section className="example-grid" aria-label={`${category.title} examples`}>
        {category.examples.map((example, index) => (
          <article className="example-card" key={example.title}>
            <div className="example-number">0{index + 1}</div>
            <div className="example-copy">
              <span className="example-subtitle">{example.subtitle}</span>
              <h3>{example.title}</h3>
              <p className="example-problem">{example.problem}</p>
              <div className="example-specs">
                <div><h4>INPUTS</h4><ul>{example.inputs.map((item) => <li key={item}>{item}</li>)}</ul></div>
                <div><h4>DECISION OUTPUT</h4><ul>{example.outputs.map((item) => <li key={item}>{item}</li>)}</ul></div>
              </div>
              <div className="mode-list">{example.modes.map((mode) => <span key={mode}>{mode}</span>)}</div>
              <div className="guardrail"><strong>HUMAN BOUNDARY</strong><span>{example.guardrail}</span></div>
              {category.slug === "financial-services" && index === 0 && (
                <Link href="/demos/financial-services/transaction-pulse" className="launch-demo">LAUNCH D1 vs. JEV <ArrowRight size={16} /></Link>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="track-next">
        <div><span className="page-index">NEXT TRACK</span><h3>{nextCategory.title}</h3></div>
        <Link href={`/demos/${nextCategory.slug}`}>EXPLORE <ArrowRight size={17} /></Link>
      </section>
    </DemoShell>
  );
}
