import { Card, CardContent } from "./ui/card"
import { Button } from "./ui/button"
import { ScrollArea } from "./ui/scroll-area"

export function MentionDropdown({ scenes, searchText, onSelect }) {
    const filteredScenes = scenes.filter(scene =>
        scene.tag.toLowerCase().includes(searchText.toLowerCase()) ||
        scene.content.toLowerCase().includes(searchText.toLowerCase())
    )

    return (
        <Card className="absolute bottom-full mb-2 w-full max-h-48 z-50">
            <CardContent className="p-2">
                <ScrollArea className="h-full">
                    {filteredScenes.map(scene => (
                        <Button
                            key={scene.id}
                            variant="ghost"
                            className="w-full justify-start mb-1 text-left hover:bg-muted"
                            onClick={() => onSelect(scene)}
                        >
                            <div className="flex flex-col">
                                <span className="font-bold text-primary">{scene.tag}</span>
                                <span className="text-sm text-muted-foreground truncate">
                                    {scene.content}
                                </span>
                            </div>
                        </Button>
                    ))}
                </ScrollArea>
            </CardContent>
        </Card>
    )
}