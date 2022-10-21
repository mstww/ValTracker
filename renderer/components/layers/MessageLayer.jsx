import Message from '../messages/Message';
import React from 'react';
import fetch from 'node-fetch';
import { getServiceData } from '../../js/dbFunctions';

const fetchMessages = async () => {
  try {
    const response = await fetch(`https://api.valtracker.gg/messages`);
    const json = await response.json();

    const data = await getServiceData();
    const last_checked_date = data.lastMessageUnix;

    return { errored: false, items: json.data, last_check: last_checked_date };
  } catch(err) {
    return { errored: true, items: err, last_check: null };
  }
}

function Messages() {
  const [ messages, setMessages ] = React.useState([]);
  const [ lastDate, setLastDate ] = React.useState(0);

  React.useEffect(() => {
    const fetchApi = async () => {
      const { errored, items, last_check } = await fetchMessages();

      if(!errored)
        setMessages(items);
        setLastDate(last_check);
    }

    setMessages([]);
    setLastDate(0);
    fetchApi();
  }, []);

  var delay = 0;
  
  return (
    <>
      {messages.map(message => {
        return (
          message.date > lastDate ? 
          <Message
            key={message.date}
            date={message.date}
            message={message.message}
            unix={message.date}
            delay={delay += 0.05}
          />
          :
          null
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