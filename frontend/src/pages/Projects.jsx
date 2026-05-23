import React, { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CTASection from '../components/public/CTASection';
import { motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const projects = [
  { title: "Complete Roof Replacement", type: "Residential Roofing", location: "West Knoxville, TN", img: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/6cdf2f35d_roofreplacement.jpg", media: [{ type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/6cdf2f35d_roofreplacement.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/3c9242701_roofreplacement2.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/0411326bc_roofreplacement3.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/afe752f1a_roofreplacement4.jpg" }, { type: "video", url: "https://media.base44.com/videos/public/6a064ce4129e9e3db2658416/befa66590_d273280b39b342a3a37f59c107cc6ca9.mov" }] },
  { title: "Commercial Flat Roof System", type: "Commercial Roofing", location: "Downtown Knoxville, TN", img: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/63f145066_commercial.jpg", media: [{ type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/63f145066_commercial.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/6fa68ff4a_commercia.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/73f218200_commercial2.jpg" }] },
  { title: "Fiber Cement Siding Install", type: "Siding", location: "Farragut, TN", img: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/5702b397a_8.jpg", media: [{ type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/5702b397a_8.jpg" }, { type: "video", url: "https://media.base44.com/videos/public/6a064ce4129e9e3db2658416/d12b30ee1_00920d910b7542fca40966da02a996cf.mov" }] },
  { title: "Whole-Home Window Replacement", type: "Windows", location: "Maryville, TN", img: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/1e1b58a87_14.jpg", media: [{ type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/1e1b58a87_14.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/f2b0cf63c_15.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/79dedd68d_16.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/25a87b3c2_20.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/3f40d724b_21.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/79a7493a6_24.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/35afec44d_25.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/f25cab03a_26.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/0aff15793_27.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/01fe80e2c_29.jpg" }] },
  { title: "Storm Damage Restoration", type: "Storm Damage", location: "Powell, TN", img: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/f8eed404d_stromdamage.jpg", media: [{ type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/f8eed404d_stromdamage.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/acc8e5890_stormdamage2.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/81063f4a1_stormdamage3.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/07530d187_stromdamage4.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/c226df6ce_stormdamage5.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/075b2c4cf_stormdamage6.jpg" }, { type: "video", url: "https://media.base44.com/videos/public/6a064ce4129e9e3db2658416/264957a3a_dji_fly_20250422_160714_668_1745352709234_video.mov" }] },
  { title: "Metal Roof Installation", type: "Residential Roofing", location: "Oak Ridge, TN", img: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/58dae1f41_metalroof.jpg", media: [{ type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/58dae1f41_metalroof.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/15df40593_metal2.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/91614ef71_metal3.jpg" }] },
  { title: "Entry Door & Sidelights", type: "Doors", location: "Lenoir City, TN", img: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/bee4d5ac1_22.jpg", media: [{ type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/bee4d5ac1_22.jpg" }] },
  { title: "Rubber Roof Install", type: "Residential Roofing", location: "Dandridge, TN", img: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/95d3a1a2c_33.jpg", media: [{ type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/95d3a1a2c_33.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/c642cb2d6_rubber2.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/6d0d31942_rubber3.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/9cdf9f0fe_rubber4.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/32f2189cd_rubber5.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/9ff612d54_rubber6.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/bbd21f0e5_rubber7.jpg" }, { type: "image", url: "https://media.base44.com/images/public/6a064ce4129e9e3db2658416/a62470d09_rubber.jpg" }] },
];

  const categories = ["All", "Residential Roofing", "Commercial Roofing", "Siding", "Windows", "Doors", "Storm Damage"];

  export default function Projects() {
  usePageTitle('Projects');
   const [filter, setFilter] = useState("All");
   const [selectedProject, setSelectedProject] = useState(null);
   const [mediaIndex, setMediaIndex] = useState(0);
   const filtered = filter === "All" ? projects : projects.filter(p => p.type === filter);

   const currentMedia = selectedProject?.media[mediaIndex];

   return (
    <div>
     <section className="relative py-32 sm:py-40 overflow-hidden">
       <div className="absolute inset-0">
         <img src="https://media.base44.com/images/public/6a064ce4129e9e3db2658416/6cdf2f35d_roofreplacement.jpg" alt="Our Projects" className="w-full h-full object-cover" />
         <div className="absolute inset-0 bg-navy-900/85" />
       </div>
       <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
         <p className="text-silver font-semibold text-xs uppercase tracking-widest mb-4">Our Work</p>
         <h1 className="font-heading font-bold text-5xl sm:text-6xl text-white mb-5">Our Projects</h1>
         <p className="text-white/60 text-lg max-w-xl mx-auto">See the quality of our work across Knoxville and East Tennessee.</p>
       </div>
     </section>

     <section className="py-16 bg-background">
       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
         <div className="flex flex-wrap gap-2 justify-center mb-10">
           {categories.map(cat => (
             <Button key={cat} variant={filter === cat ? "default" : "outline"} size="sm"
               className={filter === cat ? "bg-navy-500 hover:bg-navy-600" : ""}
               onClick={() => setFilter(cat)}>
               {cat}
             </Button>
           ))}
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
           {filtered.map((project, i) => (
             <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}>
               <Card className="overflow-hidden border-0 shadow-md group cursor-pointer" onClick={() => { setSelectedProject(project); setMediaIndex(0); }}>
                 <div className="relative h-56 overflow-hidden bg-black">
                   <img src={project.img} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                   <div className="absolute top-3 left-3">
                     <span className="bg-navy-500 text-white text-xs font-semibold px-3 py-1 rounded-full">{project.type}</span>
                   </div>
                 </div>
                 <div className="p-4">
                   <h3 className="font-heading font-bold text-sm">{project.title}</h3>
                   <p className="text-xs text-muted-foreground mt-1">{project.location}</p>
                 </div>
               </Card>
             </motion.div>
           ))}
         </div>
       </div>
     </section>

     <CTASection />

     {selectedProject && (
       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedProject(null)}>
         <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="bg-black rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
           <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
             {currentMedia?.type === "video" ? (
               <video src={currentMedia.url} className="max-w-full max-h-full" controls autoPlay />
             ) : (
               <img src={currentMedia?.url} alt={selectedProject.title} className="max-w-full max-h-full object-contain" />
             )}

             {selectedProject.media.length > 1 && (
               <>
                 <button onClick={() => setMediaIndex((i) => (i - 1 + selectedProject.media.length) % selectedProject.media.length)} className="absolute left-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition">
                   <ChevronLeft className="w-6 h-6" />
                 </button>
                 <button onClick={() => setMediaIndex((i) => (i + 1) % selectedProject.media.length)} className="absolute right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition">
                   <ChevronRight className="w-6 h-6" />
                 </button>
               </>
             )}
           </div>

           <div className="bg-card p-4 border-t">
             <div className="flex justify-between items-start mb-3">
               <div>
                 <h3 className="font-heading font-bold text-lg">{selectedProject.title}</h3>
                 <p className="text-sm text-muted-foreground">{selectedProject.location}</p>
               </div>
               <button onClick={() => setSelectedProject(null)} className="text-muted-foreground hover:text-foreground">
                 <X className="w-6 h-6" />
               </button>
             </div>

             {selectedProject.media.length > 1 && (
               <div className="flex gap-2 overflow-x-auto pb-2">
                 {selectedProject.media.map((m, i) => (
                   <button key={i} onClick={() => setMediaIndex(i)} className={`flex-shrink-0 w-16 h-16 rounded border-2 transition ${mediaIndex === i ? 'border-navy-500' : 'border-muted'}`}>
                     {m.type === "video" ? (
                       <div className="w-full h-full bg-muted flex items-center justify-center text-xs">Video</div>
                     ) : (
                       <img src={m.url} alt="" className="w-full h-full object-cover rounded" />
                     )}
                   </button>
                 ))}
               </div>
             )}
           </div>
         </motion.div>
       </motion.div>
     )}
     </div>
     );
     }