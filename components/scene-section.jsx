import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { ScrollArea } from "./ui/scroll-area"
import { Plus, Trash2 } from 'lucide-react'
import { SceneCard } from "./scene-card"

export function SceneSection({
    scriptScenes,
    onAddScene,
    onDeleteScene,
    onUpdateScene
}) {
    return (
        <Card className="w-full lg:w-2/3 animate-fadeIn">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary">Script Scenes</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100vh-200px)] flex flex-col">
                <ScrollArea className="flex-grow mb-4">
                    {scriptScenes.map((scene) => (
                        <SceneCard
                            key={scene.id}
                            scene={scene}
                            onDelete={onDeleteScene}
                            onUpdate={onUpdateScene}
                        />
                    ))}
                </ScrollArea>
                <Button
                    onClick={onAddScene}
                    className="self-start bg-primary text-primary-foreground hover:bg-primary/90 rounded-full animate-bounce-light"
                >
                    <Plus className="h-4 w-4 mr-2" /> Add Scene
                </Button>
            </CardContent>
        </Card>
    )
}