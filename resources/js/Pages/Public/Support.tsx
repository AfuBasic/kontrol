import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare } from 'lucide-react';
import PublicLayout from '@/Layouts/PublicLayout';

export default function Support() {
    return (
        <PublicLayout>
            <Head>
                <title>Support - Kontrol</title>
            </Head>

            <div className="bg-white py-24 sm:py-32 dark:bg-slate-950">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl"
                        >
                            How Can We Help?
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-400"
                        >
                            Our team is here to assist you with any questions about setting up or managing your estate.
                        </motion.p>
                    </div>

                    <div className="mx-auto mt-16 max-w-xl sm:mt-20">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="grid grid-cols-1 gap-8 sm:grid-cols-2 mb-12"
                        >
                            <div className="rounded-2xl bg-slate-50 p-8 text-center ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                                <Mail className="mx-auto h-8 w-8 text-blue-600 dark:text-blue-400" />
                                <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">Email Us</h3>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">support@kontrol.app</p>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-8 text-center ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                                <MessageSquare className="mx-auto h-8 w-8 text-blue-600 dark:text-blue-400" />
                                <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">Live Chat</h3>
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Available 9am - 5pm WAT</p>
                            </div>
                        </motion.div>

                        <motion.form
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
                            onSubmit={(e) => { e.preventDefault(); alert("Thanks for reaching out! We'll get back to you soon."); }}
                        >
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-300">Name</label>
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            name="name"
                                            id="name"
                                            className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-slate-800 dark:text-white dark:ring-slate-700 sm:text-sm sm:leading-6"
                                            placeholder="Your Name"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-300">Email</label>
                                    <div className="mt-2">
                                        <input
                                            type="email"
                                            name="email"
                                            id="email"
                                            className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-slate-800 dark:text-white dark:ring-slate-700 sm:text-sm sm:leading-6"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-300">Message</label>
                                    <div className="mt-2">
                                        <textarea
                                            id="message"
                                            name="message"
                                            rows={4}
                                            className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-slate-800 dark:text-white dark:ring-slate-700 sm:text-sm sm:leading-6"
                                            placeholder="How can we help?"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8">
                                <button
                                    type="submit"
                                    className="block w-full rounded-xl bg-blue-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-colors"
                                >
                                    Send Message
                                </button>
                            </div>
                        </motion.form>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
