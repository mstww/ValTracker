import Message from '../messages/Message';
import React from 'react';
import { ipcRenderer } from 'electron';

function Messages() {
  const [ messages, setMessages ] = React.useState([]);

  React.useEffect(() => {
    ipcRenderer.on('newMessage', (event, args) => {
      setMessages(current => [...current, args]);
    });
  }, []);

  var delay = 0;
  
  return (
    <>
      {messages.map(message => {
        return (
          <Message
            key={message.date}
            message={message}
            unix={message.date}
            delay={delay += 0.05}
          />
        )
      })}
    </>
  );
}

export default function MessageLayer() {
  return(
    <div className="absolute overflow-hidden top-0 left-0 w-screen h-screen flex flex-col justify-end items-end z-50 pointer-events-none">
      <Messages key="messages" />
    </div>
  )  
}