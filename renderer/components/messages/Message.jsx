import moment from 'moment';
import parser from 'showdown';
import { shell } from 'electron';
import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { Close, MessageIcon } from '../SVGs';
import { getServiceData, updateMessageDate } from '../../js/dbFunctions.mjs';

const variants = {
  hidden: { opacity: 0, x: 100, y: 0 },
  enter: { opacity: 1, x: 0, y: 0 },
  exit: { opacity: 0, x: 100, y: 0 },
}

const md_conv = new parser.Converter();

export default function Message({ message, unix, delay }) {
  const router = useRouter();
  
  const messageRef = React.useRef(null);
  const contentRef = React.useRef(null);

  const [ isMessageShown, setIsMessageShown ] = React.useState(true);
  const [ doesMessageExist, setDoesMessageExist ] = React.useState(true);
  
  var title = message.title;

  moment.locale(router.query.lang);
  var date = moment(message.date).format('D. MMMM, YYYY');
  var message = md_conv.makeHtml(message.message);

  const closeMessage = async (ref) => {
    var message_date = ref.current.parentElement.lastChild;

    setIsMessageShown(false);

    var data = await getServiceData();
    
    if(data.lastMessageUnix < message_date.textContent) {
      await updateMessageDate(message_date.textContent);
    }

    setTimeout(async () => {
      setDoesMessageExist(false);
    }, 600);
  }

  React.useEffect(() => {
    contentRef.current.addEventListener('click', function(e) {
      if(e.target.tagName == "a") {
        e.preventDefault();
        shell.openExternal(e.target.href);
      }
    })
  }, []);

  return(
    <>
      {doesMessageExist && 
        <motion.div 
          className="message text-gray-500 border !border-button-color w-96 min-h-40 h-auto !p-2 mx-4 mb-4 modal pointer-events-auto"
          variants={variants}
          initial="hidden"
          animate={isMessageShown ? "enter" : "exit"}
          transition={{ type: 'ease', duration: 0.3, delay: delay }}
        >
          <div
            ref={messageRef}
            className='absolute top-2 right-2 cursor-pointer rounded hover:bg-tile-color transition-all duration-[0ms] ease-in p-1 z-10'
            onClick={() => {closeMessage(messageRef)}}
          >
            <Close className='w-4' />
          </div>
          <h2 className='text-white relative flex flex-row items-center font-semibold'><MessageIcon className="w-5 h-5 mr-2 relative bottom-0.5" /> { title }</h2>
          <span className='text-gray-500 relative bottom-1'>{ date }</span>
          <hr className='relative bottom-0.5 w-full' />
          <div className='messageContent' ref={contentRef} dangerouslySetInnerHTML={{ __html: message }} />
          <span className='hidden'>{ unix }</span>
        </motion.div>
      }
    </>
  )
}