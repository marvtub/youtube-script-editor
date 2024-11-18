import { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Send } from 'lucide-react'
import { ScrollArea } from "./ui/scroll-area"
import { ThinkingAnimation } from "./thinking-animation"
import { MentionsInput, Mention } from 'react-mentions'

function SceneReference({ tag }) {
    return (
        <span
            className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
        >
            @{tag}
        </span>
    );
}

function MessageContent({ content, messageContexts, onSceneClick }) {
    const parts = content.split(/(@\[[^\]]+\])/);

    return (
        <div className="whitespace-pre-wrap">
            {parts.map((part, i) => {
                if (part.startsWith('@[') && part.endsWith(']')) {
                    const tag = part.slice(2, -1);
                    return <SceneReference key={i} tag={tag} onClick={() => onSceneClick(tag)} />;
                }
                return part;
            })}
        </div>
    );
}

function ChatInput({ input, onInputChange, onSendMessage, scriptScenes, onSceneSelect }) {
    const mentionData = scriptScenes.map(scene => ({
        id: scene.id,
        display: scene.tag,
        content: scene.content
    }));

    const defaultStyle = {
        control: {
            backgroundColor: 'var(--background)',
            fontSize: '14px',
            fontWeight: 'normal',
            minHeight: '40px',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '0',
            boxShadow: 'none',
            overflow: 'hidden'
        },
        highlighter: {
            padding: '8px 12px'
        },
        input: {
            padding: '8px 12px',
            minHeight: '40px',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--foreground)'
        },
        suggestions: {
            list: {
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                overflow: 'auto',
                position: 'absolute',
                bottom: '100%',
                marginBottom: '8px',
                width: '300px',
                maxHeight: '200px',
                left: '0',
                zIndex: 1000,
                '& > div': {
                    '&:focus': {
                        outline: 'none'
                    }
                }
            },
            item: {
                padding: '8px 12px',
                '&focused': {
                    backgroundColor: 'var(--primary/10)',
                    cursor: 'pointer'
                }
            }
        }
    };

    return (
        <div className="flex gap-2 relative">
            <div className="flex-grow relative">
                <MentionsInput
                    singleLine
                    value={input || ''}
                    onChange={(e, newValue, newPlainTextValue, mentions) => {
                        const contextUpdates = {};
                        mentions.forEach(mention => {
                            const display = `@[${mention.display}]`;
                            contextUpdates[display] = {
                                sceneId: mention.id,
                                fullText: `Scene "${mention.display}": "${mention.content}"`,
                                display: mention.display
                            };
                        });
                        onInputChange({
                            target: { value: newPlainTextValue },
                            mentions: contextUpdates
                        });
                    }}
                    style={defaultStyle}
                    placeholder="Type your message..."
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            onSendMessage();
                        }
                    }}
                >
                    <Mention
                        trigger="@"
                        data={mentionData}
                        displayTransform={(id, display) => `@[${display}]`}
                        markup="@[__display__](__id__)"
                        appendSpaceOnAdd
                        renderSuggestion={(suggestion, search, highlightedDisplay, index, focused) => (
                            <div className={`flex flex-col p-2 ${focused ? 'bg-primary/10' : ''}`}>
                                <span className="font-bold text-primary">{suggestion.display}</span>
                                <span className="text-sm text-muted-foreground truncate">
                                    {suggestion.content}
                                </span>
                            </div>
                        )}
                    />
                </MentionsInput>
            </div>
            <Button
                onClick={onSendMessage}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
                <Send className="h-4 w-4" />
            </Button>
        </div>
    );
}

export function ChatSection({
    messages,
    input,
    isThinking,
    scriptScenes,
    messageContexts,
    onInputChange,
    onSendMessage,
    onSceneSelect
}) {
    const scrollAreaRef = useRef(null)

    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight
            }
        }
    }, [messages, isThinking]) // Scroll when messages change or thinking state changes

    return (
        <Card className="w-full lg:w-1/3 animate-fadeIn">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary">Chat</CardTitle>
            </CardHeader>
            <CardContent className="h-[calc(100vh-200px)] flex flex-col">
                <ScrollArea
                    ref={scrollAreaRef}
                    className="flex-grow mb-4"
                >
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`mb-4 ${message.role === 'assistant' ? 'text-primary' : ''
                                } animate-messageAppear`}
                        >
                            <MessageContent
                                content={message.content}
                                messageContexts={messageContexts}
                                onSceneClick={onSceneSelect}
                            />
                        </div>
                    ))}
                    {isThinking && <ThinkingAnimation />}
                </ScrollArea>

                <ChatInput
                    input={input}
                    onInputChange={onInputChange}
                    onSendMessage={onSendMessage}
                    scriptScenes={scriptScenes}
                    onSceneSelect={onSceneSelect}
                />
            </CardContent>
        </Card>
    )
} 