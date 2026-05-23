import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Phone } from 'lucide-react';
import DOMPurify from 'dompurify';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ARTICLE_DATA, getArticleBySlug, slugify } from '@/lib/articles';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const article = getArticleBySlug(slug);

  usePageTitle(article ? article.title : 'Article Not Found');

  const sanitizedContent = useMemo(() => {
    if (!article?.content) return '';
    return DOMPurify.sanitize(article.content, {
      ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li',
                     'strong', 'em', 'a', 'br', 'blockquote', 'table', 'thead',
                     'tbody', 'tr', 'th', 'td'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
    });
  }, [article]);

  const relatedArticles = useMemo(() => {
    if (!article) return [];
    return ARTICLE_DATA
      .filter((a) => a.category === article.category && a.id !== article.id)
      .slice(0, 3);
  }, [article]);

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <h1 className="font-heading font-bold text-3xl mb-4">Article not found</h1>
          <p className="text-muted-foreground mb-6">
            The article you're looking for doesn't exist or has been moved.
          </p>
          <Button onClick={() => navigate('/education')} className="bg-navy-500 hover:bg-navy-600">
            Back to Education Hub
          </Button>
        </div>
      </div>
    );
  }

  return (
    <article>
      {/* Header */}
      <section className="bg-gradient-to-b from-navy-900 to-navy-800 text-white py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <Link
            to="/education"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> All Articles
          </Link>
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-4 text-xs">
              <span className="px-3 py-1 rounded-full bg-white/10 text-white font-semibold uppercase tracking-wider">
                {article.category}
              </span>
              <span className="flex items-center gap-1 text-white/60">
                <Clock className="w-3 h-3" /> {article.readTime} min read
              </span>
            </div>
            <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl leading-tight">
              {article.title}
            </h1>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div
              className="prose prose-lg max-w-none article-content"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />

            {/* Inline CTA */}
            <Card className="mt-12 p-6 bg-navy-50 border-navy-100">
              <h3 className="font-heading font-bold text-xl mb-2">
                Need help with your specific situation?
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Our team has handled thousands of Tennessee roofing projects. We're happy to walk
                you through your options — no pressure.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="tel:+18656853649" aria-label="Call Enix Exteriors at 865-685-ENIX">
                  <Button className="bg-navy-500 hover:bg-navy-600">
                    <Phone className="w-4 h-4 mr-2" /> Call (865) 685-ENIX
                  </Button>
                </a>
                <Link to="/contact">
                  <Button variant="outline">Get a Free Estimate</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Related */}
      {relatedArticles.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="font-heading font-bold text-2xl mb-8">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((rel) => (
                <Link key={rel.id} to={`/education/${slugify(rel.title)}`} className="group">
                  <Card className="h-full p-6 hover:shadow-lg transition-shadow">
                    <span className="text-xs font-semibold text-navy-500 uppercase tracking-wider mb-3 block">
                      {rel.category}
                    </span>
                    <h3 className="font-heading font-bold text-base group-hover:text-navy-500 transition-colors">
                      {rel.title}
                    </h3>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
