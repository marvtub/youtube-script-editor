import { motion, AnimatePresence } from 'framer-motion';
import { diffWords } from 'diff';

export function SceneDiffView({ original, suggested }) {
    const originalContent = original?.content || '';
    const suggestedContent = suggested?.content || '';
    const originalTag = original?.tag || '';
    const suggestedTag = suggested?.tag || '';

    const contentDiff = diffWords(originalContent, suggestedContent);

    return (
        <div className="space-y-2">
            <div className="relative p-4 bg-muted/50 rounded-lg">
                <AnimatePresence>
                    {contentDiff.map((part, i) => (
                        <motion.span
                            key={i}
                            initial={part.added ? { opacity: 0, y: 20 } : {}}
                            animate={{ opacity: 1, y: 0 }}
                            exit={part.removed ? { opacity: 0, y: -20 } : {}}
                            transition={{ duration: 0.5 }}
                            className={`
                                ${part.added ? 'text-green-500 font-medium' : ''}
                                ${part.removed ? 'text-red-500 line-through' : ''}
                            `}
                        >
                            {part.value}
                        </motion.span>
                    ))}
                </AnimatePresence>
            </div>

            {originalTag !== suggestedTag && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm"
                >
                    Tag: <span className="text-red-500 line-through">{originalTag}</span>
                    <span className="mx-2">→</span>
                    <span className="text-green-500">{suggestedTag}</span>
                </motion.div>
            )}
        </div>
    );
}