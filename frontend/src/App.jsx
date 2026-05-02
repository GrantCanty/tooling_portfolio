import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import ViewManager from './components/ViewManager';
import './App.css';

function App() {
  const [viewState, setViewState] = useState({ view: 'landing', id: null });
  const [messages, setMessages] = useState([]);
  const [hasStartedChat, setHasStartedChat] = useState(false);

  const handleToolCall = (toolCall) => {
    if (toolCall.name === 'navigate_to_view') {
      setViewState({ view: toolCall.arguments.view, id: toolCall.arguments.id });
    } else if (toolCall.name === 'compare_projects') {
      setViewState({ view: 'compare', id1: toolCall.arguments.id1, id2: toolCall.arguments.id2 });
    }
  };

  const onFirstMessage = () => {
    setHasStartedChat(true);
  };

  const isLanding = viewState.view === 'landing';

  return (
    <div className={`app-container ${viewState.view} ${hasStartedChat ? 'chat-active' : ''} ${isLanding ? 'layout-landing' : 'layout-internal'}`}>

      {/* 
        Single ChatInterface instance to persist state/animations.
        The layout is controlled via the wrapper class.
      */}
      <div className="chat-container-wrapper">
        <ChatInterface
          messages={messages}
          setMessages={setMessages}
          onToolCall={handleToolCall}
          onMessageSent={onFirstMessage}
          hasStartedChat={hasStartedChat}
          currentView={viewState.view}
        />
      </div>

      <main className="main-content">
        <ViewManager viewState={viewState} hasStartedChat={hasStartedChat} />
      </main>
    </div>
  );
}

export default App;
