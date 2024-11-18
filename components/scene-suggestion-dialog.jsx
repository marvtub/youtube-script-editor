import { motion } from 'framer-motion';
import { SceneDiffView } from './scene-diff-view';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"

export function SceneSuggestionDialog({ suggestion, onApprove, onDismiss }) {
    console.log('Rendering suggestion dialog with:', suggestion);
    if (!suggestion) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
        >
            <Card className="fixed bottom-4 right-4 w-[400px] animate-fadeIn z-50">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <span className="text-primary">AI Suggested Improvements</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{suggestion.suggestion.reasoning}</p>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <SceneDiffView
                            original={suggestion.original}
                            suggested={suggestion.suggestion}
                        />
                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={onApprove}
                                className="bg-primary hover:bg-primary/90"
                            >
                                Apply Changes
                            </Button>
                            <Button
                                onClick={onDismiss}
                                variant="outline"
                            >
                                Dismiss
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}