import React from 'react';
import { ipcRenderer } from 'electron'
import { motion } from 'framer-motion'
import { Close } from '../SVGs';

const update_card_variants = {
  hidden: { opacity: 0, x: 0, y: 250, scale: 1, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, scale: 1, display: 'block' },
  exit: { opacity: 0, x: 0, y: 250, scale: 1, transitionEnd: { display: 'none' } },
}

export default function TextboxLayer() {
  const [ textboxes, setTextboxes ] = React.useState([]);

  React.useEffect(() => {
    ipcRenderer.on('createTextbox', function(event, args) {
      console.log(args);
      setTextboxes(current => (!current.find(x => x.text === args.text) ? [...current, args ] : current));
      if(args.persistent === false) {
        setTimeout(function() {
          setTextboxes(current => current.filter(x => x.text !== args.text));
        }, 5000);
      }
    });
  }, []);

  return (
    <div className="absolute overflow-hidden top-0 left-0 w-screen h-screen flex flex-col justify-end items-end z-50 pointer-events-none">
      {textboxes.map((textbox, index) => {
        return (
          <motion.div 
            className='w-1/4 mb-4 textbox-card mx-auto card flex flex-row relative z-50 !border-button-color'
            key={index + textbox + (Math.random()) + Math.random()}
            variants={update_card_variants}
            initial="hidden"
            animate={"enter"}
            transition={{ type: 'ease-in', duration: 0.3 }}
          >
            <span className='mr-9 h-full flex items-center'>{textbox.text}</span>
            <div 
              className='absolute pointer-events-auto z-30 top-2.5 right-2 ml-auto hover:bg-tile-color rounded cursor-pointer transition-all duration-100 ease-linear w-6 h-6 flex items-center justify-center'
              onClick={() => {
                setTextboxes(current => current.filter(x => x.text !== textbox.text));
              }}
            >
              <Close className='w-6 p-1' />
            </div>
          </motion.div>
        )
      })}
    </div>
  )  
}