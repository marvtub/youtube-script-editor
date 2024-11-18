'use client'

import * as React from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, Plus, Trash2, Undo2 } from 'lucide-react'

export function ScriptEditorJsx() {
  const [messages, setMessages] = React.useState([
    { role: 'assistant', content: 'Hello! I\'m your AI assistant. How can I help you with your video intro script?' },
  ])
  const [input, setInput] = React.useState('')
  const [scriptScenes, setScriptScenes] = React.useState([
    { id: 'scene1', content: 'Welcome to our channel!', tag: 'Intro' },
    { id: 'scene2', content: 'In this video, we\'ll be exploring...', tag: 'Topic' },
    { id: 'scene3', content: 'Don\'t forget to like and subscribe!', tag: 'Outro' },
  ])
  const [history, setHistory] = React.useState([])
  const [isThinking, setIsThinking] = React.useState(false)

  const addToHistory = (action, data) => {
    setHistory(prev => [...prev, { action, data }])
  }

  const handleSendMessage = () => {
    if (input.trim()) {
      setMessages([...messages, { role: 'user', content: input }])
      setInput('')
      setIsThinking(true)
      // Simulate AI response delay
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: `You said: ${input}` }])
        setIsThinking(false)
      }, 2000)
    }
  }

  const handleAddScene = () => {
    const newScene = { id: `scene${scriptScenes.length + 1}`, content: 'New scene content', tag: 'Custom' }
    setScriptScenes(prev => [...prev, newScene])
    addToHistory('add', newScene)
  }

  const handleDeleteScene = (id) => {
    const sceneToDelete = scriptScenes.find(scene => scene.id === id)
    setScriptScenes(prev => prev.filter(scene => scene.id !== id))
    addToHistory('delete', sceneToDelete)
  }

  const handleUpdateScene = (id, field, value) => {
    const oldScene = scriptScenes.find(scene => scene.id === id)
    setScriptScenes(prev => prev.map(scene =>
      scene.id === id ? { ...scene, [field]: value } : scene))
    addToHistory('update', { id, field, oldValue: oldScene[field], newValue: value })
  }

  const handleUndo = () => {
    if (history.length === 0) return

    const lastAction = history[history.length - 1]
    setHistory(prev => prev.slice(0, -1))

    switch (lastAction.action) {
      case 'add':
        setScriptScenes(prev => prev.filter(scene => scene.id !== lastAction.data.id))
        break
      case 'delete':
        setScriptScenes(prev => [...prev, lastAction.data])
        break
      case 'update':
        setScriptScenes(prev => prev.map(scene =>
          scene.id === lastAction.data.id
            ? { ...scene, [lastAction.data.field]: lastAction.data.oldValue }
            : scene))
        break
    }
  }

  return (
    <div className="theme-custom min-h-screen bg-background text-foreground p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* AI Assistant Section */}
        <Card className="w-full lg:w-1/3 animate-fadeIn">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl font-bold text-primary">AI Assistant</CardTitle>
            <Button
              onClick={handleUndo}
              disabled={history.length === 0}
              variant="outline"
              size="icon"
              className="rounded-full">
              <Undo2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col h-[calc(100vh-200px)]">
            <ScrollArea className="flex-grow mb-4 border border-border rounded-lg p-2">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-2 ${message.role === 'user' ? 'text-right' : 'text-left'} animate-messageAppear`}>
                  <span
                    className={`inline-block p-2 rounded-lg ${message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                      }`}>
                    {message.content}
                  </span>
                </div>
              ))}
              {isThinking && (
                <div className="text-left animate-messageAppear">
                  <span className="inline-block p-2 rounded-lg bg-muted text-muted-foreground">
                    <ThinkingAnimation />
                  </span>
                </div>
              )}
            </ScrollArea>
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-grow animate-pulse-border focus:animate-none" />
              <Button
                onClick={handleSendMessage}
                className="bg-primary text-primary-foreground hover:bg-primary/90 animate-bounce-light">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Script Editor Section */}
        <Card className="w-full lg:w-2/3 animate-fadeIn">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Script Scenes</CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100vh-200px)] flex flex-col">
            <ScrollArea className="flex-grow mb-4">
              {scriptScenes.map((scene, index) => (
                <Card
                  key={scene.id}
                  className="mb-4 animate-sceneAppear hover:animate-scenePulse group">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <Input
                        value={scene.tag}
                        onChange={(e) => handleUpdateScene(scene.id, 'tag', e.target.value)}
                        className="w-1/3 text-sm font-semibold bg-secondary text-secondary-foreground border-none rounded-full px-3 py-1 animate-tagPulse"
                        placeholder="Tag" />
                      <Button
                        onClick={() => handleDeleteScene(scene.id)}
                        variant="destructive"
                        size="icon"
                        className="rounded-full animate-wiggle hover:animate-none">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={scene.content}
                      onChange={(e) => handleUpdateScene(scene.id, 'content', e.target.value)}
                      className="w-full min-h-[100px] animate-textareaFocus" />
                  </CardContent>
                </Card>
              ))}
            </ScrollArea>
            <Button
              onClick={handleAddScene}
              className="self-start bg-primary text-primary-foreground hover:bg-primary/90 rounded-full animate-bounce-light">
              <Plus className="h-4 w-4 mr-2" /> Add Scene
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ThinkingAnimation() {
  return (
    <div className="flex items-center">
      <span className="thinking-dot"></span>
      <span className="thinking-dot"></span>
      <span className="thinking-dot"></span>
    </div>
  );
}