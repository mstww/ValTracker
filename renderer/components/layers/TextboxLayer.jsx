import React from 'react';
import { ipcRenderer } from 'electron'
import { motion } from 'framer-motion'

const update_card_variants = {
  hidden: { opacity: 0, x: 0, y: 250, scale: 1, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, scale: 1, display: 'block' },
  exit: { opacity: 0, x: 0, y: 250, scale: 1, transitionEnd: { display: 'none' } },
}

function removeItemOnce(arr, value) {
  var index = arr.indexOf(value);
  if (index > -1) {
    arr.splice(index, 1);
  }
  return arr;
}

function Textboxes() {
  const [ textboxes, setTextboxes ] = React.useState([]);
  const [ textboxKeys, setTextboxKeys ] = React.useState(0);

  React.useEffect(() => {
    ipcRenderer.on('createTextbox', function(event, args) {
      setTextboxKeys(textboxKeys+1);
      setTextboxes(current => [...current, args ]);
      setTimeout(function() {
        var newArray = removeItemOnce(textboxes, args);
        var newArray = newArray.filter(value => Object.keys(value).length !== 0);
        setTextboxes(newArray);
      }, 5000);
    });
  }, []);

  return (
    <>
      {
        textboxes.map(textbox => {
          return (
            <motion.div 
              className='w-1/4 mb-4 textbox-card mx-auto bg-button-color shadow-2xl p-2 rounded-sm flex flex-row relative z-50'
              key={textboxKeys + textbox + (Math.random()) + Math.random()}
              variants={update_card_variants}
              initial="hidden"
              animate={"enter"}
              transition={{ type: 'ease-in', duration: 0.3 }}
            >
              <span className='mr-9 h-full flex items-center'>{textbox}</span>
              <div 
                className='absolute pointer-events-auto z-30 top-2 right-2 ml-auto hover:bg-maincolor-lightest rounded-sm cursor-pointer transition-all duration-100 ease-linear w-8 h-8 flex items-center justify-center'
                onClick={() => {
                  var newArray = removeItemOnce(textboxes, textbox);
                  var newArray = newArray.filter(value => Object.keys(value).length !== 0);
                  setTextboxes(newArray);
                }}
              >
                <img src='/images/close.svg' className='w-8 p-1 shadow-img' />
              </div>
            </motion.div>
          )
        })
      }
    </>
  );
}

export default function TextboxLayer() {
  return(
    <div className="absolute overflow-hidden top-0 left-0 w-screen h-screen flex flex-col justify-end items-end z-50 pointer-events-none">
      <Textboxes key="textboxes" />
    </div>
  )  
}