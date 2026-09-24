import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Sparkles, Brain, BookOpen, ShieldCheck, Heart } from 'lucide-react';
import { WhyCard, WhyCategory } from '../types';
import { WHY_CARDS, getWhyCardsByCategory } from '../services/whyCardsService';

interface WhyCardsAccordionProps {
  categoryFilter?: WhyCategory;
  defaultExpandedId?: string;
  onActionClick?: (actionLabel: string, cardId: string) => void;
}

export const WhyCardsAccordion: React.FC<WhyCardsAccordionProps> = ({
  categoryFilter,
  defaultExpandedId,
  onActionClick
}) => {
  const cards = categoryFilter ? getWhyCardsByCategory(categoryFilter) : WHY_CARDS;
  const [expandedId, setExpandedId] = useState<string | null>(defaultExpandedId || (cards[0]?.id ?? null));

  const toggleCard = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getCategoryIcon = (category: WhyCategory) => {
    switch (category) {
      case 'intention':
        return <Sparkles className="w-5 h-5 text-amber-600" />;
      case 'istighfar':
        return <Heart className="w-5 h-5 text-teal-600" />;
      case 'protection':
        return <ShieldCheck className="w-5 h-5 text-rose-600" />;
      case 'prayer':
        return <Heart className="w-5 h-5 text-emerald-600" />;
      case 'quran':
        return <BookOpen className="w-5 h-5 text-sky-600" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <HelpCircle className="w-5 h-5 text-teal-700" />
        <h4 className="text-base font-bold text-slate-800 font-['Amiri',serif]">
          بطاقات «لِـيـه؟» الإرشادية — الفهم الشرعي والنفسي
        </h4>
      </div>

      <div className="space-y-3">
        {cards.map((card) => {
          const isExpanded = expandedId === card.id;
          return (
            <div
              key={card.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isExpanded
                  ? 'bg-white border-teal-200 shadow-sm'
                  : 'bg-slate-50/70 hover:bg-white border-slate-200/80'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleCard(card.id)}
                className="w-full p-4 text-right flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-2xs shrink-0">
                    {getCategoryIcon(card.category)}
                  </div>
                  <div className="text-right">
                    <div className="text-sm md:text-base font-bold text-slate-900 leading-snug">
                      {card.title}
                    </div>
                    <div className="text-xs text-slate-500 font-medium truncate mt-0.5">
                      {card.subtitle}
                    </div>
                  </div>
                </div>

                <div className="p-1 rounded-lg text-slate-400 shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-teal-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 pt-1 space-y-4 border-t border-slate-100/80 text-sm">
                  {/* Theological proof */}
                  <div className="bg-emerald-50/60 border border-emerald-100/80 p-3.5 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                      <BookOpen className="w-4 h-4 text-emerald-700" />
                      الأصل الشرعي والمنطلق التعبدي
                    </div>
                    <blockquote className="text-emerald-950 font-['Amiri',serif] text-base leading-relaxed">
                      {card.theologicalProof.verseOrHadith}
                    </blockquote>
                    <div className="text-xs text-emerald-700 font-medium">
                      {card.theologicalProof.reference} — {card.theologicalProof.explanation}
                    </div>
                  </div>

                  {/* Psychological insight */}
                  <div className="bg-sky-50/60 border border-sky-100/80 p-3.5 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-sky-900">
                      <Brain className="w-4 h-4 text-sky-700" />
                      الرؤية النفسية والعصبية (Neurobiology)
                    </div>
                    <p className="text-xs md:text-sm text-sky-950 leading-relaxed font-medium">
                      {card.psychologicalInsight}
                    </p>
                  </div>

                  {/* Practical advice */}
                  <div className="bg-amber-50/60 border border-amber-100/80 p-3.5 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                      <Sparkles className="w-4 h-4 text-amber-700" />
                      التطبيق العملي الفوري
                    </div>
                    <p className="text-xs md:text-sm text-amber-950 leading-relaxed font-medium">
                      {card.practicalAdvice}
                    </p>
                  </div>

                  {card.actionLabel && onActionClick && (
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => onActionClick(card.actionLabel!, card.id)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        {card.actionLabel}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
