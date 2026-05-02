import LandingLayout from '@/Layouts/LandingLayout';
import SEO from '@/Components/Landing/SEO';
import { motion } from 'framer-motion';

interface Props {
    title: string;
    content: React.ReactNode;
}

export default function Legal({ title, content }: Props) {
    return (
        <LandingLayout>
            <SEO 
                title={title} 
                description={`Read our ${title.toLowerCase()} to understand how we protect your data and the rules for using the Kontrol platform.`}
            />

            <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-50 text-center">
                <div className="mx-auto max-w-4xl px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
                            {title}
                        </h1>
                        <p className="mt-4 text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">
                            Last Updated: May 2026
                        </p>
                    </motion.div>
                </div>
            </header>

            <section className="py-24">
                <div className="mx-auto max-w-3xl px-6 lg:px-8">
                    <div className="prose prose-slate max-w-none prose-headings:font-extrabold prose-headings:tracking-tight prose-a:text-primary-600 prose-strong:text-slate-900 font-medium text-slate-600 leading-relaxed">
                        {content}
                    </div>
                </div>
            </section>
        </LandingLayout>
    );
}
