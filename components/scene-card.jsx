import { Card, CardContent } from "./ui/card"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Trash2 } from 'lucide-react'

export function SceneCard({ scene, onDelete, onUpdate, isReferenced }) {
    return (
        <Card className={`
            mb-4 animate-sceneAppear hover:animate-scenePulse group
            ${isReferenced ? 'ring-2 ring-primary ring-offset-2 transition-all duration-300' : ''}
        `}>
            <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                    <Input
                        value={scene.tag}
                        onChange={(e) => onUpdate(scene.id, 'tag', e.target.value)}
                        className="w-1/3 text-sm font-semibold bg-secondary text-secondary-foreground border-none rounded-full px-3 py-1 animate-tagPulse"
                        placeholder="Tag"
                    />
                    <Button
                        onClick={() => onDelete(scene.id)}
                        variant="destructive"
                        size="icon"
                        className="rounded-full animate-wiggle hover:animate-none"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
                <Textarea
                    value={scene.content}
                    onChange={(e) => onUpdate(scene.id, 'content', e.target.value)}
                    className="w-full min-h-[100px] animate-textareaFocus"
                />
            </CardContent>
        </Card>
    )
}