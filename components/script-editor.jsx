'use client'

import * as React from 'react'
import { ChatSection } from './chat-section'
import { SceneSection } from './scene-section'
import { SceneSuggestionDialog } from './scene-suggestion-dialog'

export function ScriptEditor() {
  const [messages, setMessages] = React.useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help edit your video script scenes. Just reference a scene using @ and I\'ll suggest improvements!'
    },
  ])
  const [input, setInput] = React.useState('')
  const [scriptScenes, setScriptScenes] = React.useState([
    { id: crypto.randomUUID(), content: 'Welcome to our channel!', tag: 'Intro' },
    { id: crypto.randomUUID(), content: 'In this video, we\'ll be exploring...', tag: 'Topic' },
    { id: crypto.randomUUID(), content: 'Don\'t forget to like and subscribe!', tag: 'Outro' },
  ])
  const [history, setHistory] = React.useState([])
  const [isThinking, setIsThinking] = React.useState(false)
  const [showMentions, setShowMentions] = React.useState(false)
  const [mentionSearch, setMentionSearch] = React.useState('')
  const [cursorPosition, setCursorPosition] = React.useState(0)
  const [messageContexts, setMessageContexts] = React.useState({})
  const [sceneSuggestions, setSceneSuggestions] = React.useState({})
  const [pendingApproval, setPendingApproval] = React.useState(null)

  const addToHistory = (action, data) => {
    setHistory(prev => [...prev, { action, data }])
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    let fullContent = input;
    const referencedScenes = [];

    // Collect referenced scenes
    Object.entries(messageContexts).forEach(([display, context]) => {
      fullContent = fullContent.replace(display, context.fullText);
      const scene = scriptScenes.find(s => s.id === context.sceneId);
      if (scene) {
        referencedScenes.push({
          id: scene.id,
          content: scene.content,
          tag: scene.tag,
          display: display
        });
      }
    });

    const userMessage = { role: 'user', content: fullContent };
    const displayMessage = { role: 'user', content: input };

    setMessages(prev => [...prev, displayMessage]);
    setInput('');
    setIsThinking(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          referencedScenes: referencedScenes
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response stream');
      }

      const decoder = new TextDecoder();
      let assistantMessage = { role: 'assistant', content: '' };

      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        console.log('Received chunk in frontend:', chunk);

        try {
          // Only try to parse as JSON if it starts with {
          if (chunk.trim().startsWith('{')) {
            const parsedChunk = JSON.parse(chunk);
            console.log('Parsed chunk:', parsedChunk);

            if (parsedChunk.type === 'suggestion') {
              console.log('Setting pending approval:', parsedChunk.content);
              setPendingApproval(parsedChunk.content);
            }
          } else {
            // Regular text response
            assistantMessage.content += chunk;
            setMessages(prev => [
              ...prev.slice(0, -1),
              { ...assistantMessage }
            ]);
          }
        } catch (error) {
          console.log('Parse error:', error);
          // If parsing fails, treat as regular text
          assistantMessage.content += chunk;
          setMessages(prev => [
            ...prev.slice(0, -1),
            { ...assistantMessage }
          ]);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      let errorMessage = "I apologize, but I encountered an error. ";

      if (error.name === 'AbortError') {
        errorMessage += "The request timed out. Please try again.";
      } else if (!window.navigator.onLine) {
        errorMessage += "You appear to be offline. Please check your internet connection.";
      } else if (error.message.includes('Server error')) {
        errorMessage += "The server is having issues. Please try again in a moment.";
      } else {
        errorMessage += "Something unexpected happened. Please try again.";
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage
      }]);
    } finally {
      setIsThinking(false);
      setMessageContexts({});
    }
  };

  const handleAddScene = () => {
    const newScene = {
      id: crypto.randomUUID(),
      content: 'New scene content',
      tag: 'Custom'
    }
    setScriptScenes(prev => [...prev, newScene])
    addToHistory('add', newScene)
  }

  const handleDeleteScene = (id) => {
    const sceneToDelete = scriptScenes.find(scene => scene.id === id)
    setScriptScenes(prev => prev.filter(scene => scene.id !== id))
    addToHistory('delete', sceneToDelete)
  }

  const handleUpdateScene = (id, field, value) => {
    setScriptScenes(prev => {
      const newScenes = prev.map(scene =>
        scene.id === id ? { ...scene, [field]: value } : scene
      );
      return newScenes;
    });

    // If the tag was updated, we need to update messageContexts
    if (field === 'tag') {
      setMessageContexts(prev => {
        const newContexts = {};
        Object.entries(prev).forEach(([key, context]) => {
          if (context.sceneId === id) {
            // Create new key with updated tag
            const newKey = `@[${value}]`;
            newContexts[newKey] = {
              ...context,
              display: value,
              fullText: `Scene "${value}": "${context.content}"`
            };
          } else {
            newContexts[key] = context;
          }
        });
        return newContexts;
      });
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;

    const lastAction = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));

    switch (lastAction.action) {
      case 'add':
        setScriptScenes(prev => prev.filter(scene => scene.id !== lastAction.data.id));
        break;
      case 'delete':
        setScriptScenes(prev => [...prev, lastAction.data]);
        break;
      case 'update':
        setScriptScenes(prev => prev.map(scene =>
          scene.id === lastAction.data.id ? lastAction.data.oldScene : scene
        ));
        break;
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);

    if (e.mentions) {
      setMessageContexts(e.mentions);
    }

    // Get cursor position
    const curPos = e.target.selectionStart;
    setCursorPosition(curPos);

    // Check for @ symbol
    const lastAtSymbol = value.lastIndexOf('@', curPos);
    if (lastAtSymbol !== -1 && lastAtSymbol < curPos) {
      const searchText = value.slice(lastAtSymbol + 1, curPos).toLowerCase();
      setMentionSearch(searchText);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  }

  const insertSceneReference = (scene) => {
    const display = `@[${scene.tag}]`
    const lastAtIndex = input.lastIndexOf('@', cursorPosition)
    const before = input.slice(0, lastAtIndex)
    const after = input.slice(cursorPosition)

    setMessageContexts(prev => ({
      ...prev,
      [display]: {
        sceneId: scene.id,
        fullText: `Scene "${scene.tag}": "${scene.content}"`
      }
    }))

    setInput(before + display + after)
    setShowMentions(false)
  }

  const handleSceneSuggestion = (sceneId, suggestion) => {
    const originalScene = scriptScenes.find(scene => scene.id === sceneId);
    if (!originalScene) return;

    setPendingApproval({
      sceneId,
      original: originalScene,
      suggestion: suggestion
    });
  };

  const applySceneSuggestion = () => {
    if (!pendingApproval) return;

    const oldScene = scriptScenes.find(scene => scene.id === pendingApproval.sceneId);
    if (!oldScene) return;

    const updatedScene = {
      ...oldScene,
      content: pendingApproval.suggestion.content,
      tag: pendingApproval.suggestion.tag
    };

    setScriptScenes(prev =>
      prev.map(scene =>
        scene.id === pendingApproval.sceneId ? updatedScene : scene
      )
    );

    addToHistory('update', {
      id: pendingApproval.sceneId,
      oldScene: oldScene,
      newScene: updatedScene
    });

    setPendingApproval(null);

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `I've applied the suggested changes to the scene "${oldScene.tag}". Let me know if you'd like to make any other improvements!`
    }]);
  };

  const handleAIEdit = async (sceneId, content) => {
    const originalScene = scriptScenes.find(scene => scene.id === sceneId);
    if (!originalScene) return;

    try {
      const response = await fetch('/api/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneId: originalScene.id,
          originalContent: originalScene.content,
          originalTag: originalScene.tag
        })
      });

      const data = await response.json();
      setPendingApproval({
        sceneId: sceneId,
        original: originalScene,
        suggestion: {
          content: data.content,
          tag: data.tag,
          reasoning: data.reasoning
        }
      });
    } catch (error) {
      // Handle error appropriately
    }
  };

  return (
    <div>
      <div className="flex flex-col lg:flex-row gap-4 p-4">
        <ChatSection
          messages={messages}
          input={input}
          isThinking={isThinking}
          showMentions={showMentions}
          scriptScenes={scriptScenes}
          mentionSearch={mentionSearch}
          messageContexts={messageContexts}
          onInputChange={handleInputChange}
          onSendMessage={handleSendMessage}
          onSceneSelect={insertSceneReference}
        />
        <SceneSection
          scriptScenes={scriptScenes}
          onAddScene={handleAddScene}
          onDeleteScene={handleDeleteScene}
          onUpdateScene={handleUpdateScene}
        />
      </div>
      {pendingApproval && (
        <SceneSuggestionDialog
          suggestion={pendingApproval}
          onApprove={applySceneSuggestion}
          onDismiss={() => setPendingApproval(null)}
        />
      )}
    </div>
  )
}