import Link from 'next/link';
import Image from 'next/image';
import { getAllPosts } from '@/lib/blog';
import { format } from 'date-fns';

export const metadata = {
  title: 'Blog - Insights & Articles',
  description: 'Read our latest articles, insights, and editorial dispatches.',
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-[var(--color-nexus-bg)] text-[var(--color-nexus-dark)] font-sans">
      <header className="w-full py-16 flex flex-col items-center justify-center border-b border-[var(--color-nexus-border)] bg-white">
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter font-serif text-[var(--color-nexus-dark)]">
          NEXUS<span className="text-[var(--color-nexus-red)] ml-3">BLOG</span>
        </h1>
        <p className="mt-4 text-gray-500 font-bold uppercase tracking-[0.2em] text-xs">
          Insights, Analysis & Editorial Dispatches
        </p>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {posts.map((post) => (
            <Link href={`/blog/${post.slug}`} key={post.slug} className="group block">
              <article className="flex flex-col h-full bg-white border border-[var(--color-nexus-border)] shadow-sm hover:shadow-md transition-all rounded-sm overflow-hidden">
                {post.coverImage && (
                  <div className="relative w-full pt-[56.25%] overflow-hidden bg-gray-100 border-b border-[var(--color-nexus-border)]">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                )}
                
                <div className="p-8 flex flex-col flex-grow">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold text-[var(--color-nexus-red)] uppercase tracking-widest">
                      {post.tags?.[0] || 'Article'}
                    </span>
                    <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                      {format(new Date(post.date), 'MMM do, yyyy')}
                    </span>
                  </div>
                  
                  <h2 className="text-2xl font-bold font-serif leading-snug mb-3 group-hover:text-[var(--color-nexus-red)] transition-colors">
                    {post.title}
                  </h2>
                  
                  <p className="text-gray-600 mb-6 line-clamp-3 text-sm leading-relaxed flex-grow">
                    {post.description}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-[var(--color-nexus-border)] flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <span>{post.author}</span>
                    <span>{post.readingTime || '5 min read'}</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
