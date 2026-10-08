import { getPostBySlug, getPostSlugs, markdownToHtml } from '@/lib/blog';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Share2 } from 'lucide-react';

export async function generateStaticParams() {
  const slugs = getPostSlugs();
  return slugs.map((slug) => ({
    slug: slug.replace(/\.mdx?$/, ''),
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  try {
    const post = getPostBySlug(params.slug);
    if (!post) {
      return {};
    }

    const { title, description, coverImage, date, author } = post.meta;
    const url = `https://nexus24news.vercel.app/blog/${params.slug}`;

    return {
      title: `${title} | Nexus Blog`,
      description,
      openGraph: {
        title,
        description,
        type: 'article',
        publishedTime: date,
        authors: [author],
        url,
        images: coverImage ? [
          {
            url: coverImage,
            width: 1200,
            height: 630,
            alt: title,
          }
        ] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: coverImage ? [coverImage] : [],
      },
      alternates: {
        canonical: url,
      }
    };
  } catch (error) {
    return {};
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  let post;
  try {
    post = getPostBySlug(params.slug);
  } catch (error) {
    notFound();
  }

  const contentHtml = await markdownToHtml(post.content);
  const url = `https://nexus24news.vercel.app/blog/${params.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.meta.title,
    "description": post.meta.description,
    "image": post.meta.coverImage ? [post.meta.coverImage] : [],
    "datePublished": post.meta.date,
    "dateModified": post.meta.date,
    "author": { 
      "@type": "Person", 
      "name": post.meta.author 
    },
    "publisher": {
      "@type": "Organization",
      "name": "Nexus News",
      "logo": {
        "@type": "ImageObject",
        "url": "https://nexus24news.vercel.app/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-nexus-bg)] text-[var(--color-nexus-dark)] font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Navbar Minimal */}
      <nav className="w-full py-4 px-6 border-b border-[var(--color-nexus-border)] bg-white sticky top-0 z-50 flex items-center justify-between">
        <Link href="/blog" className="text-gray-500 hover:text-[var(--color-nexus-red)] flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>
        <Link href="/" className="text-xl font-black uppercase tracking-tighter font-serif">
          NEXUS<span className="text-[var(--color-nexus-red)]">NEWS</span>
        </Link>
      </nav>

      <article className="max-w-3xl mx-auto px-4 py-12 md:py-20">
        <header className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
             <span className="bg-[#991B1B] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded shadow-sm">
               {post.meta.tags?.[0] || 'Article'}
             </span>
             <span className="text-gray-500 text-[11px] font-bold uppercase tracking-widest">
               {format(new Date(post.meta.date), 'MMMM do, yyyy')}
             </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-serif leading-tight mb-6 text-stone-900 balance-text">
            {post.meta.title}
          </h1>
          
          <p className="text-lg md:text-xl text-stone-600 font-serif leading-relaxed mb-8 max-w-2xl mx-auto">
            {post.meta.description}
          </p>

          <div className="flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-wider text-gray-500 border-t border-b border-gray-200 py-4 max-w-md mx-auto">
            <span className="flex items-center gap-2">By <span className="text-stone-900">{post.meta.author}</span></span>
            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
            <span>{post.meta.readingTime}</span>
          </div>
        </header>

        {post.meta.coverImage && (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-12 shadow-md border border-[var(--color-nexus-border)]">
            <Image
              src={post.meta.coverImage}
              alt={post.meta.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8 relative">
          {/* Social Share Sidebar (Sticky) */}
          <aside className="hidden md:flex flex-col gap-4 sticky top-32 h-fit">
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.meta.title)}&url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-[#1DA1F2] hover:border-[#1DA1F2] transition-colors shadow-sm">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
            </a>
            <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(post.meta.title)}`} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-[#0A66C2] hover:border-[#0A66C2] transition-colors shadow-sm">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-[#1877F2] hover:border-[#1877F2] transition-colors shadow-sm">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
          </aside>

          {/* Main Content */}
          <div 
            className="prose prose-stone md:prose-lg prose-headings:font-serif prose-headings:font-bold prose-h1:text-4xl prose-a:text-[var(--color-nexus-red)] prose-img:rounded-lg max-w-none flex-grow"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </div>
        
        {/* Mobile Social Share */}
        <div className="md:hidden mt-12 pt-8 border-t border-gray-200 flex items-center justify-center gap-6">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Share:</span>
          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.meta.title)}&url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#1DA1F2]">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
          </a>
          <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(post.meta.title)}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#0A66C2]">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
          <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-[#1877F2]">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
        </div>
      </article>
    </div>
  );
}
