import moment from 'moment';
import parser from 'showdown';
import { shell } from 'electron';
import React from 'react';
import fs from 'fs';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { Close } from '../SVGs';
import { executeQuery, getServiceData, updateMessageDate } from '../../js/dbFunctions';

const variants = {
  hidden: { opacity: 0, x: 100, y: 0 },
  enter: { opacity: 1, x: 0, y: 0 },
  exit: { opacity: 0, x: 100, y: 0 },
}

const md_conv = new parser.Converter();

export default function Message({ date, message, unix, delay }) {
  const router = useRouter();
  
  const messageRef = React.useRef(null);
  const contentRef = React.useRef(null);

  const [ isMessageShown, setIsMessageShown ] = React.useState(true);

  moment.locale(router.query.lang);
  var date = moment(date).format('D. MMMM, YYYY');
  var message = md_conv.makeHtml(message);

  const closeMessage = async (ref) => {
    var message_date = ref.current.parentElement.lastChild;

    setIsMessageShown(false);

    var data = await getServiceData();
    
    if(data.lastMessageUnix < message_date.textContent) {
      await updateMessageDate(message_date.textContent);
    }
  }

  React.useEffect(() => {
    contentRef.current.addEventListener('click', function(e) {
      if(e.target.tagName == "a") {
        e.preventDefault();
        shell.openExternal(e.target.href);
      }
    })
  });
  

  return(
    <motion.div 
      className="message text-gray-500 w-80 p-2 min-h-40 h-auto mx-4 mb-4 rounded bg-maincolor-lightest pointer-events-auto shadow-xl relative"
      variants={variants}
      initial="hidden"
      animate={isMessageShown ? "enter" : "exit"}
      transition={{ type: 'ease', duration: 0.3, delay: delay }}
    >
      <div
        ref={messageRef}
        className='absolute top-2 right-2 cursor-pointer rounded hover:bg-black transition-all duration-100 ease-in p-1'
        onClick={() => {closeMessage(messageRef)}}
      >
        <Close cls='w-4' />
      </div>
      <span className='text-gray-500'>{ date }</span>
      <div className='messageContent' ref={contentRef} dangerouslySetInnerHTML={{ __html: message }} />
      <span className='hidden'>{ unix }</span>
    </motion.div>
  )
}