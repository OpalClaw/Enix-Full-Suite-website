import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Clock } from 'lucide-react';
import { ARTICLE_DATA, slugify, getArticleExcerpt, getCategories } from '@/lib/articles';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function Blog() {
  usePageTitle('Education Hub');
  const [activeCategory, setActiveCategory] = useState('ALL');

  const categories = useMemo(() => ['ALL', ...getCategories()], []);

  const filteredArticles = useMemo(() => {
    if (activeCategory === 'ALL') return ARTICLE_DATA;
    return ARTICLE_DATA.filter((a) => a.category === activeCategory);
  }, [activeCategory]);

  if (!ARTICLE_DATA.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">No articles yet — check back soon.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 sm:py-32 bg-gradient-to-b from-navy-900 to-navy-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold text-silver uppercase tracking-widest mb-3">
              Education Hub
            </p>
            <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl mb-6">
              Expert guides for Tennessee homeowners
            </h1>
            <p className="text-lg text-white/70 max-w-2xl">
              Field-tested advice on roofing, insurance claims, storm damage, and everything in
              between — written by the Enix Exteriors team.
            </p>
          </div>
        </div>
      </section>

      {/* Category filters */}
      <section className="border-b border-border bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={activeCategory === cat ? 'default' : 'outline'}
                onClick={() => setActiveCategory(cat)}
                className="text-xs"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Article grid */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => {
              const slug = slugify(article.title);
              const excerpt = getArticleExcerpt(article.content, 160);
              return (
                <Link key={article.id} to={`/education/${slug}`} className="group">
                  <Card className="h-full p-6 hover:shadow-lg transition-shadow border-border">
                    <div className="flex items-center gap-2 mb-3 text-xs">
                      <span className="px-2 py-1 rounded-full bg-navy-100 text-navy-700 font-semibold uppercase tracking-wider">
                        {article.category}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" /> {article.readTime} min read
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-lg mb-3 group-hover:text-navy-500 transition-colors leading-tight">
                      {article.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {excerpt}
                    </p>
                    <div className="flex items-center gap-1 text-navy-500 text-sm font-semibold group-hover:gap-2 transition-all">
                      Read More <ArrowRight className="w-4 h-4" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-navy-50">
        <div className="container mx-auto px-4 text-center">
          <BookOpen className="w-12 h-12 text-navy-500 mx-auto mb-4" />
          <h2 className="font-heading font-bold text-2xl mb-3">
            Have a question we haven't covered?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Our team is happy to walk you through your specific roofing situation. No obligation.
          </p>
          <a href="tel:+18656853649" aria-label="Call Enix Exteriors at 865-685-ENIX">
            <Button size="lg" className="bg-navy-500 hover:bg-navy-600">
              Call (865) 685-ENIX
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
