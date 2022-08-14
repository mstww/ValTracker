import { motion } from "framer-motion"

const backdrop_variants = {
  hidden: { opacity: 0, x: 0, y: 0, display: 'none' },
  enter: { opacity: 1, x: 0, y: 0, display: 'flex' },
  exit: { opacity: 0, x: 0, y: 0, transitionEnd: { display: 'none' } },
}
 
export default function OverlayWrapper({ useRef, isShown, children }) {
  return(
    <motion.div 
      id='settings-overlay-wrapper' 
      ref={useRef} 
      className='absolute bottom-0 left-0 w-full h-full flex items-center justify-center z-30 bg-black bg-opacity-80 pointer-events-none'
      variants={backdrop_variants}
      initial="hidden"
      animate={isShown ? 'enter' : 'exit'}
      transition={{ type: 'ease-in', duration: 0.2 }}
    >
      {children}
    </motion.div>
  )
}